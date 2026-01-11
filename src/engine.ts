import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import type {
  WFSLRepoGuardMode,
  WFSLRepoGuardEvidence,
  WFSLRepoGuardFinding,
  WFSLRepoGuardOutcome
} from "./types.js";

function isoNow(d: Date): string {
  return d.toISOString();
}

function safeRunId(now: Date): string {
  return now.toISOString().replace(/[:.]/g, "-");
}

function exists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function joinRoot(root: string, rel: string): string {
  return path.resolve(root, rel);
}

function defaultForbidden(): string[] {
  return ["node_modules", ".next", ".env", ".env.local", ".env.production", ".env.development"];
}

function defaultRequired(): string[] {
  return [".gitignore", "README.md", "LICENSE"];
}

function marketplaceRequired(): string[] {
  return [".gitignore", "README.md", "LICENSE", "action.yml"];
}

function marketplaceForbidden(): string[] {
  // dist-action is allowed in marketplace actions. dist can be allowed too.
  return ["node_modules", ".next", ".env", ".env.local", ".env.production", ".env.development"];
}

function findForbidden(root: string, forbidden: string[]): string[] {
  const hits: string[] = [];
  for (const item of forbidden) {
    const abs = joinRoot(root, item);
    if (exists(abs)) {
      hits.push(item);
    }
  }
  return hits;
}

function findMissing(root: string, required: string[]): string[] {
  const missing: string[] = [];
  for (const item of required) {
    const abs = joinRoot(root, item);
    if (!exists(abs)) {
      missing.push(item);
    }
  }
  return missing;
}

function gitAvailable(root: string): boolean {
  return isDir(joinRoot(root, ".git"));
}

