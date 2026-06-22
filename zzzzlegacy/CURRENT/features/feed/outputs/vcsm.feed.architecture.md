---
# Module Architecture Report — ARCHITECT §26.11
# Feature: feed
# App: VCSM
# Ticket: ARCHITECT-FEED-0001
# Generated: 2026-06-02
# Status: IMMUTABLE DATED REPORT — do not modify; update ARCHITECTURE.md instead

---

# feed — Module Architecture Report

## Feature Overview

The feed feature is the central content discovery system for the VCSM platform. It renders paginated, privacy-filtered, block-aware, reaction-enriched posts for authenticated citizens via a pipeline/query/DAL stack that executes up to 9 parallel DB reads per page load. Two parallel hook implementations exist: the legacy `useFeed.js` (manual cursor loop with local state) and the newer `useCentralFeed.js` (React Query `useInfiniteQuery`), both backed by the same `fetchFeedPage.pipeline.js` pipeline. The feature is self-contained with no engine-layer controllers or DALs — it consumes one engine alias (`@hydration`) for actor data enrichment and background hydration.

**Source Path:** `apps/VCSM/src/features/feed/`
**Engine Path:** None — feature-only (consumes `@hydration` engine alias only)
**Security Tier:** MEDIUM
**Feature Status:** ACTIVE

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | apps/VCSM/src/features/feed/controllers/ |
| DALs | YES | apps/VCSM/src/features/feed/dal/ |
| Models | YES | apps/VCSM/src/features/feed/model/ |
| Hooks | YES | apps/VCSM/src/features/feed/hooks/ |
| Screens | YES | apps/VCSM/src/features/feed/screens/ |
| Components | YES | apps/VCSM/src/features/feed/components/ |
| Adapters | YES | apps/VCSM/src/features/feed/adapters/ |
| Pipeline | YES | apps/VCSM/src/features/feed/pipeline/ (non-standard extra layer) |
| Queries | YES | apps/VCSM/src/features/feed/queries/ (non-standard extra layer) |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

The pipeline and queries layers are non-standard additions not defined in the canonical build order (`DAL → Model → Controller → Hook → Components → View Screen → Final Screen`). They emerged as the feature evolved from a controller-driven model to a React Query-driven model. The pipeline layer owns the orchestration of parallel DAL reads; the queries layer owns the `queryFn` abstraction for `useInfiniteQuery`.

---

## Active Controllers

| Controller | Purpose | Auth Gate |
|---|---|---|
| feedWelcomeCard.controller.js | Read/write welcome card visibility state for a given actorId | None — caller must supply valid actorId; write path depends entirely on DB RLS (V3 HIGH OPEN) |
| getDebugPrivacyRows.controller.js | Dev-only: build privacy debug matrix for a set of post IDs | Input guard: returns empty array if no actorId or empty postIds; no prod auth gate |
| getFeedViewerContext.controller.js | Determine viewer adult status from actor + profile data | Input guard: returns null if no viewerActorId; silently catches errors |
| listActorPosts.controller.js | SSOT for actor-scoped post reads — shared by feed AND profiles | Input guard: throws if actorId or viewerActorId missing; RLS enforces visibility downstream |

**Notes:**
- `listActorPosts.controller.js` is marked `@Status: LOCKED` and `@SSOT: PROFILE + FEED POSTS` — it is the canonical shared controller for actor posts. Both `useProfileView` and feed consumers must use this controller exclusively.
- `getDebugPrivacyRows.controller.js` is dev-diagnostic tooling; production exposure would be a security concern.

---

## Active DALs

