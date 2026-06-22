---
name: vcsm.upload.behavior
description: Feature-level behavior contract for the VCSM upload feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P1
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — upload
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The upload feature is the post-creation pipeline for VCSM. It handles file selection, media compression and upload to Supabase Storage, DB persistence of post and post_media rows, mention extraction and resolution, hashtag extraction, and mention notifications.

It supports three post modes:
- **VIBES** (`post`) — multi-image post, up to MAX_VIBES_PHOTOS (10) photos
- **24drop** (`24drop`) — single-file story
- **vdrop** (`vdrop`) — single-file short video

A secondary adapter surface (`posts.adapter.js`) exposes `createSystemPost` for machine-generated posts such as fuel price updates, menu items, and exchange rate announcements. This adapter is consumed by vport/gasprices, vport/exchange, locksmith, barbershop, and menu controllers.

Upload is owned by the social content domain. It is the exclusive write path for `vc.posts`, `vc.post_media`, and `vc.post_mentions`.

**Sources:** ARCHITECTURE.md §PURPOSE, §OWNERSHIP; INDEX.md §Source Inventory

---

## §2 Entry Points

The following entry points are confirmed from governance artifacts:

| Entry Point | Type | Description |
|---|---|---|
| `UploadScreen.jsx` | Screen | Top-level routing entry; delegates immediately to `UploadScreenModern.jsx` |
| `UploadScreenModern.jsx` | Screen | Interactive post composer screen — supports all three post modes |
| `posts.adapter.js` via `createSystemPost(...)` | Adapter (programmatic) | Machine-authored post creation used by other VPORT subsystems |
| `searchMentionSuggestions.controller.js` | Controller | Typeahead endpoint driven from the composer UI for mention autocomplete |

Route registration is not owned by this feature — `UploadScreen.jsx` is the routing boundary but routes are registered in the app router layer external to this feature directory.

**Sources:** ARCHITECTURE.md §ENTRY POINTS; INDEX.md §Routes

---

## §3 User Flows

### Happy Path — User creates a VIBES post (multi-image)

1. User opens the upload composer via `UploadScreen.jsx` then `UploadScreenModern.jsx`
2. User selects media files via `useMediaSelection` hook (`handleChosen`, `pick`)
3. Media is compressed and prepared via the media engine (`@media` alias / `uploadMedia.js`)
4. User adds caption and optionally mentions other actors via `useMentionAutocomplete`
5. Mention suggestions are fetched via `ctrlSearchMentionSuggestions` then `identity.search_actor_directory` RPC
6. User submits via `useUploadSubmit.submit()`
7. `createPostController` is called with `{ identity, input }`:
   - Auth session verified via `getCurrentAuthUserDAL()`
   - `actorId` sourced from `useIdentity()` (session-derived identity context)
   - `vc.posts` row inserted via `insertPost`
   - `vc.post_media` rows inserted via `insertPostMedia` (batch)
   - `vc.post_mentions` rows inserted via `insertPostMentions` (validated actor IDs only)
   - Mention notifications dispatched via `publishVcsmNotificationBatch` (notifications adapter)
8. Media asset IDs written back to `vc.post_media` via `recordPostMediaController` then `updatePostMediaAssetIdDAL` (non-blocking, fire-and-forget)
9. Navigation occurs immediately after submit (no confirmation state)

**Note on MAX_VIBES_PHOTOS cap:** The cap check in `createPostController` applies only when `input.mode === "post"` or `input.mode` is falsy. For non-"post" mode values, the controller-level cap is bypassed; `uploadMedia.js` pre-filters to a single file for non-"post" modes. Source: BW-UPLOAD-003 / SECURITY.md

### Happy Path — System post via createSystemPost

1. A VPORT controller (gasprices, exchange, locksmith, barbershop, menu) calls `createSystemPost({ actorId, text, post_type, realm_id, ... })`
2. Adapter verifies the caller is authenticated via `supabase.auth.getUser()`
3. Post row is inserted via `insertPost` with the supplied `actorId`
4. System post appears in the actor's feed as a machine-authored entry

**Note:** The adapter accepts `actorId` from the caller without cross-verifying ownership via `actor_owners`. Ownership verification is delegated to each calling controller. Source: VEN-UPLOAD-007 / SECURITY.md

