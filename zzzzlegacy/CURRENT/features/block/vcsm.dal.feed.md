# VCSM DAL — `feed`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/feed/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 16 |
| Exported functions | 28 |
| Tables accessed | 14 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `feed.mentions.dal.js`

**Path:** `features/feed/dal/feed.mentions.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchPostMentionRows` | `read` | `post_mentions` |
| `readPostMentionRows` | `read` | `post_mentions` |

### `feed.posts.dal.js`

**Path:** `features/feed/dal/feed.posts.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listFeedPosts` | `read` | `posts` |

### `feed.read.actorsBundle.dal.js`

**Path:** `features/feed/dal/feed.read.actorsBundle.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateActorBundleEntry` | `read` | `actors`, `profiles`, `actor_privacy_settings` |
| `invalidateActorsBundleCache` | `read` | `actors`, `profiles`, `actor_privacy_settings` |
| `readActorsBundle` | `read` | `actors`, `profiles`, `actor_privacy_settings` |

### `feed.read.blockRows.dal.js`

**Path:** `features/feed/dal/feed.read.blockRows.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateFeedBlockCache` | `read` | `blocks` |
| `readFeedBlockRowsDAL` | `read` | `blocks` |

### `feed.read.commentCounts.dal.js`

**Path:** `features/feed/dal/feed.read.commentCounts.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readCommentCountsBatch` | `read` | `post_comments` |

### `feed.read.debugPrivacyRows.dal.js`

**Path:** `features/feed/dal/feed.read.debugPrivacyRows.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readActorPrivacyByActorIdsDAL` | `read` | `actor_privacy_settings`, `actor_follows`, `posts`, `actor_owners`, `actors` |
| `readActorsByIdsDAL` | `read` | `actor_privacy_settings`, `actor_follows`, `posts`, `actor_owners`, `actors` |
| `readFollowRowsByActorsDAL` | `read` | `actor_privacy_settings`, `actor_follows`, `posts`, `actor_owners`, `actors` |
| `readOwnedActorIdsByUserIdDAL` | `read` | `actor_privacy_settings`, `actor_follows`, `posts`, `actor_owners`, `actors` |
| `readPostActorsByIdsDAL` | `read` | `actor_privacy_settings`, `actor_follows`, `posts`, `actor_owners`, `actors` |

### `feed.read.followRows.dal.js`

**Path:** `features/feed/dal/feed.read.followRows.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateFeedFollowCache` | `read` | `actor_follows` |
| `readFeedFollowRowsDAL` | `read` | `actor_follows` |

### `feed.read.hiddenPosts.dal.js`

**Path:** `features/feed/dal/feed.read.hiddenPosts.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readHiddenPostsForViewer` | `read` | `actions` |

### `feed.read.media.dal.js`

**Path:** `features/feed/dal/feed.read.media.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidatePostMediaCache` | `read` | `post_media` |
| `readPostMediaMap` | `read` | `post_media` |

### `feed.read.posts.dal.js`

**Path:** `features/feed/dal/feed.read.posts.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readFeedPostsPage` | `read` | `posts` |

### `feed.read.reactionCounts.dal.js`

**Path:** `features/feed/dal/feed.read.reactionCounts.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readReactionCountsBatch` | `read` | `post_reactions`, `post_rose_gifts` |

### `feed.read.viewerContext.dal.js`

**Path:** `features/feed/dal/feed.read.viewerContext.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readProfileAdultFlagDAL` | `read` | `actors`, `profiles` |
| `readViewerActorIdentityDAL` | `read` | `actors`, `profiles` |

### `feed.read.viewerReactions.dal.js`

**Path:** `features/feed/dal/feed.read.viewerReactions.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readViewerReactionsBatch` | `read` | `post_reactions` |

### `feedWelcomeCard.dal.js`

**Path:** `features/feed/dal/feedWelcomeCard.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `markWelcomeFeedCardSeenDAL` | `read` · `upsert` | `actor_onboarding_steps` |
| `readWelcomeFeedCardStateDAL` | `read` · `upsert` | `actor_onboarding_steps` |

### `listActorPostsByActor.dal.js`

**Path:** `features/feed/dal/listActorPostsByActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listActorPostsByActorDAL` | `read` | `posts` |

### `resolvePublicRealm.dal.js`

**Path:** `features/feed/dal/resolvePublicRealm.dal.js`  
**Operations:** `constant` (no DB access — pure constant return from `@/shared/utils/resolveRealm`)  

**Exported functions:**

| `resolvePublicRealmIdDAL` | `constant` | — (no DB access) |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actions` | READ | `readHiddenPostsForViewer` |
| `actor_follows` | READ | `invalidateFeedFollowCache`, `readActorPrivacyByActorIdsDAL`, `readActorsByIdsDAL`, `readFeedFollowRowsDAL`, `readFollowRowsByActorsDAL`, `readOwnedActorIdsByUserIdDAL`, `readPostActorsByIdsDAL` |
| `actor_onboarding_steps` | UPSERT | `markWelcomeFeedCardSeenDAL`, `readWelcomeFeedCardStateDAL` |
| `actor_owners` | READ | `readActorPrivacyByActorIdsDAL`, `readActorsByIdsDAL`, `readFollowRowsByActorsDAL`, `readOwnedActorIdsByUserIdDAL`, `readPostActorsByIdsDAL` |
| `actor_privacy_settings` | READ | `invalidateActorBundleEntry`, `invalidateActorsBundleCache`, `readActorPrivacyByActorIdsDAL`, `readActorsBundle`, `readActorsByIdsDAL`, `readFollowRowsByActorsDAL`, `readOwnedActorIdsByUserIdDAL`, `readPostActorsByIdsDAL` |
| `actors` | READ | `invalidateActorBundleEntry`, `invalidateActorsBundleCache`, `readActorPrivacyByActorIdsDAL`, `readActorsBundle`, `readActorsByIdsDAL`, `readFollowRowsByActorsDAL`, `readOwnedActorIdsByUserIdDAL`, `readPostActorsByIdsDAL`, `readProfileAdultFlagDAL`, `readViewerActorIdentityDAL` |
| `blocks` | READ | `invalidateFeedBlockCache`, `readFeedBlockRowsDAL` |
| `post_comments` | READ | `readCommentCountsBatch` |
| `post_media` | READ | `invalidatePostMediaCache`, `readPostMediaMap` |
| `post_mentions` | READ | `fetchPostMentionRows`, `readPostMentionRows` |
| `post_reactions` | READ | `readReactionCountsBatch`, `readViewerReactionsBatch` |
| `post_rose_gifts` | READ | `readReactionCountsBatch` |
| `posts` | READ | `listActorPostsByActorDAL`, `listFeedPosts`, `readActorPrivacyByActorIdsDAL`, `readActorsByIdsDAL`, `readFeedPostsPage`, `readFollowRowsByActorsDAL`, `readOwnedActorIdsByUserIdDAL`, `readPostActorsByIdsDAL` |
| `profiles` | READ | `invalidateActorBundleEntry`, `invalidateActorsBundleCache`, `readActorsBundle`, `readProfileAdultFlagDAL`, `readViewerActorIdentityDAL` |

---

## Risk Findings

**Dead artifact — `index.js`:** An empty `index.js` exists in `features/feed/dal/`. It exports nothing and has zero callers. It is not an architectural problem but is unused scaffolding that should be deleted. No function depends on it.

**Diagnostics-only DAL files (3):** The following DAL files and their exported functions are only reachable through the dev diagnostics harness (`feedFeature.group.js` → `diagnosticsGroups.part2.js` → `DevDiagnosticsScreen`). They are intentionally preserved but are NOT production code paths:
- `feed.posts.dal.js` (`listFeedPosts`) — explicitly documented as legacy diagnostics fallback
- `feed.read.viewerContext.dal.js` (`readProfileAdultFlagDAL`, `readViewerActorIdentityDAL`) — viewer context is now sourced from `identity.isAdult` in session, not fetched on demand; these functions exist for diagnostic audit of the read path only
- `listActorPostsByActor.dal.js` (`listActorPostsByActorDAL`) — controller comment claims profile post-tab ownership, but no profile-layer caller exists; only reachable via diagnostics

**Dev-only DAL file (1):** `feed.read.debugPrivacyRows.dal.js` — all 5 functions are gated behind `import.meta.env.DEV` in `DebugPrivacyPanel.jsx` and `CentralFeedScreen.jsx`. They never execute in production. Essential for local privacy visibility debugging.

**Stale call chains (2):** The original doc marked `feed.read.viewerContext.dal.js` and `listActorPostsByActor.dal.js` as "partial chain (no screen reached)." This is accurate but lacks classification — both are intentionally diagnostics-only paths, not broken chains. Corrected below.

---

## Pending Reviews

**DELETE CANDIDATE:** `features/feed/dal/index.js` — empty file, 0 exports, 0 callers. Safe to delete. Requires IRONMAN ownership confirmation before removal.

All other DAL files are either production-live or intentionally preserved diagnostics/dev-only. No other pending reviews.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `feed.mentions.dal.js`

**Direct callers:**

- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.mentions.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.mentions.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.posts.dal.js`

**Classification: DIAGNOSTICS-ONLY (intentionally preserved legacy)**

**Direct callers:**

- `feedFeature.group.js` _Other_

**Chain (diagnostics only — not a production path):**

```
`feed.posts.dal.js` → `feedFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

> `listFeedPosts` is the legacy feed posts DAL. The main production feed pipeline uses `feed.read.posts.dal.js` (`readFeedPostsPage`) instead. This file is explicitly preserved for backwards-compat with the dev diagnostics group and documents the legacy read path.

### `feed.read.actorsBundle.dal.js`

**Direct callers:**

- `feedCache.adapter.js` _Adapter_
- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.actorsBundle.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.actorsBundle.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.read.blockRows.dal.js`

**Direct callers:**

- `feedCache.adapter.js` _Adapter_
- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.blockRows.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.blockRows.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.read.commentCounts.dal.js`

**Direct callers:**

- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.commentCounts.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.commentCounts.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.read.debugPrivacyRows.dal.js`

**Direct callers:**

- `getDebugPrivacyRows.controller.js` _Controller_

**Full call chain to screen:**

```
`feed.read.debugPrivacyRows.dal.js` → `getDebugPrivacyRows.controller.js` → `useDebugPrivacyRows.js` → `DebugPrivacyPanel.jsx`
```
```
`feed.read.debugPrivacyRows.dal.js` → `getDebugPrivacyRows.controller.js` → `useDebugPrivacyRows.js` → `DebugPrivacyPanel.jsx` → `CentralFeedScreen.jsx`
```

### `feed.read.followRows.dal.js`

**Direct callers:**

- `feedCache.adapter.js` _Adapter_
- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.followRows.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.followRows.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.read.hiddenPosts.dal.js`

**Direct callers:**

- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.hiddenPosts.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.hiddenPosts.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.read.media.dal.js`

**Direct callers:**

- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.media.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.media.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.read.posts.dal.js`

**Direct callers:**

- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.posts.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.posts.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.read.reactionCounts.dal.js`

**Direct callers:**

- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.reactionCounts.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.reactionCounts.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feed.read.viewerContext.dal.js`

**Classification: DIAGNOSTICS-ONLY (intentional — viewer context now sourced from session identity)**

**Direct callers:**

- `getFeedViewerContext.controller.js` _Controller_

**Chain (diagnostics only — not a production path):**

```
`feed.read.viewerContext.dal.js` → `getFeedViewerContext.controller.js` → `feedFeature.group.js` → `diagnosticsGroups.part2.js` → `DevDiagnosticsScreen.jsx`
```

> `readProfileAdultFlagDAL` and `readViewerActorIdentityDAL` were previously used to fetch the viewer's adult flag on demand. This was superseded — `identity.isAdult` is now sourced directly from the session in `CentralFeedScreen.jsx`. These functions are intentionally retained for diagnostic audit of the privacy visibility read path (confirming RLS + policy behavior in dev). They do not run in production.

### `feed.read.viewerReactions.dal.js`

**Direct callers:**

- `fetchFeedPage.pipeline.js` _Other_

**Full call chain to screen:**

```
`feed.read.viewerReactions.dal.js` → `fetchFeedPage.pipeline.js` → `useFeed.js` → `useFeed.adapter.js` → `PostFeed.screen.jsx`
```
```
`feed.read.viewerReactions.dal.js` → `fetchFeedPage.pipeline.js` → `fetchCentralFeedPage.js` → `useCentralFeed.js` → `CentralFeedScreen.jsx`
```

### `feedWelcomeCard.dal.js`

**Direct callers:**

- `feedWelcomeCard.controller.js` _Controller_

**Full call chain to screen:**

```
`feedWelcomeCard.dal.js` → `feedWelcomeCard.controller.js` → `useFeedWelcomeCard.js` → `WelcomeFeedCard.jsx` → `CentralFeedScreen.jsx`
```

### `index.js`

**Classification: DEAD ARTIFACT — DELETE CANDIDATE**

> Empty file. 0 exports. 0 callers. No code in the codebase imports from `feed/dal` or `feed/dal/index`. All imports in this feature target individual DAL files directly. This file is unused scaffolding with no purpose. Safe to delete pending IRONMAN ownership confirmation.

### `listActorPostsByActor.dal.js`

**Classification: DIAGNOSTICS-ONLY (controller comment is aspirational — no live profile-layer caller exists)**

**Direct callers:**

- `listActorPosts.controller.js` _Controller_

**Chain (diagnostics only — not a production path):**

```
`listActorPostsByActor.dal.js` → `listActorPosts.controller.js` → `feedFeature.group.js` → `diagnosticsGroups.part2.js` → `DevDiagnosticsScreen.jsx`
```

> The controller's inline comment claims this is the SSOT for "Profile → Posts tab" and "Profile → Photos tab." No such caller exists — grep confirms zero profile-layer imports. The comment is aspirational (intended future refactor target) or from a previous codebase state. This DAL and controller are reachable only from the dev diagnostics harness. Not a production path.

### `resolvePublicRealm.dal.js`

**Direct callers:**

- `publishBarbershopHoursUpdateAsPost.controller.js` _Controller_
- `publishBarbershopPortfolioUpdateAsPost.controller.js` _Controller_
- `publishExchangeRateUpdateAsPost.controller.js` _Controller_
- `publishFuelPriceUpdateAsPost.controller.js` _Controller_
- `publishLocksmithHoursUpdateAsPost.controller.js` _Controller_
- `publishLocksmithPortfolioUpdateAsPost.controller.js` _Controller_
- `publishLocksmithServiceAreaUpdateAsPost.controller.js` _Controller_
- `publishMenuUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`resolvePublicRealm.dal.js` → `publishLocksmithPortfolioUpdateAsPost.controller.js` → `usePortfolioItemSubmit.js`
```
```
`resolvePublicRealm.dal.js` → `publishBarbershopHoursUpdateAsPost.controller.js` → `usePublishBarbershopHoursPost.js` → `VportDashboardCalendarScreen.jsx`
```
```
`resolvePublicRealm.dal.js` → `publishBarbershopPortfolioUpdateAsPost.controller.js` → `usePublishBarbershopPortfolioPost.js` → `VportDashboardPortfolioScreen.jsx`
```
```
`resolvePublicRealm.dal.js` → `publishExchangeRateUpdateAsPost.controller.js` → `usePublishExchangeRatePost.js` → `VportDashboardExchangeScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `buildMentionMaps.model.js`, `feedBlockVisibility.model.js`, `feedFollowVisibility.model.js`, `feedPrivateVisibility.model.js`, `feedRowVisibility.model.js`, `inferMediaType.model.js` +1 more |
| **Controller** | ✓ PRESENT | `feedWelcomeCard.controller.js`, `getDebugPrivacyRows.controller.js`, `getFeedViewerContext.controller.js`, `listActorPosts.controller.js` |
| **Adapter** | ✓ PRESENT | `feedCache.adapter.js`, `useFeed.adapter.js` |
| **Pipeline Aggregator** | ✓ PRESENT | `pipeline/fetchFeedPage.pipeline.js` — sole importer of all 10 production read DALs |
| **Service** | ✓ PRESENT | `queries/fetchCentralFeedPage.js` — React Query queryFn, 15s timeout, multi-page drain |
| **Hook** | ✓ PRESENT | `useCentralFeed.js`, `useCentralFeedActions.js`, `useDebugPrivacyRows.js`, `useFeed.js`, `useFeed.utils.js`, `useFeedConfirmToast.js` +2 more |
| **Component** | ✓ PRESENT | `FeedSkeletonList.jsx`, `WelcomeFeedCard.jsx`, `FeedConfirmModal.jsx` (PRODUCTION — misplaced in `screens/`), `DebugFeedFilterPanel.jsx` (DEV-ONLY — misplaced in `screens/`) |
| **View Screen** | ⚠ IMPLICIT | `CentralFeedScreen.jsx` performs View Screen duties (4 hooks, 10 components rendered) — needs split |
| **Final Screen** | ✓ PRESENT | `CentralFeedScreen.jsx` |

### Model

_Pure transforms — no side effects, no DB access_

- `features/feed/model/buildMentionMaps.model.js`
- `features/feed/model/feedBlockVisibility.model.js`
- `features/feed/model/feedFollowVisibility.model.js`
- `features/feed/model/feedPrivateVisibility.model.js`
- `features/feed/model/feedRowVisibility.model.js`
- `features/feed/model/inferMediaType.model.js`
- `features/feed/model/normalizeFeedRows.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/feed/controller/feedWelcomeCard.controller.js`
- `features/feed/controllers/getDebugPrivacyRows.controller.js`
- `features/feed/controllers/getFeedViewerContext.controller.js`
- `features/feed/controllers/listActorPosts.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/feed/adapters/feedCache.adapter.js`
- `features/feed/adapters/hooks/useFeed.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/feed/hooks/useCentralFeed.js`
- `features/feed/hooks/useCentralFeedActions.js`
- `features/feed/hooks/useDebugPrivacyRows.js`
- `features/feed/hooks/useFeed.js`
- `features/feed/hooks/useFeed.utils.js`
- `features/feed/hooks/useFeedConfirmToast.js`
- `features/feed/hooks/useFeedInfiniteScroll.js`
- `features/feed/hooks/useFeedWelcomeCard.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/feed/components/FeedSkeletonList.jsx`
- `features/feed/components/WelcomeFeedCard.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/feed/screens/CentralFeedScreen.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audit Date:_ 2026-05-11  
_Auditor:_ ARCHITECT static scan + live import grep  
_Scope:_ 16 DAL files · 28 exported functions  
_Method:_ Every exported function name grepped against `apps/VCSM/src/`. Partial chains traced manually. Debug/diagnostics guards inspected in `DebugPrivacyPanel.jsx` and `CentralFeedScreen.jsx`. `index.js` inspected for content and callers.

### Function Status Table

| Function | DAL File | Imported By | Status |
|---|---|---|---|
| `fetchPostMentionRows` | `feed.mentions.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `readPostMentionRows` | `feed.mentions.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `listFeedPosts` | `feed.posts.dal.js` | `feedFeature.group.js` | DIAGNOSTICS-ONLY |
| `invalidateActorBundleEntry` | `feed.read.actorsBundle.dal.js` | `feedCache.adapter.js` | LIVE |
| `invalidateActorsBundleCache` | `feed.read.actorsBundle.dal.js` | `feedCache.adapter.js` | LIVE |
| `readActorsBundle` | `feed.read.actorsBundle.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `invalidateFeedBlockCache` | `feed.read.blockRows.dal.js` | `feedCache.adapter.js` | LIVE |
| `readFeedBlockRowsDAL` | `feed.read.blockRows.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `readCommentCountsBatch` | `feed.read.commentCounts.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `readActorPrivacyByActorIdsDAL` | `feed.read.debugPrivacyRows.dal.js` | `getDebugPrivacyRows.controller.js` | DEV-ONLY (`import.meta.env.DEV`) |
| `readActorsByIdsDAL` | `feed.read.debugPrivacyRows.dal.js` | `getDebugPrivacyRows.controller.js` | DEV-ONLY (`import.meta.env.DEV`) |
| `readFollowRowsByActorsDAL` | `feed.read.debugPrivacyRows.dal.js` | `getDebugPrivacyRows.controller.js` | DEV-ONLY (`import.meta.env.DEV`) |
| `readOwnedActorIdsByUserIdDAL` | `feed.read.debugPrivacyRows.dal.js` | `getDebugPrivacyRows.controller.js` | DEV-ONLY (`import.meta.env.DEV`) |
| `readPostActorsByIdsDAL` | `feed.read.debugPrivacyRows.dal.js` | `getDebugPrivacyRows.controller.js` | DEV-ONLY (`import.meta.env.DEV`) |
| `invalidateFeedFollowCache` | `feed.read.followRows.dal.js` | `feedCache.adapter.js` | LIVE |
| `readFeedFollowRowsDAL` | `feed.read.followRows.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `readHiddenPostsForViewer` | `feed.read.hiddenPosts.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `invalidatePostMediaCache` | `feed.read.media.dal.js` | `feedCache.adapter.js` | LIVE |
| `readPostMediaMap` | `feed.read.media.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `readFeedPostsPage` | `feed.read.posts.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `readReactionCountsBatch` | `feed.read.reactionCounts.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `readProfileAdultFlagDAL` | `feed.read.viewerContext.dal.js` | `getFeedViewerContext.controller.js` | DIAGNOSTICS-ONLY |
| `readViewerActorIdentityDAL` | `feed.read.viewerContext.dal.js` | `getFeedViewerContext.controller.js` | DIAGNOSTICS-ONLY |
| `readViewerReactionsBatch` | `feed.read.viewerReactions.dal.js` | `fetchFeedPage.pipeline.js` | LIVE |
| `markWelcomeFeedCardSeenDAL` | `feedWelcomeCard.dal.js` | `feedWelcomeCard.controller.js` | LIVE |
| `readWelcomeFeedCardStateDAL` | `feedWelcomeCard.dal.js` | `feedWelcomeCard.controller.js` | LIVE |
| `listActorPostsByActorDAL` | `listActorPostsByActor.dal.js` | `listActorPosts.controller.js` | DIAGNOSTICS-ONLY |
| `resolvePublicRealmIdDAL` | `resolvePublicRealm.dal.js` | 8 vport publish controllers | LIVE |

### DAL File Inventory

| Status | Count |
|---|---|
| DAL files on disk | 17 (16 documented + 1 undocumented `index.js`) |
| DAL files in doc | 16 |
| Dead artifact on disk not in doc | 1 (`index.js` — empty, no exports, no callers) |
| Dead functions | 0 |

### Verdict by Classification

| Classification | Count | Functions |
|---|---|---|
| LIVE (production pipeline) | 21 | All `fetchFeedPage.pipeline` consumers + cache invalidators + `resolvePublicRealmIdDAL` + `feedWelcomeCard` pair |
| DEV-ONLY (env-gated) | 5 | All `feed.read.debugPrivacyRows.dal.js` exports |
| DIAGNOSTICS-ONLY (dev harness only) | 3 | `listFeedPosts`, `readProfileAdultFlagDAL`, `readViewerActorIdentityDAL`, `listActorPostsByActorDAL` |
| TRUE DEAD CODE | 0 | — |
| DEAD ARTIFACT (file) | 1 | `index.js` |

### Audit Verdict

**No true dead code among the 28 exported functions.** The feed DAL layer follows a deliberate three-tier pattern: production pipeline functions, dev diagnostics, and a legacy diagnostics fallback. One empty `index.js` artifact exists and is a deletion candidate.

---

## Native Parity Notes

Native Relevance: YES  
Falcon Review: REQUIRED  
Related Native Module: `feed` — central feed, post rendering, reaction counts, media, hidden posts, and welcome card are all core user-facing surfaces.  
Native Transfer Status: PENDING FALCON  
Known Native Gaps: Not yet assessed. The diagnostics-only DAL functions (`feed.read.viewerContext`, `listActorPostsByActor`, `feed.posts`) are dev harness paths and have no native parity concern. The 5 `DEV-ONLY` functions are excluded from production and native. The 21 live production functions are all native-relevant and must be reviewed by Falcon.  
Winter Soldier Handoff: Not yet initiated.

---

