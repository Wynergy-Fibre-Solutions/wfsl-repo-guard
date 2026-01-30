export type * from "./types.js";
export { repoGuardCheck, writeEvidence } from "./engine.js";

import { runCli } from "./cli.js";

runCli();
