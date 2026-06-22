---
name: vcsm.feed.architecture
description: ARCHITECT V2 module architecture report for VCSM:feed
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-06
  scanner-version: 1.2.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** feed
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/feed
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The feed module is the central social content display layer for VCSM. It fetches, filters, and renders paginated post streams for the authenticated viewer — scoped by actor identity and realm — applying visibility rules for blocks, follows, privacy settings, hidden posts, and moderation state. It also owns the listActorPosts controller used by profile views, making it the single source of truth for all post reads across the platform.

## OWNERSHIP

Feed team / Social layer. This module owns all central feed reads, actor-scoped post listing, welcome card onboarding state, and the feed cache invalidation adapter. The `listActorPosts.controller` is explicitly locked as an SSOT shared with the profiles domain.

## ENTRY POINTS

- `CentralFeedScreen` — the primary authenticated feed view, rendered at the app home route
- `listActorPosts.controller` — consumed by the profiles feature (profile post/photos tabs) via cross-feature use
- `feedCache.adapter.js` — exposes cache invalidation hooks (`invalidateFeedBlockCache`, `invalidateFeedFollowCache`, `invalidateActorBundleEntry`) to external features (e.g. social/block features)

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 28 | feed.read.posts.dal.js, feed.read.actorsBundle.dal.js, feedWelcomeCard.dal.js, listActorPostsByActor.dal.js |
| Model | 11 | normalizeFeedRows.model.js, feedBlockVisibility.model.js, feedFollowVisibility.model.js, feedRowVisibility.model.js |
| Controller | 8 | getFeedViewerContext.controller.js, listActorPosts.controller.js, feedWelcomeCard.controller.js, getDebugPrivacyRows.controller.js |
| Service | N/A | — |
| Adapter | 2 (fm) / 3 (cg) | feedCache.adapter.js, hooks/useFeed.adapter.js |
| Hook | 19 | useCentralFeed.js, useCentralFeedActions.js, useFeed.js, useFeedInfiniteScroll.js, useFeedWelcomeCard.js |
| Component | 6 | FeedConfirmModal.jsx, FeedSkeletonList.jsx, WelcomeFeedCard.jsx |
| Screen | 3 | CentralFeedScreen.jsx, DebugFeedFilterPanel.jsx, DebugPrivacyPanel.jsx |
| Barrel | 3 | fetchCentralFeedPage.js (query), pipeline/fetchFeedPage.pipeline.js |

