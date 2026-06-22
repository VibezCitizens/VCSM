# ELEKTRA Security Report

**Date:** 2026-06-05
**Scope:** VCSM — media feature (+ flyerBuilder controller, wanders cards controller, @media engine)
**Reviewer:** ELEKTRA
**Scan Trigger:** Post-patch re-verify — branch `vport-booking-feed-security-updates`
**Mode:** BLIND_REVERIFY_MODE
**Findings Summary:** 2 NEW MEDIUM | 2 NEW INFO | 7 upstream verifications
**False Positives Rejected:** 0
**Suggested Patches:** 7

---

## Preflight Gates

### ARCHITECT Mapping Gate

| Check | Result |
|---|---|
| ARCHITECT report found | PASS — `ZZnotforproduction/APPS/VCSM/features/media/ARCHITECTURE.md` |
| Scope match | PASS — VCSM:media |
| Report age | PASS — 2026-06-04, 1 day old |
| Status | PASS — FRESH |
| Re-verify freshness | CAUTION — ARCHITECT predates working tree modifications. Source files read directly under BLIND_REVERIFY_MODE. ARCHITECT artifacts used for gate check only, not chain reconstruction. |

### Upstream Dependency Gate

| Upstream | Report | Age | Status |
|---|---|---|---|
| VENOM | `outputs/2026/06/04/Venom/2026-06-04_19-48_venom_media-security-review.md` | 1 day | PRESENT — PASS |
| BLACKWIDOW | `outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_media-adversarial-review.md` | 1 day | PRESENT — PASS |

**ELEKTRA PREFLIGHT PASS**

---

## BLIND REVERIFY CHECK

| Check | Status | Notes |
|---|---|---|
| Historical reports not loaded during reconstruction | PASS | SECURITY.md summary read for gate/finding-ID orientation only — no exploit detail or closure assessment consumed before source reconstruction |
| Current ARCHITECT artifacts loaded | PASS | ARCHITECTURE.md consumed for gate check and scope orientation |
| Current source files re-read | PASS | 10 source files read directly from working tree |
| Chain rebuilt from source | PASS | All 7 upstream finding chains independently reconstructed |
| Exploitability assessed before report comparison | PASS | All closure/open verdicts reached from source evidence before historical IDs were mapped |

---

## Executive Summary

ELEKTRA ran in post-patch re-verify mode against the `vport-booking-feed-security-updates` working tree.

**Chain reconstruction covered:**

- `apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js`
- `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller.js`
- `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js`
- `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal.js`
- `apps/VCSM/src/features/dashboard/flyerBuilder/hooks/useFlyerEditor.js`
- `apps/VCSM/src/features/dashboard/flyerBuilder/components/FlyerEditorPanel.jsx`
- `apps/VCSM/src/features/wanders/core/controllers/cards.controller.js`
- `apps/VCSM/src/features/media/controller/createMediaAsset.controller.js`
- `apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js`
- `engines/media/src/controller/uploadMedia.controller.js`
- `engines/media/src/lib/buildMediaStorageKey.js`
- `ZZnotforproduction/APPS/VCSM/features/media/BEHAVIOR.md`

**Verdict:**

| Upstream Finding | Prior Severity | ELEKTRA Status |
|---|---|---|
| VEN-MEDIA-003 / BW-MEDIA-001 | HIGH | CLOSED_SOURCE_VERIFIED |
| BW-MEDIA-002 / VEN-MEDIA-004 | HIGH | STILL_OPEN_SOURCE_VERIFIED + expanded |
| BW-MEDIA-007 / VEN-MEDIA-005 | HIGH | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-003 | MEDIUM | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-004 / VEN-MEDIA-002 | MEDIUM | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-005 | MEDIUM | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-006 | LOW | PARTIAL_SOURCE_VERIFIED |

**2 THOR blockers remain open. ELEKTRA recommendation: FAIL.**

---

## Upstream Finding Verifications

---

### VEN-MEDIA-003 / BW-MEDIA-001 — CLOSED_SOURCE_VERIFIED

**Original finding:** `uploadFlyerImageCtrl` uploaded to Cloudflare R2 without calling `requireOwnerActorAccess` — any authenticated user could write to any VPORT's storage namespace.

