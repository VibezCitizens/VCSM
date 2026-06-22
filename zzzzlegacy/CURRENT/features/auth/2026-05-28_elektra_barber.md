# ELEKTRA — Barber Module Precision Scan (Delta Pass)
**Date:** 2026-05-28  
**Agent:** ELEKTRA  
**Scope:** apps/VCSM — barber join flow  
**Context:** Prior ELEKTRA pass ran 2026-05-27 (`2026-05-27_05-42_elektra_barber-vport-patch-advisory.md`). That pass covered the main barber VPORT ownership and post-publish paths. This pass focuses exclusively on the **join flow** — the QR and invite paths for a barber actor joining a barbershop.

**Files scanned:**
- `apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js`
- `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js`
- `apps/VCSM/src/features/join/dal/barberVport.read.dal.js`
- `apps/VCSM/src/features/join/dal/joinInvite.dal.js`
- `apps/VCSM/src/features/join/dal/joinAuth.dal.js`
- `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`
- `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` (ownership primitive reference)

---

## Summary

| ID | Title | Severity | Status |
|---|---|---|---|
| ELEK-2026-05-28-024 | `createBarberVportAndAcceptQr` calls `acceptJoinResourceDAL` without `assertActorOwnsVportActorController` | HIGH | Open |
| ELEK-2026-05-28-025 | `createBarberVportAndAccept` (invite path) calls `acceptJoinResourceDAL` without ownership assertion | HIGH | Open |
| ELEK-2026-05-28-026 | `autoResumeInviteOnboarding` calls `acceptJoinResourceDAL` without ownership assertion | MEDIUM | Open |
| ELEK-2026-05-28-027 | `fetchJoinResourceByIdDAL` does not filter by `resource_type` — any resource ID can be used as a join token | MEDIUM | Open |
| ELEK-2026-05-28-028 | QR expiry (`join_expires_at`) checked only in hook/UI layer — controller layer has no expiry enforcement | LOW | Open |

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-024  
**Title:** `createBarberVportAndAcceptQr` calls `acceptJoinResourceDAL` without verifying the newly created VPORT is owned by the caller  
**Category:** Broken Object-Level Authorization — Missing ownership assertion on join accept  
**Severity:** HIGH  
**Status:** Open  
**Scope:** VCSM  
**Location:** `apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js:44-58`

**Source:** `token` (QR resource ID from URL), `vportName` (user-supplied), `createVport` (injected function from hook)

**Sink:** `acceptJoinResourceDAL(token, vportResult.actorId, ...)` — sets `member_actor_id` on the resource row

**Trust Boundary:** `createBarberVportAndAcceptQr` creates a new barber VPORT via `createVport` and immediately accepts the QR join resource on behalf of the newly created VPORT. There is no call to `assertActorOwnsVportActorController` before `acceptJoinResourceDAL`. The assumption is that because `createVport` just created the VPORT, the caller owns it — but this is not verified against the `actor_owners` table.

**Impact:** If `createVport` can be called such that `vportResult.actorId` is not actually linked to the caller in `actor_owners` (e.g., a race or a misconfigured provisioning path), the `acceptJoinResourceDAL` would link an unowned VPORT to the barbershop resource. Contrast with `acceptQrJoin` which correctly calls `assertActorOwnsVportActorController` before accepting.