| DAL | Schema | Tables | Notes |
|---|---|---|---|
| feed.read.posts.dal.js | vc | posts | Primary cursor-paginated posts read; explicit column list; no select('*') |
| feed.read.actorsBundle.dal.js | vc + vport | actors, profiles, actor_privacy_settings, vport.profiles | TTL-cached (30s) per-actor; reduces cross-page round-trips; vportSchema for vport.profiles |
| feed.read.blockRows.dal.js | moderation | blocks | TTL-cached (60s); UUID validation via isUuid() before query |
| feed.read.followRows.dal.js | vc | actor_follows | TTL-cached; scoped to viewerActorId + actorIds |
| feed.read.media.dal.js | vc | post_media | Batched by postIds per page |
| feed.read.hiddenPosts.dal.js | moderation | actions | Client-supplied viewerActorId; depends on moderation.actions RLS (V1 OPEN) |
| feed.read.commentCounts.dal.js | vc | post_comments | Batched count per page |
| feed.read.viewerReactions.dal.js | vc | post_reactions | Client-supplied actorId; depends on vc.post_reactions RLS (V2 OPEN) |
| feed.read.reactionCounts.dal.js | vc | post_reactions, post_rose_gifts | Parallel reads for like/dislike/rose counts |
| feed.read.viewerContext.dal.js | vc | actors, profiles | Actor identity + adult flag lookup |
| feed.mentions.dal.js | vc | post_mentions | Fetches raw @mention edges; hydration moved to pipeline level |
| feed.read.debugPrivacyRows.dal.js | vc | posts, actors, actor_privacy_settings, actor_owners, actor_follows | Dev-only; 5 separate queries; used by diagnostics group |
| feedWelcomeCard.dal.js | vc | actor_onboarding_steps | READ + WRITE (upsert); client-supplied actorId; WITH CHECK RLS unconfirmed (V3 HIGH) |
| listActorPostsByActor.dal.js | vc | posts | Actor-scoped post list; explicit column select |
| feed.posts.dal.js | vc | posts | LEGACY — dev diagnostics only; imports @hydration (layer violation); DO NOT expand |

**Schema breakdown:** `vc.*` (primary domain), `moderation.*` (blocks, hidden actions), `vport.*` (vport.profiles via vportClient schema)

---

## Active Hooks

| Hook | What It Calls | Purpose |
|---|---|---|
| useFeed.js | fetchFeedPagePipeline, hydrateActorsByIds (@hydration), useActorStore, debuggers/feed | Legacy paginated feed hook; manual cursor loop; local React state |
| useCentralFeed.js | fetchCentralFeedPage, hydrateActorsByIds (@hydration), useActorStore, useInfiniteQuery | React Query replacement for useFeed; identical public API; staleTime 30s; GC 10 min |
| useCentralFeedActions.js | useDeletePostAction, useFollowActorToggle, useFollowStatus, useBlockActorAction, useHidePostForActor, useReportFlow, shareNative | All post interaction handlers — coordinates cross-feature actions via adapter boundaries |
| useFeedWelcomeCard.js | ctrlGetWelcomeCardVisible, ctrlMarkWelcomeCardSeen | Reads and dismisses the welcome card onboarding state |
| useFeedInfiniteScroll.js | IntersectionObserver | Triggers fetchPosts on scroll-to-bottom |
| useFeedConfirmToast.js | Internal state only | Confirm modal + toast orchestration for destructive actions |
| useDebugPrivacyRows.js | getDebugPrivacyRowsController | Dev-only debug panel hook |
| useFeed.utils.js | Browser Image API | Image preload + withTimeout utilities shared by useFeed.js |

**Adapter hooks:**
- `adapters/hooks/useFeed.adapter.js` — re-exports `useFeed`; nominal adapter boundary

---

## Pipeline and Query Layers

### pipeline/fetchFeedPage.pipeline.js
The central pipeline orchestrates a single "logical page" read:
1. Reads page of posts (cursor-paginated)
2. Extracts postIds and actorIds
3. Executes 9 parallel DAL reads: media, mentions (conditional), hiddenPosts, actorsBundle, blockRows, followRows, commentCounts, viewerReactions, reactionCounts
4. Runs model transforms: buildBlockedActorSet, buildFollowedActorSet, enrichMentionRows (with @hydration), normalizeFeedRows
5. Returns: `{ normalized, debugRows, hasMoreNow, nextCursorCreatedAt, hiddenByMeSet, actors, profileMap, vportMap }`

In DEV mode, all DAL calls are wrapped via `wrapDAL` from `@debuggers/feed/feedProfiler` for timing instrumentation.

### queries/fetchCentralFeedPage.js
Pure async `queryFn` for `useInfiniteQuery`. Mirrors the while-loop from `useFeed.js` — fetches up to `MAX_EMPTY_PAGES_PER_FETCH` (2) pipeline pages per logical React Query page call. Returns React Query page shape with `nextCursor` (undefined signals no more pages).