### Rollback Path — Post insert succeeds but media insert fails

1. `insertPost` succeeds — `vc.posts` row created
2. `insertPostMedia` or media upload fails
3. `createPostController` rollback path calls `deletePostByIdDAL` (from `postAuthRollback.dal.js`) to remove the orphaned post row
4. Media rows may remain with `null media_asset_id` if the failure occurs after `insertPostMedia` but before `updatePostMediaAssetIdDAL` write-back

**Known gap:** If `insertPostMedia` succeeds but `recordPostMediaController` fails, `post_media` rows persist with null `media_asset_id` — no cleanup path exists for this case. Source: ARCHITECTURE.md §MODULE MISSING PIECES

**Sources:** ARCHITECTURE.md §LAYER MAP, §MODULE DATA CONTRACT, §MODULE RUNTIME READINESS; SECURITY.md; INDEX.md §Security-Sensitive Surfaces

---

## §4 Business Rules

| Rule | Description | Source |
|---|---|---|
| BR-1 | VIBES (post) mode is limited to MAX_VIBES_PHOTOS (10) photos | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX; BW-UPLOAD-003 |
| BR-2 | 24drop and vdrop modes accept a single file only | ARCHITECTURE.md §PURPOSE; BW-UPLOAD-003 (uploadMedia pre-filters to one file) |
| BR-3 | Post creation requires an authenticated session | ARCHITECTURE.md §Authorization path mapped; VEN-UPLOAD-001 |
| BR-4 | Post creation requires a valid actorId from the caller's identity context | ARCHITECTURE.md §Auth/owner gates; VEN-UPLOAD-001 |
| BR-5 | Client-supplied actorIds for post mentions are validated for existence via filterValidActorIdsDAL before insertion | ARCHITECTURE.md §MODULE DATA CONTRACT; INDEX.md §Security-Sensitive Surfaces; VEN-UPLOAD-002 |
| BR-6 | Mention notifications are dispatched via publishVcsmNotificationBatch to the notifications feature adapter | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| BR-7 | Blocked actors are excluded from mention notifications (ctrlGetBlockedActorSet filters before notification dispatch) | VEN-UPLOAD-006 finding detail / SECURITY.md |
| BR-8 | Media asset registration is non-blocking — failure is logged only; it does not block post creation | ARCHITECTURE.md §MODULE RUNTIME READINESS (Cache behavior) |
| BR-9 | createSystemPost is for machine-authored posts only; consumed by VPORT subsystems for fuel price, menu, exchange rate, locksmith, barbershop posts | ARCHITECTURE.md §PURPOSE; SECURITY.md VEN-UPLOAD-007 |
| BR-10 | Void Realm exclusion: VPORT system posts must always use the public realm (resolvePublicRealmIdDAL) — they are void:false by construction | Platform Memory (project_void_realm_system_posts.md) |
| BR-11 | MIME type is validated via an allowlist using client-supplied file.type (browser property); SVG is explicitly blocked | SECURITY.md VEN-UPLOAD-008 |

**PARTIAL — not all business rules are documentable from governance:**
- The exact declared value of MAX_VIBES_PHOTOS: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW (governance references "10 photos" in ARCHITECTURE.md purpose description but does not formally declare the constant)
- Hashtag extraction behavior: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW (ARCHITECTURE.md mentions hashtag extraction as part of the pipeline but no governance artifact specifies the rules)
- Caption length limits: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW
- Whether realm_id is required or optional for user-created posts: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW

---

## §5 State Rules

The upload feature does not have a formally documented state machine in any governance artifact. The following state facts are provable from governance:

| State Fact | Evidence |
|---|---|
| Loading state is managed by `useUploadSubmit` as a boolean | ARCHITECTURE.md §MODULE RUNTIME READINESS |
| Error state is managed by `useUploadSubmit.error` and `useMediaSelection.error` (two separate error states) | ARCHITECTURE.md §MODULE RUNTIME READINESS; Error state: READY |
| Navigation occurs immediately after submit — no post-submission confirmation state | ARCHITECTURE.md §MODULE RUNTIME READINESS (Cache behavior note) |
| No optimistic update — no feed invalidation owned by this feature (feed invalidation is owned by feed/post feature) | ARCHITECTURE.md §MODULE RUNTIME READINESS (Cache behavior) |
| Empty state (no file selected) rendering is PARTIAL — useMediaSelection returns empty file array but UI rendering of no-file state is not confirmed | ARCHITECTURE.md §MODULE RUNTIME READINESS (Empty state: PARTIAL) |