In a direct attack scenario: if an adversary can supply a different `vportResult.actorId` (by manipulating `createVport`'s return value through a compromise of that layer), they could link an arbitrary VPORT to any pending-onboarding resource.

**Evidence:**
```js
// joinBarbershopQr.controller.js:44-57
export async function createBarberVportAndAcceptQr(token, vportName, { createVport } = {}) {
  if (!vportName || !String(vportName).trim()) throw new Error("VPORT name is required.");

  const vportResult = await createVport?.({
    name: String(vportName).trim(),
    vportType: "barber",
    directoryVisible: true,
  });

  await acceptJoinResourceDAL(token, vportResult.actorId, {  // <-- no ownership assertion before this
    join_token_used_at: new Date().toISOString(),
  });

  return { barberVportActorId: vportResult.actorId, vportName: String(vportName).trim() };
}

// Compare: acceptQrJoin — correctly asserts ownership
export async function acceptQrJoin(token, barberVportActorId, callerActorId) {
  if (!callerActorId) throw new Error("acceptQrJoin: callerActorId required");
  await assertActorOwnsVportActorController({     // <-- this is present here but absent above
    requestActorId: callerActorId,
    targetActorId: barberVportActorId,
  });
  ...
}
```

**Reproduction:**
1. Authenticated actor obtains a valid pending_onboarding QR token.
2. Actor calls the `QR_CREATE_VPORT` flow path, invoking `createBarberVportAndAcceptQr`.
3. `createVport` creates a VPORT. In the normal case, the actor owns it.
4. `acceptJoinResourceDAL` is called without checking ownership via `actor_owners`.
5. If `createVport` returns an actorId that is not owned by the calling user (race, injection, or bug), the join succeeds for an unowned VPORT.

**Existing Defense:** `acceptJoinResourceDAL` uses an atomic DB condition (`meta->>status = 'pending_onboarding' AND member_actor_id IS NULL`) that prevents replay. The `createVport` function normally creates a VPORT owned by the authenticated user.

**Why Insufficient:** The ownership assertion is the security contract. Other `acceptQrJoin` paths assert it explicitly. `createBarberVportAndAcceptQr` omits it, creating an inconsistent security posture. The protection is accidental (relies on `createVport` behavior) rather than explicit (enforced by `actor_owners`).

**Recommended Fix:** Add `assertActorOwnsVportActorController` after `createVport` returns and before `acceptJoinResourceDAL`:
```js
export async function createBarberVportAndAcceptQr(token, vportName, { createVport, callerActorId } = {}) {
  if (!callerActorId) throw new Error("createBarberVportAndAcceptQr: callerActorId required");
  if (!vportName || !String(vportName).trim()) throw new Error("VPORT name is required.");

  const vportResult = await createVport?.({
    name: String(vportName).trim(),
    vportType: "barber",
    directoryVisible: true,
  });

  // Assert ownership before accepting — consistent with acceptQrJoin pattern
  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: vportResult.actorId,
  });

  await acceptJoinResourceDAL(token, vportResult.actorId, {
    join_token_used_at: new Date().toISOString(),
  });

  return { barberVportActorId: vportResult.actorId, vportName: String(vportName).trim() };
}
```
The hook `createVportAndAcceptQr` must pass `callerActorId = identity?.actorId`.

**Follow-up Command:** SPIDER-MAN regression test for this path.

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-025  
**Title:** `createBarberVportAndAccept` (invite path) calls `acceptJoinResourceDAL` without ownership assertion  
**Category:** Broken Object-Level Authorization — Missing ownership assertion on invite accept  
**Severity:** HIGH  
**Status:** Open  
**Scope:** VCSM  
**Location:** `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js:108-121`

**Source:** `token` (invite resource ID), `vportName` (user-supplied), `createVport` + `readCurrentAuthUserDAL` (injected)

**Sink:** `acceptJoinResourceDAL(token, vportResult.actorId)` — sets `member_actor_id` on the invite resource row

**Trust Boundary:** The invite-path equivalent of ELEK-2026-05-28-024. After creating a barber VPORT via `createVport`, the function immediately calls `acceptJoinResourceDAL` with no ownership assertion. Compare with `useExistingBarberVportAndAccept` which correctly calls `assertActorOwnsVportActorController`.

**Impact:** Same impact class as ELEK-2026-05-28-024. A newly-created VPORT's actorId is accepted into the invite resource without confirming `actor_owners` ownership. Inconsistency between the "create new VPORT" and "use existing VPORT" acceptance paths.

**Evidence:**
```js
// joinBarbershopAccount.controller.js:108-121
export async function createBarberVportAndAccept(token, vportName, { readCurrentAuthUserDAL, createVport } = {}) {
  const user = await readCurrentAuthUserDAL?.();
  if (!user) throw new Error("Not signed in.");

  const vportResult = await createVport?.({
    name: vportName,
    vportType: BARBER_CATEGORY,
    directoryVisible: true,
  });

  await acceptJoinResourceDAL(token, vportResult.actorId);  // <-- no ownership assertion
  return { barberVportActorId: vportResult.actorId };
}

// Compare: useExistingBarberVportAndAccept — asserts ownership
export async function useExistingBarberVportAndAccept(token, vportActorId, { readCurrentAuthUserDAL, callerActorId } = {}) {
  if (!callerActorId) throw new Error("useExistingBarberVportAndAccept: callerActorId required");
  ...
  await assertActorOwnsVportActorController({    // <-- correctly present here
    requestActorId: callerActorId,
    targetActorId: vportActorId,
  });
  await acceptJoinResourceDAL(token, vportActorId);
}
```

**Reproduction:** Same as ELEK-2026-05-28-024, via the invite flow `CREATE_VPORT` path.

**Existing Defense:** User auth check (`if (!user)`) confirms session exists. `createVport` typically creates an actor owned by the session user.

**Why Insufficient:** Auth check confirms session, not ownership via `actor_owners`. The ownership assertion gap is identical to ELEK-2026-05-28-024.

**Recommended Fix:**
```js
export async function createBarberVportAndAccept(token, vportName, { readCurrentAuthUserDAL, createVport, callerActorId } = {}) {
  if (!callerActorId) throw new Error("createBarberVportAndAccept: callerActorId required");
  const user = await readCurrentAuthUserDAL?.();
  if (!user) throw new Error("Not signed in.");

  const vportResult = await createVport?.({ name: vportName, vportType: BARBER_CATEGORY, directoryVisible: true });

  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: vportResult.actorId,
  });

  await acceptJoinResourceDAL(token, vportResult.actorId);
  return { barberVportActorId: vportResult.actorId };
}
```
Hook `createVportInvite` must pass `callerActorId = identity?.actorId`.

**Follow-up Command:** SPIDER-MAN regression test.

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-026  
**Title:** `autoResumeInviteOnboarding` calls `acceptJoinResourceDAL` without ownership assertion after VPORT creation  
**Category:** Broken Object-Level Authorization — Missing ownership assertion on auto-resume  
**Severity:** MEDIUM  
**Status:** Open  
**Scope:** VCSM  
**Location:** `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js:73-106`

**Source:** `token` from user metadata, `vportResult.actorId` from `createVport`

**Sink:** `acceptJoinResourceDAL(token, vportResult.actorId)` — accepts the invite resource

**Trust Boundary:** The `auto_resume` path re-runs onboarding after email confirmation. It creates a VPORT via `createVport` and immediately accepts via `acceptJoinResourceDAL` without an `assertActorOwnsVportActorController` call. The `bootstrapJoinOnboardingController` is called first (which may establish the actor session) but ownership is not verified before the accept.

**Impact:** Lower risk than ELEK-2026-05-28-024/025 because this path requires the user to have a valid Supabase session with matching `pending_invite_token` metadata — a stronger precondition. However it still breaks the ownership assertion consistency requirement.

**Evidence:**
```js
// joinBarbershopAccount.controller.js:97-104
const vportResult = await createVport?.({
  name: vportName,
  vportType: BARBER_CATEGORY,
  directoryVisible: true,
});

await acceptJoinResourceDAL(token, vportResult.actorId);  // <-- no ownership assertion
```

**Existing Defense:** `bootstrapJoinOnboardingController` runs first, establishing the actor session for the user. The token must match user metadata (`pending_invite_token`).

**Why Insufficient:** Session + token match is not equivalent to `actor_owners` verification. The pattern is inconsistent with the platform ownership model.

**Recommended Fix:** Add `assertActorOwnsVportActorController` after `createVport` returns, before `acceptJoinResourceDAL`. Requires `callerActorId` to be resolved from the bootstrapped session (e.g., via `refreshActorFn` return value or a separate actor lookup by userId).

**Follow-up Command:** Verify whether `bootstrapJoinOnboardingController` returns an actorId that can be used for the ownership assertion.

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-027  
**Title:** `fetchJoinResourceByIdDAL` does not filter by `resource_type` — any resource ID is accepted as a join token  
**Category:** Insufficient Input Validation — Resource type confusion  
**Severity:** MEDIUM  
**Status:** Open  
**Scope:** VCSM  
**Location:** `apps/VCSM/src/features/join/dal/joinInvite.dal.js:5-16`

**Source:** `resourceId` parameter (URL path parameter / QR code payload)

**Sink:** `vportSchema.from('resources').select(...).eq('id', resourceId).maybeSingle()` — no `resource_type` filter

**Trust Boundary:** The `resources` table contains rows of multiple types (e.g., booking resources, join resources, potentially others). `fetchJoinResourceByIdDAL` fetches any row matching the UUID — it does not filter for `resource_type = 'barber_join'` (or equivalent). A caller who guesses or obtains a non-join resource UUID could load a resource row of the wrong type.

**Impact:** If a booking resource UUID (or another resource type) is used as a join token, `fetchJoinResourceByIdDAL` returns a row. The controller then checks `meta?.status === 'pending_onboarding'` — which would fail for a booking resource. So the practical exploit is limited to confusion: no actual join occurs. However, the data returned (`name`, `meta`, `barbershop` join) leaks resource metadata to any actor who knows a UUID, regardless of resource type.

**Evidence:**
```js
// joinInvite.dal.js:5-16
export async function fetchJoinResourceByIdDAL(resourceId) {
  if (!resourceId) return null;
  const { data, error } = await vportSchema
    .from("resources")
    .select(RESOURCE_COLS)     // includes meta, name, barbershop profile data
    .eq("id", resourceId)      // <-- no .eq('resource_type', 'barber_join') filter
    .maybeSingle();
  ...
}
```

**Reproduction:**
1. Actor obtains a UUID of any row in `vport.resources` (e.g., from a booking resource ID).
2. Actor constructs a URL `/join/barbershop/[booking-resource-id]`.
3. `loadQrJoin(token)` calls `fetchJoinResourceByIdDAL` and gets back data for the booking resource.
4. The barbershop join data (name, meta) is returned to the frontend even though this is not a join resource.

**Existing Defense:** Controller-layer `meta?.status !== 'pending_onboarding'` check rejects the resource before any write occurs. The join flow errors gracefully.

**Why Insufficient:** Resource metadata disclosure is still a finding. The DAL should not return rows of the wrong type. Defense should be at the DAL layer, not just the controller layer.

**Recommended Fix:** Add `resource_type` filter to the DAL query:
```js
const { data, error } = await vportSchema
  .from("resources")
  .select(RESOURCE_COLS)
  .eq("id", resourceId)
  .eq("resource_type", "barber_join")   // add this
  .maybeSingle();
```
Or use an allowlist of valid resource types (`in('resource_type', ['barber_join', 'barber_qr'])`).

**Follow-up Command:** DB audit of `vport.resources` table to confirm `resource_type` column values in use.

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-028  
**Title:** QR expiry (`join_expires_at`) checked in hook/UI layer only — controller layer has no expiry enforcement  
**Category:** Insufficient Input Validation — Client-side expiry enforcement  
**Severity:** LOW  
**Status:** Open  
**Scope:** VCSM  
**Location:**
- `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js:100-104` (expiry check — UI layer)
- `apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js:19-42` (no expiry check)

**Source:** `resource.meta.join_expires_at` (from DB row, returned by `fetchJoinResourceByIdDAL`)

**Sink:** `acceptJoinResourceDAL` — accepts the join resource

**Trust Boundary:** The QR expiry check (`meta.join_expires_at`) is performed only in the hook at line 100:
```js
if (meta.join_expires_at && Date.now() > new Date(meta.join_expires_at).getTime()) {
  setError("This QR code has expired.");
  setView(VIEWS.ERROR);
  return;
}
```
The `acceptQrJoin` controller does not re-check `join_expires_at` before calling `acceptJoinResourceDAL`. A caller who bypasses the hook and calls the controller directly could accept an expired QR token.

**Impact:** An expired QR token could be used to join a barbershop after the intended expiry. Since the hook is the only enforcement point, direct controller invocation bypasses the expiry gate.

**Existing Defense:** `acceptJoinResourceDAL` enforces `meta->>status = 'pending_onboarding'` atomically. If the shop owner changes status on expiry, the token is effectively invalidated. If they do not, the expiry check in the hook is the only gate.

**Why Insufficient:** Expiry enforcement belongs in the controller layer (or DAL layer), not the UI layer. Client-side-only enforcement is a security anti-pattern.

**Recommended Fix:** Add expiry check in `acceptQrJoin`:
```js
export async function acceptQrJoin(token, barberVportActorId, callerActorId) {
  if (!callerActorId) throw new Error("acceptQrJoin: callerActorId required");
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: barberVportActorId });

  const resource = await fetchJoinResourceByIdDAL(token);
  if (!resource) throw new Error("join resource not found");
  if (resource.meta?.status !== "pending_onboarding") throw new Error("join resource is no longer available");
  if (resource.member_actor_id) throw new Error("join resource is no longer available");
  // Add expiry enforcement:
  if (resource.meta?.join_expires_at && Date.now() > new Date(resource.meta.join_expires_at).getTime()) {
    throw new Error("This QR code has expired.");
  }

  return acceptJoinResourceDAL(token, barberVportActorId, { join_token_used_at: new Date().toISOString() });
}
```

**Follow-up Command:** DB migration to add a DB-level expiry enforcement (e.g., trigger or RPC that rejects accepts past expiry).

---

## Non-Findings

### `acceptQrJoin` ownership assertion
`acceptQrJoin` correctly calls `assertActorOwnsVportActorController` with `requestActorId: callerActorId` and `targetActorId: barberVportActorId`, then re-fetches and re-validates the resource state before calling `acceptJoinResourceDAL`. The atomic DB guard in `acceptJoinResourceDAL` (`meta->>status = 'pending_onboarding' AND member_actor_id IS NULL`) prevents replay and race conditions. No finding on this path.

### `useExistingBarberVportAndAccept`
Correctly calls `assertActorOwnsVportActorController` before `acceptJoinResourceDAL`. No finding.

### `findBarberVportForUserDAL` / `readBarberVportByOwnerUserIdDAL`
Both DALs scope queries to `owner_user_id` from the authenticated user's session ID — no cross-user data access. Explicit column lists used. No finding.

### Invite token state validation
`loadInviteForJoin` returns the resource object and the hook validates `meta?.invite_status !== "pending"`. No bypass path confirmed.

---

## Verdict

**2H / 2M / 1L**  
THOR release gate: **BLOCKED** on ELEK-2026-05-28-024 (QR create-VPORT path missing ownership assertion) and ELEK-2026-05-28-025 (invite create-VPORT path missing ownership assertion).

Note: The prior ELEKTRA pass (2026-05-27) covered the barber profile and post-publish paths. This pass covers the join flow as a separate surface. Both passes must be clear before THOR release.
