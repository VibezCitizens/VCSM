---
title: ARCHITECT Report — Feed Module
feature: feed
module: feed
run-date: 2026-06-05
agent: ARCHITECT
status: COMPLETE
files-scanned: 45
source-path: apps/VCSM/src/features/feed/
---

# ARCHITECT — Feed Module Full Analysis
**Date:** 2026-06-05
**Files Scanned:** 45
**Status:** COMPLETE

---

## 1. Module Overview

The feed module is the central social content stream for the VCSM platform. It is responsible for rendering the authenticated central feed screen, orchestrating a multi-DAL data pipeline that assembles post rows with visibility filtering, hydrates actor identities, and surfaces interaction controls (hide, report, block, share).

The module has a dual-hook architecture: `useCentralFeed` (canonical, React Query infinite) and `useFeed` (legacy, manual cursor). Only `useCentralFeed` is mounted in `CentralFeedScreen`. The `useFeed` hook is still exercised by the dev diagnostics group (`feedFeature.group.js`) and is re-exported via `useFeed.adapter.js`. It is not dead code — but it is not the active runtime path for production users.

---

## 2. Layer Inventory

| Layer | File Count | Files |
|---|---|---|
| Screens | 3 | CentralFeedScreen.jsx, DebugFeedFilterPanel.jsx, DebugPrivacyPanel.jsx |
| Hooks | 8 | useCentralFeed, useFeed, useCentralFeedActions, useFeedInfiniteScroll, useFeedWelcomeCard, useDebugPrivacyRows, useFeedConfirmToast, useFeed.utils |
| Controllers | 4 | feedWelcomeCard, getDebugPrivacyRows, getFeedViewerContext, listActorPosts |
| Models | 8 | buildMentionMaps, enrichMentionRows, feedBlockVisibility, feedFollowVisibility, feedPrivateVisibility, feedRowVisibility, inferMediaType, normalizeFeedRows |
| Pipeline | 1 | fetchFeedPage.pipeline.js |
| Query functions | 1 | fetchCentralFeedPage.js |
| DALs | 15 | (see table below) |
| Components | 4 | FeedConfirmModal, FeedSkeletonList, WelcomeFeedCard, welcomeFeedCard.styles |
| Adapters | 2 | feedCache.adapter.js, useFeed.adapter.js |
| Debuggers (stub) | 2 | index.js, feedProfiler.js |
| Diagnostics | 2 | feedFeature.group.js, feedFeature.group.helpers.js |
| i18n | 2 | en/feed.json, es/feed.json |
| **Total** | **52** | |

**Note:** The task brief lists 45 files — 52 is the verified count including style, i18n, and debugger stubs.

### DAL Inventory

| File | Schema | Table(s) | Operation |
|---|---|---|---|
| feed.mentions.dal.js | vc | post_mentions | SELECT |
| feed.posts.dal.js (legacy) | vc | posts, post_comments | SELECT (legacy/diagnostics only) |
| feed.read.actorsBundle.dal.js | vc, vport, (public) | actors, profiles (public), actor_privacy_settings, vport.profiles | SELECT + TTL cache |
| feed.read.blockRows.dal.js | moderation | blocks | SELECT + TTL cache |
| feed.read.commentCounts.dal.js | vc | post_comments | SELECT |
| feed.read.debugPrivacyRows.dal.js | vc | posts, actors, actor_privacy_settings, actor_owners, actor_follows | SELECT (debug) |
| feed.read.followRows.dal.js | vc | actor_follows | SELECT + TTL cache |
| feed.read.hiddenPosts.dal.js | moderation | actions | SELECT |
| feed.read.media.dal.js | vc | post_media | SELECT + TTL cache |
| feed.read.posts.dal.js | vc | posts | SELECT (paginated cursor) |
| feed.read.reactionCounts.dal.js | vc | post_reactions, post_rose_gifts | SELECT |
| feed.read.viewerContext.dal.js | vc, (public) | actors, profiles (public) | SELECT |
| feed.read.viewerReactions.dal.js | vc | post_reactions | SELECT |
| feedWelcomeCard.dal.js | vc | actor_onboarding_steps | SELECT + UPSERT (write surface) |
| listActorPostsByActor.dal.js | vc | posts | SELECT |

