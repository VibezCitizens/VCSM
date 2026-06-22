---
title: Feed Module — Architecture
status: VERIFIED
feature: feed
module: feed
source: architect-verified
created: 2026-06-05
updated: 2026-06-05
source-path: apps/VCSM/src/features/feed/
architect-report: outputs/2026/06/05/ARCHITECT/2026-06-05_architect_feed-module.md
---

# feed / modules / feed — ARCHITECTURE

## Status

VERIFIED. Full source read completed 2026-06-05. All 45 source files read. Architecture is accurate.

---

## Layer Diagram

```
[Screen]
  CentralFeedScreen.jsx
    ↓
[Hooks]
  useCentralFeed.js (canonical — React Query infinite)
  useFeed.js (legacy — diagnostics/adapter only, NOT mounted in production screen)
  useCentralFeedActions.js
  useFeedInfiniteScroll.js
  useFeedWelcomeCard.js
  useFeedConfirmToast.js
    ↓
[Query Function]
  fetchCentralFeedPage.js  (React Query queryFn — wraps pipeline with retry loop)
    ↓
[Pipeline]
  fetchFeedPage.pipeline.js  (9 parallel DAL calls → model assembly)
    ↓
[DALs — 15 files]
  feed.read.posts.dal       → vc.posts
  feed.read.media.dal       → vc.post_media
  feed.read.hiddenPosts.dal → moderation.actions
  feed.read.actorsBundle.dal→ vc.actors + public.profiles + vc.actor_privacy_settings + vport.profiles
  feed.read.blockRows.dal   → moderation.blocks
  feed.read.followRows.dal  → vc.actor_follows
  feed.read.commentCounts.dal → vc.post_comments
  feed.read.viewerReactions.dal → vc.post_reactions
  feed.read.reactionCounts.dal → vc.post_reactions + vc.post_rose_gifts
  feed.mentions.dal         → vc.post_mentions [conditional]
  feed.read.viewerContext.dal → vc.actors + public.profiles
  feed.read.debugPrivacyRows.dal → vc.posts + actors + actor_privacy_settings + actor_owners + actor_follows
  feedWelcomeCard.dal       → vc.actor_onboarding_steps (READ + UPSERT)
  listActorPostsByActor.dal → vc.posts
  feed.posts.dal (legacy)   → vc.posts + post_comments [diagnostics only]
    ↓
[DB — 15 tables across 3 schemas]
  vc: posts, actors, post_media, post_mentions, post_comments, post_reactions,
      post_rose_gifts, actor_follows, actor_privacy_settings, actor_owners,
      actor_onboarding_steps
  moderation: blocks, actions
  public: profiles
  vport: profiles

[Controllers — 4 files, separate from pipeline]
  feedWelcomeCard.controller → feedWelcomeCard.dal
  getFeedViewerContext.controller → feed.read.viewerContext.dal
  listActorPosts.controller (SSOT/LOCKED) → listActorPostsByActor.dal
  getDebugPrivacyRows.controller → feed.read.debugPrivacyRows.dal

[Models — 8 pure files, zero DB access]
  normalizeFeedRows → feedRowVisibility → feedBlockVisibility
                                        → feedFollowVisibility
                                        → feedPrivateVisibility
                   → inferMediaType
  buildMentionMaps (pure)
  enrichMentionRows (pure)
```

---

## Dependency Map (Who Imports What)

### CentralFeedScreen.jsx imports:
- AuthProvider — session
- identity.adapter — actorId, realmId, isAdult
- useCentralFeed, useCentralFeedActions, useFeedConfirmToast, useFeedInfiniteScroll — feed hooks
- FeedConfirmModal, FeedSkeletonList, WelcomeFeedCard — feed components
- DebugPrivacyPanel, DebugFeedFilterPanel — feed debug screens
- PostCard.adapter, PostActionsMenu.adapter, ShareModal.adapter — post feature (via adapters)
- ReportModal.adapter, ReportedPostCover.adapter — moderation feature (via adapters)
- @debuggers/feed — stub in production

### useCentralFeed.js imports:
- fetchCentralFeedPage (queries) — queryFn
- actorStore — Zustand actor state
- @hydration — background actor hydration
- @debuggers/feed — stub in production

