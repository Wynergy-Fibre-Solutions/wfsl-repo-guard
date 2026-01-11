# WFSL Repo Admission Guard

Deterministic repository hygiene and release sequencing enforcement with evidence emission.

WFSL Repo Admission Guard prevents common, costly errors such as committing node_modules, publishing without required files, or tagging releases before a valid remote exists. All checks emit structured evidence suitable for audit and CI enforcement.

## Features

- Blocks forbidden artefacts such as node_modules
- Enforces presence of required files (.gitignore, README, LICENSE)
- Validates release and repository state before admission
- Emits timestamped evidence bundles and summaries
- Deterministic, CI-safe, non-interactive operation

## Usage

### Repository mode
```bash
wfsl-repo-guard check --root . --mode repo
