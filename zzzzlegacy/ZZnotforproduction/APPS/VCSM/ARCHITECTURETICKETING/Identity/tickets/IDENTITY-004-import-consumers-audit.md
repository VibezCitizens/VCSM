# [IDENTITY-004] Import Consumers Audit — All 41 Inbound

Status: Open
Priority: P2
Type: TASK
Weight: Light
Risk: ZERO

---

## Goal

Enumerate every one of the 41 inbound consumers of `features/identity/` with:
- Exact import path used (feature adapter vs engine alias)
- Which adapter export is consumed
- Compliance classification (COMPLIANT | BYPASS | ENGINE_ALIAS | UNKNOWN)

This creates the per-consumer map that IDENTITY-005 through IDENTITY-009 rely on.

---

## Context

The scanner confirmed 41 inbound consumers and 0 violations. However, "0 violations" means
no consumer imports from a non-adapter path. It does NOT mean no consumer uses the `@identity`
engine alias (which is a separate path). Chat is confirmed to use both `@/features/identity/`
(8x) and `@identity` (16x).

The engine alias path (`@identity` → `engines/identity/`) is different from the feature
adapter path (`@/features/identity/adapters/`). The scanner may or may not flag `@identity`
as a violation depending on rule definition.

IDENTITY-004 resolves this by reading the actual import lines.

---

## Source Evidence

- `FEATURE_IMPORT_MAP.json`: identity inbound = 41; violations = 0
- `FEATURE_IMPORT_MAP.json` inbound array: contains per-file import records for each consumer
- `FEATURES_ARCHITECTURE_REVIEW.md`: chat uses `@identity` (16x) AND `@/features/identity/` (8x)
- `IDENTITY-003` output: adapter contract (compliance baseline)

---

## Scope

For each of the 41 inbound consumer import records in `FEATURE_IMPORT_MAP.json`:
1. Record the consumer file path
2. Record the import path used
3. Classify the import:
   - **COMPLIANT**: imports from `@/features/identity/adapters/`
   - **ENGINE_ALIAS**: imports from `@identity` (engine alias)
   - **BYPASS**: imports from identity DAL, controller, hooks, or resolvers directly (should be 0 per scanner)
   - **UNKNOWN**: import path not determinable from JSON

Group results by consumer feature. Record total counts per category.

---

## Out of Scope

- Fixing any import
- Classifying as "bad" — classification only; IDENTITY-010 decides policy on ENGINE_ALIAS
- Consumer feature audits (those are IDENTITY-005 through IDENTITY-009)

---

## Dependencies

IDENTITY-001 — current state known
IDENTITY-003 — adapter contract known (defines what COMPLIANT means)

---

## Blocked By

IDENTITY-001, IDENTITY-003

---

## Exact Steps

1. Read `ARCHITECTURETICKETING/FEATURE_IMPORT_MAP.json` — identity.inbound array.
2. For each entry in the inbound array:
   a. Record: consumer file → import path
   b. Classify: COMPLIANT | ENGINE_ALIAS | BYPASS | UNKNOWN
3. Group by consumer feature (settings, chat, notifications, profiles, auth, shell, etc.)
4. Count per classification.
5. Identify any BYPASS entries — these are violations the scanner may have missed.
6. Identify all ENGINE_ALIAS entries — pass these to IDENTITY-010.
7. Write summary table.

---

## Validation

- [ ] All 41 inbound records processed
- [ ] Zero unprocessed entries
- [ ] Every entry classified (no UNKNOWN left unresolved if import path is readable)
- [ ] BYPASS count confirmed (expect 0 per scanner)
- [ ] ENGINE_ALIAS list produced for IDENTITY-010
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Full consumer map appended to this ticket:
```
## Consumer Audit — [DATE]

### Summary
COMPLIANT: [count]
ENGINE_ALIAS: [count]
BYPASS: [count]
UNKNOWN: [count]
Total: 41

### Per-Feature Breakdown
[table: feature | file | import path | classification]

### ENGINE_ALIAS Sites (for IDENTITY-010)
[list: file → import path]

### BYPASS Sites (should be 0)
[list or "None confirmed"]
```

---

## Next Ticket

IDENTITY-005 through IDENTITY-009 (per-feature audits — unblock after this ticket)
IDENTITY-010 (engine alias policy — needs ENGINE_ALIAS list from this ticket)
