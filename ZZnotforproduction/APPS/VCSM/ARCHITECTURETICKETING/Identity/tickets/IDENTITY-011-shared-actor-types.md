# [IDENTITY-011] Shared Actor Types Planning

Status: Open
Priority: P2
Type: TASK
Weight: Medium-Heavy
Risk: MEDIUM

---

## Goal

Design the schema for `shared/types/actors.types.js` — a single source of truth for actor
type definitions used across `identity`, `profiles`, `auth`, `settings`, and `booking`.
This ticket produces a planning document only. No source changes.

---

## Context

Actor type definitions are currently distributed across multiple features with no canonical
location. `shared/types/` does not exist. The risk is type drift: if one feature's actor
shape assumption diverges from another's, integration boundary failures appear at runtime
rather than at import time.

Known actor type usage locations:
- `identity/`: `toPublicIdentity()` shape = `{ actorId, kind, ownerActorId, realmId }`
- `auth/`: actor creation shapes in DAL layer (`dalCreateUserActor`, `dalCreateActorOwner`)
- `profiles/`: actor model references (exact fields UNKNOWN until IDENTITY-008)
- `settings/`: reads identity fields (exact fields from IDENTITY-006)
- `booking/`: uses actor ownership types (exact fields UNKNOWN)

The D-002 bug (IDENTITY-009) exists partly because `identity.kind` is not a typed constant —
any string can be passed as `callerActorId` without type enforcement.

---

## Source Evidence

- `actor-first-architecture-audit.md`: `toPublicIdentity()` shape defined
- `IDENTITY-001` output: identity feature file inventory
- `IDENTITY-004` output: all 41 consumer features (which features use actor fields)
- `IDENTITY-006` output: which identity fields settings reads
- `IDENTITY-008` output: which identity fields profiles reads
- `IDENTITY-009` output: D-002 — kind='user' | kind='vport' distinction is unchecked

---

## Scope

Design the `shared/types/actors.types.js` file contents:
1. `ACTOR_KIND` constant: `{ USER: 'user', VPORT: 'vport' }`
2. `PublicIdentity` shape: `{ actorId, kind, ownerActorId, realmId }`
3. `ActorBase` shape: minimal fields every actor record has
4. `ActorOwner` shape: ownership relationship shape
5. Guard functions (if applicable): `isUserActor(identity)`, `isVportActor(identity)`

Assess where each type is currently defined informally (which feature owns it implicitly now).
Assess the migration impact: how many files must import from `shared/types/actors.types.js`
instead of their current source.

---

## Out of Scope

- Creating the file (implementation ticket)
- Migrating any imports (implementation ticket)
- TypeScript type definitions (VCSM is JavaScript — these are JSDoc shapes and constant objects)
- Actor fields beyond identity and ownership (DB schema fields not in scope here)

---

## Dependencies

IDENTITY-001 — identity file inventory (confirms toPublicIdentity shape)
IDENTITY-002 — actors vs identity boundary (defines where ActorBase currently lives)
IDENTITY-004 — full consumer list (defines which features must be migrated)

---

## Blocked By

IDENTITY-001, IDENTITY-002, IDENTITY-004

---

## Exact Steps

1. Load IDENTITY-001 output — get the confirmed `toPublicIdentity()` shape from source.
2. Load IDENTITY-006 output — which fields does settings read from identity?
3. Load IDENTITY-008 output — which fields does profiles read from identity?
4. Load IDENTITY-009 output — what types are checked or missed in D-002 hooks?
5. Draft `ACTOR_KIND` constants: confirm values from source (`'user'` and `'vport'` —
   verify these are the only two values in `vc.actors.kind`).
6. Draft `PublicIdentity` shape from `toPublicIdentity()`.
7. Draft `ActorBase` — minimum fields shared across all actor records (actorId, kind).
8. Draft `ActorOwner` — ownership relationship (actorId + ownerActorId + relationship).
9. Draft guard functions: `isUserActor(identity)` = `identity?.kind === ACTOR_KIND.USER`.
10. List all files across codebase that would need to import from `shared/types/actors.types.js`
    (based on consumer audit).
11. Assess migration complexity: is this a simple search-replace, or are there inline type
    checks that need semantic changes?

---

## Validation

- [ ] `toPublicIdentity()` shape confirmed from source (not assumed)
- [ ] `ACTOR_KIND` values confirmed from DB schema or source constants
- [ ] All type shapes have evidence from source reads
- [ ] Migration impact count written (how many files must be updated)
- [ ] Guard functions drafted
- [ ] No source file created or modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. `shared/` directory (do not create files — planning only). Any CONTRACTS/ file.

---

## Expected Output

Shared actor types plan appended to this ticket:
```
## Shared Actor Types Plan — [DATE]

### Proposed: shared/types/actors.types.js

#### ACTOR_KIND
const ACTOR_KIND = { USER: 'user', VPORT: 'vport' }
Evidence: [where confirmed in source]

#### PublicIdentity Shape
{ actorId, kind, ownerActorId, realmId }
Evidence: toPublicIdentity() in [file]

#### ActorBase Shape
{ actorId, kind }
Evidence: [confirmed fields]

#### ActorOwner Shape
{ actorId, ownerActorId }
Evidence: [confirmed from actor_owners table or source]

#### Guard Functions
isUserActor(identity): identity?.kind === ACTOR_KIND.USER
isVportActor(identity): identity?.kind === ACTOR_KIND.VPORT

### Migration Impact
[table: feature | files to update | complexity]
Total files: [count]

### Current Informal Type Locations
[where each type is currently implied/used without a central definition]
```

---

## Next Ticket

IDENTITY-012 — actors → identity Merge Planning