function gitHasRemote(root: string): boolean {
  try {
    const out = execSync("git remote", { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function gitHasTags(root: string): boolean {
  try {
    const out = execSync("git tag", { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function gitHasCommits(root: string): boolean {
  try {
    execSync("git rev-parse --verify HEAD", { cwd: root, stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

function gitHasUpstream(root: string): boolean {
  try {
    execSync("git rev-parse --abbrev-ref --symbolic-full-name @{u}", {
      cwd: root,
      stdio: ["ignore", "ignore", "ignore"]
    });
    return true;
  } catch {
    return false;
  }
}

function buildEvidence(
  root: string,
  mode: WFSLRepoGuardMode,
  outcome: WFSLRepoGuardOutcome,
  findings: WFSLRepoGuardFinding[],
  exitCode: number,
  now: Date
): WFSLRepoGuardEvidence {
  return {
    schema: "wfsl.repo-guard.v1",
    run_id: safeRunId(now),
    timestamp: isoNow(now),
    root: path.resolve(root),
    mode,
    outcome,
    exit_code: exitCode,
    findings
  };
}

export type RepoGuardCheckInput = {
  root: string;
  mode: WFSLRepoGuardMode;
};

export type RepoGuardCheckResult = {
  ok: boolean;
  evidence: WFSLRepoGuardEvidence;
};

export function repoGuardCheck(input: RepoGuardCheckInput): RepoGuardCheckResult {
  const now = new Date();
  const root = path.resolve(input.root);
  const mode = input.mode;

  const findings: WFSLRepoGuardFinding[] = [];

  if (!exists(root) || !isDir(root)) {
    const evidence = buildEvidence(
      root,
      mode,
      "ERROR",
      [
        {
          code: "CHECK_FAILED",
          message: "Root path does not exist or is not a directory.",
          details: { root }
        }
      ],
      2,
      now
    );
    return { ok: false, evidence };
  }

  const required = mode === "marketplace" ? marketplaceRequired() : defaultRequired();
  const forbidden = mode === "marketplace" ? marketplaceForbidden() : defaultForbidden();

  const forbiddenHits = findForbidden(root, forbidden);
  if (forbiddenHits.length > 0) {
    findings.push({
      code: "FORBIDDEN_ARTIFACT_PRESENT",
      message: "Repository contains forbidden artefacts that must not be committed.",
      paths: forbiddenHits
    });
  }

  const missing = findMissing(root, required);
  if (missing.length > 0) {
    findings.push({
      code: "REQUIRED_FILE_MISSING",
      message: "Repository is missing required files.",
      missing
    });
  }

  // Release sequencing: tags before remote/upstream is a common failure
  if (gitAvailable(root)) {
    const hasTags = gitHasTags(root);
    const hasRemote = gitHasRemote(root);
    const hasCommits = gitHasCommits(root);
    const hasUpstream = gitHasUpstream(root);

    // v1 rule: tags must not exist before first remote exists
    if (hasTags && !hasRemote) {
      findings.push({
        code: "INVALID_RELEASE_SEQUENCE",
        message: "Tags exist but no git remote is configured. Create the GitHub repo and add remote before tagging or pushing tags.",
        details: { hasTags, hasRemote }
      });
    }

    // v1 rule: tags should not exist before first commit
    if (hasTags && !hasCommits) {
      findings.push({
        code: "INVALID_RELEASE_SEQUENCE",
        message: "Tags exist but repository has no commits. Create an initial commit before tagging.",
        details: { hasTags, hasCommits }
      });
    }

    // marketplace posture: encourage upstream tracking (not mandatory), but flag as violation in marketplace mode
    if (mode === "marketplace" && hasRemote && !hasUpstream) {
      findings.push({
        code: "MARKETPLACE_CONTRACT_VIOLATION",
        message: "Marketplace mode expects the current branch to track an upstream remote. Push with -u to set upstream.",
        details: { hasRemote, hasUpstream }
      });
    }
  } else {
    // In marketplace mode we expect git to exist
    if (mode === "marketplace") {
      findings.push({
        code: "MARKETPLACE_CONTRACT_VIOLATION",
        message: "Marketplace mode expects a git repository (missing .git directory). Initialise git and commit before publishing."
      });
    }
  }

  const refused = findings.length > 0;
  const outcome: WFSLRepoGuardOutcome = refused ? "REFUSED" : "ADMITTED";
  const exitCode = refused ? 1 : 0;

  const evidence = buildEvidence(root, mode, outcome, refused ? findings : [
    {
      code: "REPO_ADMITTED",
      message: "Repository admitted. No violations detected in v1 ruleset."
    }
  ], exitCode, now);

  return { ok: !refused, evidence };
}

export function writeEvidence(root: string, evidence: WFSLRepoGuardEvidence): { jsonPath: string; mdPath: string } {
  const evidenceDir = path.resolve(root, "evidence");
  if (!exists(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const runDir = path.join(evidenceDir, evidence.run_id);
  fs.mkdirSync(runDir, { recursive: true });

  const jsonPath = path.join(runDir, "repo-guard.evidence.json");
  fs.writeFileSync(jsonPath, JSON.stringify(evidence, null, 2), "utf8");

  const mdPath = path.join(runDir, "summary.md");
  fs.writeFileSync(mdPath, renderEvidenceMarkdown(evidence), "utf8");

  return { jsonPath, mdPath };
}

function renderEvidenceMarkdown(e: WFSLRepoGuardEvidence): string {
  const lines: string[] = [];
  lines.push(`# WFSL Repo Admission Guard Evidence`);
  lines.push(``);
  lines.push(`- Schema: \`${e.schema}\``);
  lines.push(`- Run ID: \`${e.run_id}\``);
  lines.push(`- Timestamp: \`${e.timestamp}\``);
  lines.push(`- Root: \`${e.root}\``);
  lines.push(`- Mode: \`${e.mode}\``);
  lines.push(`- Outcome: **${e.outcome}**`);
  lines.push(`- Exit code: \`${e.exit_code}\``);
  lines.push(``);
  lines.push(`## Findings`);
  if (!e.findings || e.findings.length === 0) {
    lines.push(`- None`);
    return lines.join("\n");
  }

  for (const f of e.findings) {
    lines.push(`- **${f.code}**: ${f.message}`);
    if (f.paths && f.paths.length > 0) {
      for (const p of f.paths) lines.push(`  - Path: \`${p}\``);
    }
    if (f.missing && f.missing.length > 0) {
      for (const m of f.missing) lines.push(`  - Missing: \`${m}\``);
    }
    if (f.details) {
      lines.push(`  - Details: \`${JSON.stringify(f.details)}\``);
    }
  }

  return lines.join("\n");
}