---

## 3. DB Table Inventory

### Tables Read

| Schema | Table | DAL |
|---|---|---|
| vc | posts | feed.read.posts.dal, feed.read.debugPrivacyRows.dal, feed.posts.dal (legacy), listActorPostsByActor.dal |
| vc | actors | feed.read.actorsBundle.dal, feed.read.debugPrivacyRows.dal, feed.read.viewerContext.dal |
| vc | post_media | feed.read.media.dal |
| vc | post_mentions | feed.mentions.dal |
| vc | post_comments | feed.read.commentCounts.dal, feed.posts.dal (legacy) |
| vc | post_reactions | feed.read.viewerReactions.dal, feed.read.reactionCounts.dal |
| vc | post_rose_gifts | feed.read.reactionCounts.dal |
| vc | actor_follows | feed.read.followRows.dal, feed.read.debugPrivacyRows.dal |
| vc | actor_privacy_settings | feed.read.actorsBundle.dal, feed.read.debugPrivacyRows.dal |
| vc | actor_owners | feed.read.debugPrivacyRows.dal |
| vc | actor_onboarding_steps | feedWelcomeCard.dal |
| moderation | blocks | feed.read.blockRows.dal |
| moderation | actions | feed.read.hiddenPosts.dal |
| (public) | profiles | feed.read.actorsBundle.dal, feed.read.viewerContext.dal |
| vport | profiles | feed.read.actorsBundle.dal (via vportSchema) |

**Total unique tables: 15 across 3 schemas (vc, moderation, vport/public)**

---

## 4. Write Surface Inventory

| Surface | Schema | Table | Operation | Auth Enforcement |
|---|---|---|---|---|
| markWelcomeFeedCardSeenDAL | vc | actor_onboarding_steps | UPSERT (onConflict: actor_id, step_key) | RLS only — no app-layer ownership assertion |

**Only one write surface exists in the entire feed module.** All other DALs are read-only.

---

## 5. Dependency Map (Import Graph)

### Screen Layer

```
CentralFeedScreen.jsx
  ├── AuthProvider (@/app/providers/AuthProvider) — user session
  ├── identity.adapter (@/features/identity/adapters/identity.adapter) — actorId, realmId, isAdult
  ├── postCard.adapter (@/features/post/adapters/) — cross-feature via adapter
  ├── PullToRefresh (@/shared/components/)
  ├── useCentralFeed (feed/hooks) — canonical infinite query hook
  ├── useCentralFeedActions (feed/hooks) — post actions
  ├── useFeedConfirmToast (feed/hooks) — confirm/toast state
  ├── useFeedInfiniteScroll (feed/hooks) — scroll detection
  ├── FeedConfirmModal (feed/components)
  ├── FeedSkeletonList (feed/components)
  ├── WelcomeFeedCard (feed/components)
  ├── DebugPrivacyPanel (feed/screens)
  ├── DebugFeedFilterPanel (feed/screens)
  ├── ReportModal.adapter (@/features/moderation/adapters/) — via adapter
  ├── PostActionsMenu.adapter (@/features/post/adapters/) — via adapter
  ├── ShareModal.adapter (@/features/post/adapters/) — via adapter
  ├── ReportedPostCover.adapter (@/features/moderation/adapters/) — via adapter
  ├── FeedDebugPanel (@debuggers/feed) — dev only stub
  └── hideLaunchSplash (@/shared/lib/)
```

```
DebugPrivacyPanel.jsx
  └── useDebugPrivacyRows (feed/hooks)
        └── getDebugPrivacyRows.controller
              └── feed.read.debugPrivacyRows.dal — 5 tables

DebugFeedFilterPanel.jsx
  └── [pure UI — no imports beyond React]
```