---

## Engine Dependencies

| Engine | Import Path | Purpose | Import Sites |
|---|---|---|---|
| hydration | @hydration | Actor summary hydration — `hydrateActorsByIds`, `hydrateAndReturnSummaries` | pipeline/fetchFeedPage.pipeline.js, hooks/useFeed.js, hooks/useCentralFeed.js, dal/feed.posts.dal.js (LEGACY) |

No other engine dependencies. The feature does not import from `engines/booking`, `engines/chat`, `engines/identity`, `engines/notifications`, or any other engine.

---

## Cross-Feature Dependencies

| Feature | What Is Imported | Direction | Import Path |
|---|---|---|---|
| identity | useIdentity hook | feed consumes identity | @/features/identity/adapters/identity.adapter |
| post | PostCard component, PostActionsMenu, ShareModal | feed renders post cards | @/features/post/adapters/... (adapter boundary) |
| moderation | ReportModal, ReportedPostCover, useHidePostForActor, useReportFlow | feed handles reporting flow | @/features/moderation/adapters/... (adapter boundary) |
| block | useBlockActorAction | feed block action | @/features/block/adapters/hooks/useBlockActorAction.adapter |
| social | useFollowActorToggle, useFollowStatus | feed follow toggle | @/features/social/adapters/friend/subscribe/hooks/... (adapter boundary) |

All cross-feature imports in active files go through adapter boundaries. No direct internal-file imports from other features were found. Compliant.

---

## Authorization Pattern

The feed feature uses a passive authorization model with three tiers:

**Tier 1 — Input guards (enforced):** Controllers throw or return null/empty when `actorId` / `viewerActorId` is absent. `readFeedBlockRowsDAL` uses `isUuid()` validation before any query.

**Tier 2 — RLS delegation (partially confirmed):** Post reads, actor bundle reads, follow reads, block reads, and reaction count reads rely on Supabase RLS for data scoping. Three surfaces have unconfirmed RLS:
- `moderation.actions` → `readHiddenPostsForViewer` (V1 MODERATE)
- `vc.post_reactions` → `readViewerReactionsBatch` (V2 MODERATE)
- `vc.actor_onboarding_steps` → `markWelcomeFeedCardSeenDAL` (V3 HIGH)

**Tier 3 — No actor_owners assertion:** The feed feature has no `actor_owners` ownership check in any controller. This is appropriate for read surfaces but the write path (`feedWelcomeCard`) should assert actor ownership before upsert. Current state: trusted entirely to WITH CHECK RLS (unconfirmed).

---

## Module Independence Classification

**MOSTLY INDEPENDENT**

The feed feature owns its full stack (controllers, DALs, model layer, pipeline, hooks, screens) and has no engine-layer dependency beyond the `@hydration` alias. All cross-feature imports in consumer files go through adapter boundaries. The SSOT coupling (`listActorPosts.controller.js` shared with profiles) is intentional and documented. No reverse-dependency violations found.

---

## Architecture State

**EVOLVING**

Evidence:
- Two parallel hook implementations (`useFeed.js` legacy, `useCentralFeed.js` React Query) with identical APIs — migration in progress, no deprecation marker
- Non-standard pipeline and queries layers — emerged from migration, not in canonical build order
- `feed.posts.dal.js` remains (legacy, engine import violation) — not removed
- `CentralFeedScreen.jsx` not yet split into Final Screen + View Screen per SENTRY SA4

---

## Known Structural Risks

1. **V3 HIGH — Write path with unconfirmed WITH CHECK RLS:** `feedWelcomeCard.controller.js` + `markWelcomeFeedCardSeenDAL` upsert into `vc.actor_onboarding_steps` with a client-supplied `actorId`. No `actor_owners` check. No confirmed WITH CHECK RLS. Requires CARNAGE to close.

2. **V1 MODERATE — Hidden posts read with client actorId:** `readHiddenPostsForViewer` accepts client-supplied `viewerActorId`. Safety depends on `moderation.actions` RLS. Requires CARNAGE to confirm.