### useFeed.js imports:
- fetchFeedPagePipeline (pipeline) — manual cursor fetch
- actorStore — Zustand actor state
- @hydration — background actor hydration
- @debuggers/feed, feedProfiler — stubs in production

### useCentralFeedActions.js imports:
- useDeletePostAction.adapter, useFollowActorToggle.adapter, useFollowStatus.adapter,
  useBlockActorAction.adapter, useHidePostForActor.adapter, useReportFlow.adapter
  — all via adapter boundaries (cross-feature)

### fetchFeedPage.pipeline.js imports:
- All 9 primary read DALs
- feed.mentions.dal (conditional)
- normalizeFeedRows, buildBlockedActorSetModel, buildFollowedActorSetModel,
  enrichMentionRows, buildMentionMaps — model layer
- @hydration — mention actor resolution

---

## Write-Surface Inventory

| DAL | Schema | Table | Operation | Auth | Risk |
|---|---|---|---|---|---|
| feedWelcomeCard.dal — markWelcomeFeedCardSeenDAL | vc | actor_onboarding_steps | UPSERT (onConflict: actor_id,step_key) | RLS only (no app-layer ownership assertion) | MEDIUM — actorId is caller-supplied |

**Total write surfaces: 1**

---

## Route Inventory

The feed module does not own or declare any routes. CentralFeedScreen is mounted by the app shell.

Navigation targets (output only — not owned routes):
- `/login` — auth redirect
- `/settings?tab=profile` — welcome card CTA
- `/explore` — welcome card CTA
- `/post/:postId` — post card click
- `/post/:postId/edit` — edit action
- `/profile/:postActorId` — open profile from menu

---

## Ownership Boundaries

| Concern | Layer Owner |
|---|---|
| Auth gate | CentralFeedScreen |
| Identity resolution | identity adapter (cross-feature) |
| Feed pagination state | useCentralFeed (React Query) |
| Post-level actions | useCentralFeedActions (delegates to cross-feature adapters) |
| Scroll detection | useFeedInfiniteScroll |
| Confirm/toast UI state | useFeedConfirmToast |
| Welcome card | useFeedWelcomeCard + feedWelcomeCard.controller + feedWelcomeCard.dal |
| Viewer adult flag | getFeedViewerContext.controller |
| Actor post list SSOT | listActorPosts.controller (LOCKED — shared with profiles) |
| Data pipeline assembly | fetchFeedPage.pipeline |
| Visibility filtering | Model layer (pure — feedRowVisibility, feedBlockVisibility, feedFollowVisibility, feedPrivateVisibility) |
| Actor hydration | @hydration engine (cross-feature) |
| Actor store updates | actorStore Zustand (cross-feature state) |
| Cache invalidation (outbound) | feedCache.adapter.js |

---

## Visibility Model Summary

Four pure models compose the client-side visibility decision:

| Model | File | Rule |
|---|---|---|
| Block | feedBlockVisibility.model.js | Both sides of a block relationship are hidden (bidirectional) |
| Follow | feedFollowVisibility.model.js | Only active follows (`is_active=true`) count |
| Private | feedPrivateVisibility.model.js | Private actors visible only to owner or followers |
| Row | feedRowVisibility.model.js | Orchestrator — combines block/follow/private; distinguishes vport vs user actors |

Visibility reasons produced by feedRowVisibility:
`blocked_actor` | `missing_actor` | `missing_vport_profile` | `inactive_vport` | `visible_vport` | `missing_profile` | `private_not_following` | `visible_user`

---

## Data Flow — Central Feed Load (Full Path)