### Hook Layer

```
useCentralFeed.js
  ├── fetchCentralFeedPage (feed/queries)
  ├── useActorStore (@/state/actors/actorStore)
  ├── hydrateActorsByIds (@hydration)
  ├── queryKeys (@/queries/queryKeys)
  └── debugFeedEvent, debugFeedResult (@debuggers/feed — stub in prod)

useFeed.js [legacy]
  ├── fetchFeedPagePipeline (feed/pipeline)
  ├── useActorStore (@/state/actors/actorStore)
  ├── hydrateActorsByIds (@hydration)
  ├── debugFeedEvent, debugFeedResult, feedProfiler (@debuggers/feed — stub in prod)
  ├── withTimeout, preloadInitialMedia (feed/hooks/useFeed.utils)
  └── [NOT mounted in CentralFeedScreen — dev/diagnostics only]

useCentralFeedActions.js
  ├── useDeletePostAction (@/features/post/adapters/ — adapter)
  ├── useFollowActorToggle (@/features/social/adapters/ — adapter)
  ├── useFollowStatus (@/features/social/adapters/ — adapter)
  ├── useBlockActorAction (@/features/block/adapters/ — adapter)
  ├── useHidePostForActor (@/features/moderation/adapters/ — adapter)
  ├── useReportFlow (@/features/moderation/adapters/ — adapter)
  └── shareNative (@/shared/lib/)

useFeedWelcomeCard.js
  └── feedWelcomeCard.controller
        └── feedWelcomeCard.dal → vc.actor_onboarding_steps

useDebugPrivacyRows.js
  └── getDebugPrivacyRows.controller
        └── feed.read.debugPrivacyRows.dal
```

### Query / Pipeline Layer

```
fetchCentralFeedPage.js (React Query queryFn)
  └── fetchFeedPagePipeline (feed/pipeline)

fetchFeedPage.pipeline.js
  ├── feed.read.posts.dal — vc.posts
  ├── feed.read.media.dal — vc.post_media
  ├── feed.read.hiddenPosts.dal — moderation.actions
  ├── feed.read.actorsBundle.dal — vc.actors + profiles + vport.profiles + actor_privacy_settings
  ├── feed.read.blockRows.dal — moderation.blocks
  ├── feed.read.followRows.dal — vc.actor_follows
  ├── feed.read.commentCounts.dal — vc.post_comments
  ├── feed.read.viewerReactions.dal — vc.post_reactions
  ├── feed.read.reactionCounts.dal — vc.post_reactions + post_rose_gifts
  ├── feed.mentions.dal — vc.post_mentions (conditional: only if "@" in text)
  ├── hydrateAndReturnSummaries (@hydration — mention actor resolution)
  ├── normalizeFeedRows.model
  ├── buildBlockedActorSetModel
  ├── buildFollowedActorSetModel
  ├── enrichMentionRows.model
  ├── buildMentionMaps.model
  └── feedProfiler (@debuggers/feed/feedProfiler — stub in prod)
```

### Controller Layer

```
feedWelcomeCard.controller.js
  └── feedWelcomeCard.dal (readWelcomeFeedCardStateDAL, markWelcomeFeedCardSeenDAL)

getDebugPrivacyRows.controller.js
  └── feed.read.debugPrivacyRows.dal
        (readPostActorsByIdsDAL, readActorsByIdsDAL, readActorPrivacyByActorIdsDAL,
         readOwnedActorIdsByUserIdDAL, readFollowRowsByActorsDAL)

getFeedViewerContext.controller.js
  └── feed.read.viewerContext.dal (readViewerActorIdentityDAL, readProfileAdultFlagDAL)

listActorPosts.controller.js
  └── listActorPostsByActor.dal → vc.posts WHERE actor_id
```

### Model Layer (pure, no imports from DALs)

```
normalizeFeedRows.model.js
  ├── inferMediaType.model.js (pure)
  └── feedRowVisibility.model.js
        ├── feedBlockVisibility.model.js (pure)
        ├── feedFollowVisibility.model.js (pure)
        └── feedPrivateVisibility.model.js (pure)

buildMentionMaps.model.js (pure)
enrichMentionRows.model.js (pure)
```

