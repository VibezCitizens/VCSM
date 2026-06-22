---
title: Feed Module — Ownership
status: ACTIVE
feature: feed
module: feed
source: sentry-derived
created: 2026-06-05
updated: 2026-06-05
sentry-report: outputs/2026/06/05/SENTRY/2026-06-05_sentry_feed-compliance.md
---

# feed / modules / feed — OWNERSHIP

## Layer Ownership Map

| Layer | File(s) | Owner |
|---|---|---|
| Screen / Auth Gate | `screens/CentralFeedScreen.jsx` | Feed module |
| Feed State (React Query) | `hooks/useCentralFeed.js` | Feed module |
| Feed Actions | `hooks/useCentralFeedActions.js` | Feed module — delegates to cross-feature adapters |
| Scroll Detection | `hooks/useFeedInfiniteScroll.js` | Feed module |
| Confirm / Toast UI State | `hooks/useFeedConfirmToast.js` | Feed module |
| Welcome Card | `hooks/useFeedWelcomeCard.js` + `controllers/feedWelcomeCard.controller.js` + `dal/feedWelcomeCard.dal.js` | Feed module |
| Query Function | `queries/fetchCentralFeedPage.js` | Feed module |
| Data Pipeline | `pipeline/fetchFeedPage.pipeline.js` | Feed module |
| Visibility Enforcement | `model/feedRowVisibility.model.js` + `feedBlockVisibility.model.js` + `feedFollowVisibility.model.js` + `feedPrivateVisibility.model.js` | Feed module (pure model layer) |
| Post Normalization | `model/normalizeFeedRows.model.js` | Feed module |
| Mention Enrichment | `model/enrichMentionRows.model.js` + `model/buildMentionMaps.model.js` | Feed module |
| Media Type Inference | `model/inferMediaType.model.js` | Feed module |
| Actor Post List (SSOT) | `controllers/listActorPosts.controller.js` | Feed module (LOCKED — shared SSOT with profiles feature) |
| Viewer Context | `controllers/getFeedViewerContext.controller.js` | Feed module |
| Debug Privacy Rows | `controllers/getDebugPrivacyRows.controller.js` | Feed module (DEV-only) |
| Actor Hydration | `@hydration` engine | Hydration engine (cross-feature) |
| Actor Store | `@/state/actors/actorStore` | Zustand actor state (cross-feature) |
| Cache Invalidation (outbound) | `adapters/feedCache.adapter.js` | Feed module (exposes to block/social) |
| Identity Resolution | `@/features/identity/adapters/identity.adapter` | Identity feature (cross-feature, via adapter) |
| Post Card Rendering | `@/features/post/adapters/postCard.adapter` | Post feature (cross-feature, via adapter) |
| Report / Moderation | `@/features/moderation/adapters/...` | Moderation feature (cross-feature, via adapters) |
| Block Action | `@/features/block/adapters/hooks/useBlockActorAction.adapter` | Block feature (cross-feature, via adapter) |
| Follow / Subscribe | `@/features/social/adapters/friend/subscribe/...` | Social feature (cross-feature, via adapters) |

---

## Concern Ownership Map

| Concern | Owner Layer | File |
|---|---|---|
| Auth gate (unauthenticated redirect) | Screen | `CentralFeedScreen.jsx` |
| Identity resolution (actorId, realmId, isAdult) | Identity adapter | `identity.adapter.js` (cross-feature) |
| Feed pagination state | useCentralFeed (React Query) | `hooks/useCentralFeed.js` |
| Infinite scroll trigger | useFeedInfiniteScroll | `hooks/useFeedInfiniteScroll.js` |
| Post-level user actions (edit, delete, report, block, follow, share) | useCentralFeedActions | `hooks/useCentralFeedActions.js` |
| Confirm modal lifecycle | useFeedConfirmToast | `hooks/useFeedConfirmToast.js` |
| Toast lifecycle | useFeedConfirmToast | `hooks/useFeedConfirmToast.js` |
| Welcome card visibility + dismiss | useFeedWelcomeCard + feedWelcomeCard.controller | `hooks/useFeedWelcomeCard.js`, `controllers/feedWelcomeCard.controller.js` |
| Welcome card DB persistence | feedWelcomeCard.dal | `dal/feedWelcomeCard.dal.js` |
| Viewer adult flag | getFeedViewerContext.controller | `controllers/getFeedViewerContext.controller.js` |
| Actor post list (shared SSOT) | listActorPosts.controller (LOCKED) | `controllers/listActorPosts.controller.js` |
| Data assembly (9 DAL fan-out) | Pipeline | `pipeline/fetchFeedPage.pipeline.js` |
| Visibility filtering (block/follow/private) | Model layer (pure) | `model/feedRowVisibility.model.js` and sub-models |
| Actor hydration | @hydration engine | (engine-level, cross-feature) |
| Actor store updates | actorStore Zustand | (cross-feature state) |
| Cache invalidation (outbound) | feedCache.adapter.js | `adapters/feedCache.adapter.js` |
| Debug overlays | DebugFeedFilterPanel, DebugPrivacyPanel | `screens/DebugFeedFilterPanel.jsx`, `screens/DebugPrivacyPanel.jsx` |

