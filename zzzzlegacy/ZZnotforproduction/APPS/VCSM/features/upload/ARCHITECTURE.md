---
name: vcsm.upload.architecture
description: ARCHITECT V2 module architecture report for VCSM:upload
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** upload
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/upload
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The upload feature is the post-creation pipeline for VCSM. It handles file selection, media compression and upload to Supabase Storage, DB persistence of post and post_media rows, mention extraction and resolution, hashtag extraction, and mention notifications. It supports three post modes: VIBES (multi-image up to 10 photos), 24drop (single-file story), and vdrop (single-file short video). A secondary adapter surface (`posts.adapter.js`) exposes a `createSystemPost` function for machine-generated posts such as fuel price updates.

## OWNERSHIP

Upload is owned by the social content domain. It is the exclusive write path for `vc.posts`, `vc.post_media`, and `vc.post_mentions`. The media engine owns the physical file storage; upload delegates to it via `@media` alias and `media.adapter`. Notifications are delegated to the notification feature adapter.

## ENTRY POINTS

- `UploadScreen.jsx` — top-level routing entry; delegates immediately to `UploadScreenModern.jsx`
- `UploadScreenModern.jsx` — interactive post composer screen (multi-mode)
- `posts.adapter.js` — `createSystemPost(...)` for machine-authored posts (fuel price, menu) consumed by other features
- `searchMentionSuggestions.controller.js` — typeahead endpoint driven from composer UI

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 10 | insertPost.dal.js, insertPostMedia.dal.js, insertPostMentions.dal.js, postAuthRollback.dal.js, updatePostMediaAssetId.write.dal.js |
| Model | 1 | uploadTypes.model.js |
| Controller | 4 | createPost.controller.js, recordPostMedia.controller.js, searchMentionSuggestions.controller.js, (api/uploadMedia.js as orchestrating adapter) |
| Service | N/A | — |
| Adapter | 1 | posts.adapter.js, adapters/ui/LinkifiedMentions.adapter.js |
| Hook | 9 | useUploadSubmit.js, useMediaSelection.js, useMentionAutocomplete.js, useResolvedActor.js |
| Component | 29 | UploadCard.jsx, CaptionCard.jsx, MediaPreview.jsx, MentionTypeahead.jsx, MentionChips.jsx, MentionAutocompleteList.jsx, ActorPill.jsx, TagChips.jsx, SelectedThumbStrip.jsx, SegmentedButton.jsx, PrimaryActionButton.jsx, UploadHeader.jsx, LinkifiedMentions.jsx |
| Screen | 7 | UploadScreen.jsx, UploadScreenModern.jsx |
| Barrel | 1 | (module index) |

