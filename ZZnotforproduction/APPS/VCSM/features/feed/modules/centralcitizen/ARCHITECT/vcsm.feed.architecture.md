---
name: vcsm.feed.architecture.2026-06-06
description: ARCHITECT V2 full module architecture run — VCSM:feed — 2026-06-06
metadata:
  type: architect-run-output
  owner: ARCHITECT
  run-date: 2026-06-06
  scanner-version: 1.2.0
  branch: vport-booking-feed-security-updates
---

# ARCHITECT RUN — VCSM:feed — 2026-06-06

**Run type:** Full module architecture + behavior consistency + DB read audit
**Branch:** vport-booking-feed-security-updates
**Delta from:** 2026-06-04 run

---

## LAYER MAP (Source-Verified)

```
DAL (14 production + 1 DEV-only)
 → feed.read.posts.dal.js           vc.posts (primary read, cursor-paginated)
 → feed.read.actorsBundle.dal.js    vc.actors + profiles + vport.profiles (30s TTL)
 → feed.read.media.dal.js           vc.post_media (60s TTL per-post)
 → feed.read.blockRows.dal.js       moderation.blocks (60s TTL)
 → feed.read.followRows.dal.js      vc.actor_follows (60s TTL, full viewer graph)
 → feed.read.hiddenPosts.dal.js     moderation.actions (hide/unhide latest-wins)
 → feed.read.commentCounts.dal.js   vc.post_comments (batched Map<id,n>)
 → feed.read.reactionCounts.dal.js  vc.post_reactions + vc.post_rose_gifts (parallel)
 → feed.read.viewerReactions.dal.js vc.post_reactions (actorId-scoped)
 → feed.read.viewerContext.dal.js   vc.actors + profiles (adult flag)
 → feed.mentions.dal.js             vc.post_mentions
 → feedWelcomeCard.dal.js           vc.actor_onboarding_steps (read + WRITE)
 → listActorPostsByActor.dal.js     vc.posts (actor-scoped; profiles SSOT)
 → feed.read.debugPrivacyRows.dal.j DEV-ONLY
 → feed.posts.dal.js                DEV-ONLY (guarded return []  in production)

Model (8)
 → normalizeFeedRows.model.js       Full row normalization + visibility filter
 → feedRowVisibility.model.js       Primary visibility gate (blocked/missing/private/vport)
 → feedBlockVisibility.model.js     buildBlockedActorSetModel
 → feedFollowVisibility.model.js    buildFollowedActorSetModel
 → feedPrivateVisibility.model.js   canViewPrivateFeedActorModel
 → inferMediaType.model.js          URL-based type inference
 → enrichMentionRows.model.js       Merge hydration into mention edges
 → buildMentionMaps.model.js        Map<postId, mentionMap>

Controller (4)
 → listActorPosts.controller.js     SSOT/LOCKED; shared with profiles
 → getFeedViewerContext.controller.js 2 sequential DAL calls (actors → profiles)
 → feedWelcomeCard.controller.js    Welcome card read/mark
 → getDebugPrivacyRows.controller.js DEV-ONLY

Pipeline (1)
 → fetchFeedPage.pipeline.js        9 parallel DALs via Promise.all; DEV wrapDAL profiler

Query (1)
 → fetchCentralFeedPage.js          React Query queryFn; while-loop sparse fill; 15s timeout

Hook (8)
 → useCentralFeed.js                CANONICAL: useInfiniteQuery (staleTime:30s, gcTime:10min)
 → useCentralFeedActions.js         Block/delete/follow/report/share action handlers
 → useFeed.js                       LEGACY: useState-based; still served via adapter
 → useFeed.utils.js                 withTimeout, preloadInitialMedia
 → useFeedConfirmToast.js           Confirm + toast state
 → useFeedInfiniteScroll.js         IntersectionObserver sentinel (600px rootMargin)
 → useFeedWelcomeCard.js            Welcome card visibility
 → useDebugPrivacyRows.js           DEV-ONLY

Component (4)
 → FeedConfirmModal.jsx
 → FeedSkeletonList.jsx
 → WelcomeFeedCard.jsx
 → welcomeFeedCard.styles.js

Screen (3)
 → CentralFeedScreen.jsx            PRIMARY authenticated feed
 → DebugFeedFilterPanel.jsx         DEV-ONLY
 → DebugPrivacyPanel.jsx            DEV-ONLY

Adapter (2)
 → feedCache.adapter.js             invalidateFeedBlockCache / invalidateFeedFollowCache / invalidateActorBundleEntry
 → hooks/useFeed.adapter.js         ⚠ Re-exports useFeed.js (LEGACY) — not updated to useCentralFeed
```

---

## DB READ AUDIT

