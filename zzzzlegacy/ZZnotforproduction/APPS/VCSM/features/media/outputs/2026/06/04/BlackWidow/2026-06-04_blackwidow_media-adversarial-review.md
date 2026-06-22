# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: media | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Command | BLACKWIDOW V2 |
| Protocol Version | BW2.5 V2 / BW2.9 sections |
| Feature | media |
| App | VCSM |
| Run Date | 2026-06-04 |
| Analyst | BlackWidow automated adversarial review |
| Scanner Preflight | FRESH — maps generated 2026-06-04T19:48:25.152Z (~7h old) |
| Scanner Version | 1.1.0 |
| Behavior Contract Status | PLACEHOLDER — all §9 invariants UNANCHORED |

---

## 2. Scanner Preflight

- Status: FRESH
- Generated: 2026-06-04T19:48:25.152Z
- Scanner Version: 1.1.0
- Security paths attributed to media: 2
- Total platform security paths: 598
- Confidence on all 2 media security paths: LOW (no resolved sourceRoute)

---

## 3. Scanner Inputs Block

| Map | Status | Media Entries |
|---|---|---|
| security-path-map.json | Read OK | 2 paths (both LOW confidence) |
| callgraph.json | Read OK | 45 nodes, 58 edges |
| write-execution-map.json | Read OK | 0 resolved paths (empty) |
| rpc-execution-map.json | Read OK | 0 RPC paths |

Scanner write-execution-map returned empty for media — no route-confirmed write paths. All write surfaces discovered via callgraph traversal and direct source read.

---

## 4. Attack Surface Inventory

### 4.1 Security Paths in Scope

| Path ID | Operation | Table | DAL Function | Confidence | Note |
|---|---|---|---|---|---|
| media-sp-001 | UPDATE | platform.media_assets | softDeleteMediaAssetDAL | LOW | No resolved sourceRoute |
| media-sp-002 | INSERT | platform.media_assets | insertMediaAssetDAL | LOW | No resolved sourceRoute |

Both paths are LOW confidence — PRIMARY ATTACK TARGETS per Rule BW-002.

### 4.2 Controller Entry Points (Callgraph)

| Controller | Layer | File |
|---|---|---|
| createMediaAssetController | controller | apps/VCSM/src/features/media/controller/createMediaAsset.controller.js |
| softDeleteMediaAssetController | controller | apps/VCSM/src/features/media/controller/softDeleteMediaAsset.controller.js |
| uploadMediaController | controller | engines/media/src/controller/uploadMedia.controller.js |

### 4.3 Hook Entry Points

| Hook | Layer | File |
|---|---|---|
| useMediaUpload | hook | engines/media/src/hooks/useMediaUpload.js |

### 4.4 DAL Write Surfaces

| DAL Function | Operation | Table | File |
|---|---|---|---|
| insertMediaAssetDAL | INSERT | platform.media_assets | apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js |
| softDeleteMediaAssetDAL | UPDATE | platform.media_assets | apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js |
| dalUploadToR2 | R2 Storage Write | Cloudflare R2 | engines/media/src/dal/r2Upload.dal.js |

### 4.5 Identified Callers of createMediaAssetController (Cross-Feature)

| Caller | File | Ownership Check Present? |
|---|---|---|
| uploadFlyerImageCtrl | flyerBuilder/controller/flyerEditor.controller.js | NO |
| ctrlUploadDesignAsset | designStudio/controller/designStudio.assetsExports.controller.js | YES (requireOwnerActorAccess) |
| recordPostMediaController | upload/controller/recordPostMedia.controller.js | NO explicit check (caller-sourced actorId) |
| addPortfolioMediaWithRecord | portfolio/controller/addPortfolioMediaWithRecord.controller.js | NO explicit check (caller-sourced actorId) |
| recordChatAttachmentController | chat/conversation/controller/recordChatAttachment.controller.js | NO explicit check (caller-sourced ownerActorId) |
| saveVportActorMenuItemController (recordMenuItemMedia) | profiles/.../saveVportActorMenuItem.controller.js | YES — category.actor_id === actorId + item.actor_id check |
| publishWandersFromBuilder | wanders/core/controllers/publishWandersFromBuilder.controller.js | NO (uses user.id as ownerActorId for R2 key) |
| publishWandersFromBuilder (cards.controller.js copy) | wanders/core/controllers/cards.controller.js | NO (same user.id pattern) |
| submitCreateVportController | vport/controller/submitCreateVport.controller.js | IMPLICIT — uses res.actorId from just-created vport |