---

## 6. Visibility Model Inventory

The feed module implements a four-layer client-side visibility model applied after data is fetched from the database. RLS provides a database-level backstop, but client-side filtering is the primary visibility enforcement layer in the application.

### Model 1 — Block Visibility (`feedBlockVisibility.model.js`)

- **Function:** `buildBlockedActorSetModel({ viewerActorId, blockRows })`
- **Input:** Raw block rows from `moderation.blocks`
- **Output:** Set of actor IDs that are blocked (bidirectional — both `blocker` and `blocked` are excluded)
- **Rule:** If either party in a block relationship is the viewer, the other party's posts are excluded.
- **Function:** `isActorBlockedForViewerModel({ actorId, blockedActorSet })`

### Model 2 — Follow Visibility (`feedFollowVisibility.model.js`)

- **Function:** `buildFollowedActorSetModel({ followRows })`
- **Input:** Raw follow rows from `vc.actor_follows`
- **Output:** Set of actor IDs the viewer actively follows (`is_active === true`)
- **Rule:** Used to determine whether a private actor's posts can be shown to the viewer.
- **Function:** `isActorFollowedByViewerModel({ actorId, followedActorSet })`

### Model 3 — Private Actor Visibility (`feedPrivateVisibility.model.js`)

- **Function:** `canViewPrivateFeedActorModel({ isPrivate, isOwner, isFollowing })`
- **Rule:** A private actor's posts are visible only if:
  - `!isPrivate` (public actor), OR
  - `isOwner` (viewer is the actor), OR
  - `isFollowing` (viewer follows the actor)

### Model 4 — Row Visibility Resolver (`feedRowVisibility.model.js`)

- **Function:** `resolveFeedRowVisibilityModel({ row, actorMap, profileMap, vportMap, blockedActorSet, followedActorSet, viewerActorId })`
- **Returns:** `{ post_id, actor_id, visible, reason, is_private, is_following, is_owner, actor_kind }`
- **Visibility reasons (exhaustive):**
  - `blocked_actor` — either party blocked the other
  - `missing_actor` — actor not found in actorMap (data integrity gap)
  - `missing_vport_profile` — vport actor has no vport.profiles entry (RLS: owner-only)
  - `inactive_vport` — vport is_active=false or is_deleted=true
  - `visible_vport` — vport post passes all checks
  - `missing_profile` — user actor has no profiles entry
  - `private_not_following` — private actor, viewer neither follows nor owns
  - `visible_user` — user post passes all checks

**Note on vport visibility:** `vportMap` is keyed by `actor.id` (not `actor.vport_id`). VPORTs with `owner-only` RLS on `vport.profiles` will surface as `missing_vport_profile` for non-owners and then be hidden. This produces false-negatives that are resolved by the `hydrateActorsByIds` force hydration path using the `SECURITY DEFINER` RPC `vc.get_actor_summaries`.

---

## 7. Central Feed Load — Full Data Flow

