# Module Architecture Report — vcsm.upload
# ARCHITECT §26.11 — Dated Immutable Report
# Generated: 2026-06-02
# Ticket: ARCHITECT-UPLOAD-0001
# Architecture State: FLAGGED
# Security Tier: MEDIUM (elevated — CRITICAL finding in R2 transport)

---

## Report Header

| Field | Value |
|---|---|
| Feature | upload |
| App | VCSM |
| Source Path | apps/VCSM/src/features/upload/ |
| Engine Path | engines/media (sealed — via @media alias and @/features/media/adapters/) |
| Audit Date | 2026-06-02 |
| Ticket | ARCHITECT-UPLOAD-0001 |
| Architecture State | FLAGGED |
| Module Status | MOSTLY COMPLETE |
| Security Tier | MEDIUM (elevated — CRITICAL R2 CORS finding) |
| Test Coverage | NONE — SPIDER-MAN BLOCKED |

---

## Feature Overview

The upload feature owns the full post-creation pipeline: file selection, client-side media compression (FFmpeg WASM), Cloudflare R2 cloud upload, post row persistence, multi-media attachment, mention resolution, and non-blocking media asset registration in `platform.media_assets`. It also exposes a system-post adapter (`posts.adapter.js`) consumed by VPORT system posts. The feature serves the protected `/upload` route and handles three post modes: standard Vibes posts (up to 10 images), 24drop stories, and vdrop posts.

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES — DUAL-FOLDER ANOMALY | `upload/controller/` (singular) AND `upload/controllers/` (plural) — GAP-039 OPEN |
| DALs | YES | `upload/dal/` |
| Models | YES | `upload/model/uploadTypes.model.js` |
| Hooks | YES | `upload/hooks/` |
| Screens | YES | `upload/screens/` |
| Components | YES | `upload/ui/` (9+ components) |
| Adapters | YES | `upload/adapters/posts.adapter.js`, `adapters/ui/LinkifiedMentions.adapter.js` |
| Lib | YES | `upload/lib/` (classifyFile, compressIfNeeded, extractHashtags, extractMentions) |
| API | YES | `upload/api/uploadMedia.js` |
| Engine controllers | YES | `engines/media/src/controller/uploadMedia.controller.js` |
| Engine DALs | YES | `engines/media/src/dal/r2Upload.dal.js` |

---

## Active Controllers

| Controller | Folder | Purpose | Auth Gate |
|---|---|---|---|
| `createPost.controller.js` | `controllers/` (PLURAL) | Primary post creation — inserts `vc.posts`, `vc.post_media`, `vc.post_mentions`; fires mention notifications | `getCurrentAuthUserDAL()` session check + `identity.actorId` guard; NO `actor_owners` lookup |
| `recordPostMedia.controller.js` | `controller/` (SINGULAR) | Non-blocking media asset write-back — records in `platform.media_assets`, updates `vc.post_media.media_asset_id` | `actorId` param guard only — no auth re-check |
| `searchMentionSuggestions.controller.js` | `controller/` (SINGULAR) | Mention typeahead — thin passthrough to `searchMentionSuggestions.dal` | NONE — open surface |

**ANOMALY (GAP-039):** Two controller folders coexist with no canonical designation. Contract violation per VCSM architecture rules.

---

## Active DALs

| DAL | Tables | Operation | Notes |
|---|---|---|---|
| `insertPost.dal.js` | `vc.posts` | INSERT | Returns `{ id }`; explicit select |
| `insertPostMedia.dal.js` | `vc.post_media` | INSERT | Returns sorted by sort_order; explicit select `id, sort_order` |
| `insertPostMentions.dal.js` | `vc.post_mentions` | INSERT | No select on insert |
| `updatePostMediaAssetId.write.dal.js` | `vc.post_media` | UPDATE | Updates `media_asset_id`; no ownership check at DAL level |
| `postAuthRollback.dal.js` | `vc.posts` | DELETE + auth.getUser | Rollback mechanism; also provides `getCurrentAuthUserDAL`; rollback active usage UNCLEAR |
| `findActorsByHandles.dal.js` | `public.profiles`, `vc.actors`, `vport.profiles` | SELECT | Multi-schema read; exports `filterValidActorIdsDAL` |
| `findPostMentionsByPostIds.dal.js` | `vc.post_mentions`, `vc.actors`, `public.profiles`, `vport.profiles` | SELECT | Multi-schema join; used by feed render path |
| `searchMentionSuggestions.dal.js` | `identity.search_actor_directory` (RPC) | RPC READ | No auth gate on RPC call |