## Command Evidence Registry

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.feed.md` (this doc) | Initial DAL map + dead code audit source | PRESENT |
| VENOM | — | Trust boundary — feed privacy reads, viewer context, hidden posts | MISSING |
| SENTRY | — | Architecture boundary — diagnostics vs production separation | MISSING |
| FALCON | — | Native parity for feed, reactions, media, welcome card | MISSING |
| LOKI | — | Runtime trace for `fetchFeedPage.pipeline` read path | MISSING |
| KRAVEN | — | Performance — 21 functions fire per feed page load via pipeline | MISSING |
| CARNAGE | — | DB migration history for `posts`, `post_reactions`, `post_media`, `actor_follows` | MISSING |
| IRONMAN | — | Ownership confirmation required before deleting `index.js` | MISSING |

---

---

## Consumer Map

_Appended:_ 2026-05-11  
_Source:_ ARCHITECT static scan — full layer trace from DAL up to Screen  
_Scope:_ All 16 production DAL files · pipeline · adapters · controllers · hooks · screens  

This section answers: **what model, controller, hook, and screen touches each DAL file?**

---

### Primary Aggregator — `fetchFeedPage.pipeline.js`

The pipeline is the central direct consumer of 10 of 16 DAL files. All main feed surfaces reach DAL exclusively through this file.

| DAL File | Function Imported | Pipeline Role |
|---|---|---|
| `feed.read.posts.dal.js` | `readFeedPostsPage` | page-cursor fetch — first query in pipeline |
| `feed.read.media.dal.js` | `readPostMediaMap` | media rows for the current page |
| `feed.read.hiddenPosts.dal.js` | `readHiddenPostsForViewer` | hidden post set for viewer |
| `feed.read.actorsBundle.dal.js` | `readActorsBundle` | actors + profiles + vport map |
| `feed.read.blockRows.dal.js` | `readFeedBlockRowsDAL` | block rows for viewer |
| `feed.read.followRows.dal.js` | `readFeedFollowRowsDAL` | follow rows for viewer |
| `feed.mentions.dal.js` | `fetchPostMentionRows` | @mention rows (conditional — only if `@` in post text) |
| `feed.read.commentCounts.dal.js` | `readCommentCountsBatch` | batched comment counts |
| `feed.read.viewerReactions.dal.js` | `readViewerReactionsBatch` | viewer's own reactions |
| `feed.read.reactionCounts.dal.js` | `readReactionCountsBatch` | aggregate reaction counts |

All 10 reads execute in a single `Promise.all()` — no sequential reads, no N+1.

---

### Models — Downstream of Pipeline (no direct DAL imports)

Models receive pre-fetched data from the pipeline. None import DAL files directly.

| Model | File | Consumes output from |
|---|---|---|
| `buildBlockedActorSetModel` | `feedBlockVisibility.model.js` | `readFeedBlockRowsDAL` (via pipeline `blockRows`) |
| `isActorBlockedForViewerModel` | `feedBlockVisibility.model.js` | `blockedActorSet` built above |
| `buildFollowedActorSetModel` | `feedFollowVisibility.model.js` | `readFeedFollowRowsDAL` (via pipeline `followRows`) |
| `isActorFollowedByViewerModel` | `feedFollowVisibility.model.js` | `followedActorSet` built above |
| `buildMentionMaps` | `buildMentionMaps.model.js` | `fetchPostMentionRows` (via pipeline `mentionRows`) |
| `resolveFeedRowVisibilityModel` | `feedRowVisibility.model.js` | `blockSet` + `followSet` + `actorMap` + `profileMap` + `vportMap` (all via pipeline) |
| `canViewPrivateFeedActorModel` | `feedPrivateVisibility.model.js` | called by `feedRowVisibility.model.js` |
| `normalizeFeedRows` | `normalizeFeedRows.model.js` | all 10 pipeline reads assembled into a normalized post array |
| `inferMediaType` | `inferMediaType.model.js` | called inside `normalizeFeedRows` — infers type from media URL |

**Call chain (models):**

```
fetchFeedPage.pipeline.js
 → readFeedBlockRowsDAL   → buildBlockedActorSetModel (feedBlockVisibility.model.js)
 → readFeedFollowRowsDAL  → buildFollowedActorSetModel (feedFollowVisibility.model.js)
 → fetchPostMentionRows   → buildMentionMaps (buildMentionMaps.model.js)
 → [all 10 DAL outputs]   → normalizeFeedRows (normalizeFeedRows.model.js)
                               → resolveFeedRowVisibilityModel (feedRowVisibility.model.js)
                                   → canViewPrivateFeedActorModel (feedPrivateVisibility.model.js)
                               → inferMediaType (inferMediaType.model.js)
```

---

### Adapter — `feedCache.adapter.js`

Re-exports 3 cache invalidators directly from DAL. The only cross-feature boundary that exposes DAL-level cache busting.

| DAL File | Function Re-exported | Purpose |
|---|---|---|
| `feed.read.blockRows.dal.js` | `invalidateFeedBlockCache` | bust block cache on block/unblock write |
| `feed.read.followRows.dal.js` | `invalidateFeedFollowCache` | bust follow cache on follow/unfollow write |
| `feed.read.actorsBundle.dal.js` | `invalidateActorBundleEntry` | bust single actor's bundle cache |

`feedCache.adapter.js` is the approved cross-feature boundary — external features call these invalidators instead of touching DAL files directly.

---

### Controllers — Direct DAL Consumers

| Controller | File | DAL Imported | Classification |
|---|---|---|---|
| `feedWelcomeCard.controller.js` | `features/feed/controller/` | `readWelcomeFeedCardStateDAL`, `markWelcomeFeedCardSeenDAL` from `feedWelcomeCard.dal.js` | PRODUCTION |
| `getDebugPrivacyRows.controller.js` | `features/feed/controllers/` | all 5 exports from `feed.read.debugPrivacyRows.dal.js` | DEV-ONLY |
| `getFeedViewerContext.controller.js` | `features/feed/controllers/` | `readProfileAdultFlagDAL`, `readViewerActorIdentityDAL` from `feed.read.viewerContext.dal.js` | DIAGNOSTICS-ONLY |
| `listActorPosts.controller.js` | `features/feed/controllers/` | `listActorPostsByActorDAL` from `listActorPostsByActor.dal.js` | DIAGNOSTICS-ONLY |
| 8 vport publish controllers | `features/profiles/kinds/vport/controller/[domain]/publish*.controller.js` | `resolvePublicRealmIdDAL` from `resolvePublicRealm.dal.js` | PRODUCTION (cross-feature) |

**Note on `feedWelcomeCard.controller.js`:** Located in `controller/` (singular), not `controllers/` (plural). Naming inconsistency — not a duplicate. Both folders exist.

**Note on vport publish controllers:** `resolvePublicRealm.dal.js` lives inside the feed DAL folder but is exclusively consumed by vport publish controllers in another feature. The DAL file resolves the public realm ID before stamping posts. This is a valid cross-feature dependency through an approved path (controller → DAL, single direction).

---

### Hooks — DAL consumers via controller or pipeline

| Hook | File | Calls | DAL Reach | Classification |
|---|---|---|---|---|
| `useFeed.js` | `features/feed/hooks/` | `fetchFeedPagePipeline` | all 10 production pipeline DALs | PRODUCTION |
| `useCentralFeed.js` | `features/feed/hooks/` | `fetchCentralFeedPage` → `fetchFeedPagePipeline` | all 10 production pipeline DALs | PRODUCTION |
| `useFeedWelcomeCard.js` | `features/feed/hooks/` | `ctrlGetWelcomeCardVisible`, `ctrlMarkWelcomeCardSeen` | `feedWelcomeCard.dal.js` | PRODUCTION |
| `useDebugPrivacyRows.js` | `features/feed/hooks/` | `getDebugPrivacyRowsController` | `feed.read.debugPrivacyRows.dal.js` | DEV-ONLY |

**`useFeed.adapter.js`** — thin re-export of `useFeed.js`. Not a hook of its own; it exposes `useFeed` to external features (`PostFeed.screen.jsx`) without those features importing from feed internals directly.

---

### Screens & Components — DAL consumers via hook

| Screen / Component | File | Hook Used | DAL Reach | Classification |
|---|---|---|---|---|
| `CentralFeedScreen.jsx` | `features/feed/screens/` | `useCentralFeed` | all 10 pipeline DALs + `feedWelcomeCard.dal.js` | PRODUCTION — primary feed surface |
| `PostFeed.screen.jsx` | `features/post/screens/` | `useFeed` (via `useFeed.adapter.js`) | all 10 pipeline DALs | PRODUCTION — secondary feed surface (post feature) |
| `WelcomeFeedCard.jsx` | `features/feed/components/` | `useFeedWelcomeCard` | `feedWelcomeCard.dal.js` | PRODUCTION — rendered inside `CentralFeedScreen` |
| `DebugPrivacyPanel.jsx` | `features/feed/screens/` | `useDebugPrivacyRows` | `feed.read.debugPrivacyRows.dal.js` | DEV-ONLY — rendered inside `CentralFeedScreen` when `?debug=privacy` |

---

### Full Consumer Matrix

| DAL File | Direct Importer | Layer | Hook | Screen | Classification |
|---|---|---|---|---|---|
| `feed.read.posts.dal.js` | `fetchFeedPage.pipeline.js` | Pipeline | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.read.media.dal.js` | `fetchFeedPage.pipeline.js` | Pipeline | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.read.hiddenPosts.dal.js` | `fetchFeedPage.pipeline.js` | Pipeline | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.read.actorsBundle.dal.js` | `fetchFeedPage.pipeline.js`, `feedCache.adapter.js` | Pipeline + Adapter | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.read.blockRows.dal.js` | `fetchFeedPage.pipeline.js`, `feedCache.adapter.js` | Pipeline + Adapter | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.read.followRows.dal.js` | `fetchFeedPage.pipeline.js`, `feedCache.adapter.js` | Pipeline + Adapter | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.mentions.dal.js` | `fetchFeedPage.pipeline.js` | Pipeline | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.read.commentCounts.dal.js` | `fetchFeedPage.pipeline.js` | Pipeline | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.read.viewerReactions.dal.js` | `fetchFeedPage.pipeline.js` | Pipeline | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feed.read.reactionCounts.dal.js` | `fetchFeedPage.pipeline.js` | Pipeline | `useFeed`, `useCentralFeed` | `CentralFeedScreen`, `PostFeed.screen` | PRODUCTION |
| `feedWelcomeCard.dal.js` | `feedWelcomeCard.controller.js` | Controller | `useFeedWelcomeCard` | `WelcomeFeedCard` → `CentralFeedScreen` | PRODUCTION |
| `feed.read.debugPrivacyRows.dal.js` | `getDebugPrivacyRows.controller.js` | Controller | `useDebugPrivacyRows` | `DebugPrivacyPanel` → `CentralFeedScreen` | DEV-ONLY |
| `feed.read.viewerContext.dal.js` | `getFeedViewerContext.controller.js` | Controller | diagnostics harness only | `DevDiagnosticsScreen` | DIAGNOSTICS-ONLY |
| `listActorPostsByActor.dal.js` | `listActorPosts.controller.js` | Controller | diagnostics harness only | `DevDiagnosticsScreen` | DIAGNOSTICS-ONLY |
| `feed.posts.dal.js` | `feedFeature.group.js` | Diagnostics | diagnostics harness only | `DevDiagnosticsScreen` | DIAGNOSTICS-ONLY |
| `resolvePublicRealm.dal.js` | 8 vport publish controllers | Controller (cross-feature) | `usePublishBarbershop*`, `usePublishExchangeRate*`, `usePortfolioItemSubmit` | vport dashboard screens | PRODUCTION (cross-feature) |

---

### Architectural Observations

**Single aggregation point.** The pipeline (`fetchFeedPage.pipeline.js`) is the only file that directly calls the 10 production read DALs. No hook or screen bypasses it. This is intentional and correct — it enforces batching and prevents N+1 at the call site.

**Two parallel hook surfaces.** `useFeed.js` and `useCentralFeed.js` implement the same public API but through different data-fetching strategies (custom loop vs React Query `useInfiniteQuery`). Both reach the same pipeline. `PostFeed.screen.jsx` uses the older `useFeed` path; `CentralFeedScreen.jsx` uses the newer `useCentralFeed` path.

**`resolvePublicRealm.dal.js` ownership gap.** This DAL lives in the feed DAL folder but has zero feed-layer consumers. All 8 callers are vport dashboard publish controllers in a different feature. The DAL belongs to the vport publish write path, not the feed read path. It is a cross-feature DAL living in the wrong folder. This is a noted boundary smell — flagged for IRONMAN / SENTRY review.

**`feedWelcomeCard.controller.js` folder inconsistency.** The welcome card controller lives in `controller/` (singular) while all other controllers are in `controllers/` (plural). Not a functional problem but creates noise when grepping for controllers. Flag for SENTRY review.

---

## Change Log

### 2026-05-11 (Consumer Map)

