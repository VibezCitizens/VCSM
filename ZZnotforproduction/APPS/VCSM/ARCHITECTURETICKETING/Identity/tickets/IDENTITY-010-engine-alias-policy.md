# [IDENTITY-010] Engine Alias Policy Decision

Status: Open
Priority: P2
Type: TASK
Weight: Medium
Risk: MEDIUM

---

## Goal

Write the canonical policy decision: is `@identity` (engine alias) an acceptable import path
inside `apps/VCSM/src/features/`, or must all VCSM features go through
`@/features/identity/adapters/`? Record the decision as a written policy with rationale,
the migration path for ENGINE_ALIAS sites, and the scanner rule update needed.

---

## Context

The engine alias `@identity` resolves to `engines/identity/` — the raw, cross-app identity
engine. The feature adapter `@/features/identity/adapters/` is the VCSM-specific governed
wrapper. These two paths expose different surfaces:

- Engine: raw identity contract shared by VCSM, Wentrex, and any other app
- Feature adapter: VCSM ownership guards, hydration pipeline, VCSM-specific operations

Chat is the confirmed mixed case: 16 engine-alias imports + 8 feature-adapter imports.
IDENTITY-004 may reveal additional ENGINE_ALIAS sites in other features.

The policy question: should VCSM features ever import directly from the engine, or is the
feature adapter always the correct path?

This ticket does NOT fix any import. It only produces the written policy and migration spec.

---

## Source Evidence

- `FEATURES_ARCHITECTURE_REVIEW.md`: "chat: @identity (16x) AND @/features/identity/ (8x)"
- `IDENTITY-004` output: all ENGINE_ALIAS sites across the codebase
- `IDENTITY-005` output: which specific operations chat accesses via engine alias
- `engines/identity/` — raw engine exports (read to understand what it exposes vs feature adapter)

---

## Scope

1. Read `engines/identity/index.js` (or equivalent main export). Record the raw engine surface.
2. Compare raw engine surface vs `identity.adapter.js` exports (from IDENTITY-003):
   - What does the engine expose that the feature adapter does NOT?
   - What does the feature adapter add that the engine does not have?
3. Assess IDENTITY-005 findings: are chat's 16 engine-alias imports accessing raw engine
   operations or engine data that should go through the adapter?
4. Write the policy decision: one of three outcomes:
   - **ADAPTER_ONLY**: All VCSM features must use `@/features/identity/adapters/` only.
     `@identity` is banned inside `apps/VCSM/src/features/`.
   - **ENGINE_ALLOWED**: `@identity` is allowed in VCSM features for engine-level operations
     not exposed by the feature adapter. Feature adapter must not re-export raw engine
     internals.
   - **HYBRID_DOCUMENTED**: `@identity` is allowed only where documented. Each usage must
     have a comment explaining why the feature adapter is insufficient.
5. Write the migration spec for existing ENGINE_ALIAS sites.
6. Write the scanner rule update: what rule should `FEATURE_IMPORT_MAP` scanner apply to
   ENGINE_ALIAS imports?

---

## Out of Scope

- Migrating any existing ENGINE_ALIAS import (implementation ticket)
- Modifying the scanner (implementation ticket)
- Changing the feature adapter

---

## Dependencies

IDENTITY-005 must be Complete (chat engine-alias audit needed).

---

## Blocked By

IDENTITY-005

---

## Exact Steps

1. Read `engines/identity/index.js` (or main entry). Record all exports.
2. Load IDENTITY-003 output (identity.adapter.js exports).
3. Side-by-side compare engine exports vs feature adapter exports.
4. Load IDENTITY-005 output (chat engine-alias import details).
5. For each chat ENGINE_ALIAS site from IDENTITY-005:
   - Is the imported operation available in the feature adapter? YES → should migrate.
   - Is the imported operation engine-only (not in feature adapter)? YES → document why.
6. Load IDENTITY-004 output for all ENGINE_ALIAS sites beyond chat.
7. Assess each non-chat ENGINE_ALIAS site with the same question.
8. Write the policy decision (ADAPTER_ONLY | ENGINE_ALLOWED | HYBRID_DOCUMENTED).
9. If ADAPTER_ONLY or HYBRID_DOCUMENTED: write the migration spec.
10. Write the scanner rule recommendation.

---

## Validation

- [ ] Engine surface vs feature adapter surface comparison completed
- [ ] All ENGINE_ALIAS sites assessed against the comparison
- [ ] Policy decision written with explicit rationale
- [ ] Migration spec written (even if ADAPTER_ONLY produces "migrate all")
- [ ] Scanner rule recommendation written
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Policy decision appended to this ticket:
```
## Engine Alias Policy Decision — [DATE]

### Engine Surface vs Feature Adapter Surface
[table: export | in engine | in feature adapter | verdict]

### Policy Decision
CHOSEN: ADAPTER_ONLY | ENGINE_ALLOWED | HYBRID_DOCUMENTED
Rationale: [paragraph]

### ENGINE_ALIAS Sites — Migration Assessment
[table: file | imported symbol | available in adapter? | migration action]

### Migration Spec
[If ADAPTER_ONLY: step-by-step migration for each ENGINE_ALIAS site]
[If HYBRID_DOCUMENTED: required comment format for each allowed usage]

### Scanner Rule Recommendation
[What rule should the scanner apply to @identity imports inside apps/VCSM/src/features/]
```

---

## Next Ticket

IDENTITY-011 — Shared Actor Types Planning