**Patch chain reconstructed:**

```
Source: uploadFlyerImageCtrl({ vportId, file })
           ↓
Boundary: await requireOwnerActorAccess(vportId)                           ← PATCHED: line 9
           ↓ dalReadAuthenticatedUserId() → Supabase session userId
           ↓ dalReadActorOwnerRow({ actorId: vportId, userId })
           ↓ queries vc.actor_owners WHERE actor_id = vportId AND user_id = userId
           ↓ if null → throws "You do not have access to this VPORT design studio."
           ↓ ONLY if row found: proceeds
Sink:     uploadMediaController({ ownerActorId: vportId, ... }) → R2 upload
```

Ownership is verified before the upload executes. The guard queries `vc.actor_owners` using the session-derived `userId` — not a caller-supplied value. If the caller passes a `vportId` they do not own, the `actor_owners` query returns null and the upload is blocked.

**Additional surface checked:** `ctrlUploadDesignAsset` (active design studio upload path) also calls `requireOwnerActorAccess(ownerActorId)` at line 24 before upload. Both upload surfaces are guarded.

**Status: CLOSED_SOURCE_VERIFIED**

**CAUTION (INFO):** `FlyerEditorPanel` → `useFlyerEditor` → `uploadFlyerImageCtrl` chain appears to have no active callers in the route tree. `FlyerBuilderShell` (the only component importing `FlyerEditorPanel`) has zero callers in the codebase. The patch protects a code path that may be dead. The active design studio path (`ctrlUploadDesignAsset`) is separately guarded. See NEW finding ELEK-2026-06-05-002.

---

### BW-MEDIA-002 / VEN-MEDIA-004 — STILL_OPEN_SOURCE_VERIFIED

**Original finding:** `wanders/core/controllers/cards.controller.js:228` passes `user.id` (auth.users UUID) as `ownerActorId` to `uploadMediaController` — identity namespace violation in R2 storage key.

**Chain reconstructed from source:**

```
Source: publishWandersFromBuilder (imageFile provided)
           ↓
Boundary: ABSENT — no ownership check before upload
           ↓
Sink (line 225-232):
  uploadMediaController({
    file: imageFile,
    scope: 'wanders_card',
    ownerActorId: user.id,        ← auth.users UUID — NOT vc.actors.id
    opts: { extraPath: 'cards' },
  })
           ↓
Engine: buildMediaStorageKey(prefix, user.id, file, opts)
           ↓
Storage key format: {prefix}/{auth-user-uuid}/cards/{yyyy}/{mm}/{dd}/{uuid}.{ext}
           ↓
Public CDN URL: https://cdn.r2.dev/{prefix}/{auth-user-uuid}/cards/...
```

The upload still uses `user.id` (Supabase `auth.users.id` — a different UUID namespace from `vc.actors.id`) as the `ownerActorId`. This is confirmed at line 228.

**Expanded scope (NEW — see ELEK-2026-06-05-001):**

The `media_assets` writeback (lines 270-293) uses `senderActorId` (correct actor UUID) for `owner_actor_id` and `created_by_actor_id`. However the `storage_key` value stored in `media_assets.storage_key` is the R2 path that was built with `user.id` — creating a data inconsistency within the same DB row:

```
media_assets row:
  owner_actor_id:  senderActorId (vc.actors.id UUID)   ← correct namespace
  storage_key:    '{prefix}/{auth-user-uuid}/cards/...'  ← wrong namespace embedded in path
```

**No patch applied to this path.** The `user.id` at line 228 is unchanged.

**Status: STILL_OPEN_SOURCE_VERIFIED — THOR BLOCKER**

---

### BW-MEDIA-007 / VEN-MEDIA-005 — STILL_OPEN_SOURCE_VERIFIED

**Original finding:** `BEHAVIOR.md` is a non-functional placeholder — no security rules, no invariants, no governance anchor.

**Source read:**

```
ZZnotforproduction/APPS/VCSM/features/media/BEHAVIOR.md

# VCSM Feature Behavior Contract — media
Status: PLACEHOLDER
Feature: media
Notes:
- Behavior contract pending source review.
```