---

## 5. Scanner Signals Block

- No RPC paths for media (write-execution-map and rpc-execution-map both returned empty)
- Callgraph has 3 controller nodes and 1 hook node as media entry points
- uploadMediaController (engine layer) is the upload path; no session guard at engine level
- createMediaAssetController delegates ownership entirely to callers — no session verification inside
- softDeleteMediaAssetController explicitly delegates ownership enforcement to DB RLS only

---

## 6. Adversarial Path Analysis

---

### 6.A — OWNERSHIP BYPASS

#### Attack 6.A.1: uploadFlyerImageCtrl — No Session Gate Before R2 Upload

**Scenario:** An authenticated user submits a request with an arbitrary `vportId` value to `uploadFlyerImageCtrl`. The function accepts `{ vportId, file }` and immediately calls `uploadMediaController({ ownerActorId: vportId })` without first checking that the authenticated session user owns the actor identified by `vportId`.

**Source trace:**
- `flyerEditor.controller.js:8` — `export async function uploadFlyerImageCtrl({ vportId, file })`
- `flyerEditor.controller.js:9` — `const result = await uploadMediaController({ file, scope: 'design_asset', ownerActorId: vportId, ... })`
- No call to `requireOwnerActorAccess` before `uploadMediaController`
- `requireOwnerActorAccess` is only called in `saveFlyerPublicDetailsCtrl` (line 35) — the separate save path

**Impact:** The R2 storage write proceeds with an attacker-controlled `vportId` as the `ownerActorId`. The storage key format is `design-assets/{vportId}/assets/{yyyy}/{mm}/{dd}/{uuid}.{ext}`. An attacker can write files into any VPORT's storage namespace on R2.

**Result: BYPASSED** [SOURCE_VERIFIED — flyerEditor.controller.js:8-31]

**Confirmed exploit chain:** Single-step — call `uploadFlyerImageCtrl({ vportId: <victim-vport-actor-id>, file: <any-valid-image> })`. VEN-MEDIA-003 CONFIRMED by adversarial trace.

---

#### Attack 6.A.2: createMediaAssetController — No Session Verification

**Scenario:** `createMediaAssetController` accepts `ownerActorId` and `createdByActorId` as caller-supplied parameters. The controller validates that they are non-null (lines 37-38) but does NOT verify that the calling session owns the actor identified by `ownerActorId`.

**Source trace:**
- `createMediaAsset.controller.js:37` — `if (!ownerActorId) throw new Error(...)`
- `createMediaAsset.controller.js:38` — `if (!createdByActorId) throw new Error(...)`
- No session lookup, no actor_owners check
- Proceeds directly to `insertMediaAssetDAL(insertPayload)` (line 69)

**Risk Context:** Because `createMediaAssetController` is always called AFTER a successful `uploadMediaController` result, the meaningful gate is at the upload step. However, if a caller has a `MediaUploadResult` object (from any legitimate upload), they can register it against any `ownerActorId` in the DB.

**Result: PARTIAL** [SOURCE_VERIFIED — createMediaAsset.controller.js:25-79]
The DB INSERT RLS is the only layer preventing cross-actor registration in `platform.media_assets`. The {public} policy surface (VEN-MEDIA-001) potentially allows this INSERT to succeed without actor ownership verification.

---

#### Attack 6.A.3: softDeleteMediaAssetController — RLS-Only Defense

**Scenario:** `softDeleteMediaAssetController({ assetId: <victim-asset-id>, actorId: <attacker-actor-id> })`. The controller only validates both params are non-null (lines 14-15), then passes them to `softDeleteMediaAssetDAL`.