**Task:** Full consumer map — trace every model, controller, hook, and screen that touches each feed DAL file  
**Application Scope:** VCSM  
**Prompt:** User requested ARCHITECT consumer map for `vcsm.dal.feed.md`  
**Code Status Before:** Consumer relationships documented only in "Call Chains" section (DAL → Screen, no per-layer breakdown)  
**Code Status After:** No code changes — audit only. New "Consumer Map" section appended with: pipeline import table, model chain, adapter re-export map, per-controller DAL imports, per-hook DAL reach, per-screen hook chain, full consumer matrix, and architectural observations.  
**Files Changed:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.feed.md` (this file)  
**Command Evidence:** ARCHITECT static scan — read `fetchFeedPage.pipeline.js`, `feedCache.adapter.js`, `fetchCentralFeedPage.js`, all 4 controllers, all 4 hooks, all 7 models, `CentralFeedScreen.jsx`, `DebugPrivacyPanel.jsx`, `PostFeed.screen.jsx`, `useFeed.adapter.js`  
**Architecture Contracts Checked:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md  
**Key Findings:**  
- Pipeline is the sole direct consumer of all 10 production read DALs — no bypass  
- `useFeed` (loop) and `useCentralFeed` (React Query) both reach same pipeline  
- `resolvePublicRealm.dal.js` lives in feed DAL folder but is 100% consumed by cross-feature vport controllers — boundary smell flagged for SENTRY/IRONMAN  
- `feedWelcomeCard.controller.js` lives in `controller/` (singular) vs all others in `controllers/` (plural) — naming inconsistency flagged for SENTRY  
**Documentation Truth Status:** VERIFIED  
**Native Documentation Verification:** PENDING FALCON

---

### 2026-05-11 (Dead Code Audit)

**Task:** Dead code audit of feed DAL layer — verify all 16 DAL files and 28 exported functions; resolve partial chains; classify diagnostics vs dead code  
**Application Scope:** VCSM  
**Prompt:** User requested ARCHITECT dead code detection on `vcsm.dal.feed.md`, confirmed findings, then requested Logan update  
**Code Status Before:** 2 partial chains unlabelled. `index.js` flagged as "possibly dead." `feed.read.debugPrivacyRows.dal.js` chain not classified. Risk Findings and Pending Reviews were empty placeholders.  
**Code Status After:** No code changes — audit only. Documentation updated.  
**Files Changed:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.feed.md` (this file)  
**Command Evidence:** ARCHITECT static scan + live import grep across `apps/VCSM/src/` + `DebugPrivacyPanel.jsx` and `CentralFeedScreen.jsx` env-gate inspection  
**Architecture Contracts Checked:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md  
**Security / Runtime / DB Notes:** `feed.read.debugPrivacyRows.dal.js` is fully gated by `import.meta.env.DEV` — never executes in production. `index.js` is an empty dead artifact. `listActorPostsByActor.dal.js` controller comment claims profile ownership that does not exist in code — aspirational comment, not a live contract.  
**Validation:** 21 functions confirmed live production paths. 5 confirmed dev-only. 3 confirmed diagnostics-only. 0 true dead code. 1 dead artifact file (`index.js`) identified as deletion candidate.  
**Documentation Truth Status:** VERIFIED  
**Native Documentation Verification:** PENDING FALCON

---

## Avengers Assembly Report — 2026-05-11

**Run Summary**

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | User — targeted single-doc AvengersAssemble pass |
| Application Scope | VCSM |
| Branch | `vport-booking-feed-security-updates` |
| Document Scope | `vcsm.dal.feed.md` — feed DAL layer only |
| Passes Completed | ARCHITECT · VENOM · LOGAN · review-contract · Session-Summary Structure |
| Read-Only | YES — no source code modified |
| Feed DAL changes on branch | NONE — zero feed files modified on this branch |

---

### ARCHITECT

**Status: DRIFT FOUND**

**Finding 1 — `resolvePublicRealm.dal.js` operation classified as `unknown` (MODERATE)**

The doc marks `resolvePublicRealmIdDAL` with operation `unknown` and table `—`. Actual implementation:

```js
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";

export function resolvePublicRealmIdDAL() {
  return PUBLIC_REALM_ID;
}
```

This is a **pure constant lookup** — synchronous, no Supabase call, no table access, no async. Operation should be classified as `constant` not `unknown`. Tables column is correctly `—`.

Secondary concern: a pure constant resolver living inside the DAL layer contains no DB access but is named as a DAL. This is flagged for SENTRY review.

**Finding 2 — vport publish controller paths incorrect in Consumer Map and Call Chains (MODERATE)**

The Consumer Map and Call Chains sections document the 8 vport publish controllers at:

```
features/dashboard/vport/controller/publish*.js
```

Actual paths (verified by grep):

```
features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js
features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js
features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js
features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js
features/profiles/kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller.js
features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js
features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js
features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js
```

The `features/dashboard/vport/controller/` path is a different controller directory (booking and team controllers live there). The publish controllers live under `features/profiles/kinds/vport/`. Count is correct (8), paths are wrong.

**Finding 3 — `FeedConfirmModal.jsx` undocumented production component (MODERATE)**

`features/feed/screens/FeedConfirmModal.jsx` exists on disk (68 lines) and is imported and rendered in `CentralFeedScreen.jsx`. It is a production confirm modal (no `import.meta.env.DEV` gate). It handles Escape key dismissal via `useEffect` and renders a full-screen overlay with two button variants (danger / neutral). It is not documented anywhere in this doc.

Classification concern: This file lives in `screens/` but is a reusable modal component. Its location in `screens/` may contribute to discovery gaps.

**Finding 4 — `DebugFeedFilterPanel.jsx` undocumented dev component (LOW)**

`features/feed/screens/DebugFeedFilterPanel.jsx` exists on disk (58 lines) and is imported in `CentralFeedScreen.jsx`. It is fully gated by `if (!isDev || ...) return null` — never renders in production. It renders a tabular feed visibility debug overlay (post_id, actor_id, visibility reason). Not documented in this doc. Comparable to `DebugPrivacyPanel.jsx` (which is documented).

**Finding 5 — Four additional undocumented empty `index.js` artifacts (LOW)**

The doc documents only `dal/index.js` as a dead artifact deletion candidate. Four additional empty `index.js` files exist in the feed feature:

| Path | Content | Documented |
|---|---|---|
| `features/feed/dal/index.js` | Empty | YES — deletion candidate |
| `features/feed/adapters/index.js` | Empty | NO |
| `features/feed/hooks/index.js` | Empty | NO |
| `features/feed/model/index.js` | Empty | NO |
| `features/feed/screens/index.js` | Empty | NO |

All four undocumented files are empty scaffolding with no exports and no callers. All are deletion candidates pending IRONMAN ownership confirmation.

---

### VENOM

**Status: ALIGNED**

No new unmitigated trust boundary issues found for the feed DAL layer.

Observations:
- All 5 DEV-ONLY functions (`feed.read.debugPrivacyRows.dal.js`) are correctly env-gated — they never execute in production
- `resolvePublicRealmIdDAL` is a pure constant — it does not expose any data read surface
- Feed privacy reads (`readFeedBlockRowsDAL`, `readFeedFollowRowsDAL`, `readActorsBundle`) go through the pipeline aggregator, not exposed to individual screens — correct pattern
- No feed DAL files were modified on this branch

Recommendation: VENOM full auth surface review still MISSING from command evidence registry.

---

### LOGAN

**Status: DRIFT FOUND**

**Logan Finding 1 — `resolvePublicRealm.dal.js` operations metadata wrong (MODERATE)**

Doc table entry shows:
```
| `resolvePublicRealmIdDAL` | `unknown` | — |
```

Correct entry:
```
| `resolvePublicRealmIdDAL` | `constant` | — (no DB access) |
```

The `unknown` classification is misleading and implies a DB call exists but was not traced. It was a pure constant lookup from the start.

**Logan Finding 2 — Consumer Map controller paths incorrect (MODERATE)**

Two places in the doc cite `features/dashboard/vport/controller/` as the home of the vport publish controllers. Both are wrong. Correct root is `features/profiles/kinds/vport/controller/[domain]/`. Affects:
- Call Chains section for `resolvePublicRealm.dal.js`
- Consumer Map → Controllers table
- Architectural Observations note

**Logan Finding 3 — `FeedConfirmModal.jsx` absent from all documentation sections (MODERATE)**

`FeedConfirmModal` is a production component that renders inside `CentralFeedScreen.jsx`. It is:
- Not listed in the Architecture Pipeline (not in Component, not in Final Screen, not in View Screen)
- Not listed in Dead Code Audit
- Not listed in Consumer Map → Screens & Components
- Not listed in Full Consumer Matrix

As it has no DAL dependency it has no function-level entry in this doc, but as an architectural component of the feed feature it belongs in the Architecture Pipeline and Consumer Map.

**Logan Finding 4 — `DebugFeedFilterPanel.jsx` absent from documentation sections (LOW)**

Same as Finding 3 but for the dev-only filter panel. Unlike `DebugPrivacyPanel.jsx` (documented as DEV-ONLY), this component is fully undocumented.

**Logan Finding 5 — Undocumented `index.js` artifacts outside `dal/` (LOW)**

Four empty `index.js` files not documented. Deletion candidate scope in the doc is limited to `dal/index.js`; the others are not mentioned.

---

### review-contract

**Status: MINOR NOTES**

| Check | Result |
|---|---|
| No `select('*')` violations | PASS — existing files confirmed clean in prior audit; no new feed files on branch |
| No TypeScript files | PASS |
| No relative `../../` imports | PASS — `resolvePublicRealm.dal.js` uses `@/shared/utils/resolveRealm` correctly |
| Layer order DAL → Controller respected | PASS |
| Cross-feature access through adapter only | PASS — `feedCache.adapter.js` is the approved boundary |
| No feed DAL changes on this branch | CONFIRMED — zero drift from branch work |

**Minor Note 1 — `resolvePublicRealm.dal.js` layer classification**

A function that returns a constant from a shared utility does not access the database and does not satisfy the architecture contract's definition of DAL as "Raw Supabase access only." Not critical (reads no user data, mutates nothing) but is a boundary smell. Flagged for SENTRY review.

**Minor Note 2 — `CentralFeedScreen.jsx` has View Screen responsibilities**

The doc classifies `CentralFeedScreen.jsx` as a Final Screen. However, it directly renders `FeedConfirmModal` and `DebugFeedFilterPanel` as siblings — making it a composition hub that acts more like a View Screen. Per contract, Final Screens are "route entry + identity gate only — no computation." A screen that conditionally renders modals and debug panels is doing View Screen work.

**Minor Note 3 — `FeedConfirmModal.jsx` placed in `screens/` folder**

This is a reusable modal component (no routing, no identity gate). Its placement in `screens/` instead of `components/` is incorrect per contract. Modal components belong in `components/`.

---

### Session-Summary Structure

**Status: ISSUE (carryover from auth doc pass)**

| Check | Result |
|---|---|
| `2026-05` month folder exists | MISSING — no `session-summaries/2026-05/` folder |
| `2026-04` has month summary | PRESENT — `2026-04_month_summary.md` exists |
| Stray `.md` files at root | NONE — clean |
| CLAUDE.md command inventory matches `.claude/commands/` | DRIFT — AvengersAssemble, Cerebro, SHIELD, Sentry, WinterSoldier absent from CLAUDE.md table |

---

### Governance Evidence Registry

| Command | Status | Drift | Blocking |
|---|---|---|---|
| ARCHITECT | PRESENT | DRIFT FOUND | NO — doc drift only |
| VENOM | PRESENT (inline pass) | ALIGNED | NO |
| LOGAN | PRESENT (inline pass) | DRIFT FOUND | NO — doc drift only |
| review-contract | PRESENT (inline pass) | MINOR NOTES | NO |
| IRONMAN | MISSING | N/A — ownership needed for 5 index.js cleanups | NO |
| SENTRY | MISSING | N/A — resolvePublicRealm DAL boundary + CentralFeedScreen layer purity | NO |
| LOKI | MISSING | N/A | NO |
| KRAVEN | MISSING | N/A | NO |
| CARNAGE | MISSING | N/A | NO |
| FALCON | MISSING | N/A | NO |
| WINTER SOLDIER | MISSING | N/A | NO |
| SHIELD | MISSING | N/A | NO |

---

### Cross-System Contradictions

| System A | System B | Contradiction | Severity | Resolution |
|---|---|---|---|---|
| ARCHITECT (controller path: `dashboard/vport`) | Filesystem (controller path: `profiles/kinds/vport`) | Consumer Map and Call Chains cite wrong feature root for 8 publish controllers | MODERATE | Update all path references to `features/profiles/kinds/vport/controller/[domain]/` |
| ARCHITECT (DAL operation: `unknown`) | Code (operation: constant return) | `resolvePublicRealmIdDAL` shown as potential DB operation when it is a pure constant | MODERATE | Reclassify as `constant`; add boundary smell note |
| LOGAN (FeedConfirmModal absent) | Filesystem (FeedConfirmModal: production) | Production component in active use has zero documentation | MODERATE | Add to Architecture Pipeline Components section and Full Consumer Matrix |

---

### Documentation Truth Review

| Doc Section | Truth Status | Drift | Blocking |
|---|---|---|---|
| DAL Files (count: 16) | ALIGNED | None | NO |
| Exported Functions (count: 28) | ALIGNED | None | NO |
| `resolvePublicRealm.dal.js` operation | DRIFT | `unknown` should be `constant` | NO |
| Tables Accessed (14 tables) | ALIGNED | None | NO |
| RPCs Called (0) | ALIGNED | None | NO |
| Risk Findings | ALIGNED | None | NO |
| Call Chains — `resolvePublicRealm.dal.js` | DRIFT | terminal controller paths wrong | NO |
| Architecture Pipeline — Component | DRIFT | FeedConfirmModal absent | NO |
| Architecture Pipeline — Final Screen | MINOR | CentralFeedScreen has View layer duties | NO |
| Dead Code Audit | PARTIAL DRIFT | index.js scope limited to dal/; 4 others uncovered | NO |
| Consumer Map — Controllers | DRIFT | vport publish controller paths wrong | NO |
| Consumer Map — Screens | DRIFT | FeedConfirmModal + DebugFeedFilterPanel absent | NO |
| Consumer Map — Full Matrix | DRIFT | FeedConfirmModal absent | NO |
| Native Parity Notes | ALIGNED | PENDING FALCON correctly noted | NO |
| Command Evidence Registry | ALIGNED | All MISSING statuses correctly noted | NO |

