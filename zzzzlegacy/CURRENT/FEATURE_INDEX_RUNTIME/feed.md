# Runtime Feature Index: feed

## Metadata

| Field | Value |
|---|---|
| Feature | feed |
| CURRENT Folder | CURRENT/features/feed |
| Source Folder | apps/VCSM/src/features/feed |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 4 | feedWelcomeCard.controller.js, getDebugPrivacyRows.controller.js, getFeedViewerContext.controller.js, listActorPosts.controller.js |
| DALs | 16 | feed.read.posts.dal.js, feed.read.actorsBundle.dal.js, feed.read.blockRows.dal.js, feed.read.followRows.dal.js, feed.read.media.dal.js, feed.read.hiddenPosts.dal.js, feed.read.commentCounts.dal.js, feed.read.viewerReactions.dal.js, feed.read.reactionCounts.dal.js, feed.read.viewerContext.dal.js, feed.mentions.dal.js, feed.read.debugPrivacyRows.dal.js, feedWelcomeCard.dal.js, listActorPostsByActor.dal.js, feed.posts.dal.js (LEGACY), feed.read.viewerContext.dal.js |
| Hooks | 8 | useFeed.js, useCentralFeed.js, useCentralFeedActions.js, useFeedWelcomeCard.js, useFeedInfiniteScroll.js, useFeedConfirmToast.js, useDebugPrivacyRows.js, useFeed.utils.js |
| Models | 8 | normalizeFeedRows.model.js, feedRowVisibility.model.js, feedBlockVisibility.model.js, feedFollowVisibility.model.js, feedPrivateVisibility.model.js, inferMediaType.model.js, enrichMentionRows.model.js, buildMentionMaps.model.js |
| Screens | 3 | CentralFeedScreen.jsx, DebugFeedFilterPanel.jsx, DebugPrivacyPanel.jsx |
| Components | 4 | FeedConfirmModal.jsx, FeedSkeletonList.jsx, WelcomeFeedCard.jsx, welcomeFeedCard.styles.js |
| Adapters | 2 | feedCache.adapter.js, adapters/hooks/useFeed.adapter.js |
| Pipeline | 1 | fetchFeedPage.pipeline.js |
| Queries | 1 | fetchCentralFeedPage.js |
| Routes | 1 | /feed (AUTH protected) |
| Tests | 0 | NONE FOUND |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /feed | apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx | AUTH | Main content feed — paginated, block-aware, privacy-filtered |
| DebugFeedFilterPanel | apps/VCSM/src/features/feed/screens/DebugFeedFilterPanel.jsx | AUTH (dev-only) | Debug panel — must be gated to DEV environment; production risk if ungated |
| DebugPrivacyPanel | apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx | AUTH (dev-only) | Privacy debug panel — dev-only; uses getDebugPrivacyRowsController |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| feedWelcomeCard.controller.js / markWelcomeFeedCardSeenDAL | feed/controllers/ + feed/dal/ | UPSERT (vc.actor_onboarding_steps) | PARTIAL — client-supplied actorId; WITH CHECK RLS unconfirmed (V3 OPEN) | HIGH |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| feedWelcomeCard.controller.js + markWelcomeFeedCardSeenDAL | feed/controllers/, feed/dal/ | DB_RLS WRITE | V3 HIGH — client-supplied actorId; no confirmed WITH CHECK RLS on vc.actor_onboarding_steps — CARNAGE required |
| readHiddenPostsForViewer DAL | feed/dal/feed.read.hiddenPosts.dal.js | DB_RLS READ | V1 MODERATE — client-supplied viewerActorId; safety depends on moderation.actions RLS — CARNAGE required |
| readViewerReactionsBatch DAL | feed/dal/feed.read.viewerReactions.dal.js | DB_RLS READ | V2 MODERATE — client-supplied actorId; safety depends on vc.post_reactions RLS — CARNAGE required |
| feed.posts.dal.js (LEGACY) | feed/dal/feed.posts.dal.js | LAYER VIOLATION | SA2 — imports @hydration engine from DAL layer; legacy file, not in active pipeline — IRONMAN assignment required |
| FeedConfirmModal.jsx | feed/components/ | IOS BLOCKING | SA3 MODERATE — stacking context issue; FALCON-flagged; wrong folder per SENTRY |
| DebugFeedFilterPanel, DebugPrivacyPanel | feed/screens/ | UNGATED DEV PANEL | LK1 — console.log present; panels render on prod if route not dev-guarded |

## Architecture Summary

| Metric | Value |
|---|---|
| Architecture State | EVOLVING |
| Module Status | MOSTLY COMPLETE |
| Controller Count | 4 |
| DAL Count | 16 (15 active + 1 legacy) |
| Hook Count | 8 |
| Model Count | 8 |
| Screen Count | 3 |
| Component Count | 4 |
| Engine Deps | @hydration |
| Test Files | 0 |
| Open Security Findings | V1 MODERATE, V2 MODERATE, V3 HIGH |
| Open Architecture Violations | SA2 HIGH, SA3 MODERATE, SA4 MODERATE |
| THOR Status | THOR_BLOCKED — V3 HIGH unresolved |

## Recommended Next Command

CARNAGE — Verify RLS on `vc.actor_onboarding_steps`, `moderation.actions`, `vc.post_reactions` to resolve V1/V2/V3 and unblock THOR.

## Recommended Next Ticket

TICKET-FEED-CARNAGE-001 — CARNAGE RLS verification for `moderation.actions`, `vc.post_reactions`, `vc.actor_onboarding_steps`. Also triggers IRONMAN assignment for SA2 refactor (`feed.posts.dal.js` removal) and SA3 FeedConfirmModal.jsx relocation.
