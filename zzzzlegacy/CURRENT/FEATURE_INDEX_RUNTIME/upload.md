# Runtime Feature Index: upload

## Metadata
| Field | Value |
|---|---|
| Feature | upload |
| CURRENT Folder | CURRENT/features/upload |
| Source Folder | apps/VCSM/src/features/upload |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence + ARCHITECT-UPLOAD-0001 |
| Architecture State | FLAGGED |
| Security Tier | MEDIUM (elevated — CRITICAL finding in R2 transport) |

## Source Inventory
| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 3 | createPost.controller.js (controllers/), recordPostMedia.controller.js (controller/), searchMentionSuggestions.controller.js (controller/) |
| DALs | 8 | insertPost.dal.js, insertPostMedia.dal.js, insertPostMentions.dal.js, updatePostMediaAssetId.write.dal.js, postAuthRollback.dal.js, findActorsByHandles.dal.js, findPostMentionsByPostIds.dal.js, searchMentionSuggestions.dal.js |
| Hooks | 4 | useUploadSubmit.js, useMediaSelection.js, useMentionAutocomplete.js, useResolvedActor.js |
| Models | 1 | uploadTypes.model.js |
| Screens | 2 | UploadScreenModern.jsx (ACTIVE), UploadScreen.jsx (LEGACY — status UNKNOWN) |
| Components | 9 | ActorPill.jsx, CaptionCard.jsx, LinkifiedMentions.jsx, MediaPreview.jsx, MentionAutocompleteList.jsx, MentionChips.jsx, MentionTypeahead.jsx, PrimaryActionButton.jsx, SegmentedButton.jsx, SelectedThumbStrip.jsx, TagChips.jsx, UploadCard.jsx, UploadHeader.jsx |
| Adapters | 2 | posts.adapter.js, ui/LinkifiedMentions.adapter.js |
| API | 1 | api/uploadMedia.js |
| Lib | 4 | classifyFile.js, compressIfNeeded.js, extractHashtags.js, extractMentions.js |
| Routes | 1 | /upload — protected (Auth required) |
| Tests | 0 | NONE FOUND — SPIDER-MAN BLOCKED |

**ANOMALY — Dual Controller Folder (GAP-039 OPEN):**
`upload/controller/` (singular) contains `recordPostMedia.controller.js` and `searchMentionSuggestions.controller.js`.
`upload/controllers/` (plural) contains `createPost.controller.js`.
No canonical designation. Architecture contract violation.

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /upload | screens/UploadScreenModern.jsx | AUTH | Primary post-creation screen; all post modes (vibes/24drop/vdrop) |
| /upload (legacy) | screens/UploadScreen.jsx | AUTH | Wraps UploadScreenModern; mount status UNKNOWN — LOKI verification required |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| createPost.controller.js | upload/controllers/ | INSERT vc.posts + vc.post_media + vc.post_mentions | PARTIAL — session check via getCurrentAuthUserDAL; NO actor_owners lookup | HIGH |
| recordPostMedia.controller.js | upload/controller/ | UPDATE vc.post_media.media_asset_id; INSERT platform.media_assets | NO gate — actorId param only; caller must be authenticated | HIGH |
| insertPost.dal.js | upload/dal/ | INSERT vc.posts | NO — DAL is ungated; relies on controller auth | HIGH |
| insertPostMedia.dal.js | upload/dal/ | INSERT vc.post_media | NO — DAL is ungated | HIGH |
| insertPostMentions.dal.js | upload/dal/ | INSERT vc.post_mentions | NO — DAL is ungated | MEDIUM |
| updatePostMediaAssetId.write.dal.js | upload/dal/ | UPDATE vc.post_media (media_asset_id) | NO — no ownership check at DAL level | MEDIUM |
| postAuthRollback.dal.js | upload/dal/ | DELETE vc.posts | NO — deletes by postId only; no ownership check | MEDIUM |

## Read Surface Map
| Surface | Source Path | Read Type | Notes |
|---|---|---|---|
| findActorsByHandles.dal.js | upload/dal/ | SELECT public.profiles + vc.actors + vport.profiles | Multi-schema read for mention resolution |
| findPostMentionsByPostIds.dal.js | upload/dal/ | SELECT vc.post_mentions + vc.actors + public.profiles + vport.profiles | Multi-schema join used by feed render |
| searchMentionSuggestions.dal.js | upload/dal/ | RPC identity.search_actor_directory | Unified typeahead — no auth gate on RPC call |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| cloudflare-worker-upload/worker.js | apps/WT/ | CRITICAL | Wildcard CORS (`Access-Control-Allow-Origin: *`), no Supabase JWT verification — any origin can write files to post-media R2 bucket |
| createPost.controller.js | upload/controllers/ | HIGH | `actor_id` set from caller-supplied `identity.actorId` — no `actor_owners` lookup to confirm ownership; if identity context is spoofed, user can post as another actor |
| recordPostMedia.controller.js | upload/controller/ | HIGH | No auth re-check; fires non-blocking (Promise.allSettled); failures are silent in production |
| searchMentionSuggestions.controller.js | upload/controller/ | LOW | No auth gate — open typeahead; potential actor enumeration surface |
| Dual controller folder (GAP-039) | upload/ | MEDIUM | Canonical write path unclear; consumers may import from either folder; boundary risk |