```
User lands on /feed
  ↓
CentralFeedScreen.jsx mounts
  ↓
[1] useAuth() — verifies session (redirects /login if no user)
[2] useIdentity() — resolves actorId, realmId, isAdult
  ↓
useCentralFeed(actorId, realmId, { viewerIsAdult })
  ↓
useInfiniteQuery(queryKey: ['centralFeed', actorId, realmId])
  ↓
fetchCentralFeedPage({ actorId, realmId, pageParam=undefined })
  ↓
  [while loop: up to MAX_EMPTY_PAGES=2 on first load]
  fetchFeedPagePipeline({ viewerActorId, realmId, cursorCreatedAt, pageSize=10 })
    ↓
    [1] readFeedPostsPage() → vc.posts [paginated, cursor, realm_id filter]
        Returns: { pageRows, hasMoreNow, nextCursorCreatedAt }
    
    [2-10] 9 parallel DAL calls (Promise.all):
      ├── readPostMediaMap(pagePostIds)       → vc.post_media
      ├── fetchRawPostMentionEdgesDAL(postIds) → vc.post_mentions [conditional: only if "@" in text]
      ├── readHiddenPostsForViewer()          → moderation.actions [hide/unhide events]
      ├── readActorsBundle(actorIds)          → vc.actors + public.profiles + vc.actor_privacy_settings + vport.profiles
      ├── readFeedBlockRowsDAL()              → moderation.blocks [TTL 60s]
      ├── readFeedFollowRowsDAL()             → vc.actor_follows [TTL 60s]
      ├── readCommentCountsBatch()            → vc.post_comments
      ├── readViewerReactionsBatch()          → vc.post_reactions
      └── readReactionCountsBatch()           → vc.post_reactions + vc.post_rose_gifts
    
    [3] [if mentions present] hydrateAndReturnSummaries(mentionedActorIds)
        → vc.get_actor_summaries RPC (SECURITY DEFINER)
    
    [4] Model assembly (pure):
      buildBlockedActorSetModel()
      buildFollowedActorSetModel()
      enrichMentionRows()
      buildMentionMaps()
      normalizeFeedRows() [applies resolveFeedRowVisibilityModel per row]
    
    Returns: { normalized, debugRows, hasMoreNow, nextCursorCreatedAt,
               hiddenByMeSet, actors, profileMap, vportMap }
  
  [Return to fetchCentralFeedPage]
  Merges pages if loop ran more than once.
  Returns: { posts, nextCursor, hasMore, hiddenIds, debugRows,
             actors, profileMap, vportMap }
  ↓
[Back in useCentralFeed]
useEffect: upsertActors() → actorStore (Zustand)
useEffect: hydrateActorsByIds(staleOrMissing) — background canonical hydration
useEffect: preloadInitialMedia(firstPage.posts) — first-paint image preload
  ↓
CentralFeedScreen renders:
  - FeedSkeletonList [until firstBatchReady]
  - WelcomeFeedCard [if user actor + not seen]
  - PostCard[] [for each post]
  - Infinite scroll sentinel [useFeedInfiniteScroll → IntersectionObserver]
```

---

## 8. Route Inventory

The feed module does not declare or own any routes. `CentralFeedScreen` is mounted by the app shell navigation layer at the `/feed` path (or equivalent home route). The module has no `index.js` entry file exposing routes.

Routes observed in the module (navigation targets, not owned routes):
- `/login` — redirect if no user (auth guard)
- `/settings?tab=profile` — WelcomeFeedCard complete-profile CTA
- `/explore` — WelcomeFeedCard explore CTA
- `/post/:postId` — open post on card click
- `/post/:postId/edit` — edit post action
- `/profile/:postActorId` — open actor profile from post menu

---

## 9. Ownership Boundaries

| Concern | Layer Owner |
|---|---|
| Authentication gate | CentralFeedScreen (uses AuthProvider) |
| Identity resolution (actorId, realmId, isAdult) | Identity adapter (cross-feature) |
| Feed pagination state | useCentralFeed (React Query) |
| Post-level actions (hide, report, block, share) | useCentralFeedActions (delegates to cross-feature adapters) |
| Scroll detection and pagination trigger | useFeedInfiniteScroll |
| Confirm / toast UI state | useFeedConfirmToast |
| Welcome card visibility + dismiss | useFeedWelcomeCard + feedWelcomeCard.controller + feedWelcomeCard.dal |
| Viewer adult flag resolution | getFeedViewerContext.controller |
| Actor post list (SSOT for profiles) | listActorPosts.controller (LOCKED) |
| Data pipeline assembly | fetchFeedPage.pipeline |
| All visibility filtering (block/follow/private) | Model layer (pure functions) |
| Actor identity hydration (post-fetch) | engines/hydration (@hydration) |
| Actor store updates | actorStore (Zustand — cross-feature state) |
| Cache invalidation (outbound) | feedCache.adapter.js |