**Post creation lifecycle (provable from governance):**
1. Pre-submit: user composing
2. Submit triggered: loading = true
3. Auth verified, identity verified, post insert, media batch, mentions insert, notifications
4. On media failure: rollback delete, error state
5. On success: navigate (no confirmation state)

Full state machine specification: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW (no formal state machine documented in governance artifacts)

---

## §6 Security Constraints

The following constraints are derived from VENOM and BlackWidow findings. Each represents a rule the feature is expected to enforce. Note: several are CURRENTLY NOT ENFORCED as documented by the findings.

| Constraint | Status | Evidence |
|---|---|---|
| CONSTRAINT-1: Post creation must verify the authenticated user owns the actorId via actor_owners before inserting into vc.posts | NOT ENFORCED | VEN-UPLOAD-001 (HIGH): actor_owners check absent in createPostController; corroborated by BW-UPLOAD-001 |
| CONSTRAINT-2: Mention targets must be lifecycle-valid (active, not deleted/suspended) actors only | NOT ENFORCED | VEN-UPLOAD-002 (HIGH): filterValidActorIdsDAL checks existence only, not lifecycle status |
| CONSTRAINT-3: Media URLs stored in vc.post_media must originate from the expected Supabase storage bucket (origin validation required) | NOT ENFORCED | VEN-UPLOAD-003 (MEDIUM): URL accepted from uploadMedia return value without origin check |
| CONSTRAINT-4: updatePostMediaAssetIdDAL must include an actor ownership filter in the UPDATE predicate | NOT ENFORCED | VEN-UPLOAD-004 (HIGH): UPDATE uses row ID only, no actor_id/user_id scoping |
| CONSTRAINT-5: deletePostByIdDAL must include an ownership predicate (actor_id or user_id) before deleting | NOT ENFORCED | VEN-UPLOAD-005 (HIGH): DELETE predicate is postId only |
| CONSTRAINT-6: viewerActorId must be passed to the identity.search_actor_directory RPC so block/privacy filtering applies to mention autocomplete | NOT ENFORCED | VEN-UPLOAD-006 (MEDIUM): viewerActorId is always null in the RPC call |
| CONSTRAINT-7: createSystemPost must verify the authenticated caller owns the supplied actorId via actor_owners before inserting | NOT ENFORCED | VEN-UPLOAD-007 (HIGH): adapter accepts actorId from caller without verification |
| CONSTRAINT-8: MIME type validation must not rely solely on client-supplied file.type; server-side or magic-byte inspection is required for production hardening | NOT ENFORCED | VEN-UPLOAD-008 (MEDIUM): classifyFile and validateMediaFile both use client file.type |
| CONSTRAINT-9: post_type stored in vc.posts must be validated against an allowlist (['post', '24drop', 'vdrop']) at the controller layer | NOT ENFORCED | VEN-UPLOAD-009 (MEDIUM): input.mode stored directly without allowlist check |
| CONSTRAINT-10: Notification linkPath must use a human-readable or slug-based post URL — raw postId UUIDs must not appear in public-facing notification links | NOT ENFORCED | VEN-UPLOAD-010 (LOW): linkPath uses /post/${postId} raw UUID |
| CONSTRAINT-11: recordPostMediaController must not silently continue when actorId is null — it must throw to prevent ownerless media asset creation | NOT ENFORCED | BW-UPLOAD-002 (MEDIUM): null actorId triggers silent early return |
| CONSTRAINT-12: Post creation must not allow submission when identity context user_id and actorId originate from mismatched sources | NOT ENFORCED | BW-UPLOAD-001 (HIGH): user_id from auth session and actor_id from identityContext are never cross-verified |
| CONSTRAINT-13: Post creation must be idempotent — duplicate submissions must not create duplicate vc.posts rows | NOT ENFORCED | BW-UPLOAD-004 (LOW): no idempotency key or server-side deduplication exists |
| CONSTRAINT-AUTH-1: Authentication is required for all post write operations (createPostController, createSystemPost) | ENFORCED | getCurrentAuthUserDAL() call verified by VENOM; createSystemPost auth check at lines 12-13 confirmed by BW |