```
User → /feed
  → CentralFeedScreen mounts
  → [Auth] useAuth() — redirect /login if no user
  → [Identity] useIdentity() → actorId, realmId, isAdult
  → useCentralFeed(actorId, realmId)
  → useInfiniteQuery
  → fetchCentralFeedPage({ actorId, realmId, pageParam=undefined })
  → [Loop ≤2] fetchFeedPagePipeline
    → readFeedPostsPage() → vc.posts (cursor-paginated)
    → Promise.all (9 parallel):
        readPostMediaMap()        → vc.post_media
        fetchRawPostMentionEdges()→ vc.post_mentions [if "@" in text]
        readHiddenPostsForViewer()→ moderation.actions
        readActorsBundle()        → vc.actors + public.profiles + vc.actor_privacy_settings + vport.profiles
        readFeedBlockRowsDAL()    → moderation.blocks [TTL 60s]
        readFeedFollowRowsDAL()   → vc.actor_follows [TTL 60s]
        readCommentCountsBatch()  → vc.post_comments
        readViewerReactionsBatch()→ vc.post_reactions
        readReactionCountsBatch() → vc.post_reactions + vc.post_rose_gifts
    → [if mentions] hydrateAndReturnSummaries() → vc.get_actor_summaries RPC
    → buildBlockedActorSetModel()
    → buildFollowedActorSetModel()
    → enrichMentionRows() + buildMentionMaps()
    → normalizeFeedRows() — applies resolveFeedRowVisibilityModel() per row
  → Return: { posts, nextCursor, hiddenIds, debugRows, actors, profileMap, vportMap }
  → [Side effects] upsertActors() → actorStore
  → [Background] hydrateActorsByIds(staleOrMissing)
  → [First paint] preloadInitialMedia(firstPage.posts)
  → Render: FeedSkeletonList → PostCard[] + WelcomeFeedCard + IntersectionObserver
```

---

## React Query Configuration

| Config | Value |
|---|---|
| staleTime | 30 seconds |
| gcTime | 10 minutes |
| refetchOnWindowFocus | false |
| enabled | Boolean(viewerActorId) |

---

## Cache Inventory

| Cache | TTL | Key | Invalidation Export |
|---|---|---|---|
| actorBundle | 30s | `actor:{actorId}` | `invalidateActorBundleEntry(actorId)` |
| blockRows | 60s | `viewerActorId` | `invalidateFeedBlockCache(viewerActorId)` |
| followRows | 60s | `viewerActorId` | `invalidateFeedFollowCache(viewerActorId)` |
| postMedia | 60s | `postId` | `invalidatePostMediaCache(postId)` |
| React Query | 30s stale / 10min gc | `(actorId, realmId)` | `queryClient.resetQueries(queryKey)` |

Outbound cache invalidation adapters exposed at: `adapters/feedCache.adapter.js`

---

## Cross-Feature Boundary Assessment

All cross-feature imports use adapter boundaries. No direct internal imports detected.

| From | To | Adapter | Status |
|---|---|---|---|
| CentralFeedScreen | post/postCard | YES | CLEAN |
| CentralFeedScreen | moderation adapters | YES | CLEAN |
| useCentralFeedActions | post/social/block/moderation hooks | YES (all) | CLEAN |
| useCentralFeed | @hydration engine | YES (alias) | CLEAN |
| feedCache.adapter | (outbound — exposes invalidation to block/social) | N/A | CLEAN |
| listActorPosts.controller | (outbound — SSOT to profiles) | LOCKED | DOCUMENTED |

---

## Open Architecture TODOs (resolved from prior STUB)

- [x] Trace CentralFeedScreen imports — all cross-feature via adapters CONFIRMED
- [x] firstBatchReady — set from React Query `status` in useCentralFeed: `status === 'success' || status === 'error'`
- [x] useFeed.js status — legacy, still referenced by diagnostics and useFeed.adapter; NOT mounted in production screen
- [x] fetchCentralFeedPage confirmed — calls pipeline, not DALs directly

## Outstanding Issues

- [ ] Resolve useFeed.js lifecycle — document as intentional adapter surface or mark for removal
- [ ] getDebugPrivacyRows.controller needs import.meta.env.DEV gate (SEC finding BW-FEED-008)
- [ ] markWelcomeFeedCardSeenDAL — verify RLS sufficiency on vc.actor_onboarding_steps
- [ ] Share URL uses raw UUID postId — violates platform invariant (BW-FEED-007)
- [ ] useCentralFeedActions.js has bare console.error/warn in catch blocks (production-reaching)
- [ ] i18n Spanish translations are identical to English — no actual localization
