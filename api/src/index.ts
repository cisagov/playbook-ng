/**
 * Build Target: Playbook-NG as an API
 *
 * - This is entirely self-contained and separate from the Website / Editor.
 * - This is a backend-only REST API version of Playbook-NG.
 * - You provide a list of Technique IDs and get back a Playbook Export.
 * - Swagger Docs are available in-API at http://IP:PORT/docs/
 */

import {
  AttackDataset,
  AttackDatasets,
  Technique,
  TechniqueI,
} from "../../shared/src/attack/objects";
import { Dataset, Item } from "../../shared/src/dataset/types";
import express, { Request, Response } from "express";
import cors from "cors";
import * as appR from "../../shared/src/app/store/appdata";
import * as bookR from "../../shared/src/app/store/playbook";
import {
  adjustTechs,
  hideUnchanged,
  initialLoadInfo,
  loadAppResources,
} from "../../shared/src/app/load";
import { Dict } from "../../shared/src/base/types";
import { stableDedupe } from "../../shared/src/base/utils/set";
import { Playbook } from "../../shared/src/playbook/types";
import { SaveableFile } from "../../shared/src/playbook/utils/export/types";
import { exportMd } from "../../shared/src/playbook/utils/export/md";
import { exportDocx } from "../../shared/src/playbook/utils/export/docx";
import { exportXlsx } from "../../shared/src/playbook/utils/export/xlsx";
import * as swaggerUi from "swagger-ui-express";
import { SWAGGER_JSON } from "./swagger";
import { PathFileGetter } from "./load";
import { AppConfig } from "../../shared/src/app/runtime-config/types";
import { getUsedTemplateInfo } from "../../shared/src/playbook/utils/template-info";
import { ttiItemIDs, ttiTechIDs } from "../../shared/src/playbook/helpers";

/** Build-Time Config */
const BUILD_CONFIG = {
  /** Port to host on */
  port: 3000,
  /** Run in production mode? */
  production: false,
} as const;

/**
 * Global Data Store
 *
 * - Written-to during load
 * - Read-only when running
 */
const g = {
  app: appR.createInitialState(),
  config: {} as AppConfig,
  loadInfo: initialLoadInfo(),
  techLUT: {} as Dict<Technique>,
  itemLUT: {} as Dict<Item>,
  itemType: "",
};

/** Builds a Lookup of ATT&CK ID -> Technique */
function makeTechLUT(attack: AttackDatasets): Dict<Technique> {
  const lut: Dict<Technique> = {};
  Object.values(attack)
    .flatMap((dom: AttackDataset) => dom.techniques)
    .forEach((tech) => (lut[tech.attackId] = tech));
  return lut;
}

/** Build a Lookup of Item ID -> Item */
function makeItemLUT(dataset: Dataset): Dict<Item> {
  const lut: Dict<Item> = {};
  dataset.items.forEach((item) => (lut[item.id] = item));
  return lut;
}

/** Load resources + populate the global store */
async function loadAPI() {
  const r = await loadAppResources(
    new PathFileGetter(),
    BUILD_CONFIG.production
  );
  g.app = appR.setAttack(g.app, r.attack);
  g.app = appR.setDataset(g.app, r.dataset);
  g.config = r.config;
  g.loadInfo = {
    dataLoaded: r.toLoad,
    datasetAdjusts: r.datasetAdjusts,
  };
  g.techLUT = makeTechLUT(g.app.attack);
  g.itemLUT = makeItemLUT(g.app.dataset);
  g.itemType = g.app.dataset.item_type;
}

/** API-Supported Export Formats */
const FORMATS = [
  "markdown",
  "word",
  "excel",
  "app-usable-json",
  "full-content-json",
] as const;

/** Type for API-Supported Export Formats */
type Format = (typeof FORMATS)[number];

/** Is a string an API-Supported Export Format? */
function isFormat(format: string): format is Format {
  return FORMATS.includes(format as Format);
}

/**
 * Convert a query param to string[]
 *
 * - undefined -> []
 * - string    -> [val]
 * - string[]  -> val
 */
function queryParamToArr(param: Request["query"][string]): string[] {
  const value = param as string | string[] | undefined;
  if (typeof value === "undefined") return [];
  else if (typeof value === "string") return [value];
  else return value;
}

/** Send a SaveableFile for a Response */
function sendFile(file: SaveableFile, res: Response) {
  const blob = file.data as Blob;
  const type = blob.type;
  blob.arrayBuffer().then((arrayBuf) => {
    res
      .contentType(type)
      .appendHeader(
        "Content-Disposition",
        `attachment; filename="${file.filename}"`
      )
      .send(Buffer.from(arrayBuf));
  });
}

/** Create a Playbook with Title for a set of Technique IDs */
function createPlaybook(techIds: string[], title: string): Playbook {
  let playbook = bookR.startBlankPlaybook(g.app.dataset);
  playbook = bookR.setPlaybookTitle(playbook, title);
  playbook = bookR.addTechs(playbook, {
    allItems: g.app.dataset.items,
    ids: techIds,
  });
  return playbook;
}

