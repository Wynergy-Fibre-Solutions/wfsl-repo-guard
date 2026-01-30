import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type CheckResult = { name: string; ok: boolean };

function fail(code: number, checks: CheckResult[]): never {
  const verdict = {
    verdict: "FAIL",
    checks,
    ok: false
  };
  console.log(JSON.stringify(verdict, null, 2));
  process.exit(code);
}

function pass(checks: CheckResult[]): never {
  const verdict = {
    verdict: "PASS",
    checks,
    ok: true
  };
  console.log(JSON.stringify(verdict, null, 2));
  process.exit(0);
}

function git(cmd: string): string {
  return execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
}

// ---- Phase-1 Verifier ----

const checks: CheckResult[] = [];

// 1. ProofGate manifest exists
const manifestPath = resolve(process.cwd(), "proofgate.manifest.json");
if (!existsSync(manifestPath)) {
  checks.push({ name: "proofgate.manifest.exists", ok: false });
  fail(10, checks);
}
checks.push({ name: "proofgate.manifest.exists", ok: true });

// 2. Manifest is valid JSON
let manifest: any;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  checks.push({ name: "proofgate.manifest.valid", ok: true });
} catch {
  checks.push({ name: "proofgate.manifest.valid", ok: false });
  fail(20, checks);
}

// 3. Freeze state respected
if (manifest.freeze === true) {
  // allowed only if no working tree changes
  const status = git("status --porcelain");
  if (status.length !== 0) {
    checks.push({ name: "repo.freeze.respected", ok: false });
    fail(12, checks);
  }
}
checks.push({ name: "repo.freeze.respected", ok: true });

// 4. HEAD commit is signed
try {
  const sig = git("log --show-signature -1");
  if (!sig.includes("Good signature")) {
    checks.push({ name: "git.head.signed", ok: false });
    fail(11, checks);
  }
  checks.push({ name: "git.head.signed", ok: true });
} catch {
  checks.push({ name: "git.head.signed", ok: false });
  fail(11, checks);
}

// Phase-1 complete
pass(checks);
