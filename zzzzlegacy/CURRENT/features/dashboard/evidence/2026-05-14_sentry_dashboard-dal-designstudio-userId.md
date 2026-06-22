# SENTRY Compliance Review — designStudio.shared.controller.js userId Usage

**Date:** 2026-05-14  
**Scope:** `features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller.js`  
**Triggered by:** CEREBRO orchestration — VENOM-1 finding from 2026-05-11 Avengers Assembly  
**Authority:** SENTRY — Architecture compliance and boundary enforcement

---

## Prior Finding (VENOM-1)

`designStudio.auth.dal.js` calls `supabase.auth.getUser()` and returns the raw `userId`. The prior concern: if `dalReadAuthenticatedUserId()` is used as an authorization gate or ownership check, it violates the actor-based identity contract (VCSM identity must be scoped to `actorId`, not raw `userId`).

---

## File Reviewed

**`designStudio.shared.controller.js`** (full, 18 lines):

```js
import { dalReadAuthenticatedUserId } from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.auth.dal";
import { dalReadActorOwnerRow } from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal";

export async function requireOwnerActorAccess(ownerActorId) {
  const userId = await dalReadAuthenticatedUserId();
  if (!userId) throw new Error("Sign in required.");

  const ownerRow = await dalReadActorOwnerRow({
    actorId: ownerActorId,
    userId,
  });

  if (!ownerRow) {
    throw new Error("You do not have access to this VPORT design studio.");
  }

  return userId;
}
```

---

## Compliance Assessment

### Identity gate analysis

The function `requireOwnerActorAccess(ownerActorId)` performs ownership verification as follows:

1. **Fetches `userId`** from `supabase.auth.getUser()` — this is the Supabase auth session user ID
2. **Authentication check**: if no `userId`, throws (authentication guard, not authorization)
3. **Ownership check**: calls `dalReadActorOwnerRow({ actorId: ownerActorId, userId })` — this queries the `actor_owners` table using **both** the provided `actorId` AND the session `userId`
4. **Authorization gate**: if no `ownerRow` found, throws access denied

**The primary scoping key is `ownerActorId`** — which is passed into `requireOwnerActorAccess()` as a parameter by the caller (the hook or screen providing the target actor context). The `userId` is a secondary lookup value used only to verify that the authenticated session user owns the specified actor.

This pattern is **COMPLIANT** with the actor-based identity contract:
- The `actor_owners` table IS the canonical ownership table per the architecture contract
- `actorId` IS the primary scoping key
- `userId` is used only as a session lookup credential, not as an identity gate

---

### Returned userId concern

The function returns `userId` to its callers. Callers must not use this returned value as an identity gate. Callers reviewed:

- `designStudio.assetsExports.controller.js` — passes `ownerActorId` to `requireOwnerActorAccess`, uses returned value only for logging/null-check
- `designStudio.load.controller.js` — same pattern
- No caller was found routing domain data by the returned `userId`

**Assessment: COMPLIANT**

---

### Contract compliance checklist

| Check | Result |
|---|---|
| Primary scoping key is `actorId` | PASS — `ownerActorId` is the gate |
| `actor_owners` used for ownership verification | PASS |
| `profileId` or `vportId` not used as gate | PASS |
| `userId` not exposed as identity surface | PASS — internal lookup only |
| No TypeScript files | PASS |
| No `select('*')` | PASS |
| Controller has no React imports | PASS |
| File under 300 lines | PASS (18 lines) |

---

## Verdict

**VENOM-1 FINDING: RESOLVED**

`designStudio.shared.controller.js` is compliant with the VCSM actor-based identity contract. The `userId` is used only as a Supabase auth session credential to verify ownership via `actor_owners`. The `ownerActorId` (actorId) is the primary authorization scoping key.

**Status:** VERIFIED
