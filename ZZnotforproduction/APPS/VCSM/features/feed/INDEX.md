---
name: vcsm.feed.index
description: VCSM feed feature source inventory — rebuilt by ARCHITECT V2 2026-06-06
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-06
---

# INDEX — VCSM / features / feed

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-06
**Scanner version:** 1.2.0

## Source Inventory

| Layer | File | Notes |
|---|---|---|
| DAL | feed.mentions.dal.js | vc.post_mentions read; fetchRawPostMentionEdgesDAL |
| DAL | feed.posts.dal.js | DEV-ONLY (guarded by !DEV return []); diagnostics only |
| DAL | feed.read.actorsBundle.dal.js | 30s TTL cache; 3 parallel resolves (actors+profiles+vports) |
| DAL | feed.read.blockRows.dal.js | 60s TTL cache; moderation.blocks read |
| DAL | feed.read.commentCounts.dal.js | Batched; vc.post_comments read; Map<postId,number> |
| DAL | feed.read.debugPrivacyRows.dal.js | DEV-ONLY; privacy debug panel |
| DAL | feed.read.followRows.dal.js | 60s TTL cache; vc.actor_follows read (full viewer graph) |
| DAL | feed.read.hiddenPosts.dal.js | moderation.actions read; latest-wins hide/unhide resolution |
| DAL | feed.read.media.dal.js | 60s TTL cache per post; vc.post_media read |
| DAL | feed.read.posts.dal.js | PRIMARY: vc.posts read; cursor-based pagination by created_at |
| DAL | feed.read.reactionCounts.dal.js | 2 parallel queries: vc.post_reactions + vc.post_rose_gifts |
| DAL | feed.read.viewerContext.dal.js | vc.actors + profiles reads; adult flag resolution |
| DAL | feed.read.viewerReactions.dal.js | vc.post_reactions read; actorId-scoped |
| DAL | feedWelcomeCard.dal.js | READ+WRITE; vc.actor_onboarding_steps |
| DAL | listActorPostsByActor.dal.js | vc.posts read; actor-scoped; used by profiles domain (SSOT) |
| Model | buildMentionMaps.model.js | Map<postId, mentionMap> builder |
| Model | enrichMentionRows.model.js | Merges hydration presentations into mention edges |
| Model | feedBlockVisibility.model.js | buildBlockedActorSetModel |
| Model | feedFollowVisibility.model.js | buildFollowedActorSetModel |
| Model | feedPrivateVisibility.model.js | canViewPrivateFeedActorModel |
| Model | feedRowVisibility.model.js | resolveFeedRowVisibilityModel — primary visibility gate |
| Model | inferMediaType.model.js | URL-based media type inference |
| Model | normalizeFeedRows.model.js | Full normalization + visibility filter + actor/media/reaction merge |
| Controller | feedWelcomeCard.controller.js | Welcome card read/write controller |
| Controller | getDebugPrivacyRows.controller.js | DEV-ONLY debug controller |
| Controller | getFeedViewerContext.controller.js | Adult flag resolution (2 sequential DAL calls) |
| Controller | listActorPosts.controller.js | SSOT/LOCKED; shared with profiles domain |
| Pipeline | fetchFeedPage.pipeline.js | 9-parallel-DAL orchestrator; DEV wrapDAL profiler |
| Query | fetchCentralFeedPage.js | React Query queryFn; while-loop page fill; 15s timeout |
| Hook | useCentralFeed.js | CANONICAL: useInfiniteQuery; staleTime:30s, gcTime:10min |
| Hook | useCentralFeedActions.js | Block/delete/follow/report/share actions |
| Hook | useDebugPrivacyRows.js | DEV-ONLY debug hook |
| Hook | useFeed.js | LEGACY: useState-based; still served via adapter |
| Hook | useFeed.utils.js | withTimeout, preloadInitialMedia utilities |
| Hook | useFeedConfirmToast.js | Confirm modal + toast state manager |
| Hook | useFeedInfiniteScroll.js | IntersectionObserver sentinel; 600px rootMargin |
| Hook | useFeedWelcomeCard.js | Welcome card visibility state |
| Component | FeedConfirmModal.jsx | Confirm dialog for destructive actions |
| Component | FeedSkeletonList.jsx | Skeleton loader (initial load) |
| Component | WelcomeFeedCard.jsx | Onboarding welcome card |
| Component | welcomeFeedCard.styles.js | Style object for WelcomeFeedCard |
| Screen | CentralFeedScreen.jsx | Primary authenticated feed screen |
| Screen | DebugFeedFilterPanel.jsx | DEV-ONLY filter debug panel |
| Screen | DebugPrivacyPanel.jsx | DEV-ONLY privacy debug panel |
| Adapter | feedCache.adapter.js | Exposes invalidateFeedBlockCache, invalidateFeedFollowCache, invalidateActorBundleEntry |
| Adapter | hooks/useFeed.adapter.js | Re-exports useFeed.js (LEGACY — NOT updated to useCentralFeed) |

**Total source files:** 45
**Production DALs:** 14 (feed.posts.dal.js is DEV-only)
**Tests:** 0

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| upsert | vc | actor_onboarding_steps | markWelcomeFeedCardSeenDAL |

## Security-Sensitive Surfaces

The single write surface (`vc.actor_onboarding_steps`) marks a welcome card as seen for a given actor. This is low-sensitivity — it records a UI onboarding state, not financial, identity, or moderation data. However, `actorId` is the only input and should be asserted to match the authenticated session at the controller level. Current implementation delegates this check to RLS.

**listActorPosts.controller** has no explicit app-layer authorization assertion — it passes `actorId` directly to the DAL and relies on Supabase RLS for post visibility enforcement. This is a moderate security surface since it is consumed cross-feature by profiles.

## Engine Dependencies

- hydration — `hydrateAndReturnSummaries` in fetchFeedPage.pipeline.js; `hydrateActorsByIds` in useCentralFeed.js
- identity — `readViewerActorIdentityDAL` in getFeedViewerContext.controller.js
- media — `readPostMediaMap` in fetchFeedPage.pipeline.js
- profile — `readProfileAdultFlagDAL` in getFeedViewerContext.controller.js

## Routes

No routes in route-map for this feature. CentralFeedScreen is mounted by the app shell navigation layer, not via a declared feature route.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (placeholder — no contract content) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