**Source trace:**
- `softDeleteMediaAsset.controller.js:13-17` — null guards only, no actor_owners check
- `softDeleteMediaAssetDAL` executes `.update().eq('id', assetId)` with no WHERE clause on `owner_actor_id`
- Relying entirely on DB RLS policy: "actor owner can soft delete media asset" via `vc.actor_owners`

**Defense:**
- DAL comment (line 30): "DB layer (RLS USING) — actor owner can soft delete media asset policy enforces the authenticated user owns the actor identified by owner_actor_id via vc.actor_owners"
- DAL comment (line 24-25): {public} policy `media_assets_vc_owner_update` coexists — but the column grants restrict it to `(status, deleted_at, deleted_by_actor_id, updated_at)` and WITH CHECK enforces `status = 'deleted'`

**Result: BLOCKED** — DB RLS is verified as the defense layer. However, the {public} policy creates an advisory concern (VEN-MEDIA-001 open). [SOURCE_VERIFIED — mediaAssets.softDelete.dal.js:1-65]

---

### 6.B — SESSION MUTATION

#### Attack 6.B.1: Wanders User.id as ownerActorId in uploadMediaController

**Scenario:** In both `publishWandersFromBuilder.controller.js` (line 134) and `cards.controller.js` (line 228-229), the call is:
```
ownerActorId: user.id
```
where `user.id` is the `auth.users` UUID, NOT a `vc.actors.id`. This is used as the `ownerActorId` in `uploadMediaController`, which embeds it in the R2 storage key path.

**Source trace:**
- `publishWandersFromBuilder.controller.js:131-136` — `uploadMediaController({ scope: 'wanders_card', ownerActorId: user.id, ... })`
- `cards.controller.js:225-231` — identical pattern with `user.id`
- `buildMediaStorageKey.js:55` — `${prefix}/${ownerActorId}/...` — R2 key uses the `user.id` UUID as the actor segment

**Impact:** Storage keys for wanders uploads embed `auth.users.id` instead of `vc.actors.id`. This is a namespace violation. If `createMediaAssetController` is later called with this result, it will use `senderActorId` as `ownerActorId` (the correct actor) — so the DB record is correct — but the R2 path reflects a `userId` not an `actorId`. The `buildMediaStorageKey` has no way to enforce identity type; it trusts whatever string is passed as `ownerActorId`.

**Confirmed by:** VEN-MEDIA-004 (wanders/core/controllers/cards.controller.js:228 passes `user.id` as `ownerActorId`)

**Result: BYPASSED** [SOURCE_VERIFIED — publishWandersFromBuilder.controller.js:134, cards.controller.js:228]
No fix applied. VEN-MEDIA-004 CONFIRMED.

---

#### Attack 6.B.2: Null/Undefined viewerActorId Bypass

**Scenario:** Pass `ownerActorId: null` or `ownerActorId: undefined` to each write entry point.

- `uploadMediaController`: line 33 — `if (!ownerActorId) throw new Error('[MediaEngine] ownerActorId is required')` — BLOCKED
- `createMediaAssetController`: line 37 — `if (!ownerActorId) throw new Error(...)` — BLOCKED
- `softDeleteMediaAssetController`: line 14 — `if (!actorId) throw new Error(...)` — BLOCKED
- `useMediaUpload` hook: passes `ownerActorId` from hook params; no validation at hook level — caller must supply valid value

**Result: BLOCKED** — All three controllers validate non-null. [SOURCE_VERIFIED — all three controller files, lines 33, 37, 14]

---

### 6.C — RUNTIME ABUSE

#### Attack 6.C.1: Non-Owner Actor Kind Reaching Owner-Only Upload Paths

**Scenario:** Does any upload scope gate against actor `kind`? A `user`-kind actor calling a `vport`-scoped upload.

**Trace:** `uploadScopes.js` does not carry actor kind restrictions. Scope `vport_avatar`, `vport_banner`, `portfolio_media`, `menu_item_photo` are vport-semantically scoped but have no runtime `kind` check in `uploadMediaController` or `createMediaAssetController`. A user-kind actor can call `uploadMediaController({ scope: 'vport_avatar', ownerActorId: <any-id> })` and the engine will not reject based on actor kind.