---

## §7 Error Handling

The following error states are provable from governance artifacts:

| Error Condition | Handling | Source |
|---|---|---|
| Null/undefined identity.actorId at createPostController entry | Throws "No actor identity" error | BW report §6.9 Inferred Invariant I-2; ARCHITECTURE.md |
| Auth session absent (getCurrentAuthUserDAL fails) | Controller throws | ARCHITECTURE.md §Auth/owner gates |
| Media upload failure after post insert | Rollback path: deletePostByIdDAL deletes the orphaned post row | ARCHITECTURE.md §MODULE DATA CONTRACT |
| recordPostMediaController receives null actorId | Silent early return (does NOT throw) — downstream may create ownerless media record | BW-UPLOAD-002; SECURITY.md |
| insertPostMedia succeeds but media asset registration fails | Failure logged only (Promise.allSettled); no alerting; post_media rows persist with null media_asset_id | ARCHITECTURE.md §MODULE MISSING PIECES; §MODULE RUNTIME READINESS |
| useUploadSubmit loading state during submit | UI is gated from re-submission; not a server-side idempotency guard | BW-UPLOAD-004; ARCHITECTURE.md |

**PARTIAL — the following error conditions are not documented in governance:**
- What happens when notifications dispatch fails: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW
- What happens when insertPostMentions fails: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW
- What happens when rollback (deletePostByIdDAL) itself fails: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW
- Empty state (no file selected) rendering behavior: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW (ARCHITECTURE.md notes this as PARTIAL)

---

## §8 Cross-Feature Dependencies

| Dependency | Type | Direction | Boundary | Notes |
|---|---|---|---|---|
| engines/media (@media alias) | Engine | upload to media | Approved — via adapter | uploadMedia.js delegates file upload to media engine via @media alias |
| features/media (media.adapter) | Feature adapter | upload to media | Approved — adapter boundary | recordPostMedia.controller imports createMediaAssetController from media.adapter |
| features/notifications (notifications.adapter) | Feature adapter | upload to notifications | Approved — adapter boundary | publishVcsmNotificationBatch dispatched from createPost.controller |
| features/block (@/features/block barrel) | Feature adapter | upload to block | Approved — via feature barrel | ctrlGetBlockedActorSet used in createPostController for notification filtering |
| engines/directory (identity.search_actor_directory RPC) | Engine RPC | upload to directory | Approved — via DAL | searchMentionSuggestions.dal calls the directory RPC for mention typeahead |
| @/state/identity | State module | upload to state | Approved | useIdentity() provides actorId in useUploadSubmit |
| feed / post features | Feature (consumer) | feed/post reads vc.posts | N/A (write path; consumers read from DB) | Upload writes to vc.posts, vc.post_media, vc.post_mentions; feed/post features consume these tables |

No circular dependencies detected. Source: ARCHITECTURE.md §MODULE DEPENDENCY GRAPH

**Independence status:** MOSTLY INDEPENDENT — Source: CURRENT_STATUS.md

**Boundary warning:** `ctrlGetBlockedActorSet` is imported from `@/features/block` (feature barrel index), not a named adapter file. This is flagged as a boundary warning — should be verified as an intentional adapter boundary. Source: ARCHITECTURE.md §MODULE BOUNDARY WARNINGS

---

## §9 Must Never Happen — Security Invariants

The following invariants are derived from VENOM and BlackWidow findings. Each represents a condition that must never occur in a correctly functioning, fully secured system. All are currently UNANCHORED (no formal test coverage, no controller-layer enforcement for most).