Counts from callgraph scanner (cg_layerCounts).

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source clearly shows purpose; BEHAVIOR.md is a placeholder | BEHAVIOR.md needs full contract |
| Owner defined | PARTIAL | Controller comments indicate team; no formal ownership file | Ownership record missing |
| Entry points mapped | PASS | CentralFeedScreen, listActorPosts controller, feedCache adapter all identifiable | None |
| Controllers present/delegated | PASS | 8 controllers (cg) covering viewer context, post listing, welcome card, debug | None |
| DAL/repository present/delegated | PASS | 28 DAL references in callgraph; 15 DAL files in source; explicit column selects used | None |
| Models/transformers present | PASS | 11 model files; normalizeFeedRows, visibility models, mention maps | None |
| Hooks/view models present | PASS | 19 hooks; useCentralFeed is React Query infinite; useFeed.js also present (dual implementation) | Dual hook risk (useFeed + useCentralFeed) |
| Screens/components present | PASS | 3 screens, 6 components; skeleton and welcome card implemented | None |
| Services/adapters present | PASS | feedCache.adapter.js exposes invalidation; useFeed.adapter.js present | None |
| Database objects mapped | PASS | vc.posts (read), vc.actor_onboarding_steps (write), moderation.actions (read), vc.post_media (read), vc.actor_follows (read), vc.post_reactions (read), vc.post_comments (read), vc.post_mentions (read) | All reads — only 1 write surface (welcome card) |
| Authorization path mapped | PARTIAL | realmId scoping applied at DAL level; viewerActorId threaded through pipeline; RLS handles post visibility | No explicit owner gate on listActorPosts (controller trusts RLS) |
| Cache/runtime behavior mapped | PASS | React Query staleTime:30s, gcTime:10min, refetchOnWindowFocus:false; feedCache adapter exposes invalidation | No cache warming on cold start |
| Error/loading/empty states mapped | PASS | CentralFeedScreen: skeleton, loading indicator, empty state ("No Vibes found."), error falls through to firstBatchReady flag | No dedicated error UI screen |
| Documentation linked | FAIL | BEHAVIOR.md is placeholder (Status: PLACEHOLDER) | Full behavior contract needed |
| Tests/validation noted | FAIL | 0 tests detected by scanner | No unit or integration tests |
| Native parity noted | N/A | PWA only at this time | — |
| Engine dependencies mapped | PASS | hydration, identity, media, profile engines imported | All 4 engine deps confirmed in source |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/hydration | engine | inbound | YES | hydrateAndReturnSummaries used in pipeline; hydrateActorsByIds in useCentralFeed |
| engines/identity | engine | inbound | YES | readViewerActorIdentityDAL in getFeedViewerContext.controller |
| engines/media | engine | inbound | YES | readPostMediaMap in pipeline |
| engines/profile | engine | inbound | YES | readProfileAdultFlagDAL in getFeedViewerContext.controller |
| features/moderation | cross-feature (adapter) | inbound (screen) | PARTIAL | ReportModal and ReportedPostCover imported directly as adapters in CentralFeedScreen — not via feed's own adapter |
| features/post | cross-feature (adapter) | inbound (screen) | YES | PostCard, PostActionsMenu, ShareModal imported via post feature adapters |
| features/social | cross-feature (cache) | outbound | YES | feedCache.adapter.js invalidation consumed by social/block features |
| features/profiles | cross-feature (controller) | outbound | YES | listActorPosts.controller is SSOT for profile post tabs |
| vc.posts | DB read | outbound | YES | Primary read surface; cursor-based pagination by created_at |
| vc.actor_onboarding_steps | DB write | outbound | YES | markWelcomeFeedCardSeenDAL — only write surface in this module |
| moderation.actions | DB read | outbound | YES | readHiddenPostsForViewer — hidden post suppression |
| @debuggers/feed | dev-only | inbound | YES | wrapDAL profiler, FeedDebugPanel, debugFeedEvent; all guarded by import.meta.env.DEV |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.posts | READ (paginated, cursor) | upload feature (writes) | feed DAL | RLS enforces deleted_at filter; realmId scoping |
| vc.actor_onboarding_steps | WRITE (upsert) | onboarding feature | feedWelcomeCard.dal.js | Low risk; single-row upsert per actor |
| vc.post_media | READ | post/upload feature | feed.read.media.dal.js | Low |
| vc.post_reactions | READ | post feature | feed.read.viewerReactions.dal.js, feed.read.reactionCounts.dal.js | Low |
| vc.post_comments | READ (count only) | post feature | feed.read.commentCounts.dal.js | Low |
| vc.post_mentions | READ | post/upload feature | feed.mentions.dal.js | Low |
| moderation.actions | READ | moderation feature | feed.read.hiddenPosts.dal.js | Low; used only for hidden post suppression |
| vc.actor_follows | READ | social feature | feed.read.followRows.dal.js | Low |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | CentralFeedScreen with auth guard (Navigate to /login if !user) | No route declared in route-map scanner (nav handled by app shell) |
| Loading state | READY | FeedSkeletonList rendered during !firstBatchReady; "Loading more..." for pagination | None |
| Empty state | READY | "No Vibes found." message when posts.length === 0 and !loading | None |
| Error state | PARTIAL | firstBatchReady=true on status==='error'; no dedicated error UI panel | Error silently clears skeleton but shows empty feed |
| Auth/owner gates | PARTIAL | User auth gate in screen (Navigate); viewerActorId required for infinite query (enabled:Boolean(actorId)); listActorPosts controller has no explicit owner check beyond RLS | listActorPosts trusts RLS; no explicit actor ownership assertion |
| Cache behavior | READY | React Query staleTime:30s, gcTime:10min; cache invalidation adapter present; setPosts supports optimistic updates | No cache warming on cold start |
| Runtime dependencies | READY | hydration engine, identity adapter, React Query, Zustand actor store — all standard platform dependencies | Dual hook implementations (useFeed + useCentralFeed) — migration status unclear |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/feed/BEHAVIOR.md | PRESENT (placeholder only) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | No documented happy paths, edge cases, or behavioral contracts for the largest feature layer in social | LOGAN |
| Zero tests | HIGH | Feed pipeline has 9 parallel DAL calls, visibility filter models, and mention hydration — all untested | SPIDER-MAN |
| useFeed.adapter.js re-exports legacy hook (useFeed.js) not canonical hook (useCentralFeed.js) | HIGH | External consumers via adapter boundary receive the state-based legacy hook, not the React Query infinite hook — adapter boundary is frozen in legacy; any new consumers get wrong implementation | IRONMAN |
| Dual hook implementations (useFeed.js + useCentralFeed.js) | MEDIUM | useCentralFeed is the canonical hook but useFeed.js is still served through the adapter; migration status undocumented; risk of divergence | IRONMAN |
| No dedicated error state UI | MEDIUM | Feed silently shows empty state on error — indistinguishable from genuinely empty feed | LOKI |
| listActorPosts.controller has no explicit authorization assertion | MEDIUM | Trusts RLS entirely; no app-layer actor ownership or caller identity check | VENOM |
| debugPostId parameter orphaned in pipeline | LOW | fetchFeedPagePipeline accepts debugPostId but fetchCentralFeedPage never passes it; parameter is dead in the production call path | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

1. **CentralFeedScreen direct cross-feature imports** — `CentralFeedScreen.jsx` imports `ReportModal`, `PostActionsMenu`, `ShareModal`, and `ReportedPostCover` directly from `features/moderation` and `features/post` adapter paths. This is via adapter boundaries (`.adapter.js` files) and is permitted, but the feed screen itself is doing heavy cross-feature composition that may belong in an app-shell coordinator layer.