---

## 10. TTL Cache Inventory

| Cache | Location | TTL | Scope | Invalidation |
|---|---|---|---|---|
| actorBundle cache | feed.read.actorsBundle.dal | 30s | Per actor ID | `invalidateActorBundleEntry(actorId)` |
| blockRows cache | feed.read.blockRows.dal | 60s | Per viewerActorId | `invalidateFeedBlockCache(viewerActorId)` |
| followRows cache | feed.read.followRows.dal | 60s | Per viewerActorId | `invalidateFeedFollowCache(viewerActorId)` |
| postMedia cache | feed.read.media.dal | 60s | Per post ID | `invalidatePostMediaCache(postId)` |
| React Query | useCentralFeed | staleTime: 30s, gcTime: 10min | Per (actorId, realmId) | `queryClient.resetQueries(queryKey)` |

---

## 11. Cross-Feature Boundary Audit

| Import | Direction | Path | Via Adapter? | Assessment |
|---|---|---|---|---|
| PostCard | Inbound to feed | @/features/post/adapters/postCard.adapter | YES | CLEAN |
| PostActionsMenu | Inbound to feed | @/features/post/adapters/postcard/components/PostActionsMenu.adapter | YES | CLEAN |
| ShareModal | Inbound to feed | @/features/post/adapters/postcard/components/ShareModal.adapter | YES | CLEAN |
| ReportModal | Inbound to feed | @/features/moderation/adapters/components/ReportModal.adapter | YES | CLEAN |
| ReportedPostCover | Inbound to feed | @/features/moderation/adapters/components/ReportThanksOverlay.adapter | YES | CLEAN |
| useDeletePostAction | Inbound to actions | @/features/post/adapters/postcard/hooks/useDeletePostAction.adapter | YES | CLEAN |
| useFollowActorToggle | Inbound to actions | @/features/social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter | YES | CLEAN |
| useFollowStatus | Inbound to actions | @/features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter | YES | CLEAN |
| useBlockActorAction | Inbound to actions | @/features/block/adapters/hooks/useBlockActorAction.adapter | YES | CLEAN |
| useHidePostForActor | Inbound to actions | @/features/moderation/adapters/hooks/useHidePostForActor.adapter | YES | CLEAN |
| useReportFlow | Inbound to actions | @/features/moderation/adapters/hooks/useReportFlow.adapter | YES | CLEAN |
| hydrateActorsByIds | Inbound to hooks/pipeline | @hydration | YES (engine alias) | CLEAN |
| identity.adapter | Inbound to screen | @/features/identity/adapters/identity.adapter | YES | CLEAN |
| listActorPosts.controller | Outbound from feed | consumed by profiles feature (SSOT) | N/A — shared controller | DOCUMENTED, LOCKED |
| feedCache.adapter | Outbound from feed | consumed by block/social features | YES (adapter) | CLEAN |

**Finding:** All cross-feature imports in `CentralFeedScreen.jsx` and `useCentralFeedActions.js` correctly use adapter boundaries. Zero direct internal cross-feature imports detected.

**Note on `useCentralFeedActions.js`:** This file uses `console.error` and `console.warn` directly in 3 places. These would reach production if triggered (catch blocks). This violates VCSM's no-console-log debug rule.

---

## 12. Architecture Health Assessment

### Health Rating: HEALTHY (with noted gaps)

The feed module is structurally sound. The layer stack is clean, the pipeline pattern is well-implemented, all cross-feature imports go through adapters, and the visibility model is pure and well-organized. The React Query migration (`useCentralFeed`) is the active production path.

**Strengths:**
- Clean 9-DAL parallel pipeline with no N+1 queries
- Pure model layer (zero DB access in models)
- Correct adapter boundary usage throughout
- TTL caching at block/follow/actor/media layers reduces redundant round-trips
- Image preload for first-paint performance
- Well-scoped write surface (exactly 1 write DAL)
- Dev/prod debugger stub pattern correctly implemented

