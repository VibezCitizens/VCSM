---
title: Feed Module — Test Coverage
status: ACTIVE
feature: feed
module: feed
source: spider-man-coverage-analysis
created: 2026-06-05
reviewed-by: SPIDER-MAN
source-path: apps/VCSM/src/features/feed/
---

# feed / modules / feed — TEST COVERAGE

## Status

NO TESTS EXIST. This is a zero-coverage module. All coverage classifications below are
NOT_COVERED unless marked otherwise. All security regression tests are currently absent.

Previous TESTS.md: DID NOT EXIST — created 2026-06-05 by SPIDER-MAN.

---

## Coverage Summary

| Dimension | Count | Covered | Not Covered | Coverage % |
|---|---|---|---|---|
| Source Functions | 17 | 0 | 17 | 0% |
| Behaviors (Workflows) | 8 | 0 | 8 | 0% |
| Invariants | 15 | 0 | 15 | 0% |
| Security Regression Tests Needed | 18 | 0 | 18 | 0% |

Overall coverage: **0%**

---

## Function Coverage Matrix

### Pipeline

| Function | File | Covered | Notes |
|---|---|---|---|
| `fetchFeedPagePipeline` | `pipeline/fetchFeedPage.pipeline.js` | NOT_COVERED | Core orchestrator — 9 DAL fan-out, mention enrichment, normalization |

### Visibility Models

| Function | File | Covered | Notes |
|---|---|---|---|
| `buildBlockedActorSetModel` | `model/feedBlockVisibility.model.js` | NOT_COVERED | Bidirectional block set builder — pure function, high unit-test value |
| `isActorBlockedForViewerModel` | `model/feedBlockVisibility.model.js` | NOT_COVERED | Set membership check — pure function |
| `buildFollowedActorSetModel` | `model/feedFollowVisibility.model.js` | NOT_COVERED | Follow set builder with is_active filter — pure function |
| `isActorFollowedByViewerModel` | `model/feedFollowVisibility.model.js` | NOT_COVERED | Set membership check — pure function |
| `canViewPrivateFeedActorModel` | `model/feedPrivateVisibility.model.js` | NOT_COVERED | Private gate — 3-input pure function, trivially testable |
| `resolveFeedRowVisibilityModel` | `model/feedRowVisibility.model.js` | NOT_COVERED | 8-branch visibility resolver — highest unit-test ROI in the module |
| `normalizeFeedRows` | `model/normalizeFeedRows.model.js` | NOT_COVERED | Post normalization with media resolution and filtering |
| `buildMentionMaps` | `model/buildMentionMaps.model.js` | NOT_COVERED | Mention map builder with route resolution |
| `enrichMentionRows` | `model/enrichMentionRows.model.js` | NOT_COVERED | Mention edge enrichment — pure join |
| `inferMediaType` | `model/inferMediaType.model.js` | NOT_COVERED | URL pattern matching — pure function, trivially testable |

### Controllers

| Function | File | Covered | Notes |
|---|---|---|---|
| `listActorPosts` | `controllers/listActorPosts.controller.js` | NOT_COVERED | Requires both actorId and viewerActorId — throws on missing |
| `getFeedViewerIsAdult` | `controllers/getFeedViewerContext.controller.js` | NOT_COVERED | vport shortcut path + profile read path |
| `ctrlGetWelcomeCardVisible` | `controllers/feedWelcomeCard.controller.js` | NOT_COVERED | Welcome card DB read |
| `ctrlMarkWelcomeCardSeen` | `controllers/feedWelcomeCard.controller.js` | NOT_COVERED | Welcome card DB write |

### Internal Helpers (Pipeline-Private)

| Function | File | Covered | Notes |
|---|---|---|---|
| `makeActorRoute` (private) | `model/buildMentionMaps.model.js` | NOT_COVERED | Route resolution with 4 paths — tested indirectly via buildMentionMaps |

---

## Behavior Coverage Matrix

All 8 documented workflows from BEHAVIOR.md are currently NOT_COVERED.

