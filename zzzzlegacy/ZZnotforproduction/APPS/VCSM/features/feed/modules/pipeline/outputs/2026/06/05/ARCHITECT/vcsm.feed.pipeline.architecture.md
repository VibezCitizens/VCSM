---
title: Feed Pipeline Module — Architecture
status: SOURCE_VERIFIED
feature: feed
module: pipeline
command: ARCHITECT
run-date: 2026-06-05
source-verified: true
confidence: HIGH
---

# ARCHITECT V2 — Feed Pipeline Module Architecture Report

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | vcsm.feed.pipeline |
| Feature / Scope | VCSM:feed / modules/pipeline |
| Command | ARCHITECT |
| Module Type | Infrastructure / Feed Processing Pipeline |
| Scanner Version | N/A — direct source read (no scanner maps required for module-scoped run) |
| Output Path | ZZnotforproduction/APPS/VCSM/features/feed/modules/pipeline/outputs/2026/06/05/ARCHITECT/ |
| Timestamp | 2026-06-05T00:00:00 |
| Source Files Verified | 22 |
| Confidence | HIGH |

---

## MODULE ARCHITECTURE REPORT

**Module:** feed / pipeline
**Application Scope:** VCSM
**Module Type:** Infrastructure / Feed Processing Pipeline
**Primary Root:** `apps/VCSM/src/features/feed/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The feed pipeline module owns the complete data assembly lifecycle for a single page of the VCSM central feed. It is a pure read pipeline — no writes. It fetches, filters, enriches, and normalizes a cursor-paginated post page, returning a fully hydrated, visibility-filtered, actor-enriched row set to the caller.

Entry consumers are `useFeed.js` (manual hook) and `useCentralFeed.js` (React Query hook) via the query function `fetchCentralFeedPage.js`.

---

## OWNERSHIP

**Owning Feature:** `VCSM:feed`
**Module Boundary:** All pipeline execution lives in `apps/VCSM/src/features/feed/pipeline/`, `dal/`, and `model/`. No UI. No screens. No writes (core pipeline). The adapter layer (`feedCache.adapter.js`) exposes only cache invalidation functions to other features.

---

## ENTRY POINTS

| Entry Point | File | Caller | Purpose |
|---|---|---|---|
| `fetchFeedPagePipeline` | `pipeline/fetchFeedPage.pipeline.js` | `useFeed.js`, `fetchCentralFeedPage.js` | Single pipeline invocation for one DB page |
| `fetchCentralFeedPage` | `queries/fetchCentralFeedPage.js` | `useCentralFeed.js` (React Query queryFn) | Multi-page drain loop with 15s timeout; produces one logical page for infinite query |

---

## LAYER MAP

**DAL (10 files, all read-only in pipeline core):**

| File | Schema | Table(s) | Cache | Notes |
|---|---|---|---|---|
| `dal/feed.read.posts.dal.js` | vc | posts | NONE | Cursor paginated by created_at; realm filter optional; no viewerActorId auth check |
| `dal/feed.read.actorsBundle.dal.js` | vc + vport | actors, profiles, actor_privacy_settings, vport.profiles | 30s TTL per-actor | Uses separate vportClient; 3 parallel sub-queries for profiles+privacy+vports |
| `dal/feed.read.blockRows.dal.js` | moderation | blocks | 60s TTL per-viewer | UUID-validated; fetches viewer's full block graph scoped to current page actorIds |
| `dal/feed.read.followRows.dal.js` | vc | actor_follows | 60s TTL per-viewer | UUID-validated; fetches FULL follow graph for viewer (not page-scoped) |
| `dal/feed.read.hiddenPosts.dal.js` | moderation | actions | NONE | No UUID validation on viewerActorId |
| `dal/feed.read.media.dal.js` | vc | post_media | 60s TTL per-post | Returns Map<postId, [{url,media_type,sort_order}]> |
| `dal/feed.mentions.dal.js` | vc | post_mentions | NONE | No auth check; conditional call (only when @ detected in post text) |
| `dal/feed.read.commentCounts.dal.js` | vc | post_comments | NONE | Batched; returns Map<postId, number> |
| `dal/feed.read.reactionCounts.dal.js` | vc | post_reactions, post_rose_gifts | NONE | 2 parallel sub-queries; returns Map<postId, {like,dislike,rose}> |
| `dal/feed.read.viewerReactions.dal.js` | vc | post_reactions | NONE | No UUID validation on actorId; returns Map<postId, reactionKind> |

**Model (8 files, all pure functions):**

| File | Purpose |
|---|---|
| `model/normalizeFeedRows.model.js` | Orchestrates per-row visibility + mapping; produces normalized post objects |
| `model/feedRowVisibility.model.js` | Composite visibility resolver: block → actor exists → vport/user branch → private check |
| `model/feedBlockVisibility.model.js` | Builds `blockedActorSet` from block rows; bidirectional (viewer blocks OR is blocked by) |
| `model/feedFollowVisibility.model.js` | Builds `followedActorSet` from follow rows (is_active=true only) |
| `model/feedPrivateVisibility.model.js` | Pure rule: private account → must be owner OR following |
| `model/enrichMentionRows.model.js` | Joins raw mention edges with hydrated actor presentations |
| `model/buildMentionMaps.model.js` | Builds `{ [postId]: { [handleKey]: actorPayload } }` for renderer |
| `model/inferMediaType.model.js` | URL extension-based media type inference (video/image fallback) |

**Controllers:** NONE — pipeline has no controller layer; `fetchFeedPagePipeline` acts as a service-level coordinator.

**Services:** NONE — pipeline calls engines directly.

**Adapters (2 files):**

| File | Exposes | Purpose |
|---|---|---|
| `adapters/feedCache.adapter.js` | `invalidateFeedBlockCache`, `invalidateFeedFollowCache`, `invalidateActorBundleEntry` | Cache bust surface for other features |
| `adapters/hooks/useFeed.adapter.js` | `useFeed` (re-export) | Legacy adapter — exposes hook for cross-feature consumption |

**Hooks (4 files):**

| File | Consumer | Purpose |
|---|---|---|
| `hooks/useFeed.js` | `CentralFeedScreen`, `PostFeed.screen` | Manual fetch loop; direct pipeline consumer |
| `hooks/useCentralFeed.js` | `CentralFeedScreen` (new path) | React Query wrapper; same pipeline via `fetchCentralFeedPage` |
| `hooks/useCentralFeedActions.js` | Feed UI | Optimistic action handlers (block, hide, react) |
| `hooks/useFeedInfiniteScroll.js` | Feed UI | Scroll observer that triggers `fetchPosts()` |

**Screens (boundary — not owned by pipeline module):**
- `screens/CentralFeedScreen.jsx` — uses `useFeed` or `useCentralFeed`
- `screens/DebugFeedFilterPanel.jsx` — debug only
- `screens/DebugPrivacyPanel.jsx` — debug only

**Query Layer (1 file):**
- `queries/fetchCentralFeedPage.js` — queryFn, 15s timeout wrapper, multi-page drain (MAX 2 pages per call, target 3 visible on first page)

---

## PIPELINE EXECUTION FLOW

```
ENTRY: useFeed.js OR useCentralFeed.js → fetchCentralFeedPage.js → fetchFeedPagePipeline()