No authoring has occurred. BEHAVIOR.md is still a placeholder with no content.

**Status: STILL_OPEN_SOURCE_VERIFIED — GOVERNANCE BLOCKER (THOR BLOCKER)**

---

### BW-MEDIA-003 — STILL_OPEN_SOURCE_VERIFIED

**Original finding:** `createMediaAssetController` accepts caller-supplied `ownerActorId`/`createdByActorId` with no session verification — DB RLS is the only ownership guard.

**Chain reconstructed:**

```
Source: caller provides ownerActorId (any value)
           ↓
Boundary: ABSENT — no session verification in createMediaAssetController
  // Controller only validates: required fields not null, scope valid
           ↓
Sink: insertMediaAssetDAL({ owner_actor_id: ownerActorId })
           ↓
DB: INSERT into platform.media_assets
Defense at DB: RLS (INSERT policy incomplete — no vport/chat owner_source policies per VEN-MEDIA-002)
```

No change to this controller. Session-derived actor ID binding is absent at the app layer.

**Status: STILL_OPEN_SOURCE_VERIFIED**

---

### BW-MEDIA-004 / VEN-MEDIA-002 — STILL_OPEN_SOURCE_VERIFIED

**Original finding:** `insertMediaAssetDAL` has no app-layer owner filter on INSERT; INSERT RLS policies incomplete for vport/chat `owner_source`.

**Chain reconstructed:**

```
Source: caller-supplied owner_actor_id
           ↓
Boundary: ABSENT at app layer
Sink: PLATFORM().from('media_assets').insert({ owner_actor_id: row.owner_actor_id, ... })
Defense: RLS only — and INSERT RLS incomplete for vport/chat owner_source paths
```

No change to DAL. No session-derived binding added.

**Status: STILL_OPEN_SOURCE_VERIFIED**

---

### BW-MEDIA-005 — STILL_OPEN_SOURCE_VERIFIED

**Original finding:** Actor UUID embedded in public R2 CDN URLs via storage key format.

**Chain reconstructed from engine source:**

```
engines/media/src/lib/buildMediaStorageKey.js:55

return `${prefix}/${ownerActorId}/${mid}${yyyy}/${mm}/${dd}/${uuid}.${ext}`
```

Storage key format embeds `ownerActorId` directly as a path segment. Because `ownerActorId` is a `vc.actors.id` UUID (or auth UUID in the wanders path), the resulting CDN URL exposes that UUID publicly.

Example public URL:
```
https://cdn.r2.dev/design-assets/{actor-uuid}/flyer/2026/06/05/{random-uuid}.jpg
```

No change to storage key format.

**Status: STILL_OPEN_SOURCE_VERIFIED**

---

### BW-MEDIA-006 — PARTIAL_SOURCE_VERIFIED

**Original finding:** No uniqueness guard on `storage_key` in `insertMediaAssetDAL` — duplicate `media_assets` records possible for the same R2 object.

**Chain reconstructed:**

The storage key is built using `crypto.randomUUID()` as the filename component. Collision probability is negligible in practice (~UUID4 entropy). The DAL performs no uniqueness check before INSERT. Whether a DB-level unique constraint exists on `storage_key` is not determinable from source code alone.

**Status: PARTIAL_SOURCE_VERIFIED** — App layer has no guard; DB constraint unknown without DB access. DB command required to verify.

---

## New Findings

---

### ELEK-2026-06-05-001

