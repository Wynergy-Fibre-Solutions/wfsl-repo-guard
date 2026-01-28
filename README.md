Commercial use requires a WFSL licence. See commercial-wfsl-offerings/HOW-TO-BUY.md.

# WFSL Repo Guard

## Purpose

WFSL Repo Guard evaluates repository state against declared governance expectations.

It inspects repository structure, metadata, and artefacts to determine whether a repository meets defined readiness, hygiene, and integrity criteria.

Repo Guard does not enforce policy. It reports state.

---

## Functional Guarantees

WFSL Repo Guard provides:

- Deterministic repository inspection
- Explicit pass, fail, or unknown outcomes
- Non-destructive analysis
- Evidence-referenced results

All evaluations are repeatable and auditable.

---

## What This Component Does Not Do

WFSL Repo Guard explicitly does not:

- Modify repositories
- Rewrite history
- Enforce changes
- Make trust claims
- Execute remediation

It evaluates and reports only.

---

## Evaluation Scope

WFSL Repo Guard may evaluate:

- Repository structure and layout
- Presence and state of governance artefacts
- Evidence directories
- Build output indicators
- Declared guard configurations

Evaluation scope is transparent and deterministic.

---

## Role in the WFSL Platform

WFSL Repo Guard occupies a governance inspection tier within the WFSL platform.

It is used by:

- WFSL ProofGate CLI
- Governance workflows
- Continuous inspection pipelines
- Compliance preparation processes

Repo Guard outputs are intended to inform decisions, not make them.

---

## Classification and Licence

Classification: WFSL Open  
Licence: Apache License 2.0

This repository is open-source and auditable.

Commercial and production reliance requires a valid WFSL licence.

---

## Stability

This repository is considered stable once evaluation criteria and output formats are fixed.

Changes to evaluation logic require explicit versioning and documentation.

---

## WFSL Platform Membership

**Platform:** WFSL Verification Platform

**Role:**  
Provides deterministic repository state verification and governance compliance checks as part of the WFSL Verification Platform.

**Guarantees:**  
- Repository state validation  
- Deterministic verification results  
- Licence and governance compliance signalling  
- No code execution or modification  
- No behavioural inference  

**Boundary:**  
This repository performs verification only and does not execute builds, modify repositories, or enforce policy actions.

See: WFSL-PLATFORM-INDEX.md