PHASE 1 — INITIAL FETCH (readFeedPostsPage):
  feed.read.posts.dal.js
    → vc.posts WHERE realm_id=:realmId AND deleted_at IS NULL
    → ORDER BY created_at DESC LIMIT pageSize+1
    → cursor: created_at (LT for pagination)
    → returns: pageRows, hasMoreNow, nextCursorCreatedAt
    → NOTE: no viewerActorId filter at DB level; no RLS viewer guard confirmed

PHASE 2 — PARALLEL ENRICHMENT (9 concurrent DAL calls):
  ┌─ readPostMediaMap(pagePostIds)               → vc.post_media [60s cache]
  ├─ fetchRawPostMentionEdgesDAL(pagePostIds)     → vc.post_mentions [conditional: only if @ in text]
  ├─ readHiddenPostsForViewer(viewerActorId,ids)  → moderation.actions
  ├─ readActorsBundle(actorIds)                   → vc.actors + profiles + actor_privacy_settings + vport.profiles [30s cache]
  ├─ readFeedBlockRowsDAL(viewerActorId,actorIds) → moderation.blocks [60s cache]
  ├─ readFeedFollowRowsDAL(viewerActorId,actorIds)→ vc.actor_follows [60s cache; full viewer graph]
  ├─ readCommentCountsBatch(pagePostIds)          → vc.post_comments
  ├─ readViewerReactionsBatch(pagePostIds,actorId)→ vc.post_reactions
  └─ readReactionCountsBatch(pagePostIds)         → vc.post_reactions + vc.post_rose_gifts [2 parallel sub-queries]

  TOTAL DB ROUND-TRIPS PER PAGE: 9 parallel + up to 2 serial (mention hydration) = 11 max

