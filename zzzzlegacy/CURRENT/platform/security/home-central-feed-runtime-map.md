# HOME CENTRAL FEED — DEEP RUNTIME MAP

**Generated:** 2026-05-11
**Scope:** apps/VCSM — `/feed` route, `CentralFeedScreen.jsx`
**Method:** Static trace (STATICALLY TRACED unless marked INFERRED)
**ARCHITECT Note:** No application code was modified.

---

## Overview

**User Action:** Tap Home icon in BottomNavBar
**Entry Point:** `shared/components/BottomNavBar.jsx` — `<Tab to="/feed" end />`
**Navigation Method:** React Router `NavLink` — client-side push via `to="/feed"`
**Route:** `/feed`
**Screen:** `features/feed/screens/CentralFeedScreen.jsx`
**Feature Owner:** feed

---

## HOOK CHAIN

| Hook | File | Purpose | Calls |
|---|---|---|---|
| `useAuth` | `app/providers/AuthProvider` | Gate: redirects to /login if no user | Supabase auth session |
| `useIdentity` | `features/identity/adapters/identity.adapter` | Gets actorId + realmId for current actor | identitySelection.store |
| `useActorConsistencyCheck` | `@debuggers/identity` (DEV only) | Validates actorId/kind consistency | DEV only — no prod reads |
| `useCentralFeed(actorId, realmId)` | `features/feed/hooks/useCentralFeed.js` | React Query infinite feed — owns all post state | fetchCentralFeedPage → pipeline |
| `useCentralFeedActions` | `features/feed/hooks/useCentralFeedActions.js` | Post action handlers: delete, follow, block, report, share | Multiple controllers |
| `useFeedConfirmToast` | `features/feed/hooks/useFeedConfirmToast.js` | Confirm modal + toast state manager | UI state only |
| `useFeedInfiniteScroll` | `features/feed/hooks/useFeedInfiniteScroll.js` | IntersectionObserver sentinel for pagination | Calls fetchPosts() |

---

## CONTROLLER CHAIN

| Controller | File | Purpose | Calls |
|---|---|---|---|
| `fetchCentralFeedPage` | `features/feed/queries/fetchCentralFeedPage.js` | React Query queryFn — orchestrates pipeline per page | fetchFeedPagePipeline |
| `fetchFeedPagePipeline` | `features/feed/pipeline/fetchFeedPage.pipeline.js` | Master feed page: runs DALs + models + normalization | 9-10 DAL reads + 3 models |
| `normalizeFeedRows` | `features/feed/model/normalizeFeedRows.model.js` | Applies visibility rules, hydrates actor data, shapes post cards | Model only |
| `buildBlockedActorSetModel` | `features/feed/model/feedBlockVisibility.model.js` | Computes blocked actor set from block rows | Model only |
| `buildFollowedActorSetModel` | `features/feed/model/feedFollowVisibility.model.js` | Computes followed actor set from follow rows | Model only |
| `buildMentionMaps` | `features/feed/model/buildMentionMaps.model.js` | Maps mention rows by post ID | Model only |

---

## DAL / READ CHAIN (per feed page)

### Step 1 — Serial: Posts Page (cursor-based pagination)

| DAL Method | File | Tables / Views / RPCs | Risk |
|---|---|---|---|
| `readFeedPostsPage` | `feed/dal/feed.read.posts.dal.js` | `vc.posts` (cursor paginated, realm-scoped) | Realm filter depends on `realmId` — null realmId reads all realms |

**Note:** This read is SERIAL — it runs first to get `pagePostIds` and `actorIds` for all subsequent parallel reads.

### Step 2 — Parallel (9 reads fired simultaneously via `Promise.all`)

| DAL Method | File | Tables / Views / RPCs | Risk |
|---|---|---|---|
| `readPostMediaMap` | `feed/dal/feed.read.media.dal.js` | `vc.post_media` | N/A |
| `fetchPostMentionRows` | `feed/dal/feed.mentions.dal.js` | `vc.post_mentions` + `identity.actor_directory` | Conditional — skipped if no `@` in post text |
| `readHiddenPostsForViewer` | `feed/dal/feed.read.hiddenPosts.dal.js` | `moderation.actions` | Viewer-scoped read |
| `readActorsBundle` | `feed/dal/feed.read.actorsBundle.dal.js` | `vc.actors` → `profiles` + `vc.actor_privacy_settings` + `vport.profiles` | **3 sub-queries per cache miss; 30s TTL cache** |
| `readFeedBlockRowsDAL` | `feed/dal/feed.read.blockRows.dal.js` | `moderation.blocks` | Viewer + actor-scoped |
| `readFeedFollowRowsDAL` | `feed/dal/feed.read.followRows.dal.js` | `vc.actor_follows` | Viewer + actor-scoped |
| `readCommentCountsBatch` | `feed/dal/feed.read.commentCounts.dal.js` | `vc.post_comments` | Batch by post ID array |
| `readViewerReactionsBatch` | `feed/dal/feed.read.viewerReactions.dal.js` | `vc.post_reactions` | Viewer + post ID array |
| `readReactionCountsBatch` | `feed/dal/feed.read.reactionCounts.dal.js` | `vc.post_reactions` + `post_rose_gifts` | Post ID array |

