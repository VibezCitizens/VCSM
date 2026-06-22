# Module Architecture Report — vcsm.explore
# Generated: 2026-06-02
# Ticket: ARCHITECT-EXPLORE-0001
# ARCHITECT §26.11 — Dated Immutable Module Report
# Status: IMMUTABLE — do not edit; supersede with a new dated report

---

# explore — Full Module Architecture Report

## Report Header

| Field | Value |
|---|---|
| Feature | explore |
| App | VCSM |
| Security Tier | LOW |
| Feature Status | ACTIVE |
| Base Source Path | `apps/VCSM/src/features/explore/` |
| Architecture State | EVOLVING |
| Module Status | MOSTLY COMPLETE |
| Run Date | 2026-06-02 |
| Ticket | ARCHITECT-EXPLORE-0001 |
| Prior ARCHITECT Evidence | None — first ARCHITECT run |
| Prior ARCHITECTURE.md | None — created by this run |

---

## Feature Overview

The `explore` feature is the platform-wide search and discovery surface for VCSM. It
provides a full-screen search bar with filter tabs (Citizens, Vports, Vibes, Districts),
dispatching query-driven searches across actors (via `identity.search_actor_directory` RPC),
posts (via direct `vc.posts` query), and feature destinations (Wanders card injection).
When no query is active, a discovery feed is conditionally rendered — currently feature-flagged
off via a hardcoded constant. The route is `/explore` (auth-required, no controller-level gate).

**Source Path:** `apps/VCSM/src/features/explore/`
**Engine Path:** `engines/hydration/` (via `@hydration` alias — fire-and-forget actor cache warm)

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | `apps/VCSM/src/features/explore/controller/` |
| DALs | YES | `apps/VCSM/src/features/explore/dal/` |
| Models | YES | `apps/VCSM/src/features/explore/model/` |
| Hooks | YES | `apps/VCSM/src/features/explore/hooks/` |
| Screens | YES | `apps/VCSM/src/features/explore/screens/` |
| Components | YES | `apps/VCSM/src/features/explore/ui/` (11 components + nested `features/` subdir) |
| Adapters | NO | None — no adapter barrel exists for this feature |
| Use Cases | YES (DEAD) | `apps/VCSM/src/features/explore/usecases/` — not consumed by any hook |
| Engine controllers | NO | None |
| Engine DALs | YES (indirect) | `engines/hydration/` via `@hydration` alias in controller |

---

## Active Controllers

| Controller | Purpose | Auth Gate |
|---|---|---|
| `searchResults.controller.js` | Orchestrates multi-source search: calls `searchDal`, fires `hydrateActorsByIds` (fire-and-forget), normalizes + dedupes results, injects Wanders feature card via `buildFeatureResults` | None — no `requireUser()`; delegates to route guard and Supabase RLS |
| `searchTabs.controller.js` | Thin dispatcher — calls `searchDal` with full pagination opts (`limit`, `offset`, `viewerActorId`) and returns flat results | None — same pattern |

**Architectural note — dead use case:** `usecases/search.usecase.js` duplicates the
orchestration of `searchResults.controller.js` using `Promise.allSettled` (more resilient).
It is never imported by any hook or screen. This is confirmed dead code and a maintenance risk.

**Duplicate Wanders injection:** Feature card injection runs independently in both
`searchResults.controller.js` (`buildFeatureResults`) and `useSearchTabsActor.js`. If
`useSearchTabsActor` were ever wired to the active screen, the Wanders card would render twice.

---

## Active DALs

| DAL | Tables / RPCs | Auth Guard | Notes |
|---|---|---|---|
| `search.dal.js` | `identity.rpc('search_actor_directory')`, `vc.from('posts')` | None at DAL level — Supabase RLS | Unified dispatch DAL; routes to actor, post, tag, or stub handler based on `filter`; `videos` and `groups` arms return `Promise.resolve([])` |

**Table detail:**
- `identity` schema: `search_actor_directory` RPC — params: `p_viewer_domain`, `p_viewer_actor_id`, `p_query`, `p_filter`, `p_limit`, `p_offset`
- `vc` schema: `posts` — columns: `id, actor_id, text, title, tags, created_at`; filters: `deleted_at IS NULL`, `is_hidden.is.null OR is_hidden = false`, tag `contains`, text `ilike`

---

## Active Hooks

| Hook | Calls | Purpose |
|---|---|---|
| `useSearchScreenController` | `ctrlSearchResults` | Primary search hook — manages query/debounce/filter state, TTL cache (45s, max 120 entries), inflight promise deduplication, cancellation safety via `cancelled` flag |
| `useSearchActor` | `useSearchScreenController` (re-export) | No-op alias — thin re-export with zero added logic |
| `useSearchTabsActor` | `ctrlSearchTabs` | Alternative hook — no module-level cache, request-ID cancellation, client-side Wanders injection |

**Active screen wiring:** `SearchScreen.view.jsx` consumes only `useSearchScreenController`.
`useSearchTabsActor` is defined but not wired to any active screen path.

---

## Engine Dependencies

| Engine | Alias / Import Path | Purpose | Direction |
|---|---|---|---|
| `hydration` | `@hydration` → `engines/hydration/` | Fire-and-forget actor cache warm after search returns actor IDs | explore → engines/hydration |

The call is `hydrateActorsByIds(actorIds).catch(() => {})` — fully fire-and-forget; no return
value consumed; all failures silently swallowed.

---

## Cross-Feature Dependencies