| Workflow | Entry Point | Covered | Risk if Untested |
|---|---|---|---|
| WF-1: Feed Initial Load | `CentralFeedScreen` mount → `useCentralFeed` | NOT_COVERED | Unauthenticated access, null actorId query firing |
| WF-2: Infinite Scroll Pagination | IntersectionObserver → `fetchNextPage` | NOT_COVERED | Double-pagination, cursor regression, end-of-feed state |
| WF-3: Pull-to-Refresh | PullToRefresh release → `queryClient.resetQueries` | NOT_COVERED | State reset correctness, hiddenPostIds not cleared |
| WF-4: Post Action Menu (all sub-actions) | `openPostMenu` → action dispatch | NOT_COVERED | Ownership gate bypass (edit/delete), block self-guard |
| WF-5: Welcome Card Lifecycle | `WelcomeFeedCard` → `useFeedWelcomeCard` | NOT_COVERED | vport exclusion guard, localStorage bypass |
| WF-6: Actor Identity Hydration | Pipeline → Zustand upsert → stale hydration | NOT_COVERED | Force hydration condition, vport null vport_name |
| WF-7: Mention Enrichment | `@` scan → `fetchRawPostMentionEdgesDAL` → `buildMentionMaps` | NOT_COVERED | Blocked actor in mention fan-out (VEN-PIPE-008) |
| WF-8: Confirm Modal / Toast | `requestConfirm` → Promise resolve | NOT_COVERED | Unmount cleanup, animation re-trigger |

---

## Invariant Coverage Matrix

All 15 invariants from BEHAVIOR.md are currently NOT_COVERED.

| # | Invariant | Covered | Regression Risk |
|---|---|---|---|
| INV-1 | Feed query does not fire if viewerActorId is null | NOT_COVERED | HIGH — cross-tenant data exposure |
| INV-2 | Unauthenticated users never reach feed screen | NOT_COVERED | HIGH — auth bypass |
| INV-3 | Block exclusion is bidirectional | NOT_COVERED | HIGH — blocked actor posts visible |
| INV-4 | Private actor posts not shown to non-followers (unless owner) | NOT_COVERED | HIGH — privacy leak |
| INV-5 | vport posts require active non-deleted vport profile | NOT_COVERED | MEDIUM — inactive vport posts visible |
| INV-6 | Posts from actors absent from actorMap always hidden | NOT_COVERED | MEDIUM — orphaned actor posts visible |
| INV-7 | Concurrent fetch lock prevents double-pagination | NOT_COVERED | MEDIUM — duplicate posts, cursor corruption |
| INV-8 | staleTime is 30 seconds — re-entry serves from cache | NOT_COVERED | LOW |
| INV-9 | Image preload runs once per actorId+realmId session | NOT_COVERED | LOW |
| INV-10 | Welcome card only shows for actor kind === 'user' | NOT_COVERED | MEDIUM — vport actors see welcome card |
| INV-11 | localStorage short-circuits DB welcome card read | NOT_COVERED | LOW |
| INV-12 | Mention enrichment skipped if no '@' in posts | NOT_COVERED | MEDIUM — unnecessary fan-out on every page |
| INV-13 | Media type defaults to 'image' for non-matching URLs | NOT_COVERED | LOW |
| INV-14 | Actor hydration fires synchronously; background pass is secondary | NOT_COVERED | LOW |
| INV-15 | Snapshot rollback applied on block failure | NOT_COVERED | MEDIUM — block failure leaves incorrect optimistic state |

---

## Security Regression Tests Needed

One test per EXPLOITABLE or REACHABLE finding from the BlackWidow 2026-06-05 report.
Tests listed in priority order (THOR blockers first, then EXPLOITABLE, then REACHABLE).

### THOR Blockers (P0 — Must Pass Before Any Release)

**SEC-REG-001 — VEN-PIPE-002: Null realmId bypasses realm filter**
- Finding: `feed.read.posts.dal.js:30-33` — when `realmId` is null, the `.eq("realm_id", realmId)` filter is skipped. Posts from all realms are returned.
- Test: Call `fetchFeedPagePipeline` with `realmId = null`. Assert DAL throws or returns empty. Assert no cross-realm posts are returned.
- Coverage target: `fetchFeedPagePipeline`, `readFeedPostsPage`
- Classification: EXPLOITABLE / THOR BLOCKER

**SEC-REG-002 — VEN-PIPE-003: vport.profiles owner-only RLS nulls vport bundle**
- Finding: `feed.read.actorsBundle.dal.js:84-89` — vport.profiles returns null for non-owners, causing all vport posts to be invisible.
- Test: Call pipeline as non-owner viewer for a vport actor. Assert vport posts are visible (after RPC fix). Assert current behavior (null bundle → hidden) is the known regression state.
- Coverage target: `fetchFeedPagePipeline`, `resolveFeedRowVisibilityModel` (missing_vport_profile branch)
- Classification: EXPLOITABLE / THOR BLOCKER