| Invariant | Status | Violated By |
|---|---|---|
| INVARIANT-1: A post must never be inserted into vc.posts with an actor_id that the authenticated session user does not own via actor_owners | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-001 (HIGH), BW-UPLOAD-001 (HIGH) |
| INVARIANT-2: A post must never be created by an unauthenticated session | PARTIALLY ENFORCED (null guard only; no actor_owners check) | VEN-UPLOAD-001 |
| INVARIANT-3: deletePostByIdDAL must never delete a post that does not belong to the calling session user | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-005 (HIGH) |
| INVARIANT-4: post_type must never be stored as any value outside the allowlist ['post', '24drop', 'vdrop'] | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-009 (MEDIUM) |
| INVARIANT-5: updatePostMediaAssetIdDAL must never update a post_media row belonging to an actor other than the calling session | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-004 (HIGH) |
| INVARIANT-6: createSystemPost must never create a post attributed to an actorId not owned by the authenticated caller | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-007 (HIGH) |
| INVARIANT-7: Notification linkPath must never contain a raw internal UUID | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-010 (LOW) |
| INVARIANT-8: Blocked actors must never appear in mention autocomplete suggestions for the blocking user | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-006 (MEDIUM) |
| INVARIANT-9: Mention rows must never be inserted for deleted, suspended, or blocked actors | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-002 (MEDIUM) |
| INVARIANT-10: Media records must never be created with a null ownerActorId | UNANCHORED — NOT ENFORCED | BW-UPLOAD-002 (MEDIUM) |
| INVARIANT-11: Media URLs stored in vc.post_media must never originate from domains outside the approved Supabase storage bucket | UNANCHORED — NOT ENFORCED | VEN-UPLOAD-003 (MEDIUM) |
| INVARIANT-12: The MAX_VIBES_PHOTOS cap must never be bypassable by submitting a non-standard mode value | UNANCHORED — NOT ENFORCED | BW-UPLOAD-003 (MEDIUM) |
| INVARIANT-13: A post must never be inserted with a user_id/actor_id pair where the two do not correspond to the same ownership record in actor_owners | UNANCHORED — NOT ENFORCED | BW-UPLOAD-001 (HIGH) |

---

## §10 Module Responsibilities

The following modules are confirmed from ARCHITECTURE.md and INDEX.md. All module BEHAVIOR.md files are STUB/PLACEHOLDER — module-specific responsibilities below are derived from the feature-level ARCHITECTURE.md only.

### Controllers (4)

| Controller | Responsibility | Source |
|---|---|---|
| `createPost.controller.js` | Primary post creation orchestrator: auth check, post row insert, media batch insert, mentions insert, notification dispatch, rollback on media failure | ARCHITECTURE.md §LAYER MAP |
| `recordPostMedia.controller.js` | Handles media asset registration write-back after post creation; non-blocking via Promise.allSettled | ARCHITECTURE.md §MODULE DATA CONTRACT |
| `searchMentionSuggestions.controller.js` | Typeahead endpoint for mention autocomplete; calls identity.search_actor_directory RPC | ARCHITECTURE.md §LAYER MAP; VEN-UPLOAD-006 |
| `api/uploadMedia.js` | Orchestrating adapter for the media upload sequence; pre-filters to 1 file for non-"post" modes | ARCHITECTURE.md §LAYER MAP; BW-UPLOAD-003 |

### DAL Files (10)

| DAL | Operation | Target |
|---|---|---|
| `insertPost.dal.js` | INSERT | vc.posts |
| `insertPostMedia.dal.js` | INSERT | vc.post_media |
| `insertPostMentions.dal.js` | INSERT | vc.post_mentions |
| `postAuthRollback.dal.js` (exports deletePostByIdDAL) | DELETE (rollback only) | vc.posts |
| `updatePostMediaAssetId.write.dal.js` | UPDATE (async writeback) | vc.post_media |
| `searchMentionSuggestions.dal.js` | RPC (READ) | identity.search_actor_directory |
| `findActorsByHandles.dal.js` (exports filterValidActorIdsDAL) | SELECT | vc.actors (mention validation) |
| `findPostMentionsByPostIds` | SELECT | vc.post_mentions (read) |
| Additional DAL files (2) | UNKNOWN | REQUIRES IMPLEMENTATION REVIEW |

### Adapters

| Adapter | Responsibility |
|---|---|
| `posts.adapter.js` | Exposes `createSystemPost` for machine-authored posts consumed by other VPORT subsystems (gasprices, exchange, locksmith, barbershop, menu) |
| `adapters/ui/LinkifiedMentions.adapter.js` | UI adapter for rendering linkified mentions in post content |

### Hooks (9)