**Total tables touched per feed page: `vc.posts`, `vc.post_media`, `vc.post_mentions`, `moderation.actions`, `vc.actors`, `profiles`, `vc.actor_privacy_settings`, `vport.profiles`, `moderation.blocks`, `vc.actor_follows`, `vc.post_comments`, `vc.post_reactions`, `post_rose_gifts`**

**Unique schemas touched: `vc`, `vport`, `moderation`, `identity`**

---

## DATA FLOW

```
BottomNavBar taps /feed
  → React Router NavLink pushes /feed
  → CentralFeedScreen mounts

CentralFeedScreen mounts
  → useAuth() — Supabase auth session check
  → useIdentity() — reads identitySelection.store → actorId + realmId
  → useCentralFeed(actorId, realmId) activates

useCentralFeed
  → React Query useInfiniteQuery(queryKey: ['centralFeed', actorId, realmId])
  → queryFn: fetchCentralFeedPage({ actorId, realmId, pageParam: undefined })
  → staleTime: 30s — cache hit on back-navigation within 30s
  → enabled: !!actorId — feed disabled for unauthenticated users

fetchCentralFeedPage (initial load)
  → targetVisibleCount = 3 (first page fetches up to 3 visible posts)
  → loop: calls fetchFeedPagePipeline up to MAX_EMPTY_PAGES_PER_FETCH=2 times
  → 15s global timeout via withTimeout()

fetchFeedPagePipeline (per loop iteration)
  → SERIAL: readFeedPostsPage({ realmId, cursorCreatedAt, pageSize: 10 })
    → vc.posts: SELECT 11 rows (page + 1 for hasMore check), cursor DESC
  → PARALLEL: Promise.all(9 reads)
    → readPostMediaMap(pagePostIds)
    → fetchPostMentionRows(pagePostIds) [conditional on @ presence]
    → readHiddenPostsForViewer({ viewerActorId, postIds })
    → readActorsBundle(actorIds)  [30s TTL cache — cache hit skips 3 sub-queries]
    → readFeedBlockRowsDAL({ viewerActorId, actorIds })
    → readFeedFollowRowsDAL({ viewerActorId, actorIds })
    → readCommentCountsBatch(pagePostIds)
    → readViewerReactionsBatch({ postIds, actorId })
    → readReactionCountsBatch(pagePostIds)
  → Models: normalizeFeedRows, buildBlockedActorSetModel, buildFollowedActorSetModel, buildMentionMaps
  → Returns: { normalized, debugRows, hasMoreNow, nextCursorCreatedAt, actors, profileMap, vportMap }

Back in useCentralFeed after each page
  → upsertActors(actors) → actorStore Zustand cache
  → hydrateActorsByIds(staleOrMissing) → @hydration engine (background, non-blocking)
  → preloadInitialMedia(firstPage.posts) — first 3 post images (2.5s timeout)

UI renders
  → showInitialSkeleton = !firstBatchReady → FeedSkeletonList (3 skeleton cards)
  → firstBatchReady=true (on success or error) → hideLaunchSplash()
  → WelcomeFeedCard renders (actorId, kind)
  → posts.map → PostCard (from post.adapter)
  → IntersectionObserver sentinel → useFeedInfiniteScroll → fetchNextPage
```

---

## STATE / CACHE FLOW

| Store / Cache | File | Data Held | Risk |
|---|---|---|---|
| React Query cache | `queryClient` | Feed pages keyed by `['centralFeed', actorId, realmId]` | staleTime 30s, gcTime 10min — stale after 30s background |
| actorStore (Zustand) | `state/actors/actorStore.js` | Actor display data keyed by actorId | 5min TTL — central cache; corruption propagates |
| actorsBundleCache (TTL Map) | `feed/dal/feed.read.actorsBundle.dal.js` | Per-actor bundle: actor+profile+vport | 30s TTL — prevents page-to-page re-fetch |
| identitySelection.store (Zustand) | `state/identity/identitySelection.store.js` | Active actorId + kind | Critical — feeds actorId into feed query key |
| bootstrap.store (Zustand) | `bootstrap/bootstrap.store.js` | hydratedForActorId — gates badge polling | — |

---

## UI RENDER FLOW

