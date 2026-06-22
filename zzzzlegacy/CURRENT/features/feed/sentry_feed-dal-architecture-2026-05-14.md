---
report: sentry_feed-dal-architecture
date: 2026-05-14
scope: apps/VCSM/src/features/feed/
triggered_by: CEREBRO verification pass on vcsm.dal.feed.md
authority: GOVERNANCE_WRITABLE
prefix: sentry_
---

# SENTRY — Feed Feature Architecture Compliance
_Date:_ 2026-05-14  
_Scope:_ `apps/VCSM/src/features/feed/` — all layers  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.feed.md`

---

## Checks Run

| Contract Rule | Result |
|---|---|
| DAL = raw Supabase access only | VIOLATION — see SA1, SA2 |
| Components in `components/`, modals in `components/` | VIOLATION — see SA3 |
| Final Screen = route entry + identity gate only | VIOLATION — see SA4 |
| Imports use `@/` aliases, no `../../` | PASS |
| No `select('*')` | PASS |
| Files under 300 lines | PASS — all checked files within limit |
| Cross-feature access through adapter only | PASS — `feedCache.adapter.js` is approved boundary |
| Layer order: DAL → Model → Controller → Hook → Screen | VIOLATION — see SA2 |
| No TypeScript | PASS |
| No forbidden styling | PASS |

---

## SA1 — `resolvePublicRealm.dal.js`: Pure Constant in DAL Layer (MODERATE)

**File:** `apps/VCSM/src/features/feed/dal/resolvePublicRealm.dal.js`

```js
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";