| DAL | Schema | Table(s) | Cache | RLS Assumed | Notes |
|---|---|---|---|---|---|
| feed.read.posts.dal.js | vc | posts | NONE | YES | Cursor-paginated; deleted_at filter; realmId scoping |
| feed.read.actorsBundle.dal.js | vc / vport | actors + profiles + actor_privacy_settings + vport.profiles | 30s TTL per actor | YES | 3 parallel queries for uncached actors |
| feed.read.media.dal.js | vc | post_media | 60s TTL per post | YES | Empty-result cached to prevent refetch |
| feed.read.blockRows.dal.js | moderation | blocks | 60s TTL per viewer | YES | Full viewer block graph; filtered by current page actors |
| feed.read.followRows.dal.js | vc | actor_follows | 60s TTL per viewer | YES | Full viewer follow graph (not page-scoped) |
| feed.read.hiddenPosts.dal.js | moderation | actions | NONE | YES | Latest-wins hide/unhide; scoped to viewer+postIds |
| feed.read.commentCounts.dal.js | vc | post_comments | NONE | YES | Single batched query; JS-side count aggregation |
| feed.read.reactionCounts.dal.js | vc | post_reactions + post_rose_gifts | NONE | YES | 2 parallel queries; Map<postId,{like,dislike,rose}> |
| feed.read.viewerReactions.dal.js | vc | post_reactions | NONE | YES | actorId + postIds scoped |
| feed.read.viewerContext.dal.js | vc / public | actors + profiles | NONE | YES | 2 sequential calls; adult flag resolution |
| feed.mentions.dal.js | vc | post_mentions | NONE | YES | Only called when pageRows contains @ chars |
| feedWelcomeCard.dal.js (read) | vc | actor_onboarding_steps | NONE | YES | Single actor+step_key lookup |
| listActorPostsByActor.dal.js | vc | posts | NONE | YES | Actor-scoped; profiles domain SSOT |

**Write surfaces:**
| DAL | Schema | Table | Operation | Guard |
|---|---|---|---|---|
| feedWelcomeCard.dal.js | vc | actor_onboarding_steps | upsert | actorId required check only; no ownership assertion |

**N+1 risk assessment:** NONE DETECTED. Pipeline uses `Promise.all` for all 9 parallel DAL calls per page. No per-post loops that call DALs individually. Comment counts, reaction counts, and viewer reactions are all batched.

**Duplicate read risk:** LOW. Actor bundle has 30s TTL. Block and follow graphs cached for 60s per viewer. Repeated actor IDs across pagination pages hit cache on subsequent pages.

---

## PIPELINE EXECUTION FLOW

```
CentralFeedScreen
  └─ useCentralFeed(actorId, realmId)
       └─ useInfiniteQuery → fetchCentralFeedPage({ actorId, realmId, pageParam })
            └─ while(hasMore && pagesFetched < 2):
                 fetchFeedPagePipeline({ viewerActorId, realmId, cursorCreatedAt, pageSize })
                   ├─ readFeedPostsPage()                     [SEQUENTIAL — gets post IDs]
                   └─ Promise.all([                           [9 PARALLEL DALs]
                        readPostMediaMap(postIds),
                        fetchRawPostMentionEdgesDAL(postIds), [CONDITIONAL — only if @ in text]
                        readHiddenPostsForViewer({...}),
                        readActorsBundle(actorIds),
                        readFeedBlockRowsDAL({...}),
                        readFeedFollowRowsDAL({...}),
                        readCommentCountsBatch(postIds),
                        readViewerReactionsBatch({...}),
                        readReactionCountsBatch(postIds),
                      ])
                   └─ [CONDITIONAL] hydrateAndReturnSummaries for mention actors
                   └─ normalizeFeedRows() → { normalized, debugRows }
```

Total DB round-trips per page: 1 (posts) + up to 9 (parallel) + up to 1 (mentions hydration) = max 11 round-trips, but 9 run in parallel so wall-clock is dominated by the slowest parallel leg.

---

## BEHAVIOR CONSISTENCY CHECK

```
Behavior Consistency Check — feed
=======================================
BEHAVIOR.md present: YES
Status: PLACEHOLDER — no contract content

Check A (Source without behavior): FAIL
  Source is fully developed (45 files, 4 controllers, 9-DAL pipeline, 4 visibility models).
  BEHAVIOR.md has been a placeholder since at least 2026-06-04. No happy paths, edge cases,
  or behavioral contracts have been written.

Check B (Behavior without source): PASS
  No behavior claims exist to contradict source.

Check C (§13 engine consistency): PASS
  engines/hydration — hydrateAndReturnSummaries in pipeline; hydrateActorsByIds in useCentralFeed ✓
  engines/identity  — readViewerActorIdentityDAL in getFeedViewerContext.controller ✓
  engines/media     — readPostMediaMap in pipeline ✓ (NOTE: this is a feed DAL, not an engine import)
  engines/profile   — readProfileAdultFlagDAL in getFeedViewerContext.controller ✓

Check D (§6 data change consistency): PASS
  1 write surface: vc.actor_onboarding_steps (markWelcomeFeedCardSeenDAL) ✓
  No undeclared writes found.
```