```
SECURITY FINDING

Finding ID:         ELEK-2026-06-05-001
Title:              Wanders media_assets row has split identity namespace — storage_key uses auth UUID, owner_actor_id uses actor UUID
Category:           IDOR/BOLA
Severity:           MEDIUM
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/wanders/core/controllers/cards.controller.js:225-293
Source:             caller-supplied imageFile, user.id from session
Sink:               platform.media_assets row (storage_key field)
Trust Boundary:     Controller layer — missing namespace normalization before storage key build
Impact:             (1) CDN URL exposes auth user UUID (different namespace from actor UUID) in path segment. (2) media_assets row has inconsistent namespace across owner_actor_id (actor UUID) and storage_key (auth UUID path), breaking any audit or forensic lookup by actor_id → storage_key. (3) If future RLS or audit tooling correlates owner_actor_id with storage_key prefix, the mismatch will cause false negatives.
Evidence:
  Line 228: ownerActorId: user.id       ← auth.users UUID used for R2 upload path
  Line 277: ownerActorId: senderActorId ← vc.actors UUID used for media_assets record
  Engine builds key: {prefix}/{user.id}/cards/...
  DB row: owner_actor_id = senderActorId, storage_key = '{prefix}/{user.id}/cards/...'
Reproduction Steps:
  1. Send a wanders card with an imageFile attachment
  2. Inspect the resulting media_assets row (storage_key vs owner_actor_id)
  3. Confirm storage_key path segment contains auth user UUID, owner_actor_id contains actor UUID
Existing Defense:   senderActorId guard on writeback (if senderActorId null, no media_assets record created)
Why Defense Is Insufficient: The namespace split exists regardless of whether senderActorId is present — the R2 path is built before the writeback.
Recommended Fix:    Replace user.id with senderActorId as ownerActorId in the uploadMediaController call at line 228
Suggested Patch:
  // cards.controller.js line 225-232 — change ownerActorId source
  // BEFORE:
  wandersUploadResult = await uploadMediaController({
    file: imageFile,
    scope: 'wanders_card',
    ownerActorId: user.id,          // ← auth UUID — WRONG namespace
    opts: { extraPath: 'cards' },
  })
  // AFTER:
  if (!senderActorId) throw new Error('[publishWandersFromBuilder] senderActorId required for media upload')
  wandersUploadResult = await uploadMediaController({
    file: imageFile,
    scope: 'wanders_card',
    ownerActorId: senderActorId,    // ← actor UUID — correct namespace
    opts: { extraPath: 'cards' },
  })
  // NOTE: senderActorId is already resolved via resolveUserActorId(user.id) earlier in the function.
  // If senderActorId is null (user has no actor), block the upload rather than using auth UUID.
Follow-up Command:  BLACKWIDOW (re-verify wanders upload chain after patch)
```

---

### ELEK-2026-06-05-002

```
SECURITY FINDING

Finding ID:         ELEK-2026-06-05-002
Title:              FlyerEditorPanel / useFlyerEditor / uploadFlyerImageCtrl chain has no active callers — patch guards dead code
Category:           Auth Bypass (dead code risk)
Severity:           INFO
Status:             Open
Scope:              VCSM
Location:
  apps/VCSM/src/features/dashboard/flyerBuilder/components/FlyerBuilderShell.jsx
  apps/VCSM/src/features/dashboard/flyerBuilder/components/FlyerEditorPanel.jsx
  apps/VCSM/src/features/dashboard/flyerBuilder/hooks/useFlyerEditor.js
  apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js
Source:             N/A — no active route reaches this code
Sink:               uploadFlyerImageCtrl → uploadMediaController
Trust Boundary:     N/A
Impact:             The patch to uploadFlyerImageCtrl (adding requireOwnerActorAccess) protects a code path that appears to have no active callers. FlyerBuilderShell has zero callers in the codebase. If this component is later re-activated without awareness of its security requirements, the guard may be bypassed or removed. The ACTIVE upload path (ctrlUploadDesignAsset in designStudio.assetsExports.controller.js) is separately guarded and not affected.
Evidence:
  FlyerBuilderShell.jsx: only caller of FlyerEditorPanel
  grep for FlyerBuilderShell across apps/VCSM/src: zero callers found
  Active route: VportActorMenuFlyerEditorScreen → VportDesignStudioViewScreen (does NOT use FlyerEditorPanel)
Existing Defense:   requireOwnerActorAccess present in uploadFlyerImageCtrl
Why Flagged:        Dead code with security guards creates maintenance debt — the guard can drift or be removed without visible breakage.
Recommended Fix:    Remove FlyerEditorPanel + FlyerBuilderShell + useFlyerEditor + uploadFlyerImageCtrl if confirmed dead. If kept for planned re-use, add a comment documenting the security requirement.
Follow-up Command:  WATCHER (verify dead code status before removal)
```

---

### ELEK-2026-06-05-003

