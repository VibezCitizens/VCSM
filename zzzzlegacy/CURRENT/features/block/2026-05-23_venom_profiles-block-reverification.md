# VENOM RE-VERIFICATION — Profiles BLOCKING Fixes

**Date:** 2026-05-23
**Application Scope:** VCSM
**Reviewer:** VENOM
**Trigger:** Post-implementation re-verification of BLOCKING findings VF-001 and VF-002 resolved during CEREBRO profiles audit (2026-05-22)
**Source Audit:** `CURRENT/features/dashboard/evidence/2026-05-22_venom_profiles-trust-boundaries.md`
**Files Re-Verified:**
- `apps/VCSM/src/features/profiles/screens/UsernameProfileRedirect.jsx` (VF-001)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js` (VF-002)
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/services/useUpsertVportServices.js` (VF-002)

---

## VF-001 RE-VERIFICATION — Raw UUID in public URL

**Original finding:** `UsernameProfileRedirect` resolved username → actorId (UUID) then navigated to `/profile/{UUID}`, exposing the raw UUID in the browser address bar for all `/u/:username` routes.

**Fix applied:**
```jsx
// BEFORE (UUID exposed):
const { actorId, loading } = useUsernameProfileRedirect(usernameValue);
// ... resolved to UUID, then:
return <Navigate to={`/profile/${actorId}`} replace />;

// AFTER (slug preserved):
export default function UsernameProfileRedirect() {
  const { username } = useParams();
  return <Navigate to={`/profile/${username ?? ""}`} replace />;
}
```

**Re-verification:**

| Attack Vector | Before Fix | After Fix | Status |
|---|---|---|---|
| `/u/johnsmith` → address bar shows `{UUID}` | EXPOSED — redirect navigated to `/profile/{UUID}` | CLOSED — redirects to `/profile/johnsmith`; `ActorProfileScreen` resolves slug to actorId internally without URL change | ✅ CLOSED |
| `/u/{UUID}` direct UUID access | EXPOSED — passed straight to `/profile/{UUID}` | PARTIAL — still passes UUID to `/profile/{UUID}` briefly; `ActorProfileScreen` fetches canonical slug and redirects to `/profile/{slug}` | ⚠️ RESIDUAL (acceptable — same single-hop behavior as before, no regression) |
| Shared/bookmarked `/u/johnsmith` URL | EXPOSED — resolved to UUID then redirected | CLOSED — stays as slug; no UUID in URL | ✅ CLOSED |

**Residual note:** When a UUID is directly entered in `/u/{UUID}`, the URL briefly shows `/profile/{UUID}` before `ActorProfileScreen` redirects to the canonical slug. This was also true before the fix and is the expected behavior for legacy UUID URL handling. `ActorProfileScreen` comment explicitly documents this case. Acceptable residual.

**VF-001 Status: CLOSED**
The primary attack vector — slug-based `/u/:username` routes exposing UUID via redirect — is eliminated. No regression on UUID handling. Platform no-raw-IDs-in-URLs rule is now satisfied for all human-entered profile URLs.

---

## VF-002 RE-VERIFICATION — No application-layer ownership gate on `upsertVportServices`

**Original finding:** `upsertVportServices.controller.js` had comment `// Ownership enforced by RLS` with no `assertActorOwnsVportActorController()` call. Any authenticated Citizen who knew a VPORT's actorId could invoke the services upsert path for that VPORT.

**Fix applied — controller:**
```js
// BEFORE (no ownership gate):
export default async function upsertVportServicesController({
  targetActorId,
  items,
  vportType,
} = {}) {
  // Ownership enforced by RLS
  if (!targetActorId) { ... }
  // ... writes immediately

// AFTER (ownership gate added):
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

export default async function upsertVportServicesController({
  identityActorId,
  targetActorId,
  items,
  vportType,
} = {}) {
  if (!identityActorId) throw new Error("identityActorId is required");
  if (!targetActorId) throw new Error("targetActorId is required");
  if (!vportType) throw new Error("vportType is required");
  await assertActorOwnsVportActorController(identityActorId, targetActorId);
  // ... then writes
```

**Fix applied — hook:**
```js
// BEFORE (no identity):
import { useCallback, useState } from "react";
// identityActorId never resolved

// AFTER (identity resolved inside hook):
import { useCallback, useMemo, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
// identityActorId from identity?.actorId — passed to controller
```

**Re-verification:**

| Trust Boundary | Before Fix | After Fix | Status |
|---|---|---|---|
| Authenticated Citizen upserts services for own VPORT | Allowed (by RLS assumption) | Allowed — `assertActorOwnsVportActorController` passes when identity owns target actor | ✅ PASS |
| Authenticated Citizen upserts services for OTHER actor's VPORT | **Allowed** (RLS was sole gate; unverified) | **BLOCKED** — `assertActorOwnsVportActorController` throws before any DAL call | ✅ CLOSED |
| Unauthenticated call | N/A (hook enforces auth) | N/A — `identityActorId` is null; controller throws `identityActorId is required` | ✅ BLOCKED |
| Pattern consistency with `upsertVportRate` | INCONSISTENT | CONSISTENT — identical pattern: `assertActorOwnsVportActorController(identityActorId, targetActorId)` before writes | ✅ ALIGNED |

**Defense-in-depth status:**
- Application layer: ✅ `assertActorOwnsVportActorController` in controller (ADDED)
- DB layer: ⚠️ `vport.services` RLS unverified (was true before fix, unchanged — not in scope of this fix)

**VF-002 Status: CLOSED**
Controller-layer ownership enforcement is now in place. Ownership assertion matches the established `upsertVportRateController` pattern. Defense-in-depth is restored. RLS on `vport.services` remains unverified — this is a separate open risk (R-05) scheduled for a dedicated DB audit.

---

## OPEN VENOM FINDINGS (unchanged)

These findings from the original audit were not addressed in this implementation phase. They remain non-blocking but open.

| Finding | Severity | Status | Notes |
|---|---|---|---|
| VF-003 — `checkActorOwnership` ownership logic in DAL | HIGH | OPEN | Architectural debt; low exploitability |
| VF-004 — `useProfileGate` client-side-only privacy gate | HIGH | OPEN | Requires DB RLS verification; R-04 |
| VF-005 — Debug panel in production screen | HIGH | OPEN | R-14 — `ActorProfileProdDebugPanel`; bundle risk |

---

## REMAINING BLOCKING ITEM (R-BLOCK-03)

`vc.posts` INSERT RLS gap remains as the only outstanding BLOCKING item from this audit. Carnage proposal endorsed. Pending staging verification and THOR gate.

---

## VENOM RE-VERIFICATION STATUS

**VF-001: CLOSED** ✅
**VF-002: CLOSED** ✅
**VF-003 through VF-005: OPEN** (non-blocking, pre-existing)
**R-BLOCK-03:** Pending DB migration staging (separate track)

**Overall security status for this release:** CONDITIONAL CLEAR
Condition: R-BLOCK-03 (`vc.posts` INSERT RLS) must be staged and verified before THOR signs off on production.
