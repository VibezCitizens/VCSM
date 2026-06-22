# [IDENTITY-012] actors → identity Merge Planning

Status: Open
Priority: P2
Type: TASK
Weight: Heavy
Risk: HIGH

---

## Goal

Produce a complete merge plan for absorbing `features/actors/` into `features/identity/`.
The plan must enumerate every file that moves, every consumer import that must update, and
the exact import path change for each of the 2 confirmed consumers. This ticket authorizes
a future implementation ticket — no source changes happen here.

---

## Context

`features/actors/` (4 files, 2 consumers) serves a purpose that overlaps with
`features/identity/` (9 files, 41 consumers). The boundary clarification from IDENTITY-002
determines whether actors serves a distinct purpose (actor search/lookup) or is redundant.

If IDENTITY-002 concludes that actors is a subset of identity's responsibility, the merge
eliminates the parallel feature and puts actor lookup behind the same adapter surface as
identity.

The 2 confirmed consumers of `actors`:
1. `dashboard/vport/dashboard/cards/team/controller/vportTeamAccess.controller.js`
   → `@/features/actors/adapters/actors.adapter`
2. `settings/privacy/controller/Blocks.controller.js`
   → `@/features/actors/adapters/actors.adapter`

After merge, both consumers would import from `@/features/identity/adapters/identity.adapter`.

This ticket is gated on IDENTITY-002 (boundary must be resolved), IDENTITY-004 (consumer
audit complete), and IDENTITY-011 (shared types designed) because the merge plan must account
for type changes.

---

## Source Evidence

- `FEATURE_IMPORT_MAP.json`: actors consumers confirmed
- `IDENTITY-002` output: boundary definition — is actors distinct or redundant?
- `IDENTITY-004` output: full consumer map (confirms actors consumer count = 2)
- `IDENTITY-011` output: shared types plan (merge may bring actors types into shared/)
- `actor-first-architecture-audit.md`: identity architecture surface and constraints

---

## Scope

Produce the following merge plan artifacts:
1. **Decision gate**: Should the merge proceed? (Based on IDENTITY-002 boundary verdict.)
2. **File movement plan**: Where does each of the 4 actors files go after merge?
3. **Consumer update plan**: For each of the 2 consumers, the exact import path change.
4. **Identity adapter update**: What must be added to `identity.adapter.js` to surface the
   actors functionality?
5. **Shared types impact**: Does the merge affect the IDENTITY-011 shared types plan?
6. **Rollback plan**: How to revert if the merge breaks something.
7. **Implementation ticket template**: Scaffolded IDENTITY-IMPL-001 ticket for the actual merge.

---

## Out of Scope

- Executing the merge (implementation ticket)
- Modifying any source file
- Changing the scanner configuration
- Any migration beyond the 2 confirmed consumers

---

## Dependencies

IDENTITY-002 — boundary definition (must conclude whether merge is warranted)
IDENTITY-004 — consumer count confirmed (2 consumers)
IDENTITY-011 — shared types plan (merge may affect type locations)

---

## Blocked By

IDENTITY-002, IDENTITY-004, IDENTITY-011

---

## Exact Steps

1. Load IDENTITY-002 boundary verdict:
   - If DISTINCT: actors is not a subset of identity. Merge may not be warranted. Document
     the verdict and close this ticket with MERGE_NOT_RECOMMENDED.
   - If REDUNDANT or SUBSET: proceed with merge plan.
2. Read all 4 actors feature files (if not already read in IDENTITY-002):
   - `actors.adapter.js` — what does it export?
   - `searchActors.controller.js` — what does it do?
   - `searchActors.dal.js` — what table does it query?
   - `searchActors.model.js` — what model shape does it define?
3. Write the file movement plan:
   - Where does each file land inside `features/identity/`?
   - Which exports merge into `identity.adapter.js`?
   - What naming conflicts exist?
4. Write the consumer update plan:
   - Consumer 1: `vportTeamAccess.controller.js` — current import vs new import
   - Consumer 2: `Blocks.controller.js` — current import vs new import
5. Write the identity adapter update plan:
   - Which `actors.adapter.js` exports must be added to `identity.adapter.js`?
   - Do any of those exports conflict with existing identity adapter exports?
6. Assess IDENTITY-011 shared types impact:
   - Does the actors feature have types that belong in `shared/types/actors.types.js`?
7. Write the rollback plan:
   - If a consumer breaks post-merge, what is the revert path?
   - Are there any DB-level implications (actors are read-only — confirm no DB writes)?
8. Write the implementation ticket template as an appendix.

---

## Validation

- [ ] IDENTITY-002 boundary verdict loaded and recorded
- [ ] Merge decision recorded: MERGE_RECOMMENDED | MERGE_NOT_RECOMMENDED
- [ ] If MERGE_RECOMMENDED: all 4 actors files have a movement plan
- [ ] Both consumer import path changes written explicitly
- [ ] Identity adapter update plan written
- [ ] Rollback plan written
- [ ] Implementation ticket template appended
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed for this planning ticket.

For the implementation ticket (future): rollback = revert 4 file movements + 2 consumer
import updates. No DB changes involved.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Merge plan appended to this ticket:
```
## actors → identity Merge Plan — [DATE]

### Decision Gate
IDENTITY-002 verdict: REDUNDANT | SUBSET | DISTINCT
Merge decision: MERGE_RECOMMENDED | MERGE_NOT_RECOMMENDED
Rationale: [paragraph]

### File Movement Plan (if MERGE_RECOMMENDED)
[table: actors file | destination in identity/ | naming conflict?]

### Consumer Update Plan
Consumer 1: vportTeamAccess.controller.js
  FROM: @/features/actors/adapters/actors.adapter
  TO: @/features/identity/adapters/identity.adapter
  Specific export used: [name]

Consumer 2: Blocks.controller.js
  FROM: @/features/actors/adapters/actors.adapter
  TO: @/features/identity/adapters/identity.adapter
  Specific export used: [name]

### Identity Adapter Update Plan
[What must be added to identity.adapter.js to surface actors functionality]

### Shared Types Impact
[Does the merge affect IDENTITY-011 plan?]

### Rollback Plan
[Step-by-step revert if merge breaks something]

### Implementation Ticket Template
# [IDENTITY-IMPL-001] Merge actors → identity
Status: Open (pending owner approval)
...
```

---

## Next Ticket

None — this is the last planning ticket.
After owner review: open IDENTITY-IMPL-001 for the actual merge.