---

## Active Hooks

| Hook | What It Calls | Purpose |
|---|---|---|
| `useUploadSubmit.js` | `uploadMedia` (api), `createPostController`, `recordPostMediaController` | Primary submission orchestrator; owns loading/error state |
| `useMediaSelection.js` | `classifyFile` (lib) | File picker state machine; VIBES 10-image cap enforced |
| `useMentionAutocomplete.js` | `ctrlSearchMentionSuggestions` (controller) | @mention typeahead; debounced, caret-position-aware |
| `useResolvedActor.js` | `useIdentity()` | Actor resolution — exposes actorId and isVoid from identity context |

---

## Engine Dependencies

| Engine | Import Path | Used By | Purpose |
|---|---|---|---|
| engines/media | `@media` (direct barrel) | `api/uploadMedia.js` | R2 file upload via uploadMediaController |
| engines/media | `@/features/media/adapters/media.adapter` | `controller/recordPostMedia.controller.js` | Media asset registration via createMediaAssetController |
| engines/media | `@/features/media/adapters/mediaAppId.adapter` | `controller/recordPostMedia.controller.js` | App ID resolution via resolveVcsmAppId |

**Note:** Two access patterns to engines/media exist. `api/uploadMedia.js` uses the direct `@media` barrel, bypassing the adapter boundary. Should be normalized to adapter-only access.

---

## Cross-Feature Dependencies

| Feature | Import | Pattern | Compliance |
|---|---|---|---|
| `notifications` | `publishVcsmNotificationBatch` | Adapter (`notifications/adapters/notifications.adapter`) | COMPLIANT |
| `block` | `ctrlGetBlockedActorSet` | Barrel (`@/features/block`) — no adapter | VIOLATION |
| `media` | `createMediaAssetController`, `resolveVcsmAppId` | Adapter (`media/adapters/`) | COMPLIANT |

---

## Authorization Pattern

**Primary write path (`createPostController`):**
1. `identity.actorId` presence check (from caller-supplied identity param)
2. `getCurrentAuthUserDAL()` — `supabase.auth.getUser()` re-verification at controller entry

**Gap:** The `actor_id` written to `vc.posts` comes from `identity.actorId` without an `actor_owners` lookup. No server-side confirmation that the authenticated user owns the actor identity they are posting as. This is the canonical ownership gate pattern used across VCSM but is unverified for this feature.

**`recordPostMediaController`:** No auth gate — `actorId` param only.

**`searchMentionSuggestions`:** No auth gate — open typeahead.

---

## Post-Creation Pipeline Trace

```
User picks files (useMediaSelection → classifyFile, compressIfNeeded)
  → useUploadSubmit.submit(form)
    → api/uploadMedia.js → uploadMediaController (@media engine)
        → Cloudflare R2 worker (CRITICAL: wildcard CORS, no JWT)
      → returns { mediaUrls, mediaTypes, uploadResults }
    → createPostController({ identity, input })
        → getCurrentAuthUserDAL() [session check]
        → insertPost.dal → vc.posts [STEP 1 — ATOMICITY GAP POINT]
        → insertPostMedia.dal → vc.post_media [STEP 2]
          (on failure: deletePostByIdDAL rollback)
        → filterValidActorIdsDAL [mention validation]
        → insertPostMentions.dal → vc.post_mentions [STEP 3]
        → ctrlGetBlockedActorSet [block filter — barrel import]
        → publishVcsmNotificationBatch [mention notifications]
      → returns { actorId, tags, postId, postMediaIds }
    → recordPostMediaController (non-blocking / fire-and-forget)
        → createMediaAssetController → platform.media_assets [STEP 4]
        → updatePostMediaAssetIdDAL → vc.post_media.media_asset_id [STEP 5]
```

---

## Tables Touched

| Table | Schema | Operations | Owner |
|---|---|---|---|
| `posts` | `vc` | INSERT, DELETE (rollback) | upload feature |
| `post_media` | `vc` | INSERT, UPDATE (media_asset_id) | upload feature |
| `post_mentions` | `vc` | INSERT | upload feature |
| `actors` | `vc` | SELECT (mention validation) | identity domain |
| `profiles` | `public` | SELECT (mention handle resolution) | identity domain |
| `profiles` | `vport` | SELECT (vport mention handle resolution) | identity domain |
| `media_assets` | `platform` | INSERT (via media engine) | media feature |
| `actor_directory` | `identity` | RPC READ (mention typeahead) | identity domain |

---

## Module Independence Classification

**DEPENDENT**

