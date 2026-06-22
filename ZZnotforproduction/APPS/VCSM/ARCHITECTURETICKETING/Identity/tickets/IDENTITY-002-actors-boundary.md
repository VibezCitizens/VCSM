# [IDENTITY-002] actors vs identity Boundary Clarification

Status: Open
Priority: P3
Type: TASK
Weight: Light
Risk: ZERO

---

## Goal

Define, in writing, the exact boundary between `features/actors/` and `features/identity/`.
These two features serve overlapping purposes and the boundary is currently undocumented.
This ticket produces a written boundary definition that all future identity tickets will reference.

---

## Context

`features/actors/` (4 files, 2 consumers) and `features/identity/` (9 files, 41 consumers)
both provide actor data. `actors` is consumed by the dashboard team card and settings privacy
controller. `identity` is consumed by 41 features and is the primary session-resolved actor system.

FEATURES_ARCHITECTURE_REVIEW.md Question #1: "Where is the boundary between `actors/` and
`identity/`? Both provide actor data."

The answer exists in the code but has never been written down. Without a written boundary,
developers pick the wrong feature and introduce coupling errors.

---

## Source Evidence

- `FEATURE_IMPORT_MAP.json`: actors: 4 files, inbound = 2 (dashboard team card, settings privacy)
- `FEATURE_IMPORT_MAP.json`: identity: 9 files, inbound = 41
- `FEATURE_IMPORT_MAP.json` actors.inbound confirmed:
  - `dashboard/vport/dashboard/cards/team/controller/vportTeamAccess.controller.js`
    → `@/features/actors/adapters/actors.adapter`
  - `settings/privacy/controller/Blocks.controller.js`
    → `@/features/actors/adapters/actors.adapter`
- `FEATURES_ARCHITECTURE_REVIEW.md`: "Both provide actor data. Boundary is undocumented."

---

## Scope

1. Read `apps/VCSM/src/features/actors/` files:
   - `actors.adapter.js`
   - `searchActors.controller.js`
   - `searchActors.dal.js`
   - `searchActors.model.js`
2. Read IDENTITY-001 output (adapter surface of identity).
3. Compare what each feature provides:
   - What data shape does `actors` expose?
   - What data shape does `identity` expose?
   - Who is the caller for each (session user vs arbitrary lookup)?
4. Write the boundary definition.

---

## Out of Scope

- Merging the features (that is IDENTITY-012)
- Modifying any file
- Making a decision about whether actors should be merged — only documenting what exists

---

## Dependencies

IDENTITY-001 must be Complete (adapter surface of identity must be known).

---

## Blocked By

IDENTITY-001

---

## Exact Steps

1. Read all 4 actors feature files. Record exports, data shapes, and DB tables each file touches.
2. Read IDENTITY-001 output (identity adapter surface).
3. Side-by-side comparison:
   - `actors`: What does it expose? Who calls it? What is the use case?
   - `identity`: What does it expose? Who calls it? What is the use case?
4. Write the boundary definition using this template:

```
## actors — What It Does
[One paragraph]
## identity — What It Does
[One paragraph]
## The Rule
Use `actors` when: [condition]
Use `identity` when: [condition]
Never use `actors` when: [condition]
Never use `identity` when: [condition]
```

5. Append the completed definition to this ticket's output section.

---

## Validation

- [ ] All 4 actors files read
- [ ] identity adapter surface known (from IDENTITY-001)
- [ ] Written boundary definition exists with a clear rule
- [ ] "The Rule" has no ambiguous cases
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Completed boundary definition appended to this ticket:
```
## Boundary Definition — [DATE]

### actors — What It Does
[description]

### identity — What It Does
[description]

### The Rule
Use actors when: ...
Use identity when: ...
Never use actors when: ...
Never use identity when: ...

### Evidence
[files read, exports confirmed]
```

---

## Next Ticket

IDENTITY-003 (can run in parallel — IDENTITY-002 is not a blocker for IDENTITY-003)
IDENTITY-012 (depends on this ticket's boundary definition)