2. **listActorPosts.controller shared with profiles** — This controller is explicitly marked SSOT and LOCKED but lives inside the feed module. It is consumed by the profiles domain. If feed refactors this controller it affects profile post tabs. This is a soft coupling that should be documented.

3. **Debug profiler import from @debuggers/feed** — `fetchFeedPage.pipeline.js` imports `wrapDAL` and `recordStep` from `@debuggers/feed`. All calls are guarded by `import.meta.env.DEV` or `wrapDAL` conditional assignment, but the import itself is unconditional. Tree-shaking should eliminate it in production builds, but this is worth confirming.

4. **Unguarded console.log in production path** — Line 137 of `fetchFeedPage.pipeline.js` contains a `console.log("[useFeed][mentions][DBG]...")` that is only conditionally executed when `debugPostId` matches a pagePostId, but is NOT wrapped in `import.meta.env.DEV`. This log can fire in production.

---

## SPAGHETTI SCORE

**Module:** feed
**Score:** WATCH
**Reasons:** Feed pipeline is well-structured with clear layer separation (DAL → model → pipeline → hook → screen). However: dual hook implementations (useFeed + useCentralFeed) with adapter boundary frozen on legacy, CentralFeedScreen doing heavy cross-feature modal composition, listActorPosts shared across feature boundaries without a formal adapter, and debugPostId parameter orphaned in the production pipeline path. Previous run incorrectly flagged an unguarded console.log — source confirms it IS DEV-guarded (line 136: `if (import.meta.env.DEV && debugPostId && ...)`).
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no contract content, pending source review

**Check A (Source without behavior):** FAIL — source exists and is well-developed; BEHAVIOR.md is an empty placeholder. Contract has never been written.

**Check B (Behavior without source):** PASS — no behavior claims exist to contradict source.

**Check C (§13 engine consistency):** PASS — scanner declares engines: hydration, identity, media, profile. Source confirms: `@hydration` in pipeline, `readViewerActorIdentityDAL` from identity context DAL, `readPostMediaMap` in pipeline, `readProfileAdultFlagDAL` in getFeedViewerContext.controller. All 4 match.

**Check D (§6 data change consistency):** PASS — scanner declares 1 write surface: `vc.actor_onboarding_steps` (markWelcomeFeedCardSeenDAL). Source confirms this is the only write. All other DAL files are reads. No undeclared writes found.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write full BEHAVIOR.md contract | BEHAVIOR.md is placeholder; social feed behavior, visibility rules, pagination contract, and welcome card logic are undocumented | LOGAN |
| P1 | Fix adapter boundary: useFeed.adapter.js must re-export useCentralFeed | Adapter is frozen on legacy hook; external consumers receive wrong implementation | IRONMAN |
| P2 | Add feed pipeline and model tests | 0 tests for 9-DAL parallel pipeline, 4 visibility models, mention hydration chain | SPIDER-MAN |
| P3 | Complete dual hook migration (useFeed → useCentralFeed) | Both hooks exist; adapter boundary must migrate before legacy can be removed | IRONMAN |
| P3 | Remove orphaned debugPostId parameter from pipeline | Parameter is dead in production call path; dead param surfaces add confusion | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md contract is missing; highest priority governance gap
- **IRONMAN** — Adapter boundary frozen on legacy hook is a structural integrity issue
- **SPIDER-MAN** — 0 tests on a 45-file, 9-DAL parallel pipeline feature
- **VENOM** — listActorPosts authorization gap (no app-layer actor ownership assertion)
- **LOKI** — No error state UI; error indistinguishable from empty feed at runtime

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-06T03:20:00Z | FRESH | HIGH |
| callgraph | 2026-06-06T03:20:00Z | FRESH | HIGH |
| write-surface-map | 2026-06-06T03:20:00Z | FRESH | HIGH |
| route-map | 2026-06-06T03:20:00Z | FRESH | HIGH |
| engine-candidates | 2026-06-06T03:20:00Z | FRESH | MEDIUM |
| dependency-map | 2026-06-06T03:20:00Z | FRESH | HIGH |

## Delta from Previous Run (2026-06-04)

| Finding | Status | Notes |
|---|---|---|
| Unguarded console.log in pipeline (prior P4) | CORRECTED — not a finding | Source confirms line 136 IS DEV-guarded: `if (import.meta.env.DEV && debugPostId ...)`. Prior ARCHITECT report was incorrect. |
| useFeed.adapter.js re-exports legacy hook | NEW FINDING (HIGH) | adapter/hooks/useFeed.adapter.js exports from useFeed.js, not useCentralFeed.js — boundary frozen on legacy |
| debugPostId parameter orphaned in pipeline | NEW FINDING (LOW) | fetchCentralFeedPage never passes debugPostId to fetchFeedPagePipeline; parameter is dead in production |
| feed.posts.dal.js is DEV-only | CLARIFICATION | `if (!import.meta.env.DEV) return []` guard confirmed — this file is diagnostics-only, not a production DAL |
| Total file count | CORRECTED | 45 files (was 46 in prior run) |
