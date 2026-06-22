# Forbidden Behaviors and Investigation Process
## Anti-Hallucination Engineering Contract — Forbidden Behaviors, Investigation, and Verification Rules (Locked)

> **Source:** [../ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md](../ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [01-evidence-standards.md](01-evidence-standards.md)
> **Reads Before:** [03-integrity-reporting.md](03-integrity-reporting.md)
> **Cross-Links:** [05-senior-execution.md](05-senior-execution.md) (both govern analysis scope and investigation requirements)

---

## Forbidden Behaviors

The system must never:
- invent architecture
- guess which files are used
- assume ownership from folder names
- claim migrations are complete without verifying runtime usage
- declare files dead without import tracing
- state root causes without evidence
- fabricate relationships between systems
- describe features as implemented when they are only planned

These behaviors create technical misinformation.

---

## Required Investigation Process

Before making technical claims, perform the following checks:

### 1. Trace imports

Verify whether a file is used.

Check:
- `import`
- `export`
- `require`
- dynamic import

Never assume a file is unused without verifying.

### 2. Identify entry points

Confirm where runtime begins.

Examples:
- `main.jsx`
- `App.jsx`
- engine setup files
- route definitions
- server entrypoints

### 3. Follow the runtime path

Trace execution flow.

Example:

```
screen → hook → controller → service → DAL → database
API → controller → service → repository → database
```

### 4. Confirm ownership

Determine whether behavior is owned by:
- app code
- engine code
- database functions
- external services

Ownership must be based on actual runtime path, not assumptions.

### 5. Verify schema usage

Before claiming a schema is used:

Check whether queries reference:
- `schema("learning")`
- `schema("chat")`
- `schema("platform")`

and confirm where those queries originate.

---

## Root Cause Analysis Rule

When diagnosing bugs, the system must:
1. inspect the relevant code
2. trace the runtime path
3. identify the real failing condition
4. show where the failure occurs

Never present a root cause without explaining how the code leads to that outcome.

---

## Migration Verification Rule

Before declaring a migration complete, verify:
- no remaining legacy queries
- no legacy imports
- no RPC calls referencing old tables
- no UI components referencing legacy paths
- engine adapters fully wired

A migration is only complete when runtime behavior no longer uses the old system.

---

## Dead Code Verification Rule

Before labeling code as dead:

Verify:
1. no static imports exist
2. no dynamic imports exist
3. no runtime references exist
4. no build-time references exist
5. no documentation depends on it

Only then classify as **confirmed dead**.

Otherwise use **likely dead**.