---

### Overall Status

**DRIFT FOUND — not release-blocking**

All drift is documentation-only. No source code violations. No security vulnerabilities. No broken DAL chains. No dead code found beyond already-identified artifacts. Zero feed DAL changes on this branch.

Drift is confined to:
- `resolvePublicRealm.dal.js` operation misclassified as `unknown`
- vport publish controller paths incorrect across Call Chains + Consumer Map
- `FeedConfirmModal.jsx` (production) and `DebugFeedFilterPanel.jsx` (dev) undocumented
- 4 additional empty `index.js` artifacts undocumented
- `FeedConfirmModal.jsx` misplaced in `screens/` instead of `components/`

---

### Recommended Next Steps

| Priority | Action | Command |
|---|---|---|
| HIGH | Fix vport publish controller paths in Call Chains and Consumer Map (`dashboard/vport` → `profiles/kinds/vport/controller/[domain]/`) | LOGAN doc update |
| HIGH | Add `FeedConfirmModal.jsx` to Architecture Pipeline Components + Consumer Map Screens + Full Consumer Matrix | LOGAN doc update |
| MEDIUM | Reclassify `resolvePublicRealm.dal.js` operation from `unknown` to `constant`; add boundary smell note | LOGAN doc update |
| MEDIUM | Add `DebugFeedFilterPanel.jsx` as DEV-ONLY entry in Architecture Pipeline and Consumer Map | LOGAN doc update |
| MEDIUM | Expand Dead Code Audit `index.js` scope to cover all 5 empty artifacts | LOGAN doc update |
| MEDIUM | Create `session-summaries/2026-05/` folder | Session hygiene |
| LOW | SENTRY review: `resolvePublicRealm.dal.js` — pure constant in DAL layer | SENTRY |
| LOW | SENTRY review: `CentralFeedScreen.jsx` View Screen duties + `feedWelcomeCard.controller.js` singular folder | SENTRY |
| LOW | Move `FeedConfirmModal.jsx` from `screens/` to `components/` | Wolverine refactor |
| LOW | IRONMAN ownership confirmation for all 5 `index.js` deletion candidates | IRONMAN |
| LOW | Add AvengersAssemble, Cerebro, SHIELD, Sentry, WinterSoldier to CLAUDE.md command table | CAPTAIN / CLAUDE.md update |

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.feed.md` | Appended this verification/fix-pass record. No source files changed for feed. |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| `resolvePublicRealm.dal.js` operation misclassified as `unknown` | DOCUMENTED | Live code confirms `resolvePublicRealmIdDAL` returns `PUBLIC_REALM_ID` from `shared/utils/resolveRealm.js`; it is a constant lookup with no DB/RPC access. |
| vport publish controller paths documented under `features/dashboard/vport/controller` | DOCUMENTED | Live grep confirms the 8 publish controllers live under `features/profiles/kinds/vport/controller/[domain]/`. |
| `FeedConfirmModal.jsx` undocumented production component | DOCUMENTED | Live grep confirms `CentralFeedScreen.jsx` imports and renders it. No move performed because that would be a source refactor. |
| `DebugFeedFilterPanel.jsx` undocumented dev component | DOCUMENTED | Live grep confirms `CentralFeedScreen.jsx` imports it and renders it only through debug state. |
| Empty `index.js` artifacts | DEFERRED | Confirmed multiple empty scaffolding files under feed (`dal`, `adapters`, `hooks`, `model`, `screens`, plus additional empty `api`, `lib`, `ui`, `usecases`). No files deleted per user instruction. |
| `resolvePublicRealm.dal.js` boundary smell | DEFERRED | Pure constant resolver remains in DAL; SENTRY ownership decision required. |
| `CentralFeedScreen.jsx` View Screen duties and modal placement | DEFERRED | Requires source refactor / architecture review; not changed in this pass. |
| Native feed parity | DEFERRED | FALCON remains required. |

### Verification

- Commands/searches run:
  - `grep -rn "resolvePublicRealmIdDAL\\|PUBLIC_REALM_ID\\|FeedConfirmModal\\|DebugFeedFilterPanel\\|feed/dal/index\\|features/dashboard/vport/controller/publish\\|features/profiles/kinds/vport/controller/.*/publish" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `find apps/VCSM/src/features/feed -name index.js -type f -maxdepth 4 -print -exec wc -c {} \\;`
  - `grep -rn "readFeedPostsPage\\|fetchFeedPagePipeline\\|feed.read.viewerContext\\|listActorPostsByActorDAL\\|feed.posts.dal\\|feed.read.debugPrivacyRows" apps/VCSM/src --include='*.js' --include='*.jsx'`
- Production callers checked:
  - `CentralFeedScreen.jsx` imports/renders `FeedConfirmModal.jsx` and `DebugFeedFilterPanel.jsx`.
  - `resolvePublicRealmIdDAL` callers under `features/profiles/kinds/vport/controller/[domain]/`.
  - Main feed read path through `fetchFeedPage.pipeline.js`.
  - Diagnostics-only paths through `dev/diagnostics/groups/feedFeature.group.js`.
- Remaining risks:
  - No delete-candidate files removed per user instruction.
  - SENTRY still needed for `resolvePublicRealm.dal.js` DAL classification and `CentralFeedScreen.jsx` layer duties.
  - IRONMAN still needed for empty `index.js` ownership.
  - FALCON still needed for native feed parity.

### Status

PARTIAL

---

---

## CEREBRO Verification Run — 2026-05-14

_Triggered by:_ User — targeted CEREBRO pass on `vcsm.dal.feed.md`  
_Date:_ 2026-05-14  
_Branch:_ `vport-booking-feed-security-updates`  
_Read-Only:_ YES — no source code modified in this pass  
_Feed DAL changes on branch:_ NONE

---

### Phase 0 — CEREBRO Classification

CEREBRO read all 17 DAL files, the pipeline, the queries (Service) layer, all hooks, both screens, FeedConfirmModal, DebugFeedFilterPanel, PullToRefresh component, vportClient, and the debugger alias resolution in vite.config.js.

**Risk Registry**

| ID | Category | Description | Severity |
|---|---|---|---|
| B1 | iOS / FALCON | `FeedConfirmModal` (position:fixed) inside `PullToRefresh` transform wrapper — breaks on iOS Safari during pull gesture | BLOCKING |
| A2 | SENTRY | `feed.mentions.dal.js` imports `@hydration` engine — DAL-to-engine backwards layer dependency | HIGH |
| S3 | VENOM | `markWelcomeFeedCardSeenDAL` UPSERT with client-supplied `actorId` — write path without documented RLS enforcement | HIGH |
| P1 | KRAVEN | Cold-cache first page: 13–15 DB queries per pipeline call; up to 25–30 on initial load if drain loop fires | HIGH |
| A1 | SENTRY | `resolvePublicRealm.dal.js` is a pure constant in the DAL layer — no DB access; wrong layer by contract | MODERATE |
| A3 | SENTRY | `FeedConfirmModal.jsx` placed in `screens/` — contract requires modals in `components/` | MODERATE |
| A4 | SENTRY | `CentralFeedScreen.jsx` performs View Screen duties (4 hooks, 10 components, 5 modals/overlays) | MODERATE |
| A5 | SENTRY | `pipeline/` and `queries/` subdirectories not documented in Architecture Pipeline | MODERATE |
| S1 | VENOM | `readHiddenPostsForViewer` passes client-supplied `viewerActorId` — `moderation.actions` RLS verification required | MODERATE |
| S2 | VENOM | `readViewerReactionsBatch` passes client-supplied `actorId` — `vc.post_reactions` RLS verification required | MODERATE |
| P2 | KRAVEN | `readCommentCountsBatch` has no row limit — full comment row payload for high-engagement posts | MODERATE |
| P3 | KRAVEN | `readFeedFollowRowsDAL` fetches entire follow graph (unbounded) — first-load payload for high-follow-count actors | MODERATE |
| LK3 | LOKI | `fetchPostMentionRows` makes 2 sequential DB calls inside the pipeline's Promise.all batch — adds 60–160ms when @ present | MODERATE |
| LK6 | LOKI | `readPostMediaMap` silently swallows errors (returns empty map, no throw, no log) | MODERATE |
| D1 | VENOM | `profiles` table accessed via two different schemas (public + vport) — doc lists both as one table without schema distinction | MODERATE |
| A5 | SENTRY | `feedWelcomeCard.controller.js` in singular `controller/` vs plural `controllers/` | LOW |
| LK1 | LOKI | Pipeline `console.log` at line 125 ungated by env guard — dormant (debugPostId never passed in active path) | LOW |
| LK2 | LOKI | `console.warn` in mentions DAL on query error — fires in production, reveals table name | LOW |
| LK5 | LOKI | `recordStep` comment says `dalCount: 9` but doc says "10 in Promise.all" — doc inaccuracy | LOW |
| O1 | IRONMAN | 10 empty `index.js` scaffold files — all confirmed safe to delete | LOW |
| O2 | IRONMAN | `resolvePublicRealm.dal.js` feature ownership unclear — feed folder, vport consumers | LOW |
| N1 | FALCON | 21 live production functions not assessed for native coverage | LOW |
| N2 | FALCON | WinterSoldier handoff not initiated | LOW |

**Also revealed:** FA1 (BLOCKING) applies not only to `FeedConfirmModal` but also to `ReportModal`, `PostActionsMenu`, `ShareModal`, and `Toast` — all rendered inside `<PullToRefresh>`.

---

### Command Order Decided

| Phase | Command | Rationale |
|---|---|---|
| 1 | VENOM | Trust boundaries for hidden posts, viewer reactions, welcome card UPSERT write path |
| 2 | SENTRY | Architecture compliance: resolvePublicRealm layer, mentions DAL engine import, FeedConfirmModal placement, Screen layer duties |
| 3 | LOKI | Runtime: console orphans, sequential mention round-trips, error swallowing |
| 4 | KRAVEN | Performance: cold-cache query budget, comment payload, follow graph size |
| 5 | FALCON | iOS stacking context violation (BLOCKING), native parity assessment |
| 6 | IRONMAN | Ownership mapping for deletion candidates and refactor assignments |

---

### Phase 1 — VENOM

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_feed-dal-trust-boundaries.md`

**Verdict:** REVIEW_PENDING

**Summary:**
- No injection vulnerabilities found. No confirmed auth bypass.
- Trust boundary correctness depends on RLS policies not verifiable from source scan.
- V3 (`markWelcomeFeedCardSeenDAL`) is the highest-risk surface: UPSERT write path with client-supplied `actorId`. A missing WITH CHECK policy on `vc.actor_onboarding_steps` would allow any authenticated user to mark another actor's onboarding complete.
- V1 (`readHiddenPostsForViewer`) and V2 (`readViewerReactionsBatch`): client-supplied actor IDs against moderation tables — require RLS enforcement.
- V4 (blocks/follows): UUID validation present at DAL boundary — defense-in-depth.
- V5: `profiles` table accessed via two schemas (`public` + `vport`) — schema ambiguity flagged.
- V7: `@debuggers` in production resolves to `debuggers-stub/` — dev isolation confirmed via vite.config.js alias.

**Required next for VENOM:** CARNAGE — verify RLS on `moderation.actions`, `vc.post_reactions`, `vc.actor_onboarding_steps`, `vc.actor_follows`.

---

### Phase 2 — SENTRY

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/sentry_feed-dal-architecture-2026-05-14.md`

**Verdict:** VIOLATIONS FOUND

**Summary:**
- SA1 (MODERATE): `resolvePublicRealm.dal.js` — pure constant in DAL layer. Not a DAL by contract. No DB access. IRONMAN to decide migration path.
- SA2 (HIGH): `feed.mentions.dal.js` imports `@hydration` engine. DAL importing an engine violates layer order. The function makes 2 sequential DB calls inside a slot the pipeline treats as a single async — adding 60–160ms when @ mentions present. Requires source refactor: split into raw DAL + Controller/Model enrichment.
- SA3 (MODERATE): `FeedConfirmModal.jsx` in `screens/` — should be in `components/`.
- SA4 (MODERATE): `CentralFeedScreen.jsx` is doing View Screen work — needs split into Final + View.
- SA5 (LOW): `feedWelcomeCard.controller.js` folder naming inconsistency.
- SA6 (MODERATE): `pipeline/` subdirectory now documented as Pipeline Aggregator layer.
- SA7 (MODERATE): `queries/` subdirectory now documented as Service layer (the previously MISSING service layer).
- All `select('*')` checks: PASS. All `@/` imports: PASS. No TypeScript: PASS. File lengths: PASS.

---

