# [IDENTITY-009] Auth/Session Identity Boundary

Status: Open
Priority: P1
Type: TASK
Weight: Medium
Risk: MEDIUM

---

## Goal

Document the full auth → identity lifecycle boundary: how actor rows are created at
onboarding, how ownership rows are co-created, and how the 11 hooks affected by D-002
(wrong callerActorId kind) should be fixed. No source changes in this ticket — this is
the diagnostic and fix-pattern record.

---

## Context

The auth → identity boundary has two distinct problems:

**1. Lifecycle boundary (informational):**
Auth creates identity rows. At onboarding completion, `createUserActorForProfile` calls
`dalCreateUserActor` then `dalCreateActorOwner`. The identity feature reads rows that auth
writes. There is no import dependency from auth → features/identity/, only a DB write
relationship. The boundary is valid but undocumented.

**2. D-002 bug (HIGH severity, active):**
11 hooks pass `identity.actorId` as `callerActorId` to `assertActorOwnsVportActorController`,
which requires `kind='user'`. When the active actor is vport-kind, this silently fails.
`assertSessionOwnsVportActorController` does not have this restriction and should be used
instead, or hooks must derive the user-kind actorId before calling the actor-based gate.

Fix pattern is documented in the audit and already exists in 3 reference implementations:
- `usePublishMenuPost.js`
- `usePortfolioItemSubmit.js`
- `useUpsertVportServices.js`

This ticket records the full D-002 hook list, the fix pattern, and the implementation ticket
template. The fix itself is a separate implementation ticket.

---

## Source Evidence

- `actor-first-architecture-audit.md` D-002: 11 affected hooks listed
- `actor-first-architecture-audit.md` FINDING-002: Severity HIGH; fix pattern documented
- `ACTOR_OWNERSHIP_ARCHITECTURE_AUDIT_2026-06-06.md`: createUserActorForProfile lifecycle chain
- `ACTOR_MODEL_AUDIT_2026-06-06.md`: wanders user.id stored as ownerActorId finding

---

## Scope

**Part A — Lifecycle boundary:**
1. Read `apps/VCSM/src/features/auth/controllers/onboarding.controller.js` (or equivalent
   onboarding completion controller).
2. Trace: onboarding completion → `createUserActorForProfile` → `dalCreateUserActor`
   → `dalCreateActorOwner`.
3. Confirm: does auth write to `vc.actors` AND `vc.actor_owners` in the same transaction?
4. Confirm: is there a case where `vc.actors` is written but `vc.actor_owners` is not?

**Part B — D-002 bug audit:**
1. Read each of the 11 affected hooks from the audit. Confirm the bug is still present
   (i.e., confirm `identity.actorId` is passed without kind check).
2. For each hook, record:
   - File path
   - Line where `callerActorId` is set
   - Whether it uses `assertActorOwnsVportActorController` or `assertSessionOwnsVportActorController`
3. Compare against the 3 reference implementations. Confirm the fix pattern.
4. Write the fix template:
```js
const callerActorId = identity?.kind === "user"
  ? identity.actorId
  : availableActors?.find(a => a.actorKind === "user")?.actorId ?? null;
```

**Part C — wanders finding:**
From `ACTOR_MODEL_AUDIT_2026-06-06.md`: a `wanders` record uses `user.id` (Supabase auth UUID)
as `ownerActorId` instead of the actor row UUID. Confirm whether this is still present in
`vcsmActorHydrator.js:64-73` (the `profile_actor_access` fallback path).

---

## Out of Scope

- Fixing D-002 (implementation ticket)
- Auth feature full audit
- Session token handling
- The DB migration for ownership rows (separate DB audit)

---

## Dependencies

IDENTITY-001 must be Complete (identity files confirmed)
IDENTITY-003 must be Complete (adapter contract known)

---

## Blocked By

IDENTITY-001, IDENTITY-003

---

## Exact Steps

**Part A:**
1. Read onboarding.controller.js. Trace the actor creation chain.
2. Confirm co-creation of vc.actors and vc.actor_owners rows.
3. Record: transaction scope (same RPC/function? separate calls?).

**Part B:**
1. Read each of the 11 D-002 hooks:
   - `useVportDirectoryVisibility.js`
   - `useVportBusinessCardSettings.js`
   - `useVportTeam.js`
   - `useJoinBarbershop.js`
   - `useContentPages.js`
   - `usePublishBarbershopPortfolio.js`
   - `usePublishBarbershopHours.js`
   - booking action hooks (confirm exact file names from audit)
   - quick booking modal hook
   - `useActorPrivacy.js`
2. For each, confirm: does it pass `identity.actorId` without kind check?
3. Read one reference implementation (`usePublishMenuPost.js`). Confirm fix pattern.

**Part C:**
1. Read `engines/identity/vcsmActorHydrator.js` lines 64–73.
2. Confirm whether `profile_actor_access` fallback stores `user.id` or actor row UUID.

---

## Validation

- [ ] Lifecycle chain traced: auth onboarding → vc.actors + vc.actor_owners creation confirmed
- [ ] All 11 D-002 hooks confirmed (bug still present or already fixed — record both)
- [ ] Fix pattern from reference implementations confirmed
- [ ] wanders finding confirmed or cleared (profile_actor_access fallback audited)
- [ ] Implementation ticket template written
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Auth/identity boundary report appended to this ticket:
```
## Auth/Identity Boundary Report — [DATE]

### Part A — Lifecycle Boundary
Onboarding chain: [traced path]
vc.actors creation: [confirmed / NOT FOUND]
vc.actor_owners co-creation: [same transaction / separate / NOT CONFIRMED]
Gap risk: [any case where actor exists without owner row?]

### Part B — D-002 Bug Status
[table: hook file | callerActorId line | still uses wrong kind | fix needed]
Bug confirmed in [count] of 11 hooks.
Reference fix pattern: [code block confirmed from usePublishMenuPost.js]

### Part C — wanders Fallback Finding
vcsmActorHydrator.js:64-73: [confirmed stores user.id / confirmed stores actorId / UNRESOLVED]

### Implementation Ticket Template
[Draft ticket header for the D-002 fix implementation]
```

---

## Next Ticket

IDENTITY-010 — Engine Alias Policy