**Gaps / Concerns:**

| ID | Severity | Finding |
|---|---|---|
| ARCH-FEED-001 | MEDIUM | `useFeed.js` (legacy hook) coexists with `useCentralFeed.js` (canonical). useFeed is still imported by dev diagnostics and re-exported by useFeed.adapter.js. Migration decision is not documented. Dead code risk if not intentional. |
| ARCH-FEED-002 | MEDIUM | `getDebugPrivacyRows.controller.js` has no `import.meta.env.DEV` gate. The `enabled` parameter is caller-controlled. In production, this controller runs if called with `enabled=true`. (Existing SECURITY finding BW-FEED-008.) |
| ARCH-FEED-003 | LOW | `feed.posts.dal.js` is marked "legacy — diagnostics only" in its header comment but is still imported by `feedFeature.group.js`. No production exposure, but is a maintenance artifact. |
| ARCH-FEED-004 | LOW | The module has no `index.js` export surface. There is no single canonical entry point declaring what the module exports. The diagnostics group test `hasIndex` expects `src/features/feed/index.js` and would fail this check. |
| ARCH-FEED-005 | LOW | `useCentralFeedActions.js` contains 3 `console.error` / `console.warn` calls in catch blocks that are not guarded by `import.meta.env.DEV`. These reach production. |
| ARCH-FEED-006 | LOW | `buildMentionMaps.model.js` contains a Windows-style absolute path comment (`C:\Users\trest\...`) at line 1, and `normalizeFeedRows.model.js` also has one. Development artifact — does not affect runtime. |
| ARCH-FEED-007 | INFO | i18n strings (en/es) are fully in sync (same keys). However, the Spanish translation is identical to English — no actual localization has occurred. |
| ARCH-FEED-008 | INFO | `useFeed.adapter.js` simply re-exports `useFeed.js` entirely. It does not filter or gate the export, meaning anything from `useFeed.js` is accessible to any consumer via the adapter. |
| ARCH-FEED-009 | INFO | `debugFeedEvent` call in `useCentralFeedActions.js` catch block uses `console.error` not the debugger event system, inconsistent with the rest of the feed debug pattern. |

---

## 13. Key Findings for VENOM Review

1. **Single write surface, low mutation attack surface.** Only `vc.actor_onboarding_steps` is written by the feed module (welcome card dismiss). All other DALs are read-only. The write has no app-layer ownership assertion — RLS is the sole enforcement backstop.

2. **getDebugPrivacyRows controller has no production guard.** `getDebugPrivacyRows.controller.js` is reachable in production if `enabled=true` is passed by any caller. It exposes actor privacy state, owner relationships, and follow relationships for any set of post IDs. The `DebugPrivacyPanel.jsx` screen that calls it does gate on `IS_DEV && debugMode === 'privacy'`, but the controller itself has no such gate. The underlying DAL calls 5 tables including `actor_owners` and `actor_privacy_settings`.

3. **listActorPosts controller: no app-layer session binding.** `listActorPosts.controller.js` accepts `viewerActorId` from the caller and passes it to the DAL with no assertion that it matches the session user. RLS is the sole enforcement layer. This is a LOCKED SSOT controller shared with the profiles feature — any fix must coordinate across both features.

4. **Share URL constructed with raw UUID.** `useCentralFeedActions.js` line 236: `const url = \`${window.location.origin}/post/${postId}\``. This violates the platform no-raw-IDs-in-URLs invariant documented in MEMORY.md.

5. **Dual hook risk: `useFeed` is not dead.** `useFeed.js` is imported by `feedFeature.group.js` (diagnostics) and re-exported by `useFeed.adapter.js`. If any external consumer imports from `useFeed.adapter.js`, they receive the legacy hook with its manual cursor implementation, not the React Query path. The two implementations are not synchronized — divergence risk.