### EXPLOITABLE (P1)

**SEC-REG-003 — VEN-MOD-FEED-001: Bare console.warn in production error path**
- Finding: `useFeed.js:241` — fetch error details logged to console in production.
- Test: Trigger a pipeline fetch failure. Assert no `console.warn` / `console.error` fires outside DEV environment. Spy on console and assert zero calls in non-DEV context.
- Coverage target: `useFeed` error branch
- Classification: EXPLOITABLE

**SEC-REG-004 — VEN-MOD-FEED-002: 5 bare console.* calls in useCentralFeedActions**
- Finding: `useCentralFeedActions.js:68,139,182,197,221` — mutation error details logged to console.
- Test: Trigger delete failure, block failure, follow failure, report failure. Assert no console output in non-DEV context. Mock console and assert call count = 0.
- Coverage target: `useCentralFeedActions` all mutation error branches
- Classification: EXPLOITABLE

**SEC-REG-005 — VEN-MOD-FEED-003: Raw actor UUID in profile navigation URL**
- Finding: `useCentralFeedActions.js:152` — `navigate('/profile/' + postMenu.postActorId)` exposes raw UUID.
- Test: Call handleOpenActorProfile with a known actor. Assert navigate was called with a slug-based or encoded URL, NOT a raw UUID path.
- Coverage target: `useCentralFeedActions` handleOpenActorProfile
- Classification: EXPLOITABLE

**SEC-REG-006 — VEN-MOD-FEED-004: Raw UUID postId in share URL**
- Finding: `useCentralFeedActions.js:234-236` — `${window.location.origin}/post/${postId}` exposes post UUID.
- Test: Call handleShare with a known postId. Assert share URL uses slug or short-id, not raw UUID.
- Coverage target: `useCentralFeedActions` handleShare
- Classification: EXPLOITABLE (REACHABLE per ELEKTRA — included for coverage)

**SEC-REG-007 — VEN-PIPE-004: Raw actorId UUID in mention route fallback**
- Finding: `buildMentionMaps.model.js:6` — `makeActorRoute` fallback: `/profile/${actorId}`.
- Test: Call `buildMentionMaps` with a mention row that has `actorId` but no `username` or `vport_id`. Assert route does not expose raw UUID. Assert actor is dropped from mention map if no safe route can be built.
- Coverage target: `buildMentionMaps`, `makeActorRoute`
- Classification: EXPLOITABLE (MEDIUM severity)

**SEC-REG-008 — VEN-PIPE-008: Blocked actor presentations leaked via mention hydration fan-out**
- Finding: `fetchFeedPage.pipeline.js:127-133` — `hydrateAndReturnSummaries` is called for all mentioned actor IDs, including IDs of blocked actors.
- Test: Set up a page where a post mentions a blocked actor. Call `fetchFeedPagePipeline`. Assert blocked actor ID is not present in `mentionMapsByPostId` output. Assert blocked actor hydration was not triggered.
- Coverage target: `fetchFeedPagePipeline` mention enrichment block, `buildMentionMaps`
- Classification: EXPLOITABLE

### REACHABLE (P2)

**SEC-REG-009 — VEN-MOD-FEED-005: Legacy feed.posts.dal.js has no realm/block/privacy filter**
- Finding: `feed.posts.dal.js:11-53` — legacy DAL used without any visibility guards.
- Test: Verify that `feed.posts.dal.js` is not reachable from any production code path. Assert that `listActorPosts.controller.js` only calls `listActorPostsByActor.dal.js`. Grep assertion that legacy DAL has zero production callers.
- Coverage target: `listActorPosts` controller import chain
- Classification: REACHABLE

**SEC-REG-010 — VEN-PIPE-006: 60s block/follow cache + 30s staleTime — stale moderation state**
- Finding: `feed.read.blockRows.dal.js:5`, `feed.read.followRows.dal.js:6` — block/follow caches survive 60s; React Query serves from 30s stale cache. Blocked actor posts can re-appear.
- Test: Simulate block action. Assert block cache is invalidated immediately after block write. Assert fetchFeedPagePipeline returns the new block state on next call without waiting for cache TTL.
- Coverage target: `readFeedBlockRowsDAL` cache invalidation, `fetchFeedPagePipeline`
- Classification: REACHABLE