PHASE 3 — VISIBILITY MODEL ASSEMBLY:
  buildBlockedActorSetModel(viewerActorId, blockRows) → Set<actorId>
  buildFollowedActorSetModel(followRows)              → Set<actorId>

PHASE 4 — OPTIONAL MENTION ENRICHMENT (serial, conditional):
  IF mentionEdges.length > 0:
    hydrateAndReturnSummaries({ actorIds: mentionedActorIds })  ← engines/hydration
    enrichMentionRows(mentionEdges, presentations)
  buildMentionMaps(enrichedMentionRows) → { [postId]: { [handle]: actorPayload } }

PHASE 5 — NORMALIZATION:
  normalizeFeedRows({
    pageRows, actorMap, profileMap, vportMap,
    blockedActorSet, followedActorSet, viewerActorId,
    hiddenByMeSet, mediaMap, mentionMapsByPostId,
    commentCountsMap, viewerReactionsMap, reactionCountsMap,
    includeDebug: true
  })
  → resolveFeedRowVisibilityModel() per row:
      BLOCKED?          → visible:false, reason:'blocked_actor'
      ACTOR MISSING?    → visible:false, reason:'missing_actor'
      VPORT ACTOR:
        vportEntry null → visible:false, reason:'missing_vport_profile'  ← VEN-FEED-005
        inactive/deleted→ visible:false, reason:'inactive_vport'
        otherwise       → visible:true,  reason:'visible_vport'
      USER ACTOR:
        profile missing → visible:false, reason:'missing_profile'
        private + not owner + not following → visible:false, reason:'private_not_following'
        otherwise       → visible:true,  reason:'visible_user'

OUTPUT:
  { normalized, debugRows, hasMoreNow, nextCursorCreatedAt, hiddenByMeSet, actors, profileMap, vportMap }
