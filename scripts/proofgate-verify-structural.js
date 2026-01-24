const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const evidenceDir = path.resolve(process.cwd(), "evidence");

const statePath = path.join(evidenceDir, "wfsl.repo.state.txt");
const hashPath = path.join(evidenceDir, "wfsl.repo.state.sha256");

if (!fs.existsSync(statePath)) {
  console.error("STATE_EVIDENCE_MISSING");
  process.exit(1);
}

if (!fs.existsSync(hashPath)) {
  console.error("STATE_HASH_MISSING");
  process.exit(1);
}

const state = fs.readFileSync(statePath);
const expectedHash = fs.readFileSync(hashPath, "utf-8").trim();

const actualHash = crypto
  .createHash("sha256")
  .update(state)
  .digest("hex")
  .toUpperCase();

if (actualHash !== expectedHash.toUpperCase()) {
  console.error("STATE_HASH_MISMATCH");
  process.exit(2);
}

const verdict = {
  tool: "wfsl-repo-guard",
  guardType: "structural",
  verdict: "PASS",
  verifiedAt: new Date().toISOString(),
  artefact: "wfsl.repo.state.txt",
  hash: actualHash
};

fs.writeFileSync(
  path.join(evidenceDir, "wfsl.repo.verdict.json"),
  JSON.stringify(verdict, null, 2),
  "utf-8"
);

console.log("PROOFGATE_STRUCTURAL_VERIFY_PASS");
