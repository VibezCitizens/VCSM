# ARCHITECT REVIEW — Citizen / VPORT First-Class Actor Separation

**Date:** 2026-06-06
**Branch:** vport-booking-feed-security-updates
**Scope:** Identity architecture, actor model, ownership semantics, contract compliance

---

## SECTION 1: Executive Summary

**Are Citizen and VPORT both first-class actors?** **PARTIAL**

Architectural design supports first-class semantics for both actor kinds. The database schema, hydration engine, and ownership controller (`assertActorOwnsVportActor`) all treat Citizen and VPORT symmetrically. However, one critical contract violation undermines the design: `ownerActorId` is exposed through `toPublicIdentity()`, violating the identity contract that only `actorId` and `kind` may be in the public interface.

**Top 3 Critical Findings:**

1. **CONTRACT VIOLATION** — `toPublicIdentity()` at `apps/VCSM/src/state/identity/identity.model.js:7` exposes `ownerActorId` in the public identity object. This leaks a private ownership field and causes downstream code to bypass the DAL.
2. **DESIGN DRIFT** — `resolveInboxActor()` at `apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js:48` reads `identity.ownerActorId` directly instead of querying `readActorOwnerUserDAL()`.
3. **DESIGN DRIFT** — `probeVportPortfolio.controller.js:21` copies `identity.ownerActorId` into a public probe result, spreading the anti-pattern to callers.

---

## SECTION 2: Architecture Map (Verified from Source)

```
CITIZEN (user) ACTOR LIFECYCLE:
├─ auth.users (Supabase auth)
├─ public.profiles (user_id FK)
├─ vc.actors row (kind='user', profile_id FK)
└─ vc.actor_owners row (actor_id, user_id) — citizen owns self

VPORT (vport) ACTOR LIFECYCLE:
├─ vport.profiles (owner_user_id FK)
├─ vc.actors row (kind='vport', vport_id FK)
└─ vc.actor_owners row (actor_id, user_id) — citizen owns vport

OWNERSHIP MODEL:
├─ vc.actor_owners.actor_id → vc.actors.id
├─ vc.actor_owners.user_id → public.profiles.id
└─ Rule: Only kind='user' actors may appear as owners
```

**Evidence:**
- Actor creation: `apps/VCSM/src/features/auth/dal/actorCreate.dal.js:15–21` — RPC `create_actor_for_user` creates both `kind='user'` and `kind='vport'` rows
- Ownership creation: `apps/VCSM/src/features/auth/dal/actorOwnerCreate.dal.js:3–16` — `dalCreateActorOwner()` upserts `vc.actor_owners(actor_id, user_id)`
- Citizen flow: `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js:15–53` — creates user actor then calls `dalCreateActorOwner(actor.id, userId)`
- VPORT flow: `apps/VCSM/src/features/vport/dal/vport.core.dal.js:73–115` — RPC `create_vport` returns `actor_id`; ownership is handled inside the RPC

---

## SECTION 3: useIdentity() Contract Verification

**Public identity shape returned by `useIdentity()` (identityContext.jsx:162–171):**

```
{ identity, loading, identityLoading, setIdentity, switchActor, availableActors, refreshAvailableActors, blockedVport }
```

**Fields inside `identity` (from `toPublicIdentity()` at identity.model.js:1–10):**

| Field | Status | Notes |
|---|---|---|
| `actorId` | ALLOWED | Required — active actor identity |
| `kind` | ALLOWED | 'user' or 'vport' discriminator |
| `ownerActorId` | **VIOLATION** | Line 7 — private ownership field must not be public |
| `realmId` | ALLOWED | Ancillary realm context |

**Violation detail:**

```javascript
// identity.model.js:7 — THE VIOLATION
ownerActorId: source.ownerActorId ?? null,
```

`ownerActorId` is a hydration-time internal value. It belongs only in `identityDetails` (internal state), never in the public `identity` returned by `toPublicIdentity()`.

---

## SECTION 4: Actor Semantics Table