**Caller-level mitigations:**
- `saveVportActorMenuItemController` checks `category.actor_id === actorId` — but does not verify the actorId is of kind `vport`
- `ctrlUploadDesignAsset` calls `requireOwnerActorAccess` which checks `actor_owners` linkage — but not actor kind

**Result: PARTIAL** — No actor kind enforcement at engine or controller level. Ownership is checked via `actor_owners` linkage in some callers but not all. A user-kind actor that has ownership over a vport (via `actor_owners`) can upload to vport-scoped buckets, which may be intentional. [SOURCE_VERIFIED — uploadScopes.js, uploadMedia.controller.js:30-94]

---

#### Attack 6.C.2: Admin/Moderation Path Abuse

No admin or moderation paths found in the media feature source. The media engine has no admin-only routes. Not applicable.

---

### 6.D — RLS VERIFICATION

#### Attack 6.D.1: insertMediaAssetDAL — No App-Layer Ownership Filter

**Scenario:** `insertMediaAssetDAL` (mediaAssets.write.dal.js) performs a direct INSERT with no WHERE clause on owner identity. It accepts the caller-supplied `row.owner_actor_id` verbatim.

**Source trace:**
- `mediaAssets.write.dal.js:59-93` — INSERT does not filter or verify that the authenticated session user owns `row.owner_actor_id`
- No `eq('owner_actor_id', sessionActorId)` guard
- RLS INSERT policies are the only DB-side barrier

**Known RLS gap (from VENOM):** VEN-MEDIA-002 — INSERT path has no app-layer actorId session verification; owner_source-specific INSERT RLS policies incomplete (no vport/chat policies confirmed).

**Result: BYPASSED at app layer, UNRESOLVED at DB layer** — No app-layer ownership filter on INSERT. DB RLS completeness for INSERT paths is flagged as incomplete by VENOM. [SOURCE_VERIFIED — mediaAssets.write.dal.js:59-93, SCANNER_LEAD from VEN-MEDIA-002]

---

#### Attack 6.D.2: softDeleteMediaAssetDAL — {public} Policy Coexistence Risk

**Scenario:** `softDeleteMediaAssetDAL` performs UPDATE with `.eq('id', assetId)` (no owner filter in query). The actor-owner RLS policy is the primary guard. However, `media_assets_vc_owner_update` with `{public}` role coexists on the table (VEN-MEDIA-001).

**Source trace:**
- `mediaAssets.softDelete.dal.js:43-52` — UPDATE with only `id` filter
- Comment at line 30 acknowledges the {public} policy coexistence

The {public} policy has unrestricted column UPDATE surface. Although the soft-delete DAL is internally column-restricted (only sets `status, deleted_at, deleted_by_actor_id, updated_at`), the {public} policy could allow direct REST API calls to set arbitrary columns on any row without actor ownership.

**Result: PARTIAL** — App-layer column restriction holds for this DAL. Direct REST API bypass exists via {public} policy for unrestricted columns. [SOURCE_VERIFIED — mediaAssets.softDelete.dal.js:24-30]

---

### 6.E — VIEWER CONTEXT FUZZING

**Null viewerActorId tests (all three write controllers):**

| Target | Test | Result |
|---|---|---|
| uploadMediaController({ ownerActorId: null }) | Throws `[MediaEngine] ownerActorId is required` | BLOCKED |
| createMediaAssetController({ ownerActorId: null }) | Throws `[createMediaAsset] ownerActorId is required` | BLOCKED |
| softDeleteMediaAssetController({ actorId: null }) | Throws `[softDeleteMediaAsset] actorId is required` | BLOCKED |
| createMediaAssetController({ createdByActorId: null }) | Throws `[createMediaAsset] createdByActorId is required` | BLOCKED |

All null-guard checks confirmed present. [SOURCE_VERIFIED]

**Empty string test:** None of the controllers check for empty string `""`. An attacker passing `ownerActorId: ""` would bypass the `!ownerActorId` guard (since `!""` is `true` in JS — actually false — wait: `!""` IS `true`). Verified: `!""` evaluates to `true` in JavaScript — so the guard `if (!ownerActorId) throw...` WOULD catch empty string. BLOCKED.