---

## Boundary Violations Found (SENTRY 2026-06-05)

### OPEN VIOLATIONS

| Violation | Severity | Finding | Surface |
|---|---|---|---|
| Raw actor UUID in profile navigation URL | HIGH | VEN-MOD-FEED-003 | `useCentralFeedActions.js:152` |
| Raw post UUID in share URL | MEDIUM | VEN-MOD-FEED-004 | `useCentralFeedActions.js:234-236` |
| Raw actorId UUID in mention route fallback | MEDIUM | VEN-PIPE-004 | `buildMentionMaps.model.js:6` |
| console.log in pipeline without DEV gate | HIGH | (SENTRY-NEW) | `fetchFeedPage.pipeline.js:137` |
| 5x console.* in useCentralFeedActions without DEV gate | HIGH | VEN-MOD-FEED-002 | `useCentralFeedActions.js:68,139,182,197,221` |
| getDebugPrivacyRowsController callable in production (no DEV gate) | MEDIUM | BW-FEED-008 | `controllers/getDebugPrivacyRows.controller.js` |
| Spanish i18n file contains only English content | MEDIUM | (SENTRY-NEW) | `i18n/es/feed.json` |
| User-facing strings hardcoded in components (not in i18n) | MEDIUM | (SENTRY-NEW) | `CentralFeedScreen.jsx:149,189,192`, `useCentralFeedActions.js:88-92,113-114,158-161` |

### ACCEPTED (DOCUMENTED)

| Item | Reason | Finding |
|---|---|---|
| markWelcomeFeedCardSeenDAL — no app-layer ownership assertion | RLS verified sufficient (migration 20260518010000) | SECURITY.md — ACCEPTED |
| listActorPosts — viewerActorId discarded | RLS-only enforcement contract; documented as intentional | VEN-FEED-004 OPEN |

### THOR-BLOCKING VIOLATIONS

| Violation | Severity | Finding | Surface |
|---|---|---|---|
| null realmId bypasses realm filter in readFeedPostsPage | HIGH | VEN-PIPE-002 | `feed.read.posts.dal.js:30-33` |
| vport.profiles owner-only RLS nulls vport bundle for non-owners | HIGH | VEN-PIPE-003 | `feed.read.actorsBundle.dal.js:84-89` |

---

## Cross-Feature Adapter Compliance

All cross-feature access from the feed module uses the adapter pattern correctly.
No direct internal imports into other features detected in production code paths.

| From | To | Via Adapter | Status |
|---|---|---|---|
| CentralFeedScreen | post/postCard | postCard.adapter | CLEAN |
| CentralFeedScreen | moderation/components | adapters | CLEAN |
| useCentralFeedActions | post/delete | useDeletePostAction.adapter | CLEAN |
| useCentralFeedActions | social/follow | useFollowActorToggle.adapter, useFollowStatus.adapter | CLEAN |
| useCentralFeedActions | block | useBlockActorAction.adapter | CLEAN |
| useCentralFeedActions | moderation/hide | useHidePostForActor.adapter | CLEAN |
| useCentralFeedActions | moderation/report | useReportFlow.adapter | CLEAN |
| useCentralFeed | @hydration engine | hydrateActorsByIds (engine alias) | CLEAN |
| fetchFeedPage.pipeline | @hydration engine | hydrateAndReturnSummaries (engine alias) | CLEAN |

---

*OWNERSHIP.md created by SENTRY, 2026-06-05.*