| Flow | Expected Active Actor | Actual Code Uses | Status |
|---|---|---|---|
| User registers & onboards | kind='user' | createUserActorForProfile() → actor + ownership ✓ | CORRECT |
| User creates VPORT | kind='vport' | create_vport RPC returns actorId; ownership via RPC ✓ | CORRECT |
| Switch to VPORT | kind='vport' | switchActor() → hydrateVcsmActor() → ownerActorId derived from DAL ✓ | CORRECT |
| Post media (citizen) | kind='user' | useUploadSubmit passes identity.actorId ✓ | CORRECT |
| Post media (vport) | kind='vport' | recordPostMediaController receives vport actorId (not ownerActorId) ✓ | CORRECT |
| Assert VPORT ownership | caller must be kind='user' | assertActorOwnsVportActor queries vc.actor_owners via DAL ✓ | CORRECT |
| Inbox filter (citizen) | kind='user' | resolveInboxActor returns identity.actorId for both target + my ✓ | CORRECT |
| Inbox filter (vport) | kind='vport' | resolveInboxActor reads identity.ownerActorId directly ✗ | **VIOLATION** |
| Portfolio probe (vport) | kind='vport' | probeVportPortfolio copies identity.ownerActorId into result ✗ | **DRIFT** |
| Bottom-bar leads chip | kind='vport' | VportLeadsChip uses identity.actorId only ✓ | CORRECT |

---

## SECTION 5: Ownership Call Audit

| File:Line | Variable | Passed As | Controller Expects | Correct? | Notes |
|---|---|---|---|---|---|
| `resolveInboxActor.js:48` | `identity.ownerActorId` | Direct identity read | Ownership from actor_owners DAL | NO | Should call readActorOwnerUserDAL() |
| `probeVportPortfolio.controller.js:21` | `identity?.ownerActorId` | Copied into result.identity | Internal only | NO | Leaks ownership to callers |
| `useUploadSubmit.js:67` | `identity.actorId` | Active actor for media ownership | createMediaAssetController | YES | Correct — vport owns its own media |
| `assertActorOwnsVportActor.controller.js:43–46` | Derived from `readActorOwnerLinkByActorAndUserProfileDAL()` | DAL query | Proper ownership assertion | YES | Reference implementation |
| `VportLeadsChip.jsx:13–14` | `identity.actorId` (when kind='vport') | Active vport actorId | useVportLeadsCount | YES | Correct — leads scoped to vport actor |

---

## SECTION 6: Findings

---

### FINDING-001 — ownerActorId Exposed in Public Identity

- **Classification:** CONTRACT VIOLATION
- **File:** `apps/VCSM/src/state/identity/identity.model.js:7`
- **Evidence:**
  ```javascript
  export function toPublicIdentity(source) {
    if (!source?.actorId || !source?.kind) return null
    return {
      actorId: source.actorId,
      kind: source.kind,
      ownerActorId: source.ownerActorId ?? null,  // ← VIOLATION
      realmId: source.realmId ?? null,
    }
  }
  ```
- **Why it matters:** Every caller of `useIdentity()` now has access to a private ownership field. Downstream code has started depending on it (resolveInboxActor, probeVportPortfolio), eroding the isolation between the public identity contract and the private hydration state. If this field is ever absent or stale, callers silently fail.
- **Fix:** Remove line 7. Public identity = `{ actorId, kind, realmId }` only. Controllers that need owner must call `readActorOwnerUserDAL(actorId)`.

---

### FINDING-002 — resolveInboxActor Bypasses Ownership DAL

- **Classification:** DESIGN DRIFT
- **File:** `apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js:32, 48`
- **Evidence:**
  ```javascript
  if (identity.kind === "vport") {
    if (!identity.ownerActorId) {
      return { targetActorId: identity.actorId, myActorId: null };
    }
    return {
      targetActorId: identity.actorId,
      myActorId: identity.ownerActorId,  // ← reads from public identity
    };
  }
  ```