---

### 6.F — MUTATION REPLAY

**Scenario:** Can a soft-deleted asset be re-soft-deleted? Can an already-uploaded asset be re-inserted?

**Soft-delete replay:**
- `softDeleteMediaAssetDAL` performs `.update().eq('id', assetId)`. There is no state-machine check in the controller or DAL to prevent calling soft-delete on an already-deleted asset. A second call would succeed (updating `deleted_at` and `deleted_by_actor_id` to new values). DB RLS WITH CHECK enforces `status = 'deleted'` — the update value is always `'deleted'`, so it would not block a re-delete.

**INSERT replay:**
- `insertMediaAssetDAL` has no uniqueness check on `storage_key`. A second INSERT with the same `storage_key` and different `ownerActorId` would succeed if RLS policies allow it. No unique constraint on `storage_key` confirmed from DAL code. This could allow duplicate media records for the same R2 object.

**Result: PARTIAL** — Soft-delete replay is benign (idempotent semantically). INSERT replay is a DATA INTEGRITY concern — same R2 object could be registered to multiple actors if the caller passes a previously-used `mediaUploadResult`. [SOURCE_VERIFIED — mediaAssets.softDelete.dal.js:43-52, mediaAssets.write.dal.js:59-93]

---

### 6.G — HYDRATION POISONING

The media feature does not interact with the hydration store directly. `createMediaAssetController` and `softDeleteMediaAssetController` return data to callers but do not write to any hydration cache. Not applicable. No finding.

---

### 6.H — URL SURFACE

**Scenario:** Do any notification linkPaths, share links, or deep links for this feature expose raw UUIDs?

**Trace:** The media feature itself does not construct notification links or share URLs. Media assets expose `public_url` (R2 CDN URL) which contains a UUID-based `storage_key` segment (from `buildMediaStorageKey` — `{uuid}.{ext}`). This UUID is in the CDN path, not in a VCSM public route URL.

**R2 storage key format:** `{prefix}/{ownerActorId}/{extraPath/}{yyyy}/{mm}/{dd}/{uuid}.{ext}`
- The `ownerActorId` is embedded in the R2 key path. If the `public_url` is ever surfaced directly in UI (which it is, as CDN image URLs), the `ownerActorId` (a `vc.actors` UUID) is embedded in the CDN URL. This is a medium-severity information exposure — actor UUIDs should not be in public-facing URLs per the no-raw-IDs-in-public-URLs rule.
- For wanders specifically, the `ownerActorId` embedded in the R2 key is `user.id` (auth.users UUID) due to VEN-MEDIA-004 / 6.B.1. This is an auth.users UUID in a public CDN URL.

**Result: BYPASSED** [SOURCE_VERIFIED — buildMediaStorageKey.js:55]

---

### 6.I — §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md status is PLACEHOLDER. No §9 Must Never Happen entries are authored. All §9 invariants are UNANCHORED.

The following invariants are SOURCE-INFERRED from the architecture (what SHOULD be invariants based on the platform contract):

| Inferred Invariant | Attack Harness | Result |
|---|---|---|
| Actor can only register media assets they own | Pass a foreign actorId as ownerActorId to createMediaAssetController | BYPASSED — no session check in controller; relies on DB RLS |
| Upload must only go to the actor's own R2 namespace | Call uploadFlyerImageCtrl with foreign vportId | BYPASSED — no ownership gate before R2 write (VEN-MEDIA-003 confirmed) |
| userId (auth.users) must never appear in actorId fields | Use wanders upload path — ownerActorId = user.id | BYPASSED — wanders uses user.id as ownerActorId for R2 key |
| Storage key ownerActorId segment must always be a vc.actors UUID | Same as above | BYPASSED |

---

## 7. Exploitability Assessment