```

---

## CACHE ARCHITECTURE

| Cache | Location | TTL | Key | Scope | Invalidation |
|---|---|---|---|---|---|
| bundleCache | feed.read.actorsBundle.dal.js | 30s | `actor:{actorId}` | per-actor | `invalidateActorBundleEntry(actorId)` or `invalidateActorsBundleCache()` |
| blockCache | feed.read.blockRows.dal.js | 60s | `{viewerActorId}` | per-viewer | `invalidateFeedBlockCache(viewerActorId)` |
| followCache | feed.read.followRows.dal.js | 60s | `{viewerActorId}` | per-viewer; full graph | `invalidateFeedFollowCache(viewerActorId)` |
| mediaCache | feed.read.media.dal.js | 60s | `{postId}` | per-post | `invalidatePostMediaCache(postId)` |
| React Query | useCentralFeed.js | 30s staleTime | queryKeys.centralFeed(actorId, realmId) | per-viewer+realm | `queryClient.resetQueries({ queryKey })` on fresh fetch |

**Cache Risk:** 60s stale block/follow cache may serve incorrect visibility decisions after a block or unfollow within the TTL window. (BW-FEED-006, OPEN)

---

## WRITE SURFACE INVENTORY

**Core Pipeline: ZERO writes.** This is a pure read pipeline.

**Adjacent writes (not in pipeline scope):**
- `feedWelcomeCard.dal.js` — writes to `vc.actor_onboarding_steps` (welcome card controller path)
- `feed.posts.dal.js` — writes for post actions (not in pipeline flow)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Pure read pipeline, feed assembly | — |
| Owner defined | PASS | VCSM:feed | — |
| Entry points mapped | PASS | fetchFeedPagePipeline, fetchCentralFeedPage | — |
| Controllers present/delegated | PASS | Pipeline.js acts as coordinator | No explicit controller layer — acceptable for pipeline arch |
| DAL/repository present | PASS | 10 DAL files, all verified | No UUID validation in hiddenPosts + viewerReactions DALs |
| Models/transformers present | PASS | 8 model files, all pure functions | — |
| Hooks/view models present | PASS | useFeed.js, useCentralFeed.js | Dual hook paths (legacy + RQ) — no deprecation signal |
| Screens/components present | PARTIAL | Screens exist outside pipeline module | Screen layer not owned by this module — acceptable |
| Services/adapters present | PASS | feedCache.adapter.js exposes cache bust | — |
| Database objects mapped | PASS | 11 tables across 4 schemas | vc, moderation, vport, public (profiles) |
| Authorization path mapped | PARTIAL | RLS assumed; no app-layer auth in posts DAL | No viewerActorId guard in readFeedPostsPage |
| Cache/runtime behavior mapped | PASS | 4 TTL caches + React Query documented | 60s stale window risk documented |
| Error/loading/empty states mapped | PARTIAL | Loading/hasMore in hooks | Empty state handling not verified at screen level |
| Documentation linked | PARTIAL | BEHAVIOR.md STUB; SECURITY.md STUB | Need active BEHAVIOR.md (this run produces it) |
| Tests/validation noted | FAIL | No test files found for pipeline module | CRITICAL — no regression coverage |
| Native parity noted | N/A | Web-only feature | — |
| Engine dependencies mapped | PASS | hydration engine confirmed | engines/media NOT used — media is own DAL |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/hydration | engine | pipeline → engine | YES — engine import | `hydrateAndReturnSummaries`, `hydrateActorsByIds` |
| @/state/actors/actorStore | store | hook → store | YES — Zustand store | Actor upserts after each page |
| @/services/supabase/supabaseClient | service | dal → service | YES | All DALs use shared client |
| @/services/supabase/vportClient | service | dal → service | YES | actorsBundle uses vportSchema for vport.profiles |
| @/shared/lib/ttlCache | shared | dal → shared | YES | TTL cache utility |
| @/services/supabase/postgrestSafe | service | dal → service | YES | isUuid() UUID validation |
| @debuggers/feed | debugger | pipeline → dev-only | CONDITIONAL | wrapDAL/recordStep; guarded by DEV check on assignment |
| @tanstack/react-query | external | hook → external | YES | useInfiniteQuery in useCentralFeed |
| VCSM:feed/queries | internal | hook → query | YES | fetchCentralFeedPage consumed by useCentralFeed |
| VCSM:feed/pipeline | internal | query → pipeline | YES | fetchCentralFeedPage calls fetchFeedPagePipeline |

**No cross-feature DAL imports detected.** ✓
**No engine bypass patterns detected.** ✓

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.posts | read | VCSM:feed | pipeline | No viewerActorId filter at DB — relies on RLS |
| vc.post_media | read | VCSM:feed | pipeline (mediaCache) | Cache shared across pages |
| vc.post_comments | read | VCSM:feed | pipeline | Count only — no content read |
| vc.post_reactions | read | VCSM:feed | pipeline | Both viewer+aggregate reads in same page call |
| vc.post_rose_gifts | read | VCSM:feed | pipeline | Part of reaction count aggregation |
| vc.post_mentions | read | VCSM:feed | pipeline | Conditional fetch — no auth check |
| vc.actors | read | VCSM:auth/identity | pipeline | Reads is_deleted actors excluded |
| vc.actor_privacy_settings | read | VCSM:identity | pipeline | Part of actorsBundle; determines is_private |
| vc.actor_follows | read | VCSM:identity | pipeline (followCache) | Full follow graph cached per-viewer |
| moderation.blocks | read | VCSM:block | pipeline (blockCache) | Block state governs visibility |
| moderation.actions | read | VCSM:moderation | pipeline | Hidden post suppression |
| vport.profiles (vportClient) | read | VCSM:vport | pipeline | Owner-only RLS — null for non-owners → VEN-FEED-005 |
| public.profiles | read | VCSM:auth | pipeline | Display name, username, photo |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry exists | PASS | CentralFeedScreen → useFeed/useCentralFeed | — |
| Loading state | PASS | loading flag in both hooks | — |
| Empty state | PARTIAL | `firstBatchReady` flag exists | Screen-level empty state not verified |
| Error state | PARTIAL | catch block in useFeed sets hasMore:false | Error surfacing to UI not verified |
| Auth/owner gates | PARTIAL | viewerActorId guard in hooks; not in posts DAL | RLS assumed in posts read |
| Cache behavior | PASS | 4 TTL caches + React Query fully mapped | 60s stale window for block/follow |
| Runtime dependencies | PASS | All 4 caches + React Query + Zustand store mapped | — |
| Hot paths identified | PASS | 9-parallel-DAL call is the hot path per page | No pagination cap on visible feed size |
| LOKI/KRAVEN recommended | YES | 9 parallel DAL calls + full follow graph load | Performance audit recommended |
| Dual hook paths | WARN | useFeed.js and useCentralFeed.js both active | Migration to useCentralFeed not formalized |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan BEHAVIOR.md | `modules/pipeline/BEHAVIOR.md` | STUB — superseded by this run |
| Logan ARCHITECTURE.md | `modules/pipeline/ARCHITECTURE.md` | STUB — superseded by this run |
| Security audit | `modules/pipeline/SECURITY.md` | STUB — VENOM+BW findings attributed, ELEKTRA NEVER RUN |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | N/A (no schema migrations in this module) |
| Native transfer audit | — | N/A |
| Engine audit | `engines/hydration/` | PRESENT (hydration engine) |

---

## MODULE BOUNDARY WARNINGS

### BOUNDARY-PIPELINE-001 — Dual Hook Paths

```
MODULE BOUNDARY WARNING
Location:    hooks/useFeed.js + hooks/useCentralFeed.js
Module:      VCSM:feed / pipeline
Current:     Two active hooks consuming the same pipeline — useFeed (manual) + useCentralFeed (React Query)
Expected:    Single canonical consumer with clear deprecation path
Risk:        MEDIUM — behavioral drift between hooks, duplicate actor upsert logic, no migration signal
Suggested:   Mark useFeed.js as @deprecated; formalize useCentralFeed.js as the canonical path
```

### BOUNDARY-PIPELINE-002 — @debuggers/feed Unconditional Import

```
MODULE BOUNDARY WARNING
Location:    pipeline/fetchFeedPage.pipeline.js (lines 22-23 import)
Module:      VCSM:feed / pipeline
Current:     import { wrapDAL, recordStep } from '@debuggers/feed' — unconditional at module top
Expected:    DEV-only imports must be conditional or confirmed tree-shaken
Risk:        LOW-MEDIUM — debugger module included in production bundle unless bundler eliminates it
Suggested:   Confirm Vite tree-shaking; if not confirmed, add dynamic import guard
```

### BOUNDARY-PIPELINE-003 — Raw vportId in Mention Route (Security + URL Contract)

```
MODULE BOUNDARY WARNING
Location:    model/buildMentionMaps.model.js line ~46
Module:      VCSM:feed / pipeline
Current:     makeActorRoute() generates /vport/${vportId} using raw UUID
Expected:    All public-facing routes must use human-readable slugs (no raw UUIDs)
Risk:        HIGH — violates platform URL contract (memory: no_raw_ids_in_urls)
Suggested:   Use vport slug from enriched mention data (row.slug) instead of vportId
```

### BOUNDARY-PIPELINE-004 — Missing UUID Validation in Two DALs

```
MODULE BOUNDARY WARNING
Location:    dal/feed.read.hiddenPosts.dal.js, dal/feed.read.viewerReactions.dal.js
Module:      VCSM:feed / pipeline
Current:     No isUuid() check on viewerActorId / actorId inputs
Expected:    All DALs accepting actor IDs must validate UUID format (see blockRows + followRows DALs)
Risk:        MEDIUM — malformed inputs could produce unexpected DB behavior or error leakage
Suggested:   Add isUuid(viewerActorId) guard at function entry (matching blockRows/followRows pattern)
```

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Test coverage — pipeline regression suite | CRITICAL | Zero tests for 9-DAL orchestration, visibility models, and normalization; bugs in these layers are silent | SPIDER-MAN / VCSM:feed |
| ELEKTRA source-to-sink trace | HIGH | Pipeline has 9 parallel DB reads + visibility models; ELEKTRA has never run on this module | ELEKTRA |
| Realm null guard in readFeedPostsPage | HIGH | null realmId exposes all realms to partially-onboarded users (VEN-FEED-006 OPEN) | VCSM:feed |
| UUID validation in hiddenPosts + viewerReactions DALs | MEDIUM | Inconsistent validation surface vs block/follow DALs | VCSM:feed |
| vport.profiles RLS clarification | MEDIUM | Owner-only RLS hides vport posts from non-owners in central feed (VEN-FEED-005 OPEN) | DB / VCSM:vport |
| useFeed.js deprecation signal | MEDIUM | Dual hook paths with no migration path; logic drift risk | VCSM:feed |
| @debuggers tree-shaking confirmation | LOW | Production bundle may include debugger instrumentation | VCSM:build |
| Unguarded console.log at pipeline line 137 | LOW | Fires in production when debugPostId matches (VEN-FEED-002 OPEN) | VCSM:feed |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P0 | Realm null guard in readFeedPostsPage | OPEN security finding VEN-FEED-006 — all-realm exposure | ELEKTRA → patch |
| P0 | Remove/guard console.log at pipeline line 137 | Production data leak (post ID + debug info) | Direct patch |
| P1 | Pipeline regression test suite | Zero coverage on critical orchestration path | SPIDER-MAN |
| P1 | UUID validation in hiddenPosts + viewerReactions | Consistency with block/follow DAL pattern | ELEKTRA → patch |
| P1 | vport.profiles RLS decision | VEN-FEED-005 OPEN — visibility correctness failure | DB → clarify policy |
| P1 | Raw vportId in mention routes | Violates platform URL contract | ELEKTRA → patch |
| P2 | useFeed.js deprecation | Dual hook path cleanup | WOLVERINE |
| P2 | @debuggers tree-shaking confirmation | Production bundle safety | LOKI / build audit |
| P3 | Follow cache full-graph fetch review | Memory + staleness trade-off worth documenting | KRAVEN |

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module:           VCSM:feed / pipeline
Classification:   MOSTLY INDEPENDENT
Reason:           All pipeline logic is self-contained (DAL, model, adapter layers fully owned).
                  Depends on engines/hydration for mention enrichment and actor background hydration.
                  Depends on Zustand actorStore for actor upserts (hook layer).
                  Both dependencies are through approved boundaries.
Blocking gaps:    Zero tests, two OPEN security findings, one URL contract violation.
```

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| VENOM | Verify ownership propagation, cache poisoning, realm guard, vport RLS — open findings |
| BLACKWIDOW | Adversarial exploitation of VEN-FEED-005 (vport null bundle), VEN-FEED-006 (realm null bypass) |
| ELEKTRA | Source-to-sink trace through all 9 DAL paths; patch proposals for P0/P1 findings |
| SPIDER-MAN | Generate pipeline regression test suite (zero coverage confirmed) |
| SENTRY | Architecture compliance — boundary and dependency validation |
| LOKI | Runtime trace of hot path (9-DAL parallel), debugger tree-shaking confirmation |
| KRAVEN | Follow full-graph cache memory/performance impact at scale |
| THOR | Release gate — three open security findings, zero tests block release readiness |

