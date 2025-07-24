import { AppDataIndex } from "@playbook-ng/shared/src/app/store/appdata";
import { AttackFile } from "@playbook-ng/shared/src/attack/objects";
import { getJson } from "@playbook-ng/shared-web/src/code/network";
import { FileGetter } from "@playbook-ng/shared/src/app/load";
import localForage from "localforage";

/**
 * Gives functions to calculate URL of a given resource
 */
function makeURLs(appURL: URL) {
  return {
    /**
     * data/index.json
     * - what ATT&CK datasets + arbitrary datasets are available
     * - timestamp of when index (/arb datasets) were last updated
     * - always cache-busted
     */
    index: () => {
      const epoch = new Date().getTime();
      return new URL(`data/index.json?t=${epoch}`, appURL);
    },
    /**
     * data/runtime-config/user.json
     * - user-specified config (higher priority)
     * - always cache-busted
     */
    configUser: () => {
      const epoch = new Date().getTime();
      return new URL(`data/runtime-config/user.json?t=${epoch}`, appURL);
    },
    /**
     * data/runtime-config/default.json
     * - default-provided config (lower priority)
     * - always cache-busted
     */
    configDefa: () => {
      const epoch = new Date().getTime();
      return new URL(`data/runtime-config/default.json?t=${epoch}`, appURL);
    },
    /**
     * ATT&CK {domain} {version}
     * - May be cached (as domain + version identifies a fixed set of unchanging data)
     */
    attack: (domain: string, version: string) => {
      return new URL(`data/attack/${domain}/${version}.json`, appURL);
    },
    /**
     * Arbitrary Dataset {id} {version} {epoch}
     * - Cache busted using epoch of index.json["last_updated"]
     *   - id + version (coun7er + latest) points to data that changes over time
     */
    dataset: (id: string, version: string, epoch: number) => {
      return new URL(`data/datasets/${id}/${version}.json?t=${epoch}`, appURL);
    },
  };
}

type URLS = ReturnType<typeof makeURLs>;

export class URLFileGetter implements FileGetter {
  private urls: URLS;
  private cache: LocalForage | null;

  constructor(appURL: URL) {
    this.urls = makeURLs(appURL);
    try {
      this.cache = localForage.createInstance({
        name: "p-ng-cache",
        storeName: "p-ng-cache-datasets",
        version: 1.0,
        description:
          "Caches ATT&CK / Dataset JSONs on client - as they can be too large for the browser to do so.",
      });
    } catch (ex) {
      this.cache = null;
      console.log(`Cache Init Err: ${ex}`);
    }
  }

  async index() {
    return await indexGetFile(this.urls);
  }

  async config() {
    return await configGetFiles(this.urls);
  }

  private async cacheCleanup(removePrefix: string, keepKey: string) {
    if (this.cache === null) return;

    const keys = await this.cache.keys();
    const keysToRemove = keys.filter(
      (k) => k.startsWith(removePrefix) && k !== keepKey
    );
    for (const key of keysToRemove) {
      try {
        await this.cache.removeItem(key);
        console.log(`Cache Clear: ${key}`);
      } catch (ex) {
        console.log(`Cache Clear Err: ${key} - ${ex}`);
      }
    }
  }

  private async cacheGet<T>(args: { key: string; fallback: () => Promise<T> }) {
    const { key, fallback } = args;
    if (this.cache === null) return await fallback();

    try {
      const file = await this.cache.getItem<T>(key);
      if (file !== null) {
        console.log(`Cache Read Hit: ${key}`);
        return file;
      } else {
        console.log(`Cache Read Miss: ${key}`);
      }
    } catch (ex) {
      console.log(`Cache Read Err: ${key} - ${ex}`);
    }

    const file = await fallback();

    try {
      await this.cache.setItem<T>(key, file);
      console.log(`Cache Write: ${key}`);
    } catch (ex) {
      console.log(`Cache Write Err: ${key} - ${ex}`);
    }

    return file;
  }

  async attack(domain: string, version: string | null, cached: boolean) {
    // always purge un-needed cache
    const prefix = `attack-${domain}`;
    const key = `attack-${domain}-${version}`;
    await this.cacheCleanup(prefix, key);

    if (version === null) return null;

    // network-getter
    const fallback = async () =>
      await attackGetFile(this.urls, domain, version);

    // try and use cache if enabled
    if (cached) return await this.cacheGet({ key, fallback });
    else return await fallback();
  }

  async dataset(
    id: string,
    version: string,
    last_updated: AppDataIndex["last_updated"],
    cached: boolean
  ) {
    // network-getter
    const fallback = async () =>
      await datasetGetFile(this.urls, id, version, last_updated);

    // always purge un-needed cache
    const prefix = `dataset`;
    const key = `dataset-${id}-${version}-${last_updated}`;
    await this.cacheCleanup(prefix, key);

    // try and use cache if enabled
    if (cached) return await this.cacheGet({ key, fallback });
    else return await fallback();
  }
}

async function indexGetFile(urls: URLS): Promise<unknown> {
  const result = await getJson<unknown>(urls.index());
  if (!result.ok) throw new Error(result.type);
  return result.data;
}

type Config<T> = {
  user: T;
  defa: T;
};

async function configGetFiles(urls: URLS): Promise<Config<unknown>> {
  const user = await getJson<unknown>(urls.configUser());
  const defa = await getJson<unknown>(urls.configDefa());

  if (!user.ok && !defa.ok)
    throw new Error(
      `failed to GET either file: user.json (${user.type}), default.json (${defa.type})`
    );

  const conf = {
    user: user.ok ? user.data : null,
    defa: defa.ok ? defa.data : null,
  };

  return conf;
}

async function attackGetFile(
  urls: URLS,
  domain: string,
  version: string
): Promise<AttackFile> {
  const result = await getJson<AttackFile>(urls.attack(domain, version));
  if (!result.ok) throw new Error(result.type);
  return result.data;
}

async function datasetGetFile(
  urls: URLS,
  id: string,
  version: string,
  last_updated: AppDataIndex["last_updated"]
): Promise<unknown> {
  const epoch = new Date(last_updated).getTime();
  const result = await getJson<unknown>(urls.dataset(id, version, epoch));
  if (!result.ok) throw new Error(result.type);
  return result.data;
}