- **Why it matters:** When `ownerActorId` is absent or null (possible if hydration failed or contract changes), the inbox silently returns `myActorId: null`, causing the viewer to be treated as unauthenticated. The correct fix queries the DAL at call time, which is authoritative.
- **Fix:** Accept `(actorId, kind)` parameters. For `kind === 'vport'`, call `readActorOwnerUserDAL(actorId)` → then `readUserActorByProfileIdDAL(ownerRow.user_id)` to get the citizen actor ID.

---

### FINDING-003 — probeVportPortfolio Exposes ownerActorId in Public Result

- **Classification:** DESIGN DRIFT
- **File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js:21`
- **Evidence:**
  ```javascript
  result.identity = {
    actorId: identity?.actorId ?? null,
    kind: identity?.kind ?? null,
    vportType: identity?.vportType ?? null,
    ownerActorId: identity?.ownerActorId ?? null,  // ← leaks ownership
  };
  ```
- **Why it matters:** Dashboard callers of this probe now read `ownerActorId` from the result, propagating the anti-pattern one layer further. This also means ownership data is baked into cached probe results.
- **Fix:** Remove `ownerActorId` from `result.identity`. If the caller needs owner context, it must request it separately through an ownership DAL call.

---

### FINDING-004 — Hydrator Correctly Derives ownerActorId (Reference Implementation)

- **Classification:** CONFIRMED FIRST-CLASS DESIGN
- **File:** `apps/VCSM/src/features/hydration/vcsmActorHydrator.js:50–78`
- **Evidence:**
  ```javascript
  if (actor.kind === "vport") {
    const [vport, privacy, ownerRow] = await Promise.all([
      readVportIdentityDAL(actor.vport_id),
      readActorPrivacyDAL(actor.id),
      readActorOwnerUserDAL(actor.id),
    ]);
    let ownerActorId = null;
    if (ownerRow?.user_id) {
      const ownerActor = await readUserActorByProfileIdDAL(ownerRow.user_id);
      ownerActorId = ownerActor?.id ?? null;
    }
    return {
      ...mapVportActor(actor, vport, realmId),
      private: privacy?.is_private ?? false,
      ownerActorId,  // ← stored in identityDetails (internal only)
    };
  }
  ```
- **Why it matters:** This is the correct pattern. The hydrator queries `vc.actor_owners` to resolve ownership, then stores it in `identityDetails` (internal hydration context). The bug is solely that `toPublicIdentity()` then promotes this private field to the public contract.

---

### FINDING-005 — assertActorOwnsVportActor is the Reference Ownership Controller

- **Classification:** CONFIRMED FIRST-CLASS DESIGN
- **File:** `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:11–58`
- **Evidence:**
  ```javascript
  if (requesterActor.kind !== "user") {
    throw new Error("Only actor owners can manage this booking resource.");
  }
  const ownerLink = await readActorOwnerLinkByActorAndUserProfileDAL({
    targetActorId,
    userProfileId: requesterProfileId,
  });
  ```
- **Why it matters:** This controller enforces first-class ownership correctly: (1) verify `kind='user'`, (2) query `vc.actor_owners` via DAL, never reading from identity. All ownership controllers should follow this pattern.

---

### FINDING-006 — Identity Model Correctly Separates Citizen and VPORT Actor Maps

- **Classification:** CONFIRMED FIRST-CLASS DESIGN
- **File:** `apps/VCSM/src/state/identity/identity.model.js:39–80`
- **Evidence:**
  ```javascript
  export function mapProfileActor(actor, profile, realmId) {
    return { actorId: actor.id, kind: "user", realmId, ... }
  }
  export function mapVportActor(actor, vport, realmId) {
    return { actorId: actor.id, kind: "vport", realmId, ... }
  }
  ```
- **Why it matters:** Both actor kinds are mapped with symmetric shapes at the actor level. Type-specific fields (display name, avatar) are sourced from the correct backing table. First-class design at the model layer is confirmed.

---

## SECTION 7: Bottom-Bar Decision

**Should bottom-bar read `ownerActorId` from identity?**

**NO — and it correctly does not.**

Evidence from `apps/VCSM/src/features/shell/modules/bottom-bar/components/VportLeadsChip.jsx:11–15`:

```javascript
const { identity } = useIdentity();
const isVport = identity?.kind === "vport";
const actorId = isVport ? identity?.actorId : null;
const count = useVportLeadsCount(actorId);
```

When the active identity is a VPORT, the component passes the **vport's own `actorId`** to `useVportLeadsCount()`. This is correct: leads belong to the VPORT actor itself, not the owner. The bottom-bar is the canonical example of correct first-class VPORT actor consumption.

---

## SECTION 8: Recommended Fix Pattern

### Rule

```
UI passes active actorId + kind only.
Controllers resolve ownership internally via actor_owners DAL.
Controllers never expect UI to provide hidden owner IDs.
```

### Pattern A — Hydration (correct, no change needed)

```javascript
// vcsmActorHydrator.js
// ↓ queries DAL, stores result in identityDetails only (internal)
const ownerActorId = await deriveOwnerActorId(actor.id);
return { ...actorFields, ownerActorId };  // stored internally only
```

### Pattern B — Ownership Controller (correct reference)

```javascript
// assertActorOwnsVportActor.controller.js
// ↓ requester actorId in, ownership query against DAL
if (requesterActor.kind !== "user") throw ...
const ownerLink = await readActorOwnerLinkByActorAndUserProfileDAL({ ... });
```

### Pattern C — Utility functions (current: WRONG → fix)

```javascript
// resolveInboxActor.js — CURRENT (wrong)
return { myActorId: identity.ownerActorId };  // ← reads identity