| Hook | Responsibility |
|---|---|
| `useUploadSubmit` | Orchestrates full submit sequence; manages loading and error state |
| `useMediaSelection` | File selection, compression preparation, error state for media files |
| `useMentionAutocomplete` | Drives mention typeahead UI; calls ctrlSearchMentionSuggestions |
| `useResolvedActor` | Read-only actor identity resolution for the composer context |
| Additional hooks (5) | UNKNOWN — REQUIRES IMPLEMENTATION REVIEW |

### Model

| Model | Responsibility |
|---|---|
| `uploadTypes.model.js` | Type definitions for the upload feature domain |

Note: Model count is low relative to domain complexity. Media type normalization is inlined in the controller rather than in a dedicated model. Source: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX

### Module BEHAVIOR.md

The `modules/upload/BEHAVIOR.md` file is a STUB (status: STUB, source: venom+bw-derived). It contains unverified expected behaviors only; no confirmed invariants. This document supersedes it at the feature level.

---

## §11 Known Gaps

### Unproven Behavioral Items (UNKNOWN)
- MAX_VIBES_PHOTOS exact declared value not formally stated in governance (governance references "10 photos" in ARCHITECTURE.md purpose description but not as a declared constant)
- Hashtag extraction rules and behavior
- Caption length limits
- Whether realm_id is required or optional for user-created posts
- Notification dispatch failure handling
- insertPostMentions failure handling
- Rollback failure handling (if deletePostByIdDAL itself fails)
- Empty state (no file selected) UI rendering behavior
- Full state machine specification
- Responsibilities of 5 unnamed hooks (of 9 total)
- Responsibilities of 2 unnamed DAL files (of 10 total)
- UploadScreenModern.jsx internal structure and tab/mode routing

### Missing Governance Files
- OWNERSHIP.md — does not exist (ARCHITECTURE.md notes: no ownership declaration file)
- TESTS.md — does not exist (zero tests confirmed by scanner)
- Security audit file — MISSING (per ARCHITECTURE.md §MODULE GOVERNANCE LINKS)
- Runtime audit — MISSING
- Performance audit — MISSING
- Migration audit — MISSING
- ELEKTRA has never run on this feature (ELEKTRA Status: NOT RUN per SECURITY.md)

### Open Security Findings (THOR Blockers)
- VEN-UPLOAD-001: Actor identity not verified via actor_owners before post creation — OPEN
- VEN-UPLOAD-004: updatePostMediaAssetIdDAL updates by row ID without ownership filter — OPEN
- VEN-UPLOAD-005: deletePostByIdDAL has no ownership predicate — OPEN
- VEN-UPLOAD-007: createSystemPost accepts actorId without actor_owners verification — OPEN
- BW-UPLOAD-005: BEHAVIOR.md was PLACEHOLDER — RESOLVED by this document
- BW-UPLOAD-001: Dual-source trust boundary (user_id vs actor_id) never cross-verified — OPEN

### Test Coverage
- 0 tests on any controller, DAL, or rollback path (scanner confirmed 0 test files)
- All SPIDER-MAN test requirements from the BW report (T1–T6) are outstanding

### Architecture Fragmentation
- Two controller directories exist: `controller/` and `controllers/` — naming inconsistency flagged as MEDIUM risk by ARCHITECT (IRONMAN handoff recommended)
- Non-blocking media asset writeback has no alerting on failure (SENTRY handoff recommended)
- `useUploadSubmit.js` imports from `@debuggers/media/bugBunnyUploadDebugger` — production exclusion depends on vite alias; verified as properly stubbed per VENOM §12 (Security Operations domain: no findings)

### Placeholder Modules
- `modules/upload/BEHAVIOR.md` is STUB — module-level behavioral contract not complete; superseded by this document at the feature level

---

## §12 Validation Sources

