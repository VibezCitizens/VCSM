# VENOM V2 — vport Source Verification
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Run type:** Source verification pass — confirming prior 2026-06-04 findings

---

## Source Files Verified

| File | Lines | Key Observations |
|---|---|---|
| apps/VCSM/src/features/vport/dal/vport.core.dal.js | 1-293 | requireUser() present on createVport and updateVport; ABSENT on softDelete/hardDelete/restore |
| apps/VCSM/src/features/vport/dal/vport.write.profileMedia.dal.js | 1-24 | No requireUser(), no session check, actorId from caller, RLS sole barrier |

---

## VEN-VPORT-002 — CONFIRMED [SOURCE_VERIFIED]

**Finding:** updateVport has no app-layer ownership check — .eq('id', vportId) only
**Evidence:** vport.core.dal.js lines 183-229:
  `requireUser()` confirms session exists (does not verify resource ownership)
  `.update(patch).eq("id", vportId)` — no `.eq("owner_user_id", user.id)` guard
**RLS dependency:** vport.profiles UPDATE policy must enforce `owner_user_id = auth.uid()` — not verifiable from source
**Status:** OPEN — DB RLS verification required before THOR clearance

---

## VEN-VPORT-003 — CONFIRMED [SOURCE_VERIFIED]

**Finding:** softDeleteVport and restoreVport have no app-layer session check (inconsistent with hardDeleteVport which has assertActorOwnsVportActorController)
**Evidence:** vport.core.dal.js:
  - `softDeleteVport(vportId)` lines 231-246: no `requireUser()`, delegates entirely to `rpc("soft_delete_vport")`
  - `restoreVport(vportId)` lines 265-280: no `requireUser()`, delegates entirely to `rpc("restore_vport")`
  - Contrast: ctrlHardDeleteVport calls `assertActorOwnsVportActorController` — inconsistency confirmed
**RLS dependency:** soft_delete_vport / restore_vport RPCs must enforce ownership — unverifiable from source
**Status:** OPEN — DB RPC inspection required

---

## VEN-VPORT-004 — CONFIRMED [SOURCE_VERIFIED]

**Finding:** updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL have no session auth guard
**Evidence:** vport.write.profileMedia.dal.js lines 4-23 (full file read):
```js
export async function updateVportAvatarMediaAssetIdDAL({ actorId, mediaAssetId, avatarUrl }) {
  if (!actorId || !mediaAssetId) return  // null guard only — no session check
  const { error } = await vportClient
    .from('profiles')
    .update(patch)
    .eq('actor_id', actorId)  // actorId is caller-supplied; no session cross-check
  if (error) throw error
}
```
`actorId` is accepted as a parameter. No `requireUser()`. No `supabase.auth.getSession()`. The public `vportClient` is used — any call with a valid `actorId` (guessable or injected) writes to `vport.profiles` if RLS permits.
**Status:** OPEN — DB RLS verification required (BW-VPORT-002, ELEK-2026-06-06: CONDITIONAL THOR BLOCKER)

---

## Carry-Forward Open Findings

| Finding ID | Severity | Status |
|---|---|---|
| VEN-VPORT-002 | HIGH | OPEN — CONFIRMED SOURCE_VERIFIED |
| VEN-VPORT-003 | HIGH | OPEN — CONFIRMED SOURCE_VERIFIED |
| VEN-VPORT-004 | MEDIUM | OPEN — CONFIRMED SOURCE_VERIFIED |
| VEN-VPORT-005 | MEDIUM | OPEN — vport.public.js migration barrel exports updateVport without removal deadline |
| VEN-VPORT-006 | MEDIUM | OPEN — owner_user_id in getVportById/getVportBySlug SELECT |
| VEN-VPORT-007 | MEDIUM | OPEN — vportCoreOps.controller.js is a zero-logic DAL re-export |
| BW-VPORT-001 | HIGH | OPEN — updateVport RLS sole barrier |
| BW-VPORT-002 | HIGH | OPEN — profileMedia DAL RLS sole barrier |
| BW-VPORT-003 | MEDIUM | OPEN — createFuelPriceSubmissionDAL no session check |

---

## THOR Gate: BLOCKED (conditional)

BW-VPORT-001 and BW-VPORT-002 become hard THOR blockers if DB confirms vport.profiles RLS UPDATE policy is absent. VEN-VPORT-003 becomes a hard blocker if soft_delete_vport/restore_vport RPCs have no auth enforcement.