| Finding ID | Severity | Exploitability | Confirmed Chain |
|---|---|---|---|
| BW-MEDIA-001 | HIGH | HIGH | uploadFlyerImageCtrl missing pre-upload ownership gate — cross-namespace R2 write |
| BW-MEDIA-002 | HIGH | MEDIUM | wanders userId/actorId namespace violation in R2 storage key and uploadMediaController call |
| BW-MEDIA-003 | MEDIUM | MEDIUM | createMediaAssetController has no session-layer ownership verification — app-layer trust boundary gap |
| BW-MEDIA-004 | MEDIUM | LOW | insertMediaAssetDAL has no app-layer ownership filter; INSERT RLS policies incomplete for vport/chat owner_source |
| BW-MEDIA-005 | MEDIUM | LOW | Actor UUID (ownerActorId) embedded in public CDN URLs via R2 storage key |
| BW-MEDIA-006 | LOW | LOW | INSERT replay possible — no uniqueness guard on storage_key; duplicate media records possible |
| BW-MEDIA-007 | HIGH | CRITICAL | BEHAVIOR.md is a PLACEHOLDER — no §9 invariants, no security rules, no governance anchor for platform-critical infrastructure feature |

---

## 8. Source Verification Summary

All BYPASSED findings carry source verification with file path and line number:

| Finding | File | Line(s) | Evidence |
|---|---|---|---|
| BW-MEDIA-001 | apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js | 8-31 | No requireOwnerActorAccess before uploadMediaController in uploadFlyerImageCtrl |
| BW-MEDIA-002 | engines/media/src/controller/uploadMedia.controller.js + apps/VCSM/src/features/wanders/core/controllers/publishWandersFromBuilder.controller.js | engine:30-94, wanders:131-136 | user.id (auth.users) passed as ownerActorId |
| BW-MEDIA-003 | apps/VCSM/src/features/media/controller/createMediaAsset.controller.js | 25-79 | No session lookup, no actor_owners check |
| BW-MEDIA-004 | apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js | 59-93 | No owner filter in INSERT |
| BW-MEDIA-005 | engines/media/src/lib/buildMediaStorageKey.js | 55 | ownerActorId in R2 key path, exposed in public_url |
| BW-MEDIA-006 | apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js | 59-93 | No uniqueness guard on storage_key |
| BW-MEDIA-007 | ZZnotforproduction/APPS/VCSM/features/media/BEHAVIOR.md | 1-9 | PLACEHOLDER status confirmed |

---

## 9. Confidence Summary

| Finding | Provenance | Confidence |
|---|---|---|
| BW-MEDIA-001 | SOURCE_VERIFIED | HIGH |
| BW-MEDIA-002 | SOURCE_VERIFIED | HIGH |
| BW-MEDIA-003 | SOURCE_VERIFIED | HIGH |
| BW-MEDIA-004 | SOURCE_VERIFIED + SCANNER_LEAD (VEN-MEDIA-002) | HIGH |
| BW-MEDIA-005 | SOURCE_VERIFIED | MEDIUM |
| BW-MEDIA-006 | SOURCE_VERIFIED | MEDIUM |
| BW-MEDIA-007 | SOURCE_VERIFIED | HIGH |

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER — all §9 invariants are UNANCHORED.

### Source-Inferred Invariants Attacked

| Inferred Invariant | Attack Vector | Attacker-Controlled Input | Result | Finding |
|---|---|---|---|---|
| Upload only to own actor namespace | Call uploadFlyerImageCtrl with victim vportId | vportId parameter | BYPASSED | BW-MEDIA-001 |
| No auth.users UUID as actorId in media paths | Use wanders upload flow as guest | imageFile in wanders payload | BYPASSED | BW-MEDIA-002 |
| Media asset owner must be session actor | Call createMediaAssetController with foreign ownerActorId | ownerActorId parameter | PARTIAL (RLS guard at DB) | BW-MEDIA-003 |
| No raw UUIDs in public URLs | Observe R2 CDN URL structure | N/A (storage key construction) | BYPASSED | BW-MEDIA-005 |

---

## 11. Behavior Contract Attack Summary

**Contract Status:** PLACEHOLDER — governance gap confirmed.