| File | Status | Key Facts Extracted |
|---|---|---|
| `ZZnotforproduction/APPS/VCSM/features/upload/CURRENT_STATUS.md` | READ | Architecture state: EVOLVING; Independence: MOSTLY INDEPENDENT; Completeness: MOSTLY COMPLETE; Spaghetti: WATCH; Top gap: BEHAVIOR.md placeholder; Last run: 2026-06-04 |
| `ZZnotforproduction/APPS/VCSM/features/upload/SECURITY.md` | READ | VENOM complete (11 findings: 0 CRITICAL, 5 HIGH, 4 MEDIUM, 1 LOW); ELEKTRA NOT RUN; BW complete (5 findings: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW); THOR blockers: VEN-UPLOAD-001, 004, 005, 007, BW-UPLOAD-005, BW-UPLOAD-001 |
| `ZZnotforproduction/APPS/VCSM/features/upload/ARCHITECTURE.md` | READ | Full module architecture: 38 source files, 3 post modes, layer map (10 DAL, 4 controllers, 9 hooks, 29 components, 7 screens, 1 model, 1 adapter); dependency graph; data contract; runtime readiness; missing pieces; spaghetti score |
| `ZZnotforproduction/APPS/VCSM/features/upload/INDEX.md` | READ | Source inventory counts; write surface map (6 operations); engine dependencies (directory, media, notification); security-sensitive surface notes |
| `ZZnotforproduction/APPS/VCSM/features/upload/OWNERSHIP.md` | NOT FOUND — does not exist | — |
| `ZZnotforproduction/APPS/VCSM/features/upload/TESTS.md` | NOT FOUND — does not exist | — |
| `ZZnotforproduction/APPS/VCSM/features/upload/modules/upload/BEHAVIOR.md` | READ | Status: STUB; contains unverified expected behaviors derived from VENOM+BW findings; no confirmed invariants |
| `ZZnotforproduction/APPS/VCSM/features/upload/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_upload-security-review.md` | READ | Full VENOM V2 report: 11 findings all SOURCE_VERIFIED; full finding detail for VEN-UPLOAD-001 through VEN-UPLOAD-011; THOR blockers confirmed; mitigation plan; CISSP coverage |
| `ZZnotforproduction/APPS/VCSM/features/upload/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_upload-adversarial-review.md` | READ | Full BW V2 adversarial report: 5 new findings (BW-UPLOAD-001 through BW-UPLOAD-005); 7 VEN findings corroborated; attack category analysis (A–I); §9 invariant attack map; SPIDER-MAN test requirements (T1–T6) |

---

## §13 THOR Release Status

**THOR Release Blocker:** YES

**Exact text from SECURITY.md:**
> THOR Release Blocker: YES — VEN-UPLOAD-001, VEN-UPLOAD-004, VEN-UPLOAD-005, VEN-UPLOAD-007, BW-UPLOAD-005, BW-UPLOAD-001

**THOR Blockers (VENOM):** VEN-UPLOAD-001, VEN-UPLOAD-004, VEN-UPLOAD-005, VEN-UPLOAD-007
**THOR Blockers (BlackWidow):** BW-UPLOAD-005, BW-UPLOAD-001

### Blocker Detail

| Blocker ID | Source | Severity | Description | Status |
|---|---|---|---|---|
| VEN-UPLOAD-001 | VENOM | HIGH | Actor identity not verified via actor_owners before post creation in createPostController | OPEN |
| VEN-UPLOAD-004 | VENOM | HIGH | updatePostMediaAssetIdDAL updates vc.post_media by row ID without actor ownership filter | OPEN |
| VEN-UPLOAD-005 | VENOM | HIGH | deletePostByIdDAL (rollback path) has no ownership predicate — ownerless DELETE export | OPEN |
| VEN-UPLOAD-007 | VENOM | HIGH | createSystemPost adapter accepts actorId from caller without actor_owners verification | OPEN |
| BW-UPLOAD-005 | BlackWidow | HIGH | BEHAVIOR.md was a PLACEHOLDER — §9 Must Never Happen invariants were unanchored; no formally protected invariants existed | RESOLVED by this document (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) |
| BW-UPLOAD-001 | BlackWidow | HIGH | Dual-source trust boundary: user_id (auth session) and actor_id (identityContext) are never cross-verified against actor_owners | OPEN |

**ELEKTRA Status:** NOT RUN — ELEKTRA has never been run on this feature. Source-to-sink chain verification for media URL origin (VEN-UPLOAD-003), post_type injection (VEN-UPLOAD-009), and postMediaId ownership (VEN-UPLOAD-004) is pending.

**Current THOR Gate:** BLOCKED — 5 of 6 THOR blockers remain OPEN. This feature cannot be released without resolving VEN-UPLOAD-001, VEN-UPLOAD-004, VEN-UPLOAD-005, VEN-UPLOAD-007, and BW-UPLOAD-001. BW-UPLOAD-005 is considered RESOLVED by authoring this document.
