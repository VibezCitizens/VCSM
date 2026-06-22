# [IDENTITY-003] Adapter Contract Definition

Status: Open
Priority: P2
Type: TASK
Weight: Light
Risk: ZERO

---

## Goal

Produce a written adapter surface contract for `features/identity/`. The contract defines what
is publicly exported, what is internal, and what rules govern additions to the adapter surface.
This becomes the compliance baseline for IDENTITY-004's consumer audit.

---

## Context

The identity feature has two adapter files:
- `apps/VCSM/src/features/identity/adapters/identity.adapter.js`
- `apps/VCSM/src/features/identity/adapters/identityOps.adapter.js`

Scanner confirms 0 violations: all 41 consumers go through these files. But the contract
governing the adapter surface has never been written. Without a contract, there is no
authoritative answer to "is this export supposed to be public?" — making compliance checks
subjective and future additions unconstrained.

---

## Source Evidence

- `FEATURE_IMPORT_MAP.json`: identity violations = 0 (all 41 consumers through adapters)
- `actor-first-architecture-audit.md`: `toPublicIdentity()` shape = `{ actorId, kind, ownerActorId, realmId }`
- `IDENTITY-001` output: confirmed exports from both adapter files (requires IDENTITY-001 Complete)

---

## Scope

Using IDENTITY-001 output, produce a contract document specifying:
1. Every export from `identity.adapter.js` — classified as: read-only | operation | reactive hook
2. Every export from `identityOps.adapter.js` — classified as: read-only | operation | reactive hook
3. What may NOT be exported (internal-only): DAL functions, controller functions, resolver internals
4. The canonical public shape: `toPublicIdentity()` = `{ actorId, kind, ownerActorId, realmId }`
5. Rules for adding new exports:
   - Must go through adapter layer
   - Must not expose DAL query shapes
   - Must not expose ownership table access
   - Must not expose session internals beyond toPublicIdentity()

---

## Out of Scope

- Changing any adapter file
- Adding or removing exports
- Enforcing the contract (that is IDENTITY-004's job)

---

## Dependencies

IDENTITY-001 must be Complete (adapter export list must be known).

---

## Blocked By

IDENTITY-001

---

## Exact Steps

1. Load IDENTITY-001 output — get the confirmed export list for both adapter files.
2. For each export, classify:
   - **read-only**: returns data, no mutation
   - **operation**: triggers a mutation or side effect
   - **reactive hook**: wraps a subscription or realtime source
3. For each export, record:
   - Export name
   - Classification (read-only | operation | reactive hook)
   - What it exposes (a hook, a function, a context value?)
   - Whether it exposes internal identity internals (DAL shapes, session tokens) — YES/NO
4. List what is internal-only (not exported from adapter files):
   - DAL function names
   - Controller function names
   - Resolver internals
5. Write the extension rule:
   - "Any new public operation must be added to adapter files only."
   - "DAL shapes must never appear in adapter exports."
   - "The canonical public shape is `toPublicIdentity()`. No additional session fields may be added without owner approval."
6. Append the contract to this ticket's output section.

---

## Validation

- [ ] Both adapter files inventoried
- [ ] Every export classified (no unclassified exports)
- [ ] Internal-only list exists (DAL, controller, resolver)
- [ ] Extension rule written
- [ ] `toPublicIdentity()` shape confirmed from source
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Contract appended to this ticket:
```
## Adapter Contract — [DATE]

### identity.adapter.js — Public Surface
[table: export name | classification | exposes | safe]

### identityOps.adapter.js — Public Surface
[table: export name | classification | exposes | safe]

### Internal-Only (Not Adapter-Exported)
[list]

### Canonical Public Shape
toPublicIdentity(): { actorId, kind, ownerActorId, realmId }
[confirmed from source or UNKNOWN if not yet read]

### Extension Rules
[numbered rules]
```

---

## Next Ticket

IDENTITY-004 (requires this contract as compliance baseline)