**SEC-REG-011 — VEN-MOD-FEED-008: Unbounded comment row fetch for count**
- Finding: `feed.read.commentCounts.dal.js:20-25` — all comment rows fetched per post for count aggregation.
- Test: Call `readCommentCountsBatch` with a post that has 10,000+ comments. Assert query uses `.count()` aggregate or is bounded. Assert no timeout.
- Coverage target: `readCommentCountsBatch`
- Classification: REACHABLE

**SEC-REG-012 — VEN-FEED-003: actorId passed as userId to readOwnedActorIdsByUserIdDAL**
- Finding: `getDebugPrivacyRows.controller.js:42` — ownership detection uses wrong field, always fails.
- Test: Call `getDebugPrivacyRowsController` with a valid actorId. Assert ownership detection returns the expected actor's owned actors. Assert the broken actorId-as-userId path is not reachable in production.
- Coverage target: `getDebugPrivacyRows.controller.js`
- Classification: REACHABLE

**SEC-REG-013 — VEN-FEED-004: viewerActorId accepted but discarded in listActorPosts**
- Finding: `listActorPosts.controller.js:33-37` — viewerActorId is required but immediately discarded; no app-layer privacy check.
- Test: Call `listActorPosts` as a non-follower viewer against a private actor. Assert posts are filtered by RLS. Assert calling without viewerActorId throws. Document the RLS-only enforcement contract.
- Coverage target: `listActorPosts`
- Classification: REACHABLE

**SEC-REG-014 — VEN-PIPE-005: Missing UUID validation on viewerActorId in hiddenPosts and viewerReactions DALs**
- Finding: `feed.read.hiddenPosts.dal.js`, `feed.read.viewerReactions.dal.js` — no UUID format validation (inconsistent with blockRows/followRows pattern).
- Test: Call `readHiddenPostsForViewer` and `readViewerReactionsBatch` with a malformed viewerActorId string. Assert no DB error thrown. Assert result is empty (safe fallback), not an error state that crashes the pipeline.
- Coverage target: `readHiddenPostsForViewer`, `readViewerReactionsBatch`
- Classification: REACHABLE

**SEC-REG-015 — VEN-FEED-001: BEHAVIOR.md missing Security Rules and Must Never Happen sections**
- Finding: BEHAVIOR.md had no §5 Security Rules or §9 Must Never Happen sections (now documented in SECURITY.md).
- Test: Contract test — assert SECURITY.md exists and has non-empty THOR blockers section. Assert VEN-PIPE-002 and VEN-PIPE-003 are listed as open.
- Coverage target: Documentation completeness contract
- Classification: REACHABLE (documentation gap)

**SEC-REG-016 — VEN-MOD-FEED-006: readProfileAdultFlagDAL has no ownership assertion**
- Finding: `feed.read.viewerContext.dal.js:17-28` — is_adult field readable without confirming caller owns the profile.
- Test: Call `getFeedViewerIsAdult` with a viewerActorId that does not own the profile_id resolved. Assert null is returned, not the profile's is_adult value.
- Coverage target: `getFeedViewerIsAdult`
- Classification: REACHABLE

**SEC-REG-017 — VEN-MOD-FEED-010: vport_id in DAL return shape violates architecture contract**
- Finding: `feed.read.viewerContext.dal.js:3-15` — vport_id exposed from DAL, violating actor-based identity contract.
- Test: Call `getFeedViewerIsAdult`. Assert the returned actor shape does not expose vport_id at any public hook or controller surface.
- Coverage target: `getFeedViewerIsAdult`, `readViewerActorIdentityDAL`
- Classification: REACHABLE

**SEC-REG-018 — VEN-MOD-FEED-007: localStorage dismiss state can be tampered**
- Finding: `useFeedWelcomeCard.js:25-30` — localStorage key `vcsm_wfc_${actorId}` can be set by user to bypass DB state.
- Test: Set localStorage key to 'dismissed' before mounting. Assert welcome card does not show. Assert DB is not queried. Document this as an accepted risk (cosmetic bypass only — no security enforcement here).
- Coverage target: `useFeedWelcomeCard`, `ctrlGetWelcomeCardVisible`
- Classification: REACHABLE (LOW severity)

---

## Recommended Test File Structure

