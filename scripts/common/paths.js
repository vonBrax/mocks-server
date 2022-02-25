import path from "node:path";

import { dirName } from "./utils.js";

const __DIRNAME = dirName(import.meta.url);

export const ROOT_PATH = path.resolve(__DIRNAME, "..", "..");

export const NX_WORKSPACE_CONFIG = path.resolve(ROOT_PATH, "nx.json");

export const PNPM_WORKSPACE_CONFIG = path.resolve(ROOT_PATH, "workspace.json");