3. **V2 MODERATE — Reactions read with client actorId:** `readViewerReactionsBatch` accepts client-supplied `actorId`. Safety depends on `vc.post_reactions` RLS. Requires CARNAGE to confirm.

4. **SA2 HIGH — Legacy DAL with engine import (low active risk):** `feed.posts.dal.js` imports `@hydration` at the DAL layer — a layer order violation per SENTRY. The active pipeline has already moved hydration to the pipeline layer. Risk is accidental re-use. Requires IRONMAN assignment for removal.

5. **Dual hook migration undeclared:** `useFeed.js` and `useCentralFeed.js` both exist and are both active. No deprecation marker on `useFeed.js`. `CentralFeedScreen.jsx` already uses `useCentralFeed` — the React Query path is winning — but the migration is not formalized. Requires WOLVERINE.

6. **SA3 MODERATE — FeedConfirmModal.jsx:** FALCON flagged for iOS stacking context investigation. Located in components/ folder.

7. **Ungated console.log in pipeline:** `fetchFeedPage.pipeline.js` line 137 has a bare `console.log` call inside a `debugPostId` branch not wrapped in `import.meta.env.DEV`. Should be guarded.

8. **SA4 MODERATE — CentralFeedScreen.jsx not split:** SENTRY recommended splitting into Final Screen + View Screen per platform layering convention. Deferred.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | DR_STRANGE.md, CURRENT_STATUS.md | None |
| Owner defined | PARTIAL | ironman_feed-dal-ownership-2026-05-14.md present | Canonical OWNERSHIP.md not created |
| Entry points mapped | PASS | CentralFeedScreen confirmed, /feed route documented | None |
| Controllers present | PASS | 4 controllers, all mapped | None |
| DAL/repository present | PASS | 16 DAL files; all tables identified | 3 RLS policies unconfirmed |
| Models/transformers | PASS | 8 model files; visibility, normalization, mentions covered | None |
| Hooks/view models | PASS | 8 hooks; both hook strategies documented | Dual implementation — migration undeclared |
| Screens/components | PASS | 3 screens, 4 components | Debug panels production-gating risk |
| Authorization path mapped | PARTIAL | Input guards confirmed; 3 RLS policies unconfirmed | CARNAGE required for V1/V2/V3 |
| Engine dependencies mapped | PASS | @hydration confirmed; all 4 import sites listed | feed.posts.dal.js legacy violation pending removal |
| Tests/validation noted | FAIL | 0 test files found; SPIDER-MAN never run | Complete test coverage gap |

---

## Recommended Handoffs

| Command | Reason |
|---|---|
| CARNAGE | Verify RLS on `vc.actor_onboarding_steps`, `moderation.actions`, `vc.post_reactions` — closes V1/V2/V3; required before THOR |
| IRONMAN | Finalize OWNERSHIP.md; assign SA2 refactor (remove `feed.posts.dal.js`); assign SA3 FeedConfirmModal.jsx investigation |
| SPIDER-MAN | Zero test coverage; pipeline normalization, model visibility logic, and mention enrichment all unprotected by tests |
| WOLVERINE | Formalize `useFeed.js` → `useCentralFeed.js` migration; deprecate and remove `useFeed.js` once migration confirmed |

---

## Final Module Status

**MOSTLY COMPLETE**

The feed feature has a full layer stack, explicit column selects, TTL-caching in hot DALs, proper adapter boundaries for cross-feature access, and thorough model-layer visibility logic. Core incompleteness: three unconfirmed RLS policies on a write path and two read surfaces, zero test files, a dual-hook migration left undeclared, one legacy DAL with a layer violation, and missing canonical governance files (OWNERSHIP.md, TESTS.md, BLOCKERS.md, DEFERRED.md).

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-FEED-0001
- Architecture State: EVOLVING
- Module Status: MOSTLY COMPLETE
- Controller Count: 4
- DAL Count: 16 (15 active + 1 legacy)
- Hook Count: 8
- Model Count: 8
- Engine Deps: @hydration
- Open Risks: V3 HIGH, V1/V2 MODERATE (CARNAGE required), SA2 HIGH (IRONMAN required), dual-hook migration, 0 tests