/** A Playbook that includes the content of added Techs + Items */
type FullContentPlaybook = Playbook & {
  /**
   * ATT&CK ID -> TechniqueI Lookup
   *
   * - This uses TechniqueI instead of Technique
   *   - TechniqueI follows the standard of what is inside each ATT&CK STIX json
   *   - Whereas Technique also tracks base-Tech names for ease of data access
   */
  tech_lookup: Dict<TechniqueI>;

  /** Item ID -> Item Lookup */
  item_lookup: Dict<Item>;
};

/** Converts a Playbook to a FullContentPlaybook */
function addContentToPlaybook(playbook: Playbook): FullContentPlaybook {
  const tech_lookup: Dict<TechniqueI> = {};
  const item_lookup: Dict<Item> = {};

  const bookTechIds = ttiTechIDs(playbook.tech_to_items);
  bookTechIds.forEach((id) => {
    const tech = g.techLUT[id];
    tech_lookup[id] = {
      ...tech,
      name: tech.name.self,
    };
  });

  const bookItemIds = ttiItemIDs(playbook.tech_to_items);
  bookItemIds.forEach((id) => (item_lookup[id] = g.itemLUT[id]));

  return {
    ...playbook,
    tech_lookup,
    item_lookup,
  };
}

/**
 * GET / Route
 *
 * - Points user towards the documentation page
 */
function get_Home(_req: Request, res: Response) {
  res.type("html").send('Go see <a href="/docs">/docs</a>');
}

/**
 * GET /load-info Route
 *
 * - Returns LoadInfo
 */
function get_LoadInfo(_req: Request, res: Response) {
  res.type("json").send(g.loadInfo);
}

/**
 * GET /tech-report Route
 *
 * - Takes in a list of Tech IDs
 * - Returns a report of adjustments performed to the given IDs
 *   - Removed deprecated / unknown
 *   - Swapped revoked
 * - Also returns a list of the valid Tech IDs used in Playbook creation
 * - Meant to be used alongside GET /playbook
 */
function get_TechReport(req: Request, res: Response) {
  const queryIds = queryParamToArr(req.query.id);
  const uniqueIds = stableDedupe(queryIds);
  const adjusted = adjustTechs({
    uncheckedIds: uniqueIds,
    attack: g.app.attack,
  });
  const output = {
    techAdjustmentsPerformed: hideUnchanged(adjusted.adjusts, true),
    techIdsUsed: adjusted.ids,
  };
  res.type("json").send(output);
}

/**
 * GET /playbook/:format Route
 *
 * - Takes in an API-Supported Export Format name
 * - Takes in a list of Tech IDs
 * - Returns the specified export of a Playbook created with the given IDs
 */
function get_Playbook_Format(req: Request, res: Response) {
  const format = req.params.format;
  if (!isFormat(format)) {
    res
      .status(400)
      .send(
        `Specified format "${format}" doesn't exist within ${JSON.stringify(
          FORMATS
        )}.`
      );
    return;
  }

  const queryIds = queryParamToArr(req.query.id);
  const uniqueIds = stableDedupe(queryIds);
  const adjusted = adjustTechs({
    uncheckedIds: uniqueIds,
    attack: g.app.attack,
  });
  const techIds = adjusted.ids;

  const playbook = createPlaybook(techIds, "API-Made Playbook");
  const { dataset } = g.app;
  const templateInfo = getUsedTemplateInfo({ playbook, dataset });

  switch (format) {
    case "markdown": {
      const file = exportMd(
        playbook,
        g.techLUT,
        g.itemLUT,
        g.itemType,
        g.config.export_marks,
        templateInfo
      );
      sendFile(file, res);
      break;
    }
    case "word": {
      exportDocx(
        playbook,
        g.techLUT,
        g.itemLUT,
        g.itemType,
        g.config.export_marks,
        templateInfo
      ).then((file) => sendFile(file, res));
      break;
    }
    case "excel": {
      exportXlsx(
        playbook,
        g.techLUT,
        g.itemLUT,
        g.itemType,
        g.config.export_marks,
        templateInfo
      ).then((file) => sendFile(file, res));
      break;
    }
    case "app-usable-json": {
      res.type("json").send(playbook);
      break;
    }
    case "full-content-json": {
      const fullContentBook = addContentToPlaybook(playbook);
      res.type("json").send(fullContentBook);
      break;
    }
  }
}

/**
 * Entry Point
 *
 * 1. Load API resources
 * 2. Register routes
 * 3. Listen
 */
function main() {
  loadAPI()
    .then(() => {
      const api = express();
      api.use(express.json());
      api.use(cors());
      api.get("/", get_Home);
      api.get("/load-info", get_LoadInfo);
      api.get("/tech-report", get_TechReport);
      api.get("/playbook/:format", get_Playbook_Format);
      api.use("/docs", swaggerUi.serve, swaggerUi.setup(SWAGGER_JSON));
      api.listen(BUILD_CONFIG.port, () =>
        console.log(`API listening on :${BUILD_CONFIG.port}`)
      );
    })
    .catch((err) => {
      const msg = `${err}` || "Unknown Error";
      console.log("Playbook-NG API Failed to Load");
      console.log(`Cause: ${msg}`);
    });
}
main();