---

## SOURCE FILES READ

| Layer | File | Lines Verified |
|---|---|---|
| pipeline | `features/feed/pipeline/fetchFeedPage.pipeline.js` | 1–176 |
| query | `features/feed/queries/fetchCentralFeedPage.js` | 1–108 |
| hook | `features/feed/hooks/useFeed.js` | 1–277 |
| hook | `features/feed/hooks/useCentralFeed.js` | 1–292 |
| dal | `features/feed/dal/feed.read.posts.dal.js` | 1–53 |
| dal | `features/feed/dal/feed.read.actorsBundle.dal.js` | 1–162 |
| dal | `features/feed/dal/feed.read.blockRows.dal.js` | 1–48 |
| dal | `features/feed/dal/feed.read.followRows.dal.js` | 1–45 |
| dal | `features/feed/dal/feed.read.hiddenPosts.dal.js` | 1–39 |
| dal | `features/feed/dal/feed.read.media.dal.js` | 1–66 |
| dal | `features/feed/dal/feed.mentions.dal.js` | 1–21 |
| dal | `features/feed/dal/feed.read.commentCounts.dal.js` | 1–36 |
| dal | `features/feed/dal/feed.read.reactionCounts.dal.js` | 1–62 |
| dal | `features/feed/dal/feed.read.viewerReactions.dal.js` | 1–33 |
| model | `features/feed/model/normalizeFeedRows.model.js` | 1–104 |
| model | `features/feed/model/feedRowVisibility.model.js` | 1–115 |
| model | `features/feed/model/feedBlockVisibility.model.js` | 1–33 |
| model | `features/feed/model/feedFollowVisibility.model.js` | 1–23 |
| model | `features/feed/model/feedPrivateVisibility.model.js` | 1–10 |
| model | `features/feed/model/enrichMentionRows.model.js` | 1–23 |
| model | `features/feed/model/buildMentionMaps.model.js` | 1–72 |
| model | `features/feed/model/inferMediaType.model.js` | 1–7 |
| adapter | `features/feed/adapters/feedCache.adapter.js` | 1–3 |
| adapter | `features/feed/adapters/hooks/useFeed.adapter.js` | 1–1 |

---

## CONFIRMED TODOS FROM PRIOR STUB

| Prior TODO | Status |
|---|---|
| Confirm exact 9 parallel DAL calls in pipeline | CONFIRMED: 9 parallel + 1 conditional mention = up to 10 |
| Confirm cursor field (created_at?) | CONFIRMED: `created_at` (LT comparison) |
| Confirm vport.profiles RLS null bundle (VEN-FEED-005) | CONFIRMED: null vportEntry → visible:false, reason:'missing_vport_profile' |
| Confirm all 11 model file names | CONFIRMED: 8 model files (not 11) |
| Verify @debuggers/feed tree-shaking | UNRESOLVED: import unconditional, calls conditionally assigned — bundler confirmation needed |
| Unguarded console.log at line 137 | CONFIRMED: `if (debugPostId && ...)` guard is present but NOT wrapped in DEV check |
| engines/media usage | CORRECTED: readPostMediaMap is feed's own DAL, NOT engines/media |