Reason: Upload has outbound cross-feature dependencies on `notifications`, `block`, and `media`. The feature cannot function without the identity context, media engine, notification adapter, and block feature. The `block` dependency is a boundary violation (barrel import). All dependencies are outbound only — no features import from upload internals (adapter boundary is maintained for external consumers).

---

## Architecture State

**FLAGGED**

Active flags:
1. GAP-039: Dual controller folder (`controller/` + `controllers/`) — no canonical path
2. Post-media atomicity gap — `vc.posts` inserted before R2 completes; rollback only covers `insertPostMedia` failure, not R2 failure
3. No `actor_owners` ownership validation in `createPostController`
4. `block` feature consumed via barrel (`@/features/block`) — adapter boundary violation
5. `api/uploadMedia.js` imports directly from `@media` engine barrel — adapter bypass
6. Zero test coverage
7. Legacy `UploadScreen.jsx` mount status unresolved
8. R2 worker wildcard CORS — CRITICAL external transport risk

---

## Known Structural Risks

| Risk | Severity | Status |
|---|---|---|
| R2 worker wildcard CORS — no JWT verification | CRITICAL | OPEN |
| No actor_owners ownership gate in createPostController | HIGH | OPEN |
| Post-media atomicity gap — orphaned posts on R2 failure | HIGH | OPEN |
| Dual controller folder (GAP-039) | MEDIUM | OPEN |
| block barrel import — boundary violation | MEDIUM | OPEN |
| api/uploadMedia.js direct @media barrel — adapter bypass | LOW | OPEN |
| Legacy UploadScreen.jsx — mount status unknown | LOW | UNKNOWN |
| Zero test coverage | HIGH | BLOCKED |

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Full pipeline documented in source | None |
| Owner defined | PARTIAL | No OWNERSHIP.md; IRONMAN not run | OWNERSHIP.md missing |
| Entry points mapped | PASS | /upload route confirmed via UploadScreenModern | Legacy screen status unresolved |
| Controllers present | PASS | 3 controllers found | Dual folder anomaly (GAP-039) |
| DAL/repository present | PASS | 8 DAL files in dal/ | postAuthRollback active usage unclear |
| Models/transformers | PASS | uploadTypes.model.js present | Minimal — most logic in controller/lib |
| Hooks/view models | PASS | 4 hooks covering full use cases | None |
| Screens/components | PASS | 2 screens, 9+ UI components | Legacy screen unresolved |
| Authorization path mapped | PARTIAL | Session check present; no actor_owners | actor_owners gap is UNVERIFIED |
| Engine dependencies mapped | PASS | engines/media confirmed via grep | Dual access path (barrel + adapter) |
| Tests/validation noted | FAIL | Zero test files; SPIDER-MAN BLOCKED | No coverage |

---

## Recommended Handoffs

| Command | Reason |
|---|---|
| VENOM | Audit createPostController ownership gate; confirm actor_id write path; trace block barrel import |
| ELEKTRA | Source-to-sink trace: createPostController → insertPost (no actor_owners); R2 CORS patch design |
| SENTRY | Verify post-media atomicity gap; confirm rollback wiring on failure paths |
| SPIDER-MAN | Unblock test coverage for createPostController, insertPost.dal, insertPostMedia.dal |
| IRONMAN | Establish upload feature ownership; create OWNERSHIP.md; resolve UploadScreen.jsx dead/active status |

---

## Final Module Status

**MOSTLY COMPLETE**

All required structural layers are present. The feature is functionally operational. Architecture is flagged due to: dual controller folder anomaly, missing actor_owners ownership gate, zero test coverage, block feature barrel import boundary violation, and the critical R2 CORS issue in the upload transport layer. These are governance and security gaps, not missing feature functionality.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-UPLOAD-0001
- Architecture State: FLAGGED
- Module Status: MOSTLY COMPLETE
- Controllers found: 3 (across 2 folders — GAP-039)
- DALs found: 8
- Hooks found: 4
- Engine deps: engines/media (2 access paths confirmed)
- Cross-feature deps: notifications (adapter), block (barrel — violation), media (adapter)
- Test coverage: ZERO
- Files read: 16 source files + existing governance (ARCHITECTURE.md, DR_STRANGE.md, FEATURE_INDEX_RUNTIME/upload.md)
- Output files written: CURRENT/features/upload/ARCHITECTURE.md, CURRENT/FEATURE_INDEX_RUNTIME/upload.md, CURRENT/outputs/2026/06/02/ARCHITECT/modules/vcsm.upload.architecture.md
