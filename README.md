# WFSL Repo Guard

Deterministic repository governance for the WFSL ecosystem.

WFSL Repo Guard enforces non-negotiable repository invariants before any
commit or push is allowed. It does not infer intent, apply policy heuristics,
or permit operator override.

Behaviour is verified. State is proven. Drift is rejected.

---

## What Repo Guard Is

Repo Guard is a deterministic enforcement layer that validates repository
state using machine-verifiable rules defined in a ProofGate manifest.

It ensures that repositories remain:

- Structurally valid
- Reproducible
- Audit-ready
- Immune to accidental or coerced mutation

Repo Guard never mutates repositories.
It only permits or blocks actions based on verified state.

---

## What Repo Guard Is Not

Repo Guard is not:

- A linter
- A formatter
- A CI replacement
- A policy engine with opinions
- A developer productivity tool

It exists solely to prevent invalid states from entering history.

---

## Core Guarantees

Repo Guard enforces the following guarantees:

- Git history cannot record an invalid repository state
- Lockfile drift cannot be silently introduced
- Ignored artefacts cannot be committed accidentally
- Build output rules are deterministic and explicit
- Governance decisions are delegated, never embedded

All decisions are evaluated by ProofGate.

---

## Deterministic Model

Repo Guard operates under a strict deterministic model:

1. Repository state is inspected
2. ProofGate is invoked
3. A verdict is returned
4. Actions are permitted or rejected

There are no retries.
There is no fallback.
There is no interactive mode.

If state is invalid, the operation fails.

---

## ProofGate Delegation

Repo Guard does not contain governance logic.

All rules are defined in `proofgate.manifest.json` and evaluated by
WFSL ProofGate CLI.

This separation guarantees:

- Governance rules can evolve without rewriting guards
- Enforcement logic remains minimal and auditable
- Behaviour is identical across machines and environments

If ProofGate is unavailable, Repo Guard fails closed.

---

## Git Hook Enforcement

Repo Guard is enforced through deterministic Git hooks:

- pre-commit
- pre-push

Hooks invoke Repo Guard, which in turn invokes ProofGate.

No commit or push may proceed without a valid verdict.

Hooks are installed locally per repository and are not optional.

---

## Installation

Repo Guard is installed via WFSL tooling.

Hooks are deployed using the provided installer:

