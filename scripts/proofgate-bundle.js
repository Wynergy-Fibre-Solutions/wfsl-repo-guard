const fs = require("fs");
const path = require("path");

const root = process.cwd();
const evidenceDir = path.join(root, "evidence");

const bundlePath = path.join(
  evidenceDir,
  "wfsl.repo.proofgate.bundle.json"
);

const artefacts = {
  state: "wfsl.repo.state.txt",
  hash: "wfsl.repo.state.sha256",
  verdict: "wfsl.repo.verdict.json"
};

for (const file of Object.values(artefacts)) {
  const p = path.join(evidenceDir, file);
  if (!fs.existsSync(p)) {
    console.error(`MISSING_ARTEFACT: ${file}`);
    process.exit(1);
  }
}

const bundle = {
  tool: "wfsl-repo-guard",
  bundleType: "proofgate",
  version: "0.1.0",
  emittedAt: new Date().toISOString(),
  manifest: "proofgate.manifest.json",
  artefacts,
  determinism: {
    hash: "sha256",
    scope: "repository-structure"
  }
};

fs.writeFileSync(
  bundlePath,
  JSON.stringify(bundle, null, 2),
  "utf-8"
);

console.log("PROOFGATE_BUNDLE_EMITTED");
