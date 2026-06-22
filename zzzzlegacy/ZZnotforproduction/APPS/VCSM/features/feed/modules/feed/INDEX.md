---
title: Feed Module — Index
status: VERIFIED
feature: feed
module: feed
source: architect-verified
created: 2026-06-05
updated: 2026-06-05
source-path: apps/VCSM/src/features/feed/
---

# feed / modules / feed

UI, interaction, and data layer for the VCSM central social feed. Renders the authenticated feed screen, owns the multi-DAL pipeline for assembling post rows with visibility filtering, hydrates actor identities, and exposes interaction controls (hide, report, block, share).

`listActorPosts.controller.js` is SSOT/LOCKED — shared cross-feature with profiles.

---

## Module Summary

| Field | Value |
|---|---|
| Module | feed |
| Feature | feed |
| Source Path | apps/VCSM/src/features/feed/ |
| Total Files | 52 (verified) |
| Screens | 3 |
| Controllers | 4 |
| Hooks | 8 |
| Models | 8 (pure) |
| DALs | 15 |
| Pipeline | 1 |
| Query functions | 1 |
| Components | 4 |
| Adapters | 2 |
| Debugger stubs | 2 |
| Diagnostics | 2 |
| i18n | 2 |
| Routes owned | 0 — mounted by app shell |
| Write Surfaces | 1 (vc.actor_onboarding_steps — welcome card) |
| THOR Blocker | YES — BW-FEED-008 |
| Health Rating | HEALTHY |
| ARCHITECT | 2026-06-05 |
| ELEKTRA | NEVER RUN |

---

## File Inventory (Verified 2026-06-05)

### Screens

| File | Role | Notes |
|---|---|---|
| screens/CentralFeedScreen.jsx | Primary authenticated feed view | Auth guard; React Query; cross-feature composition via adapters |
| screens/DebugFeedFilterPanel.jsx | Dev-only filter debug overlay | Pure UI — gated at render by `IS_DEV && debugMode` |
| screens/DebugPrivacyPanel.jsx | Dev-only privacy state inspector | THOR BLOCKER: controller has no DEV gate (BW-FEED-008) |

### Controllers

| File | Role | Notes |
|---|---|---|
| controllers/feedWelcomeCard.controller.js | Welcome card state read + dismiss write | No ownership check (BW-FEED-001) |
| controllers/getDebugPrivacyRows.controller.js | Privacy/visibility row inspector | No DEV gate — enabled by caller param (BW-FEED-008 THOR BLOCKER) |
| controllers/getFeedViewerContext.controller.js | Viewer actorId + isAdult resolution | Read-only |
| controllers/listActorPosts.controller.js | Actor-scoped post list — SSOT, LOCKED | Shared with profiles feature; no app-layer session binding |

### Hooks

| File | Role | Notes |
|---|---|---|
| hooks/useCentralFeed.js | React Query infinite scroll feed — CANONICAL | Active production path |
| hooks/useFeed.js | Manual cursor feed hook — LEGACY | Used by diagnostics + useFeed.adapter; NOT mounted in CentralFeedScreen |
| hooks/useCentralFeedActions.js | Post-level actions: hide, report, block, share, follow | Cross-feature via adapters |
| hooks/useFeedInfiniteScroll.js | IntersectionObserver scroll pagination trigger | |
| hooks/useFeedWelcomeCard.js | Welcome card visibility + dismiss logic | LocalStorage fast-path + DB check |
| hooks/useDebugPrivacyRows.js | Debug privacy state hook | Calls getDebugPrivacyRows.controller |
| hooks/useFeedConfirmToast.js | Confirm modal + toast state management | Promise-based confirm pattern |
| hooks/useFeed.utils.js | Utilities: withTimeout, preloadInitialMedia | Shared between useFeed.js and useCentralFeed.js (via copy) |

### Models (all pure — zero DB access)

| File | Role |
|---|---|
| model/feedRowVisibility.model.js | Orchestrator — resolves post visibility given block/follow/private/vport state |
| model/feedBlockVisibility.model.js | Blocked actor set builder (bidirectional) |
| model/feedFollowVisibility.model.js | Followed actor set builder (is_active filter) |
| model/feedPrivateVisibility.model.js | Private actor access rule (owner or follower) |
| model/normalizeFeedRows.model.js | Assembles normalized post shape from raw page rows |
| model/buildMentionMaps.model.js | Builds per-post mention maps from enriched mention rows |
| model/enrichMentionRows.model.js | Joins raw mention edges with actor presentation data |
| model/inferMediaType.model.js | URL-extension-based media type inference |

### Pipeline

| File | Role |
|---|---|
| pipeline/fetchFeedPage.pipeline.js | Orchestrates 9 parallel DAL reads, model assembly, mention hydration |

### Query Functions

| File | Role |
|---|---|
| queries/fetchCentralFeedPage.js | React Query queryFn — wraps pipeline with page-filling loop (up to 2 DB pages per call) |

### DALs