6. **actorsBundle DAL crosses schema boundaries.** `feed.read.actorsBundle.dal.js` queries 4 schema namespaces: `vc` (actors), `public` (profiles), `vc` (actor_privacy_settings), `vport` (profiles via vportSchema). This multi-schema bundle is a broad read that assembles a rich actor context. If RLS is permissive on any of these tables, over-fetching is possible.

7. **vport.profiles RLS produces silent false-negatives.** Because `vport.profiles` has owner-only RLS, non-owner users receive an empty vportMap for vport actors. The pipeline handles this by force-hydrating these actors via `get_actor_summaries` RPC (SECURITY DEFINER). This is a known workaround but creates a secondary network call per feed page when vport actors are present and not yet hydrated.

8. **No tests exist for feed module.** The diagnostics group is the only runtime coverage. There are no Jest/Vitest unit tests for any model, controller, or DAL in this module. The pure model layer is ideal for unit testing but has none.

---

## 14. Files Confirmed Absent

- `src/features/feed/index.js` — no module entry point
- Any `*.test.js` or `*.spec.js` files under `src/features/feed/`
- Any TypeScript files (correct per platform rules)
- Any CSS files directly in the feed feature (correct — styles use CSS custom properties via `welcomeFeedCard.styles.js`)

---

## Appendix: Full File List (Confirmed)

**Adapters (2)**
- adapters/feedCache.adapter.js
- adapters/hooks/useFeed.adapter.js

**Components (4)**
- components/FeedConfirmModal.jsx
- components/FeedSkeletonList.jsx
- components/WelcomeFeedCard.jsx
- components/welcomeFeedCard.styles.js

**Controllers (4)**
- controllers/feedWelcomeCard.controller.js
- controllers/getDebugPrivacyRows.controller.js
- controllers/getFeedViewerContext.controller.js
- controllers/listActorPosts.controller.js

**DALs (15)**
- dal/feed.mentions.dal.js
- dal/feed.posts.dal.js (legacy)
- dal/feed.read.actorsBundle.dal.js
- dal/feed.read.blockRows.dal.js
- dal/feed.read.commentCounts.dal.js
- dal/feed.read.debugPrivacyRows.dal.js
- dal/feed.read.followRows.dal.js
- dal/feed.read.hiddenPosts.dal.js
- dal/feed.read.media.dal.js
- dal/feed.read.posts.dal.js
- dal/feed.read.reactionCounts.dal.js
- dal/feed.read.viewerContext.dal.js
- dal/feed.read.viewerReactions.dal.js
- dal/feedWelcomeCard.dal.js
- dal/listActorPostsByActor.dal.js

**Hooks (8)**
- hooks/useCentralFeed.js
- hooks/useCentralFeedActions.js
- hooks/useDebugPrivacyRows.js
- hooks/useFeed.js
- hooks/useFeed.utils.js
- hooks/useFeedConfirmToast.js
- hooks/useFeedInfiniteScroll.js
- hooks/useFeedWelcomeCard.js

**Models (8)**
- model/buildMentionMaps.model.js
- model/enrichMentionRows.model.js
- model/feedBlockVisibility.model.js
- model/feedFollowVisibility.model.js
- model/feedPrivateVisibility.model.js
- model/feedRowVisibility.model.js
- model/inferMediaType.model.js
- model/normalizeFeedRows.model.js

**Pipeline (1)**
- pipeline/fetchFeedPage.pipeline.js

**Queries (1)**
- queries/fetchCentralFeedPage.js

**Screens (3)**
- screens/CentralFeedScreen.jsx
- screens/DebugFeedFilterPanel.jsx
- screens/DebugPrivacyPanel.jsx

**Debuggers (stubs, 2)**
- (VCSM src) debuggers-stub/feed/index.js
- (VCSM src) debuggers-stub/feed/feedProfiler.js

**Diagnostics (2)**
- (VCSM src) dev/diagnostics/groups/feedFeature.group.js
- (VCSM src) dev/diagnostics/groups/feedFeature.group.helpers.js

**i18n (2)**
- i18n/en/feed.json
- i18n/es/feed.json
