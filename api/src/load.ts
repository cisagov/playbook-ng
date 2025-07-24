/** API-specific loading facilities for local file based resources */

import { FileGetter } from "../../shared/src/app/load";
import { AppDataIndex } from "../../shared/src/app/store/appdata";
import { AttackFile } from "../../shared/src/attack/objects";
import { PathOrFileDescriptor, readFileSync } from "fs";

/**
 * Load File at Path, Parse as JSON, Return as Type T
 *
 * - Performs no error checking, must be used within try-catch
 */
function loadJson<T>(path: PathOrFileDescriptor): T {
  const text = readFileSync(path, "utf-8");
  const data: T = JSON.parse(text);
  return data;
}

/**
 * Returns functions that give the path of a specified resource
 *
 * - See shared-web/src/code/load.ts:makeURLs for the web equivalent
 *   - This provides commentary on the resources / caching strategies
 */
function makePaths() {
  return {
    index: () => {
      return "data/index.json";
    },
    configUser: () => {
      return "data/runtime-config/user.json";
    },
    configDefa: () => {
      return "data/runtime-config/default.json";
    },
    attack: (domain: string, version: string) => {
      return `data/attack/${domain}/${version}.json`;
    },
    dataset: (id: string, version: string) => {
      return `data/datasets/${id}/${version}.json`;
    },
  };
}

export class PathFileGetter implements FileGetter {
  private paths: ReturnType<typeof makePaths>;

  constructor() {
    this.paths = makePaths();
  }

  async index() {
    return loadJson<unknown>(this.paths.index());
  }

  async config() {
    let user: null | unknown = null;
    let userErr = null;
    try {
      user = loadJson<unknown>(this.paths.configUser());
    } catch (err) {
      userErr = err;
    }

    let defa: null | unknown = null;
    let defaErr = null;
    try {
      defa = loadJson<unknown>(this.paths.configDefa());
    } catch (err) {
      defaErr = err;
    }

    if (user === null && defa === null) {
      throw new Error(
        `failed to GET either file: user.json (${userErr}), default.json (${defaErr})`
      );
    }

    return { user, defa };
  }

  async attack(domain: string, version: string | null, _cached: boolean) {
    if (version === null) return null;
    return loadJson<AttackFile>(this.paths.attack(domain, version));
  }

  async dataset(
    id: string,
    version: string,
    _last_updated: AppDataIndex["last_updated"],
    _cached: boolean
  ) {
    return loadJson<unknown>(this.paths.dataset(id, version));
  }
}