```
apps/VCSM/src/features/feed/__tests__/
  models/
    feedBlockVisibility.model.test.js
    feedFollowVisibility.model.test.js
    feedPrivateVisibility.model.test.js
    feedRowVisibility.model.test.js
    normalizeFeedRows.model.test.js
    buildMentionMaps.model.test.js
    enrichMentionRows.model.test.js
    inferMediaType.model.test.js
  controllers/
    listActorPosts.controller.test.js
    getFeedViewerContext.controller.test.js
    feedWelcomeCard.controller.test.js
  pipeline/
    fetchFeedPage.pipeline.test.js
  security/
    sec-reg-001.realm-isolation.test.js
    sec-reg-002.vport-bundle-rls.test.js
    sec-reg-003.console-leak-usefeed.test.js
    sec-reg-004.console-leak-actions.test.js
    sec-reg-005.raw-uuid-navigate.test.js
    sec-reg-006.raw-uuid-share.test.js
    sec-reg-007.mention-route-uuid.test.js
    sec-reg-008.blocked-actor-mention.test.js
```

---

## Priority Test List (Ordered by Risk)

Priority 1 — THOR Blockers (must unblock before any release):
1. SEC-REG-001: null realmId bypasses realm filter (VEN-PIPE-002)
2. SEC-REG-002: vport.profiles owner-only RLS nulls vport bundle (VEN-PIPE-003)

Priority 2 — Visibility Model Unit Tests (pure functions, high ROI, catches INV-1 through INV-6):
3. `resolveFeedRowVisibilityModel` — all 8 reason branches (blocked_actor, missing_actor, missing_vport_profile, inactive_vport, missing_profile, private_not_following, visible_vport, visible_user)
4. `buildBlockedActorSetModel` — bidirectional block (INV-3)
5. `canViewPrivateFeedActorModel` — private/owner/follower combinations (INV-4)
6. `buildFollowedActorSetModel` — is_active=false rows excluded

Priority 3 — Security Regression (EXPLOITABLE findings):
7. SEC-REG-008: blocked actor in mention fan-out (VEN-PIPE-008)
8. SEC-REG-003: console.warn production leak (VEN-MOD-FEED-001)
9. SEC-REG-004: 5 console.* leaks in actions (VEN-MOD-FEED-002)
10. SEC-REG-005: raw UUID in navigate URL (VEN-MOD-FEED-003)
11. SEC-REG-007: raw actorId in mention route fallback (VEN-PIPE-004)

Priority 4 — Controller and Pipeline Integration:
12. `listActorPosts` — missing actorId throws, missing viewerActorId throws
13. `ctrlGetWelcomeCardVisible` — vport actor returns show=false (INV-10)
14. `getFeedViewerIsAdult` — vport shortcut, profile null path
15. `fetchFeedPagePipeline` — mention enrichment skipped when no '@' (INV-12)
16. `inferMediaType` — all extension patterns + null input + no-match default

Priority 5 — REACHABLE Security Regressions:
17. SEC-REG-010: block cache invalidation timing (VEN-PIPE-006)
18. SEC-REG-013: viewerActorId discarded in listActorPosts (VEN-FEED-004)
19. SEC-REG-014: malformed viewerActorId in hiddenPosts/viewerReactions DALs
20. SEC-REG-016: is_adult field ownership (VEN-MOD-FEED-006)

---

## Testing Infrastructure Notes

- Framework: No test framework is currently installed in this module. Jest with jsdom or Vitest is recommended.
- DAL mocking: All pipeline tests require DAL injection. The pipeline's `_`-prefixed imports (e.g., `_readFeedPostsPage`) are designed for replacement in test environments using module mocking.
- DEV-only paths: Tests for `wrapDAL` profiler wrapping require `import.meta.env.DEV = true` simulation.
- Supabase: All DAL tests require a Supabase mock. Do not use live DB in unit tests.
- Pure model tests: All 8 model files are pure functions with no external dependencies. These have the highest ROI and zero infrastructure cost.

---

## Deferred

- Hook-level tests (useCentralFeed, useFeed, useCentralFeedActions, useFeedWelcomeCard) — require React + React Query test harness. Deferred to integration test phase.
- E2E tests — require full app stack. Out of scope for this analysis.
- useFeed.js decommission tests — blocked pending CAPTAIN decision (VEN-MOD-FEED-009 / INFO).