### Phase 3 — LOKI

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/loki_feed-dal-runtime-2026-05-14.md`

**Verdict:** RUNTIME CONCERNS FOUND (none blocking)

**Summary:**
- LK1: Pipeline `console.log` at line 125 is dormant — `debugPostId` never passed by `fetchCentralFeedPage.js`. Orphaned parameter. Remove or gate.
- LK2: `console.warn` in mentions DAL fires in production on error — appropriate but ungated; consider structured telemetry.
- LK3: `fetchPostMentionRows` makes 2 sequential DB calls inside the parallel pipeline batch — adds 60–160ms when posts contain `@`. This is also an architecture violation (DAL calls engine — see SA2).
- LK4: `fetchCentralFeedPage` can fire pipeline twice on initial load — intentional drain, capped at 2, gated by 15s timeout.
- LK5: `recordStep({ dalCount: 9 })` is correct for the Promise.all batch; doc's "10 in one Promise.all" is imprecise — it's 1 sequential + 9 parallel.
- LK6: `readPostMediaMap` silently returns empty map on error (no throw, no log) — diverges from all other DALs. Media load failures are invisible.

---

### Phase 4 — KRAVEN

**Standalone file:** `zNOTFORPRODUCTION/_ACTIVE/audits/performance/kraven_feed-dal-query-cost-2026-05-14.md`

**Verdict:** ACCEPTABLE WITH MONITORING REQUIRED

**Summary:**
- KR1: Cold-cache pipeline = 13 queries (no @) to 15 queries (with @). Initial load worst case: 23–25 queries (drain loop fires twice). All parallelized correctly.
- KR2: `readCommentCountsBatch` returns all comment rows (only `post_id` column, ~16 bytes each) with no row limit. For viral posts with 10,000+ comments: ~160KB payload per page. Recommend upgrading to PostgreSQL `count()` aggregate.
- KR3: `readFeedFollowRowsDAL` fetches entire follow graph (unbounded). Cold-cache first load for a vport following 10,000 actors: ~490KB. 60-second TTL mitigates for repeat loads.
- KR4: `readActorsBundle` fires up to 4 sub-queries on cold cache. Per-actor TTL caching (30s) ensures page 2+ hits cache.
- KR5: `readReactionCountsBatch` inner parallel: PASS.

**Warm cache query count:** 4–5 queries per page. Performance is excellent under normal usage patterns.

---

### Phase 5 — FALCON

**Standalone file:** `zNOTFORPRODUCTION/_ACTIVE/native/falcon_feed-dal-parity-2026-05-14.md`

**Verdict: BLOCKED**

**BLOCKING — FA1: iOS Stacking Context Violation**

`FeedConfirmModal` (and also `PostActionsMenu`, `ReportModal`, `ShareModal`, `Toast`) are rendered inside `<PullToRefresh>`. `PullToRefresh` applies `transform: translateY(${pull}px)` to its children wrapper when `pull > 0`. On iOS Safari, `position: fixed` inside a `transform` ancestor becomes positioned relative to the transformed element, not the viewport. The modals will shift visually with the pull gesture and render at incorrect positions.

**CLAUDE.md explicitly prohibits this pattern.**

Fix required: Move all modals/overlays outside `<PullToRefresh>` as fragment siblings:
```jsx
return (
  <>
    <PullToRefresh>{/* content only */}</PullToRefresh>
    <FeedConfirmModal ... />
    <PostActionsMenu ... />
    <ReportModal ... />
    <ShareModal ... />
    <Toast ... />
  </>
)
```

18 of 21 live production DAL functions are native-relevant. WinterSoldier handoff not yet initiated. Native transfer of `CentralFeedScreen` is BLOCKED pending FA1 fix.

---

### Phase 6 — IRONMAN

**Standalone file:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/ironman_feed-dal-ownership-2026-05-14.md`

**Verdict:** OWNERSHIP MAPPED

**Summary:**
- IM1: `resolvePublicRealm.dal.js` — owned by feed lead + vport lead (joint). Recommend migrating to `@/shared/utils/resolveRealm.js` and removing the DAL wrapper entirely.
- IM2: `feed.mentions.dal.js` refactor — owned by feed feature lead. Must split raw DAL from hydration enrichment.
- IM3: 10 empty `index.js` files — all safe to delete, confirmed no callers. Feed feature lead. (5 documented in prior audit + 5 additional: `api/`, `lib/`, `ui/`, `usecases/`, root `feed/index.js`)
- IM4: `feedWelcomeCard.controller.js` folder consolidation — feed feature lead.
- IM5: `FeedConfirmModal.jsx` — move to `components/` + fix placement in screen (BLOCKING fix). Feed feature lead.
- IM6: `CentralFeedScreen` View/Final split — feed feature lead, Wolverine required.

---

### Doc Drift Corrections Applied (2026-05-14)

The following drift documented in the 2026-05-11 AvengersAssemble pass has now been corrected directly in main document sections:

| Correction | Section | Old Value | New Value |
|---|---|---|---|
| `resolvePublicRealm.dal.js` operations field | DAL Files + Exported functions table | `unknown` | `constant` (no DB access) |
| vport publish controller paths | Consumer Map → Controllers table | `features/dashboard/vport/controller/publish*.js` | `features/profiles/kinds/vport/controller/[domain]/publish*.controller.js` |
| Architecture Pipeline — Service row | Architecture Pipeline table | `✗ MISSING` | `✓ PRESENT — queries/fetchCentralFeedPage.js` |
| Architecture Pipeline — added Pipeline Aggregator | Architecture Pipeline table | _(absent)_ | `✓ PRESENT — pipeline/fetchFeedPage.pipeline.js` |
| Architecture Pipeline — Component row | Architecture Pipeline table | `FeedSkeletonList.jsx, WelcomeFeedCard.jsx` | Added `FeedConfirmModal.jsx`, `DebugFeedFilterPanel.jsx` |
| Architecture Pipeline — View Screen | Architecture Pipeline table | `✗ MISSING` | `⚠ IMPLICIT — CentralFeedScreen performs View duties` |

Remaining drift not corrected in-place (requires source refactor or Wolverine task):
- Call Chains for `resolvePublicRealm.dal.js` — terminal controller paths use controller function names only (no incorrect path listed) — no fix needed
- `FeedConfirmModal.jsx` physical location — source file not moved in this pass
- `feed.mentions.dal.js` engine import — source refactor not performed in this pass

---

### Final Command Status Table

| Command | Standalone File | Status | Blocking |
|---|---|---|---|
| ARCHITECT | This doc (2026-05-11) | DRIFT FOUND — corrected | NO |
| VENOM (inline) | AvengersAssemble 2026-05-11 | ALIGNED | NO |
| VENOM (standalone) | `CURRENT/features/dashboard/evidence/2026-05-14_venom_feed-dal-trust-boundaries.md` | REVIEW_PENDING — 3 RLS surfaces need CARNAGE | NO |
| SENTRY | `CURRENT/features/dashboard/evidence/sentry_feed-dal-architecture-2026-05-14.md` | VIOLATIONS FOUND | NO (source violations, not data) |
| LOKI | `CURRENT/features/dashboard/evidence/loki_feed-dal-runtime-2026-05-14.md` | CONCERNS FOUND | NO |
| KRAVEN | `_ACTIVE/audits/performance/kraven_feed-dal-query-cost-2026-05-14.md` | ACCEPTABLE + MONITORING | NO |
| FALCON | `_ACTIVE/native/falcon_feed-dal-parity-2026-05-14.md` | **BLOCKED — iOS stacking context** | **YES — FA1** |
| IRONMAN | `_CANONICAL/logan/marvel/ironman/ironman_feed-dal-ownership-2026-05-14.md` | OWNERSHIP MAPPED | NO |
| CARNAGE | — | MISSING — required for RLS verification | PENDING |
| LOGAN | AvengersAssemble + this pass | DRIFT CORRECTED (main sections updated) | NO |
| review-contract | AvengersAssemble 2026-05-11 | MINOR NOTES (still valid) | NO |
| BLACKWIDOW | — | NOT RUN — no new adversarial surfaces found | NO |
| SHIELD | — | NOT RUN — no IP safety concerns | NO |
| THOR | — | NOT RUN — BLOCKED pending FA1 fix | PENDING |

---

### Open Risks

| Risk ID | Description | Owner | Priority |
|---|---|---|---|
| FA1 | **BLOCKING** — `FeedConfirmModal` + 4 other overlays rendered inside `PullToRefresh` transform wrapper — iOS stacking context violation | Feed feature lead | BLOCKING |
| SA2 | `feed.mentions.dal.js` imports `@hydration` engine — backwards layer dependency, also causes sequential double round-trip in pipeline | Feed feature lead | HIGH |
| S3/V3 | `markWelcomeFeedCardSeenDAL` UPSERT write path — RLS on `vc.actor_onboarding_steps` must be verified | CARNAGE | HIGH |
| S1/V1 | `readHiddenPostsForViewer` — RLS on `moderation.actions` must enforce actor-to-user mapping | CARNAGE | MODERATE |
| S2/V2 | `readViewerReactionsBatch` — RLS on `vc.post_reactions` must be verified | CARNAGE | MODERATE |
| KR2 | `readCommentCountsBatch` — no row limit on comment fetch; upgrade to aggregate query | Feed feature lead | MODERATE |
| LK6 | `readPostMediaMap` swallows errors silently — no throw, no log on media table failure | Feed feature lead | MODERATE |
| SA1 | `resolvePublicRealm.dal.js` in wrong layer — needs migration or removal of DAL wrapper | Feed + vport leads | MODERATE |
| SA3/IM5 | `FeedConfirmModal.jsx` in `screens/` — move to `components/` (tied to FA1 fix) | Feed feature lead | MODERATE |
| SA4/IM6 | `CentralFeedScreen.jsx` View/Final split needed | Feed feature lead | MEDIUM |
| LK1 | Orphaned `debugPostId` parameter with ungated console.log — remove or gate | Feed feature lead | LOW |
| O1/IM3 | 10 empty `index.js` scaffold files — delete all | Feed feature lead | LOW |
| N1 | 18 native-relevant production functions not yet assessed by WinterSoldier | WinterSoldier | LOW |

---

### Fixed Risks (This Pass)

| Risk | Resolution |
|---|---|
| `resolvePublicRealm.dal.js` operation `unknown` in doc | Corrected to `constant` in DAL Files table (in-place edit) |
| vport publish controller paths wrong in Consumer Map | Corrected to `features/profiles/kinds/vport/controller/[domain]/` (in-place edit) |
| Service layer listed as MISSING | `queries/fetchCentralFeedPage.js` identified and documented as Service layer |
| Pipeline Aggregator layer undocumented | `pipeline/fetchFeedPage.pipeline.js` added to Architecture Pipeline |
| `FeedConfirmModal.jsx` absent from Architecture Pipeline | Added to Component row with placement note |
| `DebugFeedFilterPanel.jsx` absent from Architecture Pipeline | Added to Component row as DEV-ONLY |
| View Screen listed as MISSING | Updated to `⚠ IMPLICIT` with explanation |
| `@debuggers` production impact unknown | Confirmed: Vite alias resolves to `debuggers-stub/` — no production impact |
| `useActorConsistencyCheck` production impact unknown | Confirmed: resolves to production no-op stub |

---

### Required Next Command

**CARNAGE** — Verify RLS policies on:
- `vc.actor_onboarding_steps` (UPSERT WITH CHECK)
- `moderation.actions` (READ — actor-to-user enforcement)
- `vc.post_reactions` (READ — actor-to-user enforcement)
- `vc.actor_follows` (READ — follow graph scoping)

After CARNAGE: **Wolverine** — Plan and execute FA1 fix (move modals outside PullToRefresh) + SA2 fix (split mentions DAL from engine import). Both are source code changes.

---

### Document Status

**REVIEW_PENDING**

Blocking issue found (FA1 — iOS stacking context on `FeedConfirmModal` and 4 other overlays inside `PullToRefresh`). CARNAGE verification of RLS surfaces still required. Architecture boundary violations (SA2: DAL importing engine) require source refactor. Document drift in main sections has been corrected. No source code was modified in this verification pass.

---

---

## CEREBRO Verification Run — 2026-05-18

_Triggered by:_ User — second targeted CEREBRO pass on `vcsm.dal.feed.md`  
_Date:_ 2026-05-18  
_Branch:_ `vport-booking-feed-security-updates`  
_Read-Only:_ YES — no source code modified in this pass  
_Feed DAL changes on branch since 2026-05-14:_ NONE  

---

### Phase 0 — CEREBRO Classification

CEREBRO re-read the full document, then verified current source state for five open risks via live file reads of `CentralFeedScreen.jsx`, `feed.mentions.dal.js`, `feed.read.media.dal.js`, `fetchFeedPage.pipeline.js`, and `feed.read.commentCounts.dal.js`. Migration files scanned for all four CARNAGE-flagged tables. 2026-05-14 BLACKWIDOW full-pass reviewed to identify feed-specific adversarial scenarios that were deferred.

**Source State Verification (2026-05-18)**