Because BEHAVIOR.md has no authored invariants, no §9 section, and no failure paths documented, there is no authoritative contract against which to verify runtime behavior for platform-critical infrastructure. This means:

1. Any future regression in ownership enforcement has no automated contract to catch it.
2. New callers of `createMediaAssetController` have no specification to verify against.
3. Security reviewers (VENOM, ELEKTRA, BW) must reconstruct invariants from source on every pass — no persistent reference.

This is a governance blocker independent of the code-level findings.

---

## 12. THOR Impact (Release Blockers)

| Finding | THOR Impact |
|---|---|
| BW-MEDIA-001 | THOR BLOCKER — cross-namespace R2 write. Confirmed chain. Must fix before release. |
| BW-MEDIA-002 | THOR BLOCKER — identity namespace violation; user.id in actor-scoped path and R2 key. |
| BW-MEDIA-007 | GOVERNANCE BLOCKER — BEHAVIOR.md must be authored before further feature development. |
| BW-MEDIA-003 | ADVISORY — defense relies on DB RLS completeness (VEN-MEDIA-002 open). |
| BW-MEDIA-004 | ADVISORY — deferred per TICKET-PLATFORM-RLS-001. |
| BW-MEDIA-005 | ADVISORY — CDN URL structure exposes actor UUIDs; violates no-raw-IDs rule. |
| BW-MEDIA-006 | INFO — data integrity concern, not a security blocker. |

---

## 13. SPIDER-MAN Test Requirements

The following test cases are required to establish regression coverage for this feature:

| Test ID | Test Description | Target | Priority |
|---|---|---|---|
| SPDR-MEDIA-001 | uploadFlyerImageCtrl must reject calls where session user does not own vportId | flyerEditor.controller.js | P0 |
| SPDR-MEDIA-002 | uploadMediaController called with wanders scope must use actorId not userId as ownerActorId | publishWandersFromBuilder.controller.js | P0 |
| SPDR-MEDIA-003 | softDeleteMediaAssetController must not delete assets owned by a different actor | softDeleteMediaAsset.controller.js + DB RLS | P1 |
| SPDR-MEDIA-004 | createMediaAssetController must require non-null, non-empty ownerActorId and createdByActorId | createMediaAsset.controller.js | P1 |
| SPDR-MEDIA-005 | insertMediaAssetDAL must not accept duplicate storage_key inserts | mediaAssets.write.dal.js | P2 |
| SPDR-MEDIA-006 | R2 storage key must never contain auth.users.id — must always be vc.actors.id | buildMediaStorageKey.js + callers | P1 |
| SPDR-MEDIA-007 | All upload entry points must verify session actor ownership before writing to R2 | All controllers using uploadMediaController | P0 |

---

## Summary

**7 findings total: 0 CRITICAL, 3 HIGH, 3 MEDIUM, 1 LOW**

- BW-MEDIA-001 (HIGH, BYPASSED): uploadFlyerImageCtrl writes to R2 without ownership gate — any authenticated user can write to any VPORT's R2 namespace. THOR BLOCKER. Confirms VEN-MEDIA-003.
- BW-MEDIA-002 (HIGH, BYPASSED): Wanders uploadMediaController passes auth.users.id as ownerActorId — identity namespace violation in R2 storage key. THOR BLOCKER. Confirms VEN-MEDIA-004.
- BW-MEDIA-003 (MEDIUM, PARTIAL): createMediaAssetController trusts caller-supplied ownerActorId with no session verification; DB RLS is the only guard.
- BW-MEDIA-004 (MEDIUM, PARTIAL): insertMediaAssetDAL has no app-layer owner filter; INSERT RLS policies incomplete per VEN-MEDIA-002.
- BW-MEDIA-005 (MEDIUM, BYPASSED): Actor UUIDs (ownerActorId) embedded in public R2 CDN URLs via storage key format.
- BW-MEDIA-006 (LOW): No uniqueness guard on storage_key in insertMediaAssetDAL; duplicate registration possible.
- BW-MEDIA-007 (HIGH): BEHAVIOR.md is PLACEHOLDER — governance and invariant coverage gap for platform-critical feature.