---

## CRITICAL FINDINGS (Source-Verified)

### FINDING-001 — ADAPTER BOUNDARY FROZEN ON LEGACY HOOK
- **Severity:** HIGH
- **File:** apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js
- **Evidence:** `export * from "@/features/feed/hooks/useFeed";`
- **Issue:** The adapter re-exports the legacy state-based `useFeed.js`, not the canonical `useCentralFeed.js`. Any external feature that consumes `useFeed.adapter.js` receives the legacy implementation. This is an adapter boundary integrity failure — the canonical hook migrated but the adapter boundary did not.
- **Route:** IRONMAN

### FINDING-002 — BEHAVIOR.md IS A PLACEHOLDER (HIGH, PERSISTENT)
- **Severity:** HIGH (persistent from 2026-06-04)
- **File:** ZZnotforproduction/APPS/VCSM/features/feed/BEHAVIOR.md
- **Evidence:** Status: PLACEHOLDER — "Behavior contract pending source review."
- **Issue:** The most complex feature in the social layer has no documented behavioral contract. Visibility rules, pagination logic, welcome card conditions, and the dual-hook migration state are all undocumented.
- **Route:** LOGAN

### FINDING-003 — ZERO TESTS (HIGH, PERSISTENT)
- **Severity:** HIGH (persistent from 2026-06-04)
- **Evidence:** 0 test files found under apps/VCSM/src/features/feed/
- **Issue:** The 9-DAL parallel pipeline, 4 visibility models, mention hydration chain, and normalizeFeedRows model have no unit or integration test coverage.
- **Route:** SPIDER-MAN

### FINDING-004 — listActorPosts.controller HAS NO APP-LAYER AUTH ASSERTION
- **Severity:** MEDIUM (persistent)
- **File:** apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js
- **Evidence:** Controller receives `actorId` + `viewerActorId` but performs no ownership check. Delegates entirely to Supabase RLS.
- **Issue:** This controller is SSOT for profile post reads and is consumed cross-feature. No app-layer assertion verifies that `viewerActorId` matches the authenticated session.
- **Route:** VENOM

### FINDING-005 — debugPostId PARAMETER ORPHANED IN PIPELINE
- **Severity:** LOW
- **File:** apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js
- **Evidence:** Function signature includes `debugPostId` parameter. fetchCentralFeedPage (the only caller) never passes it. The conditional block at line 136-141 is DEV-guarded and will never execute in the production call path.
- **Issue:** Dead parameter adds noise; console.log IS DEV-guarded (correction from prior ARCHITECT report which said it was not).
- **Route:** IRONMAN

---

## CORRECTION FROM PRIOR RUN (2026-06-04)

| Prior Finding | Correction |
|---|---|
| "Unguarded console.log in fetchFeedPage.pipeline.js line 137 fires in production" | INCORRECT. Source confirms: `if (import.meta.env.DEV && debugPostId && pagePostIds.includes(debugPostId))` — fully DEV-guarded. |
| Total source files: 46 | CORRECTED: 45 files |
| "feeds.posts.dal.js counted as production DAL" | CORRECTED: DEV-only, guarded by `if (!import.meta.env.DEV) return []` |

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module:          feed
Classification:  MOSTLY INDEPENDENT
Reason:          Clear ownership, entry points, full data access layer, and dependency
                 boundaries are present. Minor gaps: BEHAVIOR.md is placeholder,
                 0 tests, adapter boundary frozen on legacy hook, listActorPosts
                 shared cross-feature without a formal adapter.
Blocking gaps:   BEHAVIOR.md contract, useFeed.adapter.js boundary fix
```

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## BUILD PRIORITY

| Priority | Work Needed | Route |
|---|---|---|
| P1 | Write BEHAVIOR.md contract | LOGAN |
| P1 | Fix useFeed.adapter.js to re-export useCentralFeed | IRONMAN |
| P2 | Add pipeline + model + visibility tests | SPIDER-MAN |
| P3 | Complete dual hook migration (remove useFeed.js) | IRONMAN |
| P3 | Remove orphaned debugPostId parameter from pipeline | IRONMAN |
| P4 | VENOM audit on listActorPosts auth surface | VENOM |
