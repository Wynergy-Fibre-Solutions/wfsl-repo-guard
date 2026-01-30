import { spawnSync } from "node:child_process";

type TrustResult = {
  trust: "CONFIRMED" | "INVALID";
  opState: "OK" | "AGENT_CONTENDED";
  fingerprint?: string | null;
  evidenceHash?: string;
};

function runTRE(): TrustResult {
  const trePath = process.env.WFSL_TRE_PATH;

  if (!trePath) {
    throw new Error("WFSL_TRE_PATH is not set");
  }

  const proc = spawnSync(
    process.execPath,
    [trePath],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  const stdout = proc.stdout?.trim();

  if (!stdout) {
    throw new Error("TRE produced no output");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error("TRE output was not valid JSON");
  }

  if (!parsed.trust || !parsed.opState) {
    throw new Error("TRE output missing required fields");
  }

  return {
    trust: parsed.trust,
    opState: parsed.opState,
    fingerprint: parsed.fingerprint ?? null,
    evidenceHash: parsed.evidenceHash
  };
}

export function runCli(): void {
  const result = runTRE();

  console.log(
    JSON.stringify(
      {
        wfsl: {
          trust: result.trust,
          opState: result.opState,
          fingerprint: result.fingerprint ?? null,
          evidenceHash: result.evidenceHash ?? null
        }
      },
      null,
      2
    )
  );

  process.exit(result.trust === "CONFIRMED" ? 0 : 3);
}