// resolveInboxActor.js — CORRECT FIX
export async function resolveInboxActor(actorId, kind) {
  if (kind !== "vport") return { targetActorId: actorId, myActorId: actorId };
  const ownerRow = await readActorOwnerUserDAL(actorId);
  const ownerActor = ownerRow?.user_id
    ? await readUserActorByProfileIdDAL(ownerRow.user_id)
    : null;
  return { targetActorId: actorId, myActorId: ownerActor?.id ?? null };
}
```

---

## SECTION 9: Final Verdict

**FIRST_CLASS_PARTIAL**

The architecture is designed correctly — both Citizen and VPORT are first-class rows in `vc.actors`, ownership is modeled through `vc.actor_owners`, and the hydrator and key controllers follow the correct pattern. However, a single contract violation in `toPublicIdentity()` has caused design drift in two downstream files.

### Top 5 Files to Fix

| Priority | File | Change |
|---|---|---|
| 1 (root cause) | `apps/VCSM/src/state/identity/identity.model.js:7` | Remove `ownerActorId` from `toPublicIdentity()` |
| 2 | `apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js` | Refactor to accept actorId+kind; call `readActorOwnerUserDAL()` |
| 3 | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js:21` | Remove `ownerActorId` from `result.identity` |
| 4 | `apps/VCSM/src/features/hydration/vcsmActorHydrator.js` | No change — reference implementation, keep as-is |
| 5 | `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` | No change — reference implementation, use as template |

### Fix sequencing

Fix Priority 1 first. It will cause compile-time failures at Priorities 2 and 3, making those diffs obvious and scoped.

---

## Classification Summary

| # | Finding | Classification |
|---|---|---|
| 001 | ownerActorId in toPublicIdentity() | CONTRACT VIOLATION |
| 002 | resolveInboxActor reads identity.ownerActorId | DESIGN DRIFT |
| 003 | probeVportPortfolio exposes ownerActorId | DESIGN DRIFT |
| 004 | vcsmActorHydrator derives ownership correctly | CONFIRMED FIRST-CLASS DESIGN |
| 005 | assertActorOwnsVportActor pattern | CONFIRMED FIRST-CLASS DESIGN |
| 006 | mapProfileActor / mapVportActor symmetry | CONFIRMED FIRST-CLASS DESIGN |