export function resolvePublicRealmIdDAL() {
  return PUBLIC_REALM_ID;
}
```

**Violation:** The architecture contract defines the DAL layer as "Raw Supabase access only." This function makes no Supabase call. It imports a constant from `@/shared/utils/` and returns it synchronously. This is not a DAL function by contract definition.

**Impact:** Functional correctness is not affected. The 8 vport publish controllers that call this function get the correct constant. The naming (`DAL` suffix) creates confusion and misleads future readers into expecting a DB call.

**Resolution options (governance decision, not a code fix in this pass):**
1. Move to `@/shared/utils/resolveRealm.js` and re-export directly
2. Move to a feed utils file and remove the `DAL` suffix
3. Move to the vport publish feature (its actual consumer)

**Ruling:** MODERATE — doc drift fixed, source refactor deferred to IRONMAN ownership decision.

---

## SA2 — `feed.mentions.dal.js`: DAL Imports Engine (HIGH — LAYER ORDER VIOLATION)

**File:** `apps/VCSM/src/features/feed/dal/feed.mentions.dal.js`

```js
import { hydrateAndReturnSummaries } from "@hydration";
```

**Violation:** DAL layer imports from the `@hydration` engine. The architecture contract dependency direction is:

```
apps/VCSM → engines/ → shared/
```

And within feature layers:
```
DAL → Model → Controller → Hook → Screen
```

A DAL calling an engine is a backwards dependency. The `@hydration` engine itself likely calls DALs internally — if the hydration engine calls feed DALs, this creates a circular dependency risk.

**What the code actually does:** `fetchPostMentionRows` makes two sequential DB operations:
1. Queries `vc.post_mentions` → gets `mentioned_actor_id` values
2. Calls `hydrateAndReturnSummaries({ actorIds: mentionedActorIds })` → resolves actor identity

The second step belongs in a Model or Controller, not in a DAL. The DAL should return raw rows; identity resolution is a domain transform.

**Impact:** 
- Every time the pipeline detects `@` mentions (conditional), this DAL fires 2 sequential DB round-trips (not parallel), extending the pipeline's Promise.all total latency by the hydration round-trip time.
- The hydration engine's internal query behavior is not visible to the feed DAL — any caching or RLS applied inside the hydration engine is opaque at this call site.

**Resolution:** Split `fetchPostMentionRows` into:
1. `fetchRawPostMentionEdgesDAL` — returns `[{post_id, mentioned_actor_id}]` only (true DAL)
2. Move enrichment (hydration call + merge) to `buildMentionMaps.model.js` or a new mention controller

**Ruling:** HIGH — architecture boundary violation. Source refactor required. IRONMAN must assign ownership.

---

## SA3 — `FeedConfirmModal.jsx` in `screens/` Folder (MODERATE)

**File:** `apps/VCSM/src/features/feed/screens/FeedConfirmModal.jsx`

**Violation:** The architecture contract requires modals and reusable presentational components to live in `components/`. This file is a reusable confirm modal with:
- No routing
- No identity gate
- No `useIdentity()` hook
- Props-only interface (open, title, message, onConfirm, onCancel)
- A single `useEffect` for keyboard dismissal

It is a Component, not a Screen.

**Compound violation:** The file lives in `screens/` where it is not discoverable as a component, and its `position: fixed` placement inside `<PullToRefresh>` creates an iOS stacking context violation (see FALCON report).

**Resolution:** Move to `apps/VCSM/src/features/feed/components/FeedConfirmModal.jsx` and update the import in `CentralFeedScreen.jsx`.

**Ruling:** MODERATE — source refactor required. The modal placement (inside PullToRefresh) is a BLOCKING issue tracked in FALCON.

---

## SA4 — `CentralFeedScreen.jsx` Performs View Screen Duties (MODERATE)

**File:** `apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx`

**Violation:** The architecture contract defines Final Screen as "Route entry + identity gate only — no computation." `CentralFeedScreen.jsx` (247 lines) does far more:

- Calls `useCentralFeed`, `useCentralFeedActions`, `useFeedConfirmToast`, `useFeedInfiniteScroll` — 4 hooks
- Computes `viewerIsAdult`, `showInitialSkeleton`, `debugMode`, `debugPrivacy`, `debugFilter`
- Renders `FeedConfirmModal`, `DebugPrivacyPanel`, `DebugFeedFilterPanel`, `ReportModal`, `PostActionsMenu`, `ShareModal`, `Toast`, `WelcomeFeedCard`, `FeedSkeletonList`, `PostCard` — 10 components/modals
- Contains a `useCallback` (`handleRefresh`)
- Passes callbacks to child components

This file is functioning as a View Screen. It should be split:
- **Final Screen** (`CentralFeedScreen.jsx`): identity gate (`if (!user) return <Navigate>`) + route render of a View Screen
- **View Screen** (`CentralFeedView.jsx`): all hook calls, composition, conditional rendering

**Ruling:** MODERATE — architectural compliance violation. Not functionally broken, but creates layer purity debt.

---

## SA5 — `feedWelcomeCard.controller.js` Folder Inconsistency (LOW)

**Path:** `features/feed/controller/feedWelcomeCard.controller.js` (singular)  
**vs.:** `features/feed/controllers/` (plural — all other controllers)

Both folders exist. This is a naming inconsistency that breaks `grep "features/feed/controllers"` searches and creates ambiguity.

**Resolution:** Move `feedWelcomeCard.controller.js` to `features/feed/controllers/` to consolidate.

**Ruling:** LOW — naming inconsistency, no functional impact.

---

## SA6 — `pipeline/` Subdirectory Not in Architecture Pipeline Documentation (MODERATE)

**Path:** `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js`

The Architecture Pipeline table in `vcsm.dal.feed.md` documents layers: DAL → Model → Controller → Adapter → Hook → Component → Final Screen.

`pipeline/` is an additional layer between Model and Controller:
- It imports from DAL (10 functions)
- It imports from Model (normalizeFeedRows, buildBlockedActorSetModel, etc.)
- It is called by the Controller-equivalent path (hooks via `fetchCentralFeedPage`)

The `pipeline/` folder is a **pipeline aggregator layer** — this is a legitimate architectural layer not captured in the contract's build order. It is the single-entry-point enforcer for all 10 production read DALs.

**Resolution:** Document `pipeline/` as its own layer in the Architecture Pipeline table.

**Ruling:** MODERATE — documentation gap, not a violation per se (pattern is architecturally sound).

---

## SA7 — `queries/` Subdirectory Not Documented (the Missing Service Layer) (MODERATE)

**Path:** `apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js`

The Architecture Pipeline table shows `Service` as MISSING. This file IS the Service layer:
- Wraps `fetchFeedPagePipeline` with a 15-second timeout
- Implements multi-page drain logic (up to 2 pipeline calls on initial load)
- Provides the React Query `queryFn` interface for `useCentralFeed`
- Does NOT contain business rules (those are in pipeline + models)

The `queries/` folder functions as the Service layer between the pipeline aggregator and the hook layer.

**Resolution:** Document `queries/fetchCentralFeedPage.js` as the Service layer in the Architecture Pipeline table, replacing the `✗ MISSING` entry.

**Ruling:** MODERATE — documentation gap that resolves the previously mysterious "Service MISSING" status.

---

## Additional Undocumented Files Found

| Path | Content | Layer | Status |
|---|---|---|---|
| `features/feed/api/index.js` | Empty | — | Dead scaffold |
| `features/feed/lib/index.js` | Empty | — | Dead scaffold |
| `features/feed/ui/index.js` | Empty | — | Dead scaffold |
| `features/feed/usecases/index.js` | Empty | — | Dead scaffold |
| `features/feed/index.js` | Unknown | — | Needs inspection |

---

## Compliance Summary

| Check | Severity | Status | Resolution Required |
|---|---|---|---|
| SA1 — `resolvePublicRealm.dal.js` constant in DAL | MODERATE | VIOLATION | IRONMAN ownership decision |
| SA2 — `feed.mentions.dal.js` imports engine | HIGH | VIOLATION — BLOCKING for layer purity | IRONMAN assign, Wolverine refactor |
| SA3 — `FeedConfirmModal` in `screens/` | MODERATE | VIOLATION | Move to `components/` |
| SA4 — `CentralFeedScreen` View duties | MODERATE | VIOLATION | Split into View + Final |
| SA5 — `controller/` vs `controllers/` | LOW | INCONSISTENCY | Move file |
| SA6 — `pipeline/` undocumented | MODERATE | DOC GAP | LOGAN doc update |
| SA7 — `queries/` undocumented (Service layer) | MODERATE | DOC GAP | LOGAN doc update |
| select('*') | — | PASS | — |
| @/ imports | — | PASS | — |
| TypeScript | — | PASS | — |
| File length | — | PASS | — |
| Cross-feature boundary | — | PASS | — |

**SENTRY Verdict: VIOLATIONS FOUND**  
Two architecture boundary violations require source refactoring. Three documentation gaps require LOGAN updates. One naming inconsistency requires file move. No blocking build issues, but SA2 must be resolved before the feed layer is considered architecture-compliant.