| Component | File | Data Consumed | Notes |
|---|---|---|---|
| `FeedSkeletonList` | `feed/components/FeedSkeletonList.jsx` | None | Rendered while `!firstBatchReady` |
| `WelcomeFeedCard` | `feed/components/WelcomeFeedCard.jsx` | actorId, kind | Shows onboarding prompt for new users |
| `PostCard` (via adapter) | `post/adapters/postCard.adapter.js` | post (normalized shape) | Renders each feed post |
| `PostActionsMenu` (adapter) | `post/adapters/.../PostActionsMenu.adapter.js` | postMenu state | Long-press / 3-dot menu |
| `ReportModal` (adapter) | `moderation/adapters/.../ReportModal.adapter.js` | reportFlow state | Report post flow |
| `ShareModal` (adapter) | `post/adapters/.../ShareModal.adapter.js` | shareState | Share/copy link |
| `FeedConfirmModal` | `feed/screens/FeedConfirmModal.jsx` | confirmState | Delete/block confirmations |
| `Toast` | `shared/components/Toast` | toastMessage | Follow/unfollow feedback |
| `ReportedPostCover` (adapter) | `moderation/adapters/.../ReportThanksOverlay.adapter.js` | covered flag | Overlays reported posts |
| `PullToRefresh` | `shared/components/PullToRefresh` | onRefresh handler | Pull-down to refresh feed |

---

## LOADING / EMPTY / ERROR STATES

| State | Component/Behavior | Risk |
|---|---|---|
| Auth missing | `<Navigate to="/login" replace />` | Safe redirect |
| Identity loading | React Query disabled (enabled: !!actorId) — feed waits | INFERRED: skeleton remains until identity resolves |
| Initial load (firstBatchReady=false) | `FeedSkeletonList count={3}` | 3 skeleton cards shown |
| No posts after load | "No Vibes found." text | Simple empty state |
| More pages loading | "Loading more..." text + spinner | Shows during isFetchingNextPage |
| All pages loaded | "End of feed" message | — |
| Feed fetch timeout (15s) | React Query error state | INFERRED: no explicit UI for timeout — error state shows "No Vibes" |
| Network error | React Query retry=? | INFERRED: React Query defaults apply — needs LOKI verification |

---

## PERFORMANCE SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| 10+ Supabase round trips per feed page | 1 serial + 9 parallel reads per pipeline invocation | HIGH — even parallelized, 10 round trips is significant on slow connections | KRAVEN |
| Initial load loops: up to 2 pipeline calls | `fetchCentralFeedPage` loops up to `MAX_EMPTY_PAGES_PER_FETCH=2` | MEDIUM — filtered posts cause double-pipeline on first load | KRAVEN |
| actorsBundle: 3 sub-queries per uncached actor group | `readActorsBundle` fires vc.actors → profiles + privacy + vport.profiles in parallel, but only if uncached | LOW — 30s TTL cache reduces redundancy | — |
| Image preload on first batch | `preloadInitialMedia` fires 3 parallel image preloads (2.5s timeout) | LOW — race with render, not blocking | — |
| 15s feed fetch timeout | `withTimeout(FEED_FETCH_TIMEOUT_MS=15_000)` | MEDIUM — 15s timeout with no incremental feedback | KRAVEN |
| `vc.post_reactions` read twice per page | `readViewerReactionsBatch` (viewer reactions) + `readReactionCountsBatch` (counts, reads reactions + rose gifts) | MEDIUM — overlapping table access | KRAVEN |

---

## SECURITY / TRUST SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Realm-scoped feed | `readFeedPostsPage` filters by `realmId` (if provided) | INFERRED: if realmId=null, feed reads across ALL realms — needs Supabase RLS verification | VENOM |
| Block filter is client-computed | Block rows fetched and filtered in `buildBlockedActorSetModel` — not enforced at DB layer | MEDIUM — client-side filtering; blocked actor posts fetched then hidden | VENOM |
| Hidden posts fetched then overlaid | `readHiddenPostsForViewer` gets IDs; posts still fetched; covered by `ReportedPostCover` | LOW — data is fetched but not displayed; could leak metadata | VENOM |
| viewerIsAdult flag | `viewerIsAdult = identity?.kind === 'vport' ? true : (identity?.isAdult ?? null)` | MEDIUM — vport actors auto-treated as adults; isAdult from identity store | VENOM |

---

## DUPLICATE / N+1 RISK

| Risk | Evidence | Severity |
|---|---|---|
| `vc.post_reactions` read in 2 separate DAL calls | `readViewerReactionsBatch` + `readReactionCountsBatch` both touch `vc.post_reactions` | MEDIUM |
| `hydrateActorsByIds` called per page on stale actors | Background call fires per page load for missing/stale actors — separate from `readActorsBundle` | LOW — non-blocking, background |
| Double pipeline on first load when posts are filtered | `fetchCentralFeedPage` loop can run `fetchFeedPagePipeline` twice if first DB page yields <3 visible posts | MEDIUM |

---

## BOOTSTRAP DEPENDENCIES (always running while BottomNavBar is mounted)

These run on EVERY route — not just /feed — because BottomNavBar is always mounted:

| Process | Interval | Source | DB Table |
|---|---|---|---|
| Notification badge poll | 60s | `useNotificationUnread` → notifications adapter | notifications schema |
| Chat unread poll | 30s | `useChatUnread` → chat adapter inbox | chat schema |
| OneSignal push init | Once on identity hydration | `useOneSignalPush` | — |
| noti:refresh invalidation | On /notifications and /chat route enter | `BottomNavBar useEffect` | — |