| Risk | Previous Status | Current Source State |
|---|---|---|
| FA1 — iOS stacking context (modals inside PullToRefresh) | BLOCKING | **RESOLVED** — all 5 modals/overlays now rendered outside `<PullToRefresh>` as fragment siblings (lines 198–243 of `CentralFeedScreen.jsx`) |
| SA2 — `feed.mentions.dal.js` engine import | HIGH (DAL layer violation) | **RECLASSIFIED** — DAL file is clean; engine import (`@hydration`) is in `fetchFeedPage.pipeline.js` (line 13), which is the pipeline aggregator layer. Pipeline importing hydration is not a DAL-layer violation. Risk reformulated: the pipeline's `hydrateAndReturnSummaries` call adds a sequential round-trip inside a slot treated as parallel — a runtime concern (LK3), not an architecture contract violation. |
| LK6 — `readPostMediaMap` silent error swallow | MODERATE | **OPEN** — still returns empty map on error with no throw/log (lines 38–40) |
| LK1 — Orphaned `debugPostId` console.log | LOW | **OPEN** — still present at lines 136–141 of pipeline; no `import.meta.env.DEV` guard |
| KR2 — `readCommentCountsBatch` no row limit | MODERATE | **OPEN** — unbounded query unchanged |

**CARNAGE RLS Delta (2026-05-18)**

| Table | P1/P2/P3 Applied? |
|---|---|
| `vc.actor_onboarding_steps` | NO — P2 still outstanding |
| `moderation.actions` | NO — P1 still outstanding |
| `vc.actor_follows` SF-07 | NO — P3 outstanding; prerequisite (`subscriberCount.dal.js` audit) not completed |
| `vc.post_reactions` | NO — P4 verification pending |

**Updated Risk Registry**

| ID | Category | Description | Severity | Status |
|---|---|---|---|---|
| FA1 | FALCON | iOS stacking context — modals inside PullToRefresh | BLOCKING | **RESOLVED ✓** |
| SA2 | SENTRY | DAL importing engine | HIGH | **RECLASSIFIED** — pipeline import is acceptable; LK3 (sequential round-trip) remains |
| DB1/V3 | CARNAGE/VENOM | `vc.actor_onboarding_steps` UPSERT — no verified RLS | HIGH | OPEN |
| DB2/V1 | CARNAGE/VENOM | `moderation.actions` RLS policies absent | HIGH | OPEN |
| SF-07 | CARNAGE/VENOM | `vc.actor_follows` broad SELECT policy — social graph enumeration | HIGH | OPEN |
| BW-FEED-01 | BLACKWIDOW | SF-07 adversarial exploit — follow graph enumeration | HIGH | NEW — confirmed exploitable |
| BW-FEED-02 | BLACKWIDOW | Onboarding step tampering via UPSERT | HIGH | NEW — exploitable if no RLS |
| BW-FEED-03 | BLACKWIDOW | Moderation state leak via `readHiddenPostsForViewer` | HIGH | NEW — privacy breach OR silent feature regression |
| KR2 | KRAVEN | `readCommentCountsBatch` — no row limit | MODERATE | OPEN |
| LK6 | LOKI | `readPostMediaMap` silent error swallow | MODERATE | OPEN |
| SA1 | SENTRY | `resolvePublicRealm.dal.js` wrong layer | MODERATE | OPEN |
| SA3/IM5 | SENTRY | `FeedConfirmModal.jsx` in `screens/` | MODERATE | OPEN (file location unchanged; JSX placement resolved by FA1 fix) |
| SA4/IM6 | SENTRY | `CentralFeedScreen.jsx` View/Final split | MODERATE | OPEN |
| S2/V2 | VENOM | `readViewerReactionsBatch` — RLS SELECT unconfirmed | LOW | OPEN — BW-FEED-04 classifies as LOW (public data) |
| LK1 | LOKI | Orphaned `debugPostId` console.log — no env guard | LOW | OPEN |
| O1/IM3 | IRONMAN | 10 empty `index.js` scaffold files | LOW | OPEN |
| N1 | FALCON | 18 native-relevant production functions not assessed | LOW | OPEN — FA1 fix unblocks WinterSoldier |
| N2 | FALCON | WinterSoldier handoff not initiated | LOW | OPEN — unblocked by FA1 resolution |

---

### Command Order Decided

| Phase | Command | Rationale |
|---|---|---|
| 1 | CARNAGE (delta) | Required next command from 2026-05-14 pass — confirm migration status, proposals still outstanding |
| 2 | BLACKWIDOW (feed-specific) | 2026-05-14 full pass deferred all V-FEED-01/02/03 adversarial scenarios; adversarial simulation required for 3 confirmed HIGH surfaces |
| 3 | LOGAN | Corrections: FA1 resolved, SA2 reclassified, status updates |

---

### Phase 1 — CARNAGE (Delta)

**Standalone file:** `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-18_carnage_feed-dal-rls-delta.md`  
**Prior CARNAGE file:** `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_feed-dal-rls-verification.md`

**Verdict:** NO PROGRESS — ALL PROPOSALS OUTSTANDING

No new migration files reference any of the four flagged tables in the 4-day window since 2026-05-14. All proposals (P1–P4) remain unapplied.

**Key delta findings:**

- **P2 (`vc.actor_onboarding_steps` RLS):** OUTSTANDING. UPSERT write path still accepts any client-supplied `actor_id`. SQL proposals in prior CARNAGE file are ready for staging. Apply first.
- **P1 (`moderation.actions` policies):** OUTSTANDING. RLS may be ON (Batch5 proposal) but zero SELECT/INSERT policies confirmed. Either the table blocks all access (breaking hidden-post filtering) or has no RLS at all (behavioral PII leak). Both are production failures.
- **P3 (`vc.actor_follows` SF-07 resolution):** OUTSTANDING. `actor_follows_select_public_subscriber_count` PERMISSIVE policy still present. P3 prerequisite (`subscriberCount.dal.js` caller audit — to confirm safe migration to `vc.get_follower_count()` RPC) has not been completed.
- **P4 (`vc.post_reactions` SELECT verification):** OUTSTANDING. Write policies confirmed enforced. SELECT shape unknown; BW-FEED-04 classifies as LOW risk (public data pattern).

**Cross-reference note:** FA1 (iOS stacking context) is RESOLVED — confirmed in source. Does not affect CARNAGE scope but unblocks THOR evaluation once RLS proposals are applied.

**Mandatory first step before any SQL execution:** Run live schema inspection queries (documented in both CARNAGE files) via Supabase dashboard.

---

### Phase 2 — BLACKWIDOW (Feed-Specific Adversarial)

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_blackwidow_feed-dal-rls-adversarial.md`

**Verdict: THREE CONFIRMED HIGH ATTACK SURFACES**

The 2026-05-14 full BLACKWIDOW pass deferred all feed-specific adversarial scenarios. Today's feed-targeted pass simulated four attack scenarios:

**BW-FEED-01 — SF-07 Follow Graph Enumeration: CONFIRMED EXPLOITABLE (HIGH)**

`actor_follows_select_public_subscriber_count` PERMISSIVE policy `USING (is_active = true)` has no actor restriction. Any authenticated user can query `actor_follows` with an arbitrary `followed_actor_id` and receive the full follower list for any actor on the platform. No DAL bypass required — direct `supabase-js` client call succeeds. Enables complete social graph enumeration for all actors including private accounts.

**BW-FEED-02 — Onboarding Step Tampering: EXPLOITABLE IF NO RLS (HIGH)**

`markWelcomeFeedCardSeenDAL` issues an UPSERT with client-supplied `actor_id`. Without a `WITH CHECK` RLS policy, any authenticated user can mark any other actor's onboarding steps as complete using a direct Supabase client call. Blast radius: welcome card suppression, onboarding gate bypass, analytics corruption. The `step_key` value is visible in the JavaScript bundle — additional step keys are discoverable.

**BW-FEED-03 — Moderation State Leak: HIGH RISK — DUAL FAILURE MODE**

`moderation.actions` is either: (a) unprotected (behavioral PII leak — victim's hidden post list + report history readable by any authenticated user) or (b) RLS ON with no policies (default-deny — `readHiddenPostsForViewer` silently returns empty for all users, causing hidden posts to appear in every user's feed). Both outcomes are production failures. Live schema inspection is mandatory to determine which failure mode is active.

**BW-FEED-04 — Reaction Fingerprint: LOW**

`vc.post_reactions` SELECT policy likely `USING (true)` for authenticated (reactions are public social data). BW-FEED-04 classifies as LOW — reading another actor's reactions is expected behavior consistent with public social data design.

---

### Phase 3 — LOGAN Doc Corrections

**Corrections applied in this pass (status table only — existing sections preserved as historical record):**

| Correction | Section | Change |
|---|---|---|
| FA1 status | Command Evidence Registry (this pass's final table) | Updated from BLOCKING to RESOLVED |
| SA2 reclassification | Risk registry (this section) | Reclassified from HIGH DAL violation to LK3 (runtime concern, pipeline layer acceptable) |
| BLACKWIDOW status | Command Evidence Registry (this pass's final table) | Updated from NOT RUN to PRESENT with standalone file |
| CARNAGE status | Command Evidence Registry (this pass's final table) | Updated from MISSING to PRESENT with delta file |

**In-place corrections NOT made to prior sections:** The 2026-05-14 CEREBRO section's Final Command Status Table and Open Risks list are historical records. This pass's final table supersedes them for current status.

---

### Final Command Status Table

| Command | Standalone File | Status | Blocking |
|---|---|---|---|
| ARCHITECT | This doc (2026-05-11) | DRIFT CORRECTED (2026-05-14) | NO |
| VENOM (inline) | AvengersAssemble 2026-05-11 | ALIGNED | NO |
| VENOM (standalone) | `CURRENT/features/dashboard/evidence/2026-05-14_venom_feed-dal-trust-boundaries.md` | REVIEW_PENDING — RLS surfaces need CARNAGE application | NO |
| SENTRY | `CURRENT/features/dashboard/evidence/sentry_feed-dal-architecture-2026-05-14.md` | VIOLATIONS FOUND — 3 open | NO |
| LOKI | `CURRENT/features/dashboard/evidence/loki_feed-dal-runtime-2026-05-14.md` | CONCERNS FOUND — LK1, LK6 open | NO |
| KRAVEN | `_ACTIVE/audits/performance/kraven_feed-dal-query-cost-2026-05-14.md` | ACCEPTABLE + MONITORING — KR2 open | NO |
| FALCON | `_ACTIVE/native/falcon_feed-dal-parity-2026-05-14.md` | **FA1 RESOLVED** — native parity assessment still pending | NO (unblocked) |
| IRONMAN | `_CANONICAL/logan/marvel/ironman/ironman_feed-dal-ownership-2026-05-14.md` | OWNERSHIP MAPPED — actions pending | NO |
| CARNAGE | `_ACTIVE/audits/migrations/2026-05-14_carnage_feed-dal-rls-verification.md` (full) + `_ACTIVE/audits/migrations/2026-05-18_carnage_feed-dal-rls-delta.md` (delta) | ALL PROPOSALS OUTSTANDING — P1/P2/P3/P4 not applied | **YES — 3 HIGH surfaces unresolved** |
| BLACKWIDOW | `CURRENT/features/dashboard/evidence/2026-05-18_blackwidow_feed-dal-rls-adversarial.md` (feed-specific) | **3 HIGH ATTACK SURFACES CONFIRMED** | **YES — BW-FEED-01/02/03** |
| LOGAN | AvengersAssemble + CEREBRO passes | CORRECTIONS APPLIED (2026-05-14 in-place + 2026-05-18 table) | NO |
| review-contract | AvengersAssemble 2026-05-11 | MINOR NOTES — still valid | NO |
| DB | — | NOT RUN — mandatory for live RLS state inspection | PENDING |
| WinterSoldier | — | NOT RUN — unblocked by FA1 resolution | PENDING |
| SHIELD | — | NOT RUN — no IP safety concerns identified | NO |
| THOR | — | NOT RUN — BLOCKED pending CARNAGE proposals applied | PENDING |

---

### Open Risks (2026-05-18)

| Risk ID | Description | Owner | Priority | Blocking |
|---|---|---|---|---|
| BW-FEED-01 | SF-07 — `actor_follows` broad SELECT allows full social graph enumeration for any actor | CARNAGE → Wolverine | P1 | **YES** |
| BW-FEED-02 | `markWelcomeFeedCardSeenDAL` UPSERT — no RLS WITH CHECK; cross-actor onboarding corruption | CARNAGE → Wolverine | P1 | **YES** |
| BW-FEED-03 | `moderation.actions` — zero policies (either behavioral PII leak OR silent hidden-post regression) | CARNAGE → Wolverine | P1 | **YES** |
| KR2 | `readCommentCountsBatch` — no row limit; upgrade to count aggregate | Feed feature lead | P2 | NO |
| LK6 | `readPostMediaMap` — silent error swallow; no throw/log on media failure | Feed feature lead | P2 | NO |
| SA1 | `resolvePublicRealm.dal.js` — pure constant in DAL layer; wrong layer by contract | Feed + vport leads | P3 | NO |
| SA3/IM5 | `FeedConfirmModal.jsx` — physical file still in `screens/` instead of `components/` | Feed feature lead | P3 | NO |
| SA4/IM6 | `CentralFeedScreen.jsx` — View/Final split needed | Feed feature lead | P3 | NO |
| LK1 | Orphaned `debugPostId` console.log — no env guard in pipeline | Feed feature lead | P4 | NO |
| O1/IM3 | 10 empty `index.js` scaffold files — delete all | Feed feature lead | P4 | NO |
| N1/N2 | 18 native-relevant functions not assessed; WinterSoldier handoff not initiated | WinterSoldier | P4 | NO |

---

### Fixed Risks (This Pass)

| Risk | Resolution |
|---|---|
| **FA1 — iOS stacking context BLOCKING** | RESOLVED — all 5 modals/overlays (`FeedConfirmModal`, `PostActionsMenu`, `ReportModal`, `ShareModal`, `Toast`) moved outside `<PullToRefresh>` as fragment siblings in `CentralFeedScreen.jsx`. Confirmed via source read (lines 135–243). |
| **SA2 — DAL importing engine (classified as HIGH)** | RECLASSIFIED — `feed.mentions.dal.js` DAL file is clean. Engine import exists in `fetchFeedPage.pipeline.js` (pipeline layer) — acceptable by architecture contract. Runtime concern (sequential round-trip in parallel slot) reclassified as LK3 — open but not HIGH. |

---

### Required Next Command

**DB** — Run live schema inspection against Supabase dashboard to confirm RLS state for all 4 tables before any migration SQL is applied:

```sql
SELECT schemaname, tablename, rowsecurity, forcerls
FROM pg_tables
WHERE (schemaname = 'vc' AND tablename IN ('actor_onboarding_steps', 'post_reactions', 'actor_follows'))
   OR (schemaname = 'moderation' AND tablename = 'actions');

SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE (schemaname = 'vc' AND tablename IN ('actor_onboarding_steps', 'post_reactions', 'actor_follows'))
   OR (schemaname = 'moderation' AND tablename = 'actions')
ORDER BY schemaname, tablename, cmd, policyname;
```

After DB: **Wolverine** — Plan and execute P2 (`actor_onboarding_steps`), P1 (`moderation.actions`), P3 prerequisite (`subscriberCount.dal.js` audit) + P3 (`actor_follows` SF-07), in that order. All require staging validation before production. After Wolverine applies P1/P2/P3: **VENOM re-verification** → **THOR** release gate.

---

### Document Status

**REVIEW_PENDING**

Three HIGH attack surfaces confirmed by BLACKWIDOW (BW-FEED-01/02/03). All CARNAGE proposals outstanding (P1/P2/P3). Live schema inspection required before any migration is applied. FA1 blocking issue resolved. No source code was modified in this verification pass.

---

---

## DB Command Pass — 2026-05-18

_Triggered by:_ CEREBRO 2026-05-18 — required next command after CARNAGE delta  
_Standalone file:_ `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-18_00-00_db_feed-rls-four-tables.md`  
_Mode:_ READ-ONLY — no schema modifications made  
_Prior snapshot:_ `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-14_db_feed-rls-four-tables.md`  

---

### Critical New Finding — P3 Prerequisite COMPLETE

**`subscriberCount.dal.js` has already been migrated to use RPC.**

The 2026-05-14 CARNAGE report flagged `subscriberCount.dal.js` as the code-side prerequisite for P3 (`vc.actor_follows` SF-07 resolution): before dropping the overly broad `actor_follows_select_public_subscriber_count` policy, any code reading the follow count directly from the table needed to be migrated to `vc.get_follower_count()` RPC.

Confirmed by live file read:

```javascript
// subscriberCount.dal.js — current state
const { data, error } = await supabase
  .rpc('get_follower_count', { p_actor_id: actorId })
```

The DAL is already on the RPC call. This unblocks P3 entirely — the only remaining work is database-side (create the function, then drop the policy).

**SF-07 execution order (all code-side work done):**
1. Create `vc.get_follower_count(uuid)` SECURITY DEFINER function
2. Apply `FORCE ROW LEVEL SECURITY` to `vc.actor_follows`
3. Drop `actor_follows_select_public_subscriber_count` policy

SF-07 has been open since 2026-05-10 (8 days). P3 is now blocked only on database execution.

---

### DB Findings Summary

| Review Item | Object | Risk | Status |
|---|---|---|---|
| DB-1 | `vc.actor_onboarding_steps` | HIGH — UPSERT write unprotected; no RLS evidence | P2 SQL ready; apply in staging |
| DB-2 | `moderation.actions` | HIGH — read/write behavioral PII unprotected; zero policies | P1 SQL ready; apply in staging |
| DB-3 | `vc.actor_follows` SF-07 | HIGH — social graph enumerable; 8 days open | P3 CODE COMPLETE; DB execution only |
| DB-4 | `vc.post_reactions` SELECT | LOW-MEDIUM — write enforced; read shape unconfirmed | P4 verify-only; run live query |
| DB-Obs | `actor_onboarding_steps` step keys | LOW — step keys visible in JS bundle | If used as gates: server enforcement required |

---

### Deployment Order (Confirmed)

| Order | Proposal | Description | Blocker |
|---|---|---|---|
| 1st | P2 | `vc.actor_onboarding_steps` — enable RLS + SELECT + ALL with WITH CHECK | None — apply immediately in staging |
| 2nd | P1 | `moderation.actions` — enable RLS + SELECT + INSERT policies | None — apply immediately in staging |
| 3rd | P3 | `vc.actor_follows` — create function → FORCE RLS → drop broad policy | None — DAL code already on RPC |
| 4th | P4 | `vc.post_reactions` — live schema verification query only | None — verify first, SQL only if policy absent |

**Mandatory pre-application:** Run live verification queries against all 4 tables via Supabase dashboard before executing any proposal SQL. Full checklist in standalone DB snapshot.

---

### Updated Command Evidence Registry

| Command | Standalone File | Status |
|---|---|---|
| CARNAGE (2026-05-14 full) | `_ACTIVE/audits/migrations/2026-05-14_carnage_feed-dal-rls-verification.md` | Proposals P1/P2/P3/P4 defined |
| CARNAGE (2026-05-18 delta) | `_ACTIVE/audits/migrations/2026-05-18_carnage_feed-dal-rls-delta.md` | All proposals still outstanding |
| BLACKWIDOW (feed-specific) | `CURRENT/features/dashboard/evidence/2026-05-18_blackwidow_feed-dal-rls-adversarial.md` | 3 HIGH attack surfaces confirmed |
| **DB (2026-05-18)** | **`_HISTORY/db/snapshots/2026-05-18_00-00_db_feed-rls-four-tables.md`** | **COMPLETE — P3 prerequisite confirmed done** |

---

### Required Next Command

**Wolverine** — Plan and execute P2 → P1 → P3 in staging using SQL from:
- `2026-05-14_carnage_feed-dal-rls-verification.md` (full SQL proposals)
- `2026-05-18_00-00_db_feed-rls-four-tables.md` (deployment checklist)

After staging validation: **VENOM re-verification** → **THOR** release gate.

---

### Document Status

**REVIEW_PENDING**

Three HIGH security surfaces confirmed and adversarially verified (BW-FEED-01/02/03). DB analysis complete. P3 code prerequisite confirmed done. All three proposals (P1/P2/P3) are ready for staging execution — no remaining code-side blockers. FA1 resolved. Document is REVIEW_PENDING pending Wolverine migration execution, VENOM re-verification, and THOR sign-off.

---

---

## Wolverine Migration Pass — 2026-05-18

_Triggered by:_ CEREBRO 2026-05-18 continuation — DB command required Wolverine for migration file execution  
_Planning file:_ `zNOTFORPRODUCTION/_ACTIVE/planning/may/18/18-01.md`  
_Approval tracker:_ `zNOTFORPRODUCTION/_ACTIVE/planning/may/18/18-approval-tracker.md`  
_Task class:_ IMPLEMENTATION — migration SQL files (source code artifacts only; not applied to database)  
_Application scope:_ VCSM  

---

### Migration Files Created

| File | Proposal | Status |
|---|---|---|
| `apps/VCSM/supabase/migrations/20260518010000_actor_onboarding_steps_rls.sql` | P2 | FILED — awaiting staging application |
| `apps/VCSM/supabase/migrations/20260518020000_moderation_actions_rls.sql` | P1 | FILED — awaiting staging application |
| `apps/VCSM/supabase/migrations/20260518030000_actor_follows_sf07_resolution.sql` | P3 (SF-07) | FILED — awaiting staging application |

**No source code files in `apps/VCSM/src/` were modified.**  
**No database changes were executed — files are SQL text artifacts only.**

---

### SENTRY Post-Execution Review

**Verdict: ALIGNED**

All three files reviewed against VCSM architecture contract:

| Check | P2 | P1 | P3 |
|---|---|---|---|
| Schema boundary — VCSM-only references | PASS | PASS | PASS |
| RLS pattern — `auth.uid()` → `actor_owners` → `actor_id` | PASS | PASS | N/A (policy drop) |
| Write policies — `WITH CHECK` present | PASS | PASS | N/A |
| `DROP IF EXISTS` guards | PASS | PASS | PASS |
| SECURITY DEFINER — pinned search_path | N/A | N/A | PASS |
| SECURITY DEFINER — count only (no row exposure) | N/A | N/A | PASS |
| GRANT EXECUTE — `authenticated` only | N/A | N/A | PASS |
| P3 execution order safety documented | N/A | N/A | PASS |
| Rollback plan present | PASS | PASS | PASS |
| File length < 300 lines | PASS (73) | PASS (74) | PASS (99) |

No violations. Cross-schema reference (`moderation.actions` → `vc.actor_owners`) confirmed acceptable — both are VCSM-internal schemas.

---

### Updated Proposal Status

| Proposal | Previous Status | Current Status |
|---|---|---|
| P2 — `vc.actor_onboarding_steps` | OUTSTANDING — not applied | **MIGRATION FILED** — apply in staging |
| P1 — `moderation.actions` | OUTSTANDING — not applied | **MIGRATION FILED** — apply in staging |
| P3 — `vc.actor_follows` SF-07 | OUTSTANDING — code ready | **MIGRATION FILED** — apply in staging; Step 3 after Step 1 confirmed |
| P4 — `vc.post_reactions` verify | Verify only | UNCHANGED — live schema query still needed |

---

### Staging Application Order

An engineer must apply these in the following order via Supabase CLI or dashboard. Each migration must pass its staging validation before the next is applied.

```
1. Run pre-check queries (from DB snapshot 2026-05-18_00-00_db_feed-rls-four-tables.md)
2. Apply 20260518010000_actor_onboarding_steps_rls.sql → validate welcome card flow
3. Apply 20260518020000_moderation_actions_rls.sql → validate hidden post filtering
4. Apply 20260518030000_actor_follows_sf07_resolution.sql:
   a. Deploy Steps 1+2 (function + FORCE RLS) → confirm get_follower_count works
   b. Deploy Step 3 (DROP POLICY) ONLY after Step 1 confirmed live
   c. Validate subscriberCount display + confirm direct actor_follows query blocked
5. Run P4 verification query for vc.post_reactions SELECT policy shape
```

---

### Open Risks — Updated (2026-05-18 post-migration)

| Risk ID | Description | Status |
|---|---|---|
| BW-FEED-01 | SF-07 follow graph enumeration | MIGRATION FILED (P3) — pending staging |
| BW-FEED-02 | Onboarding step tampering | MIGRATION FILED (P2) — pending staging |
| BW-FEED-03 | Moderation state leak | MIGRATION FILED (P1) — pending staging |
| KR2 | `readCommentCountsBatch` no row limit | OPEN — separate task |
| LK6 | `readPostMediaMap` silent error swallow | OPEN — separate task |
| SA1 | `resolvePublicRealm.dal.js` wrong layer | OPEN — SENTRY/IRONMAN decision |
| SA3/IM5 | `FeedConfirmModal.jsx` in `screens/` | OPEN — refactor task |
| SA4/IM6 | `CentralFeedScreen.jsx` View/Final split | OPEN — refactor task |
| LK1 | Orphaned `debugPostId` console.log | OPEN — low priority |
| O1/IM3 | 10 empty `index.js` files | OPEN — low priority |
| N1/N2 | Native parity + WinterSoldier handoff | OPEN — unblocked by FA1 resolution |

---

### Required Next Steps

1. **Engineer** — Apply migrations to staging in the order above; run all staging validations
2. **VENOM** — Re-verify trust boundaries after P1 + P3 applied and confirmed in staging
3. **THOR** — Release gate after VENOM confirms clean

---

### Document Status

**REVIEW_PENDING**

Three RLS migration files filed. SENTRY verified ALIGNED. Staging application and VENOM re-verification required before THOR release gate. No source code or database changes were made in this pass.