```
SECURITY FINDING

Finding ID:         ELEK-2026-06-05-003
Title:              createMediaAssetController callers resolve and pass appId but controller ignores it — redundant DAL call
Category:           (INFO — no security impact)
Severity:           INFO
Status:             Open
Scope:              VCSM
Location:
  apps/VCSM/src/features/media/controller/createMediaAsset.controller.js (function signature)
  apps/VCSM/src/features/wanders/core/controllers/cards.controller.js:274
  apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js:45
  apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js:18
Impact:             No security impact. Callers call resolveVcsmAppId() and pass appId to createMediaAssetController, but the controller function signature does not include appId — it is silently discarded. The controller internally calls resolveVcsmAppIdDAL() again. This results in a double DAL call per upload (resolveVcsmAppId is module-cached, so performance impact is minimal). Risk is API confusion — the caller believes they are providing the appId but it has no effect.
Recommended Fix:    Either (a) add appId to the controller's destructuring parameter and skip the internal resolveVcsmAppIdDAL() call, or (b) remove the appId resolution from all callers since the controller handles it internally.
Follow-up Command:  None — INFO only
```

---

## False Positives Rejected

None identified during this scan.

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | BW-MEDIA-002 / ELEK-2026-06-05-001 | Wanders upload uses auth UUID as ownerActorId | HIGH | Controller | SIMPLE | NO |
| 2 | BW-MEDIA-007 | BEHAVIOR.md placeholder — author security invariants | HIGH | Governance | MODERATE | NO |
| 3 | BW-MEDIA-003 | createMediaAssetController no session verification | MEDIUM | Controller | MODERATE | NO |
| 4 | VEN-MEDIA-002 / BW-MEDIA-004 | INSERT path no app-layer actorId session binding | MEDIUM | Controller + RLS | COMPLEX | YES |
| 5 | BW-MEDIA-005 | Actor UUID exposed in public R2 CDN URL via storage key | MEDIUM | Engine | COMPLEX | YES (re-key) |
| 6 | BW-MEDIA-006 | No uniqueness guard on storage_key | LOW | DAL | SIMPLE | YES (unique index) |
| 7 | ELEK-2026-06-05-003 | appId param ignored by createMediaAssetController | INFO | Controller | SIMPLE | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Re-verify wanders upload chain after ELEK-2026-06-05-001 patch | PENDING |
| DB | Verify: (1) unique constraint on platform.media_assets.storage_key; (2) INSERT RLS policies for vport/chat owner_source | PENDING |
| Carnage | DB migration if unique constraint on storage_key is to be added | PENDING |
| SPIDER-MAN | Add regression test: (1) wanders upload must use senderActorId not user.id; (2) uploadFlyerImageCtrl must block non-owner | PENDING |
| WATCHER | Confirm dead code status of FlyerEditorPanel / FlyerBuilderShell before removal | PENDING |
| THOR | Release gate — THOR BLOCKED until BW-MEDIA-002 and BW-MEDIA-007 closed | BLOCKED |

---

## THOR Gate Assessment

| Gate | Status | Reason |
|---|---|---|
| BW-MEDIA-001 / VEN-MEDIA-003 | CLEARED | CLOSED_SOURCE_VERIFIED — requireOwnerActorAccess present before upload |
| BW-MEDIA-002 / VEN-MEDIA-004 | BLOCKED | STILL_OPEN — wanders upload uses auth UUID as ownerActorId |
| BW-MEDIA-007 / VEN-MEDIA-005 | BLOCKED | STILL_OPEN — BEHAVIOR.md is placeholder, no governance anchor |
| BW-MEDIA-003 | CAUTION | STILL_OPEN — no app-layer session verification in createMediaAssetController |
| BW-MEDIA-004 / VEN-MEDIA-002 | CAUTION | STILL_OPEN — INSERT path no app-layer owner binding |
| BW-MEDIA-005 | CAUTION | STILL_OPEN — actor UUID in CDN URL |
| BW-MEDIA-006 | CAUTION | PARTIAL — app layer has no guard; DB constraint unverified |

**ELEKTRA RECOMMENDATION: FAIL**

Release is blocked. Open HIGH findings require remediation before THOR gate.