Counts derived from scanner callgraph data (cg_layerCounts).

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source clearly implements post creation pipeline | BEHAVIOR.md is PLACEHOLDER — not a real contract |
| Owner defined | PARTIAL | Implicitly: social content domain | No ownership declaration file |
| Entry points mapped | PASS | UploadScreen.jsx + posts.adapter.js both confirmed in source | — |
| Controllers present/delegated | PASS | 4 controllers (cg count) | No tests on controllers |
| DAL/repository present/delegated | PASS | 10 DAL files covering all write surfaces | postAuthRollback.dal exports deletePostByIdDAL used as rollback — naming is ambiguous |
| Models/transformers present | PARTIAL | 1 model (uploadTypes.model.js) | Model count low vs domain complexity; media type normalization is inlined in controller |
| Hooks/view models present | PASS | 9 hooks covering submit, media selection, mention autocomplete, actor resolution | — |
| Screens/components present | PASS | 7 screens (cg), 29 components (cg) | UploadScreenModern appears to be primary but not independently named as a screen in routing |
| Services/adapters present | PASS | posts.adapter.js + media engine delegation via @media alias | — |
| Database objects mapped | PASS | vc.posts, vc.post_media, vc.post_mentions, vc.post_media (asset writeback) | Rollback path only deletes vc.posts — orphaned post_media rows possible if media insert fails mid-batch |
| Authorization path mapped | PARTIAL | getCurrentAuthUserDAL() checks auth session; actorId from identity context | No RLS check beyond session; no actor_owners verification; client-supplied actorIds validated via filterValidActorIdsDAL for mentions |
| Cache/runtime behavior mapped | PARTIAL | No query cache seen in source; uploadMedia uses Promise.all for batch | No optimistic update; navigation happens immediately after submit (no confirmation state) |
| Error/loading/empty states mapped | PARTIAL | useUploadSubmit manages loading + error state; useMediaSelection manages file error | No explicit empty state (no-file) rendering found in source scan |
| Documentation linked | FAIL | BEHAVIOR.md exists but is PLACEHOLDER — not a real behavior contract | Real contract must be written |
| Tests/validation noted | FAIL | 0 tests (scanner confirmed) | No tests on createPostController, insertPost, or any rollback path |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | directory, media, notification engines confirmed in source imports | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/media (@media alias) | Engine | upload → media | YES — via adapter | uploadMedia.js imports uploadMediaController via @media alias |
| features/media (media.adapter) | Feature adapter | upload → media | YES — adapter boundary | recordPostMedia.controller imports createMediaAssetController from media.adapter |
| features/notifications (notifications.adapter) | Feature adapter | upload → notifications | YES — adapter boundary | publishVcsmNotificationBatch called from createPost.controller |
| features/block (block index) | Feature adapter | upload → block | YES — via feature barrel | ctrlGetBlockedActorSet imported from @/features/block |
| engines/directory (identity RPC) | Engine | upload → directory | YES — via DAL | searchMentionSuggestions.dal calls search_actor_directory RPC |
| @/state/identity | State module | upload → state | YES | useIdentity() used in useUploadSubmit |
| vc.posts | DB table | WRITE | — | insertPost, deletePostByIdDAL |
| vc.post_media | DB table | WRITE | — | insertPostMedia, updatePostMediaAssetIdDAL |
| vc.post_mentions | DB table | WRITE | — | insertPostMentions |
| identity.search_actor_directory | DB RPC | READ+RPC | — | Mention suggestion search |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.posts | INSERT, DELETE | upload | feed, post, profiles | DELETE used as rollback only — no soft-delete on rollback path |
| vc.post_media | INSERT, UPDATE | upload | feed, post | Asset writeback (UPDATE) is non-blocking fire-and-forget — may silently fail |
| vc.post_mentions | INSERT | upload | notifications, post | Client actorIds validated via filterValidActorIdsDAL before insert |
| identity.search_actor_directory | RPC (READ) | directory engine | upload (mention search) | Read-only; safe |
| platform.media_assets | INSERT (via media engine) | media engine | upload delegates | Media asset registration is non-blocking; failures logged only |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | UploadScreen.jsx is routing-level entry; delegates to UploadScreenModern | Route registration not visible in upload source — depends on app router config |
| Loading state | READY | useUploadSubmit tracks loading boolean | Loading state is hook-owned; screen must wire it |
| Empty state | PARTIAL | useMediaSelection returns empty file array; UI rendering of no-file state not confirmed | UploadScreenModern.jsx not read — may handle it |
| Error state | READY | useUploadSubmit.error + useMediaSelection.error both present | Two separate error states — potential for UI showing stale errors |
| Auth/owner gates | PARTIAL | getCurrentAuthUserDAL() + identity.actorId guard present in controller | No actor_owners cross-check; no VPORT ownership gate on posts |
| Cache behavior | NOT PRESENT | No query cache found in upload source | Feed invalidation after post depends on feed/post feature — not owned here |
| Runtime dependencies | READY | media engine, block feature, notification feature all present and adapter-gated | Circular risk: none detected |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/upload/BEHAVIOR.md | PRESENT — PLACEHOLDER ONLY |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is PLACEHOLDER | HIGH | The feature has no real behavioral specification — modes, validation rules, rollback logic, notification triggers are undocumented | LOGAN |
| Zero test coverage | HIGH | createPostController has a rollback path, mention validation, and notification dispatch — all untested | SPIDER-MAN |
| No rollback for post_media | MEDIUM | If batch insertPostMedia succeeds but recordPostMediaController fails, post_media rows may have null media_asset_id forever — no recovery path | VENOM / IRONMAN |
| CURRENT_STATUS.md absent (before this run) | LOW | No machine-readable status for tooling | ARCHITECT (resolved this run) |
| ARCHITECTURE.md absent (before this run) | LOW | No module architecture on record | ARCHITECT (resolved this run) |
| No VPORT actor gate on post creation | MEDIUM | controller checks actorId exists and auth user exists but does not verify the actor is owned by the session user via actor_owners | VENOM |
| Non-blocking writeback failure silently swallowed | LOW | recordPostMediaController uses Promise.allSettled — failures are debugger-logged only; no alerting | SENTRY |
| Duplicate dir: controller/ vs controllers/ | LOW | Two controller directories exist (controller/ and controllers/) — inconsistent naming creates confusion for tooling and contributors | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