| File | Schema | Table(s) | Op | Cache |
|---|---|---|---|---|
| dal/feed.read.posts.dal.js | vc | posts | SELECT (cursor-paginated) | No |
| dal/feed.read.media.dal.js | vc | post_media | SELECT | TTL 60s per postId |
| dal/feed.read.hiddenPosts.dal.js | moderation | actions | SELECT | No |
| dal/feed.read.actorsBundle.dal.js | vc, public, vport | actors, profiles, actor_privacy_settings, vport.profiles | SELECT | TTL 30s per actorId |
| dal/feed.read.blockRows.dal.js | moderation | blocks | SELECT | TTL 60s per viewerActorId |
| dal/feed.read.followRows.dal.js | vc | actor_follows | SELECT | TTL 60s per viewerActorId |
| dal/feed.read.commentCounts.dal.js | vc | post_comments | SELECT | No |
| dal/feed.read.viewerReactions.dal.js | vc | post_reactions | SELECT | No |
| dal/feed.read.reactionCounts.dal.js | vc | post_reactions, post_rose_gifts | SELECT | No |
| dal/feed.mentions.dal.js | vc | post_mentions | SELECT | No |
| dal/feed.read.viewerContext.dal.js | vc, public | actors, profiles | SELECT | No |
| dal/feed.read.debugPrivacyRows.dal.js | vc | posts, actors, actor_privacy_settings, actor_owners, actor_follows | SELECT | No |
| dal/feedWelcomeCard.dal.js | vc | actor_onboarding_steps | SELECT + UPSERT | No |
| dal/listActorPostsByActor.dal.js | vc | posts | SELECT | No |
| dal/feed.posts.dal.js | vc | posts, post_comments | SELECT | No — legacy/diagnostics only |

### Components

| File | Role |
|---|---|
| components/FeedConfirmModal.jsx | Keyboard-accessible confirmation modal (Escape + backdrop click) |
| components/FeedSkeletonList.jsx | Loading skeleton (3 cards) |
| components/WelcomeFeedCard.jsx | Onboarding welcome card with feature list drawer |
| components/welcomeFeedCard.styles.js | Inline style object for WelcomeFeedCard |

### Adapters

| File | Role |
|---|---|
| adapters/feedCache.adapter.js | Outbound: exposes invalidateFeedBlockCache, invalidateFeedFollowCache, invalidateActorBundleEntry to block/social features |
| adapters/hooks/useFeed.adapter.js | Re-exports useFeed.js (legacy hook via adapter surface) |

### Debugger Stubs (apps/VCSM/src/debuggers-stub/feed/)

| File | Role |
|---|---|
| debuggers-stub/feed/index.js | Production no-op stubs for FeedDebugPanel, debugFeedEvent, debugFeedResult, etc. |
| debuggers-stub/feed/feedProfiler.js | Production no-op stubs for startFeedSession, wrapDAL, recordStep, etc. |

### Diagnostics (apps/VCSM/src/dev/diagnostics/groups/)

| File | Role |
|---|---|
| dev/diagnostics/groups/feedFeature.group.js | 12-test diagnostics suite (inventory, architecture, pipeline, model contract, etc.) |
| dev/diagnostics/groups/feedFeature.group.helpers.js | Test catalog + helpers for feed diagnostics |

### i18n (apps/VCSM/src/i18n/)

| File | Keys | Status |
|---|---|---|
| i18n/en/feed.json | 12 keys | Source |
| i18n/es/feed.json | 12 keys | IDENTICAL to English — not localized |

---

## Write Surfaces

| Operation | Schema | Table | Function | Auth |
|---|---|---|---|---|
| upsert | vc | actor_onboarding_steps | markWelcomeFeedCardSeenDAL | RLS only (no app-layer ownership check) |

---

## DB Tables Accessed

| Schema | Table |
|---|---|
| vc | posts |
| vc | actors |
| vc | post_media |
| vc | post_mentions |
| vc | post_comments |
| vc | post_reactions |
| vc | post_rose_gifts |
| vc | actor_follows |
| vc | actor_privacy_settings |
| vc | actor_owners |
| vc | actor_onboarding_steps |
| moderation | blocks |
| moderation | actions |
| public | profiles |
| vport | profiles |

---

## Engine Dependencies

| Engine | Import | Usage |
|---|---|---|
| hydration | @hydration | hydrateActorsByIds — background actor hydration after feed page load |
| hydration | @hydration | hydrateAndReturnSummaries — mention actor resolution in pipeline |

---

## Cross-Feature Boundaries

| Feature | Direction | Surface | Adapter? |
|---|---|---|---|
| identity | Inbound | identity.adapter | YES |
| post | Inbound | postCard.adapter, PostActionsMenu.adapter, ShareModal.adapter, useDeletePostAction.adapter | YES |
| social | Inbound | useFollowActorToggle.adapter, useFollowStatus.adapter | YES |
| block | Inbound | useBlockActorAction.adapter | YES |
| moderation | Inbound | ReportModal.adapter, ReportedPostCover.adapter, useHidePostForActor.adapter, useReportFlow.adapter | YES |
| profiles | Outbound | listActorPosts.controller (SSOT/LOCKED) | DOCUMENTED |
| block/social | Outbound | feedCache.adapter.js (cache invalidation) | YES |

---

## Security Flags

| ID | Severity | Surface | Description |
|---|---|---|---|
| BW-FEED-008 | HIGH / THOR BLOCKER | getDebugPrivacyRows.controller | No DEV gate — exposes actor privacy state in production |
| BW-FEED-001 | HIGH | feedWelcomeCard.controller | No ownership check — actorId is caller-supplied |
| VEN-FEED-004/BW-FEED-002 | MEDIUM | listActorPosts.controller | No session binding (LOCKED controller — cross-feature fix) |
| BW-FEED-003 | MEDIUM | getDebugPrivacyRows.controller | enabled flag is caller-controlled |
| BW-FEED-007 | MEDIUM | useCentralFeedActions share handler | Raw UUID postId in share URL |

---

## Governance Files

| File | Status |
|---|---|
| INDEX.md | VERIFIED — 2026-06-05 |
| BEHAVIOR.md | STUB — needs full verification |
| ARCHITECTURE.md | VERIFIED — 2026-06-05 |
| SECURITY.md | STUB — ELEKTRA not run |
| CURRENT_STATUS.md | ACTIVE — 2026-06-05 |