| Feature | What Is Imported | Import Surface | Boundary Status |
|---|---|---|---|
| `onboarding` | `OnboardingCardsView` | `@/features/onboarding/adapters/onboarding.adapter` | COMPLIANT — adapter-gated |
| `shared` | `SkeletonRow` | `@/shared/components/Skeleton` | COMPLIANT — shared primitive |

---

## Authorization Pattern

No in-controller auth gate. Access control is enforced at two external boundaries:

1. **Route level:** `ui/index.jsx` exports `{ path: '/explore', public: false }` — the
   platform router must reject unauthenticated sessions before reaching the screen.
2. **Database level:** `identity.search_actor_directory` RPC receives `p_viewer_actor_id`
   and applies server-side visibility. `vc.posts` is filtered by `deleted_at` and
   `is_hidden` but not by viewer identity — any authenticated session can read all
   non-hidden posts.

Risk: Route guard misconfiguration is the only protection against unauthenticated search.
For a LOW-tier read-only surface this is acceptable but should be confirmed with HAWKEYE.

---

## Module Independence Classification

**MOSTLY INDEPENDENT**

Complete internal layer stack (DAL, model, controller, hook, screen). Only external
dependencies are a fire-and-forget engine call and a single adapter import from `onboarding`
in the view layer. Dead `usecases/` code creates confusion but not a boundary violation.

---

## Architecture State

**EVOLVING**

Active structural drift: dead use case shadows controller, Wanders injection duplicated
across controller and unused hook, discovery feed permanently disabled via hardcoded flag,
broken import path in `ui/index.jsx`, multiple parallel normalization paths in model layer.
Feature is functional but requires cleanup before further growth.

---

## Known Structural Risks

| # | Risk | Severity | File |
|---|---|---|---|
| 1 | Dead `search.usecase.js` — duplicates controller with more resilient `Promise.allSettled`; never consumed | MEDIUM | `usecases/search.usecase.js` |
| 2 | Duplicate Wanders injection — controller + hook both build the same feature card | LOW | `controller/searchResults.controller.js`, `hooks/useSearchTabsActor.js` |
| 3 | Broken import path in barrel — `ui/index.jsx` imports from `screen/` (singular); actual dir is `screens/` (plural) — hard module resolution error if barrel is consumed | HIGH | `ui/index.jsx` |
| 4 | No controller-level auth gate — both controllers lack `requireUser()`; auth is fully route-and-RLS-delegated | LOW (LOW tier) | `controller/searchResults.controller.js`, `controller/searchTabs.controller.js` |
| 5 | ExploreFeed permanently disabled — `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` hardcoded constant, no feature-flag system | LOW | `ui/ExploreFeed.jsx` |
| 6 | `useSearchActor` is a no-op alias with no distinct purpose | LOW | `hooks/useSearchActor.js` |
| 7 | Triple normalization paths in model — type-specific mappers, `normalizeResult` dispatcher, and `normalizeActorRow` RPC-specific mapper with dual-key output | MEDIUM | `model/search.model.js` |

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source structure scoped to search/discovery; route at `/explore` | None |
| Owner defined | FAIL | No OWNERSHIP.md | IRONMAN not run |
| Entry points mapped | PASS | `ExploreScreen.jsx` → `SearchScreen.view.jsx`; route declared in `ui/index.jsx` | Broken import in `ui/index.jsx` (risk #3) |
| Controllers present | PASS | 2 controllers present | Dead use case (risk #1) |
| DAL/repository present | PASS | Unified dispatch DAL with multi-source routing | Videos/groups stubs unbuilt |
| Models/transformers | PARTIAL | Model present; 3 parallel normalization paths; dual-key output on actor rows | Technical debt in `normalizeActorRow` |
| Hooks/view models | PASS | 3 hooks; primary hook has TTL cache and inflight dedup | `useSearchActor` no-op alias (risk #6) |
| Screens/components | PASS | 1 screen, 1 view, 11 UI components | `ExploreFeed` permanently disabled (risk #5) |
| Authorization path mapped | PARTIAL | Route guard + Supabase RLS; no controller gate | Missing `requireUser()` (risk #4) |
| Engine dependencies mapped | PASS | `@hydration` fire-and-forget identified and documented | None |
| Tests/validation noted | FAIL | Zero test files in feature directory | SPIDER-MAN not run |

---

## Recommended Handoffs

| Command | Priority | Reason |
|---|---|---|
| **VENOM** | P1 | No security posture; no controller auth gate; post search unscoped by viewer; SECURITY.md missing |
| **HAWKEYE** | P1 | Verify `/explore` route guard is active; confirm `ui/index.jsx` broken import does not silently drop route registration in live router bundle |
| **SPIDER-MAN** | P2 | Zero test files; TTL cache, inflight dedup, and cancellation safety in `useSearchScreenController` need regression coverage |
| **IRONMAN** | P2 | No ownership file; multiple structural risks need assigned owner |

---

## Final Module Status

**MOSTLY COMPLETE**

The core search execution path (controller → DAL → model → hook → screen) is fully built
and functional. Blocked from COMPLETE by: dead use case, duplicate injection logic, broken
import in route barrel, zero tests, no controller-level auth gate, and a permanently
disabled discovery feed.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-EXPLORE-0001
- Architecture State: EVOLVING
- Files Written:
  - `zNOTFORPRODUCTION/CURRENT/features/explore/ARCHITECTURE.md`
  - `zNOTFORPRODUCTION/CURRENT/FEATURE_INDEX_RUNTIME/explore.md`
  - `zNOTFORPRODUCTION/CURRENT/outputs/2026/06/02/ARCHITECT/modules/vcsm.explore.architecture.md`