1. `createPost.controller.js` imports `ctrlGetBlockedActorSet` from `@/features/block` — this is the block feature's barrel export, which is an approved cross-feature access pattern. However, it imports from `@/features/block` (feature index) rather than a named adapter file. Low risk if the barrel is the feature's public surface, but should be verified as an intentional adapter boundary.
2. `recordPostMedia.controller.js` imports `updatePostMediaAssetIdDAL` directly from `@/features/upload/dal/updatePostMediaAssetId.write.dal` — this is an intra-feature import, which is correct.
3. `posts.adapter.js` imports `insertPost` directly from the local DAL — correct intra-feature usage, but the adapter is consumed by other features (e.g. dashboard fuel price controllers). This cross-feature import into the adapter is approved as long as external consumers use only the adapter surface.
4. `useUploadSubmit.js` imports from `@debuggers/media/bugBunnyUploadDebugger` — this is a dev-only debugger alias. If the alias is not excluded from production builds, this could ship to production.

---

## SPAGHETTI SCORE

**Module:** upload
**Score:** WATCH
**Reasons:** Two controller directories (controller/ vs controllers/), non-blocking fire-and-forget writeback without retry or alerting, BEHAVIOR.md is a placeholder making intent opaque, zero tests on a critical write path. The core flow is structurally clean (Hook → Controller → DAL → Engine) with proper adapter boundaries. The fragmentation is at naming and observability level, not at dependency or coupling level.
**Release risk:** MEDIUM

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER

**Check A (Source without behavior):** PARTIAL — source exists and is complete; BEHAVIOR.md is a placeholder stub with no real behavioral spec. Source-behavior gap is total.
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no declared happy paths to verify against source.
**Check C (§13 engine consistency):** Scanner declares engines: directory, media, notification. Source confirms: @media alias (media engine), media.adapter (media engine), notifications.adapter (notification engine), searchMentionSuggestions.dal using identity RPC (directory engine). All three match.
**Check D (§6 data change consistency):** Scanner write surfaces: vc.posts INSERT, vc.post_media INSERT, vc.post_mentions INSERT, vc.posts DELETE, identity.search_actor_directory RPC, vc.post_media UPDATE. Source confirms all six. No undeclared write surfaces found.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md contract | Current placeholder gives no behavioral spec — modes, validation, rollback, notifications all undocumented | LOGAN |
| P1 | Add tests for createPostController and rollback path | Zero tests on a write path with rollback, mention validation, and notification dispatch is high risk | SPIDER-MAN |
| P2 | Add actor_owners ownership gate to createPostController | actorId is trusted from client identity context but never verified via actor_owners — security gap | VENOM |
| P3 | Unify controller/ and controllers/ directories | Naming inconsistency confuses tooling and contributors | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — write real BEHAVIOR.md contract for all three post modes
- **SPIDER-MAN** — test coverage for createPostController, rollback path, insertPostMedia
- **VENOM** — actor_owners ownership gate audit; debugger import in production build check
- **SENTRY** — non-blocking writeback failure observability
- **IRONMAN** — resolve controller/ vs controllers/ directory split

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
