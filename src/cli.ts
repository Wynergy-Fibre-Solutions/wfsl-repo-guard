import path from "node:path";
import { repoGuardCheck, writeEvidence } from "./engine.js";
import type { WFSLRepoGuardMode } from "./types.js";

function usage(): string {
  return [
    "WFSL Repo Admission Guard v1",
    "",
    "Usage:",
    "  wfsl-repo-guard check --root <path> --mode <repo|marketplace>",
    "",
    "Examples:",
    "  wfsl-repo-guard check --root . --mode repo",
    "  wfsl-repo-guard check --root C:\\Users\\Paul\\github\\wfsl-admission-guard --mode marketplace"
  ].join("\n");
}

function getArg(name: string): string | undefined {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function parseMode(raw: string | undefined): WFSLRepoGuardMode {
  const v = (raw ?? "repo").toLowerCase();
  if (v === "repo" || v === "marketplace") return v;
  return "repo";
}

async function main(): Promise<void> {
  const cmd = process.argv[2];

  if (!cmd || hasFlag("--help") || hasFlag("-h")) {
    console.log(usage());
    process.exit(0);
  }

  if (cmd !== "check") {
    console.error(`Unknown command: ${cmd}`);
    console.log(usage());
    process.exit(2);
  }

  const root = getArg("--root") ?? ".";
  const mode = parseMode(getArg("--mode"));

  const result = repoGuardCheck({ root, mode });

  const rootAbs = path.resolve(root);
  const written = writeEvidence(rootAbs, result.evidence);

  console.log(`WFSL Repo Guard v1`);
  console.log(`Mode: ${mode}`);
  console.log(`Root: ${rootAbs}`);
  console.log(`Outcome: ${result.evidence.outcome}`);
  console.log(`Wrote: ${written.jsonPath}`);
  console.log(`Wrote: ${written.mdPath}`);

  if (!result.ok) {
    for (const f of result.evidence.findings) {
      console.error(`- ${f.code}: ${f.message}`);
      if (f.paths) for (const p of f.paths) console.error(`  - Path: ${p}`);
      if (f.missing) for (const m of f.missing) console.error(`  - Missing: ${m}`);
    }
    process.exit(result.evidence.exit_code);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(`WFSL Repo Guard failed: ${err?.message ?? String(err)}`);
  process.exit(2);
});
