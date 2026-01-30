import { spawnSync } from "node:child_process";
import { verifyEd25519 } from "@wfsl/shared-verifier/node";

type TrustResult = {
  trust: "CONFIRMED" | "INVALID";
  opState: "OK" | "AGENT_CONTENDED";
  fingerprint?: string | null;
  evidenceHash?: string;
  signature?: string;
  publicKey?: string;
  payload?: unknown;
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

  return parsed;
}

export function runCli(): void {
  const result = runTRE();

  // --- SIGNATURE ENFORCEMENT ---
  if (
    !result.signature ||
    !result.publicKey ||
    !result.payload
  ) {
    throw new Error("TRE signature material missing");
  }

  const verified = verifyEd25519(
    JSON.stringify(result.payload),
    result.signature,
    result.publicKey
  );

  if (!verified) {
    process.stderr.write(
      JSON.stringify(
        {
          error: "TRE_SIGNATURE_INVALID",
          trust: result.trust,
          opState: result.opState
        },
        null,
        2
      )
    );
    process.exit(4);
  }

  // --- VERIFIED OUTPUT ---
  console.log(
    JSON.stringify(
      {
        wfsl: {
          trust: result.trust,
          opState: result.opState,
          fingerprint: result.fingerprint ?? null,
          evidenceHash: result.evidenceHash ?? null,
          signatureVerified: true
        }
      },
      null,
      2
    )
  );

  process.exit(result.trust === "CONFIRMED" ? 0 : 3);
}
