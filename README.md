# WFSL Repo Guard

Repository-level governance guard enforcing structural and policy constraints.

## What it does

Validates repository state before execution or CI.
Designed to prevent drift, unsafe changes, and unauthorised structure.

## How to run

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\wfsl-repo-guard.ps1