## Engine Dependency Map
| Engine | Import Path | Used By | Purpose |
|---|---|---|---|
| engines/media | `@media` (direct alias) | api/uploadMedia.js | R2 file upload (uploadMediaController) |
| engines/media | `@/features/media/adapters/media.adapter` | controller/recordPostMedia.controller.js | Media asset registration (createMediaAssetController) |
| engines/media | `@/features/media/adapters/mediaAppId.adapter` | controller/recordPostMedia.controller.js | App ID resolution (resolveVcsmAppId) |

**Note:** Two access paths to engines/media exist. `api/uploadMedia.js` uses the direct `@media` barrel alias — this bypasses the `@/features/media/adapters/` boundary. Should be normalized to adapter-only.

## Cross-Feature Dependency Map
| Feature | Import | Pattern | Status |
|---|---|---|---|
| notifications | publishVcsmNotificationBatch | ADAPTER — correct | COMPLIANT |
| block | ctrlGetBlockedActorSet | BARREL (`@/features/block`) — no adapter | VIOLATION |
| media | createMediaAssetController, resolveVcsmAppId | ADAPTER — correct | COMPLIANT |

## Post-Creation Pipeline Trace
```
User picks files (useMediaSelection)
  → classifyFile + compressIfNeeded (lib)
  → useUploadSubmit.submit(form)
    → api/uploadMedia.js
      → uploadMediaController (@media engine)
        → Cloudflare R2 worker (CRITICAL — wildcard CORS, no JWT)
      → returns { mediaUrls, mediaTypes, uploadResults }
    → createPostController({ identity, input })
      → getCurrentAuthUserDAL() [auth check]
      → insertPost.dal → vc.posts [STEP 1]
      → insertPostMedia.dal → vc.post_media [STEP 2]
      → findActorsByHandles / filterValidActorIdsDAL [mention validation]
      → insertPostMentions.dal → vc.post_mentions [STEP 3]
      → ctrlGetBlockedActorSet [block filter]
      → publishVcsmNotificationBatch [mention notifications]
      → returns { actorId, tags, postId, postMediaIds }
    → recordPostMediaController (non-blocking, fire-and-forget)
      → createMediaAssetController → platform.media_assets [STEP 4]
      → updatePostMediaAssetIdDAL → vc.post_media.media_asset_id [STEP 5]
```

**ATOMICITY GAP:** R2 upload (pre-controller) succeeds but if `insertPost` fails, uploaded files are orphaned in R2 with no post record. If `insertPost` succeeds but `insertPostMedia` fails, `deletePostByIdDAL` rollback fires — but this gap is at the controller level, not at the R2 transport level.

## Open Governance Items
| Item | Status | Ticket / Reference |
|---|---|---|
| R2 worker wildcard CORS (CRITICAL) | OPEN — no remediation | features/upload/CURRENT_STATUS.md |
| GAP-039 dual controller folder | OPEN | ARCHITECT-UPLOAD-0001 |
| Post-media atomicity gap | OPEN | features/upload/ARCHITECTURE.md |
| No actor_owners ownership gate in createPostController | OPEN | ARCHITECT-UPLOAD-0001 |
| block barrel import (boundary violation) | OPEN | ARCHITECT-UPLOAD-0001 |
| Legacy UploadScreen.jsx mount status | UNKNOWN | LOKI verification required |
| Zero test coverage (SPIDER-MAN BLOCKED) | BLOCKED 2026-05-26 | features/upload/CURRENT_STATUS.md |
| TICKET-PLATFORM-RLS-001 | OPEN | platform.media_assets policy |

## Recommended Next Command

**VENOM** — Audit createPostController ownership gate; verify actor_id write path; trace block barrel import as boundary violation. Then ELEKTRA for R2 CORS patch design.

## Recommended Next Ticket

TICKET-UPLOAD-RUNTIME-001 — P0: Add Supabase JWT verification and origin allowlist to cloudflare-worker-upload/worker.js. Then scoped VENOM + ELEKTRA on createPostController actor_owners gap. Consolidate GAP-039 dual controller folders as part of same sprint.
