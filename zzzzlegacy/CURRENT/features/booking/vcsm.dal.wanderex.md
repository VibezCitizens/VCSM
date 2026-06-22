# VCSM DAL — `wanderex`

---

> # ⚠️ FEATURE ON STANDBY — DO NOT USE
>
> **This feature is parked. Do not link to it, route to it, build on it, or spend any time on it.**
> No work should be done on WanderEx until explicitly reactivated.
> All findings in this document are for archive reference only.
>
> _— AI input, 2026-05-11_

---

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/wanderex/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 2 |
| Exported functions | 18 |
| Tables accessed | 10 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `wanderexPublic.read.dal.js`

**Path:** `features/wanderex/dal/wanderexPublic.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listWanderExDirectoryProfilesDAL` | `read` | `public_traze_profiles_v`, `profiles` |
| `readWanderExProfileBundleBySlugDAL` | `read` | `public_traze_profiles_v`, `profiles` |

### `wanderexPublicHelpers.read.dal.js`

**Path:** `features/wanderex/dal/wanderexPublicHelpers.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `BOOKING_SELECT` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `DIRECTORY_SELECT` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `PROFILE_SELECT` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `RESOURCE_SELECT` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `REVIEW_SUMMARY_SELECT` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `RULE_SELECT` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `buildDirectoryAvailabilityState` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `normalizePublicReviewCards` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `readActiveTeamResourcesByProfileIds` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `readAvailabilityRulesByResourceIds` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `readBookingProfilesByServiceIds` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `readBookingsInRangeByProfileIds` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `readProfilePublicDetailsIds` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `readPublicReviewsByActorId` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `readReviewSummaryMap` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |
| `readServicesByActorId` | `read` | `booking_service_profiles`, `public_vport_review_summary_v`, `public_vport_reviews_v`, `resources`, `profile_public_details`, `availability_rules`, `profiles`, `services`, `bookings` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `availability_rules` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId` |
| `booking_service_profiles` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId` |
| `bookings` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId` |
| `profile_public_details` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId` |
| `profiles` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `listWanderExDirectoryProfilesDAL`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId`, `readWanderExProfileBundleBySlugDAL` |
| `public_traze_profiles_v` | READ | `listWanderExDirectoryProfilesDAL`, `readWanderExProfileBundleBySlugDAL` |
| `public_vport_review_summary_v` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId` |
| `public_vport_reviews_v` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId` |
| `resources` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId` |
| `services` | READ | `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`, `buildDirectoryAvailabilityState`, `normalizePublicReviewCards`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `wanderexPublic.read.dal.js`

**Direct callers:**

- `useWanderExDirectory.js` _Hook_
- `useWanderExProfile.js` _Hook_

**Full call chain to screen:**

```
`wanderexPublic.read.dal.js` → `useWanderExDirectory.js` → `WanderExDirectory.screen.jsx`
```
```
`wanderexPublic.read.dal.js` → `useWanderExDirectory.js` → `WanderExHome.screen.jsx`
```
```
`wanderexPublic.read.dal.js` → `useWanderExProfile.js` → `WanderExBook.screen.jsx`
```
```
`wanderexPublic.read.dal.js` → `useWanderExProfile.js` → `WanderExProfile.screen.jsx`
```

### `wanderexPublicHelpers.read.dal.js`

**Direct callers:**

- `wanderexPublic.read.dal.js` _DAL_

**Full call chain to screen:**

```
`wanderexPublicHelpers.read.dal.js` → `wanderexPublic.read.dal.js` → `useWanderExDirectory.js` → `WanderExDirectory.screen.jsx`
```
```
`wanderexPublicHelpers.read.dal.js` → `wanderexPublic.read.dal.js` → `useWanderExDirectory.js` → `WanderExHome.screen.jsx`
```
```
`wanderexPublicHelpers.read.dal.js` → `wanderexPublic.read.dal.js` → `useWanderExProfile.js` → `WanderExBook.screen.jsx`
```
```
`wanderexPublicHelpers.read.dal.js` → `wanderexPublic.read.dal.js` → `useWanderExProfile.js` → `WanderExProfile.screen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `wanderexAvailability.model.js`, `wanderexPublic.model.js`, `wanderexProfileScreen.model.js` |
| **Controller** | ✗ MISSING | — |
| **Adapter** | ✗ MISSING | — |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useWanderExAnalytics.js`, `useWanderExBookingFlow.helpers.js`, `useWanderExBookingFlow.js`, `useWanderExBookingSubmit.js`, `useWanderExDirectory.js`, `useWanderExProfile.js` +2 more |
| **Component** | ✓ PRESENT | `WanderExBookingLaneCalendar.jsx`, `WanderExHeroCard.jsx`, `WanderExLeadActionModal.jsx`, `WanderExTopNav.jsx` |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✗ MISSING | — |

### Model

_Pure transforms — no side effects, no DB access_

- `features/wanderex/model/wanderexAvailability.model.js`
- `features/wanderex/model/wanderexPublic.model.js`
- `features/wanderex/screens/wanderexProfileScreen.model.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/wanderex/hooks/useWanderExAnalytics.js`
- `features/wanderex/hooks/useWanderExBookingFlow.helpers.js`
- `features/wanderex/hooks/useWanderExBookingFlow.js`
- `features/wanderex/hooks/useWanderExBookingSubmit.js`
- `features/wanderex/hooks/useWanderExDirectory.js`
- `features/wanderex/hooks/useWanderExProfile.js`
- `features/wanderex/hooks/useWanderExSeo.js`
- `features/wanderex/hooks/useWanderExSubmit.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/wanderex/components/WanderExBookingLaneCalendar.jsx`
- `features/wanderex/components/WanderExHeroCard.jsx`
- `features/wanderex/components/WanderExLeadActionModal.jsx`
- `features/wanderex/components/WanderExTopNav.jsx`

### Missing Layers

- 🔴 **Controller** — not detected in static scan
- 🟡 **Adapter** — not detected in static scan
- 🟡 **Service** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan
- 🟡 **Final Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`  
_Auditor:_ ARCHITECT

---

### Verdict: Feature Is Fully Unrouted — DAL Functions Technically Imported But Unreachable

| Item | Status | Evidence |
|---|---|---|
| `listWanderExDirectoryProfilesDAL` | IMPORTED — UNROUTED FEATURE | `useWanderExDirectory.js` → screens exist → `wanderex.routes.jsx` returns `[]`, never imported by main router |
| `readWanderExProfileBundleBySlugDAL` | IMPORTED — UNROUTED FEATURE | `useWanderExProfile.js` → screens exist → `wanderex.routes.jsx` returns `[]`, never imported by main router |
| `BOOKING_SELECT` | INTERNAL CONSTANT ONLY | Only consumed inside `wanderexPublic.read.dal.js` — no external imports |
| `DIRECTORY_SELECT` | INTERNAL CONSTANT ONLY | Only consumed inside `wanderexPublic.read.dal.js` — no external imports |
| `PROFILE_SELECT` | INTERNAL CONSTANT ONLY | Only consumed inside `wanderexPublic.read.dal.js` — no external imports |
| `RESOURCE_SELECT` | INTERNAL CONSTANT ONLY | Only consumed inside `wanderexPublic.read.dal.js` — no external imports |
| `REVIEW_SUMMARY_SELECT` | INTERNAL CONSTANT ONLY | Only consumed inside `wanderexPublic.read.dal.js` — no external imports |
| `RULE_SELECT` | INTERNAL CONSTANT ONLY | Only consumed inside `wanderexPublic.read.dal.js` — no external imports |
| `buildDirectoryAvailabilityState` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |
| `normalizePublicReviewCards` | INTERNAL HELPER — DUPLICATE NAME | Only consumed by `wanderexPublic.read.dal.js`; a separate `normalizePublicReviewCards` exists in `vportMenu/model/` and is the live production version |
| `readActiveTeamResourcesByProfileIds` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |
| `readAvailabilityRulesByResourceIds` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |
| `readBookingProfilesByServiceIds` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |
| `readBookingsInRangeByProfileIds` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |
| `readProfilePublicDetailsIds` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |
| `readPublicReviewsByActorId` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |
| `readReviewSummaryMap` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |
| `readServicesByActorId` | INTERNAL HELPER ONLY | Only consumed by `wanderexPublic.read.dal.js` — no external imports |

---

### Dead Code Finding #1 — Entire WanderEx Feature Is Unrouted

**File:** `app/routes/public/wanderex.routes.jsx`  
**Classification:** UNROUTED FEATURE — zero active routes, route file never imported by main router  

**Evidence:**
`wanderex.routes.jsx` content:
```js
export function wanderexPublicRoutes() {
  return [];
}
export default wanderexPublicRoutes;
```

- `wanderexPublicRoutes` returns an empty array — no routes are registered
- `wanderex.routes.jsx` has zero import references anywhere in `apps/VCSM/src/` outside itself — the routes file is never consumed by `app.routes.jsx`, `lazyApp.jsx`, or any parent router

**Cascade:** Because no routes are registered, all downstream code is unreachable at runtime:
```
wanderexPublic.read.dal.js
  → useWanderExDirectory.js → WanderExHome.screen.jsx, WanderExDirectory.screen.jsx
  → useWanderExProfile.js   → WanderExBook.screen.jsx, WanderExProfile.screen.jsx
```
All four screens exist on disk. All hooks exist. All DAL functions exist and are imported. But no user can ever navigate to any of them — the route tree has no entry point.

**Risk:** MEDIUM — no runtime errors (unreachable code does not execute), but a non-trivial feature (multi-screen directory + booking flow + availability engine) is shipping in the bundle without being wired. Bundle bloat, false sense of completeness.  
**Recommended action:** Confirm whether WanderEx is intentionally deferred. If deferred, the entire `features/wanderex/` directory is a delete candidate. If planned for activation, wire `wanderexPublicRoutes()` into the main router and populate it with the correct screen routes.  
**Handoffs:** IRONMAN (confirm WanderEx disposition — deferred, cancelled, or pending route wire-up), WOLVERINE (wire route if confirmed active)

---

### Dead Code Finding #2 — 6 SELECT Constants Exported Unnecessarily from `wanderexPublicHelpers.read.dal.js`

**File:** `features/wanderex/dal/wanderexPublicHelpers.read.dal.js`  
**Items:** `BOOKING_SELECT`, `DIRECTORY_SELECT`, `PROFILE_SELECT`, `RESOURCE_SELECT`, `REVIEW_SUMMARY_SELECT`, `RULE_SELECT`  
**Classification:** EXPORT SURFACE BLOAT — constants are internal-only, never imported outside the file pair  

**Evidence:**
- All 6 SELECT constants appear only in `wanderexPublicHelpers.read.dal.js` (definition) and `wanderexPublic.read.dal.js` (consumer)
- The `features/booking/dal/` files contain constants with the same names (`BOOKING_SELECT`, etc.) — these are **local declarations**, not imports from wanderex. Confirmed: zero `import ... from ... wanderexPublicHelpers` found outside the wanderex DAL pair
- The doc's Summary table counts them as "exported functions" — they are exported constants, not functions. The function count of 18 is inflated by 6

**Risk:** LOW — no runtime impact. The doc misclassifies them and overstates the exported surface. If the wanderex feature is ever activated, these should be made module-private (not exported).  
**Recommended action:** Remove `export` keyword from all 6 SELECT constants — they are DAL-internal implementation details. Correct the Summary table: 18 exported items → 12 (6 functions + 6 constants, with constants made private).  
**Handoffs:** WOLVERINE (remove exports if wanderex is activated), LOGAN (correct Summary table)

---

### Dead Code Finding #3 — 9 Helper Functions Exported Unnecessarily, Never Imported Externally

**File:** `features/wanderex/dal/wanderexPublicHelpers.read.dal.js`  
**Items:** `buildDirectoryAvailabilityState`, `readActiveTeamResourcesByProfileIds`, `readAvailabilityRulesByResourceIds`, `readBookingProfilesByServiceIds`, `readBookingsInRangeByProfileIds`, `readProfilePublicDetailsIds`, `readPublicReviewsByActorId`, `readReviewSummaryMap`, `readServicesByActorId`  
**Classification:** EXPORT SURFACE BLOAT — all helper functions are consumed only by `wanderexPublic.read.dal.js`  

**Evidence:**
- Zero import references to any of these 9 functions found outside `features/wanderex/`
- All are internal helpers that `wanderexPublic.read.dal.js` assembles into the two public DAL functions
- They are correctly split into a helpers file but incorrectly exported (their `export` keyword makes them part of the public module surface)

**Risk:** LOW — no runtime impact. If the feature were activated, external code could incorrectly import from the helpers DAL directly, bypassing the public DAL entry point.  
**Recommended action:** Remove `export` keywords from all 9 helper functions. They should be private to `wanderexPublicHelpers.read.dal.js`.  
**Handoffs:** WOLVERINE (make private if wanderex is activated)

---

### Dead Code Finding #4 — `normalizePublicReviewCards` Duplicate — DAL Layer Violation

**Files:**  
- `features/wanderex/dal/wanderexPublicHelpers.read.dal.js` — defines `normalizePublicReviewCards`  
- `features/public/vportMenu/model/vportPublicReviews.model.js:53` — also defines `normalizePublicReviewCards`  

**Classification:** DUPLICATE FUNCTION NAME — live version is in model; wanderex version is in DAL (layer violation)  

**Evidence:**
`getVportPublicReviews.controller.js` imports `normalizePublicReviewCards` from:
```js
import {
  normalizePublicReviewCards,
} from "@/features/public/vportMenu/model/vportPublicReviews.model";
```
The controller does NOT import from wanderex — it uses the `vportMenu/model/` version. The wanderex version in `wanderexPublicHelpers.read.dal.js` is only consumed internally by `wanderexPublic.read.dal.js`.

**Two violations in one:**
1. **Duplicate:** `normalizePublicReviewCards` is defined twice — once in a model (correct layer), once in a DAL (wrong layer). Transform/normalization logic belongs in model, not DAL.
2. **Layer violation:** Normalization functions have no business being in a DAL file. A DAL must only perform raw Supabase queries. `normalizePublicReviewCards` in `wanderexPublicHelpers.read.dal.js` is a transform, not a query — it violates the DAL responsibility contract.

**Risk:** MEDIUM — the production-active version (`vportMenu/model/`) is correctly placed. The wanderex duplicate is dead (unrouted feature) and incorrectly placed. If wanderex is ever activated and the developer mistakenly uses the DAL version, data transforms will live in the wrong layer and diverge from the production model version.  
**Recommended action:** When activating wanderex, extract `normalizePublicReviewCards` from `wanderexPublicHelpers.read.dal.js` into a `wanderex/model/` file. Evaluate whether it can reuse the existing `vportPublicReviews.model.js` version or needs wanderex-specific logic.  
**Handoffs:** WOLVERINE (extract to model layer if wanderex is activated), SENTRY (layer violation in DAL file)

---

### Structural Finding #1 — Hook-to-DAL Direct Import: No Controller Layer

**Files:** `features/wanderex/hooks/useWanderExDirectory.js`, `features/wanderex/hooks/useWanderExProfile.js`  
**Classification:** LAYER VIOLATION — hooks import DAL directly, bypassing the controller layer  

**Evidence:**
The call chain doc (confirmed by grep) shows:
```
wanderexPublic.read.dal.js → useWanderExDirectory.js (Hook)
wanderexPublic.read.dal.js → useWanderExProfile.js (Hook)
```
The Architecture Pipeline confirms: **Controller — MISSING**.  

Per the architecture contract, the required flow is:
```
DAL → Controller → Hook
```
Hooks must not import from DAL directly. Business logic, query orchestration, and ownership checks belong in a controller. Without a controller layer, all business rules are either missing or scattered into hooks.

**Risk:** HIGH — business rules (availability checks, slot building, review aggregation) are either embedded in hooks or absent. Hooks must contain only lifecycle/timing/state wiring per the architecture contract. Without a controller, authorization paths are also likely unverified.  
**Recommended action:** If WanderEx is activated, a `wanderexPublic.controller.js` must be created to own the business logic. Hooks must be refactored to call the controller, not the DAL.  
**Handoffs:** WOLVERINE (create controller layer before activation), SENTRY (authorization gap — no controller means no ownership/permission layer)

---

### Structural Finding #2 — Architecture Pipeline Marks View Screen and Final Screen MISSING — Screens Exist

**Classification:** DOC INACCURACY — static scanner missed screen files  

**Evidence:**
The pipeline marks View Screen and Final Screen as MISSING. The following screens exist in `features/wanderex/screens/`:
- `WanderExDirectory.screen.jsx`
- `WanderExHome.screen.jsx`
- `WanderExBook.screen.jsx`
- `WanderExProfile.screen.jsx`

The scanner likely missed them because the naming pattern uses `.screen.jsx` suffix rather than the `Screen.jsx` or `ScreenView.jsx` patterns the scanner expects.

**Corrected pipeline:**

| Layer | Actual Status | Files |
|---|---|---|
| DAL | PRESENT | `wanderexPublic.read.dal.js`, `wanderexPublicHelpers.read.dal.js` |
| Model | PRESENT | `wanderexAvailability.model.js`, `wanderexPublic.model.js`, `wanderexProfileScreen.model.js` |
| Controller | MISSING | — (layer violation: hooks call DAL directly) |
| Hook | PRESENT | 8 hooks |
| Component | PRESENT | 4 components |
| Final Screen | PRESENT (undetected) | `WanderExDirectory.screen.jsx`, `WanderExHome.screen.jsx`, `WanderExBook.screen.jsx`, `WanderExProfile.screen.jsx` |
| Routes | EMPTY + UNIMPORTED | `wanderex.routes.jsx` returns `[]`, never consumed |

**Recommended action:** Update Architecture Pipeline table and add a note about the empty routes file.  
**Handoffs:** LOGAN (doc correction)

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| `wanderex.routes.jsx` returns `[]` and is never imported — entire feature unrouted | UNROUTED FEATURE | P0 — confirm disposition with IRONMAN |
| 6 SELECT constants exported unnecessarily — internal-only, doc overcounts as functions | EXPORT BLOAT + DOC INACCURACY | P2 — make private when activating |
| 9 helper functions exported unnecessarily — internal-only | EXPORT BLOAT | P2 — make private when activating |
| `normalizePublicReviewCards` duplicated — wanderex DAL version vs. vportMenu model version | DUPLICATE + LAYER VIOLATION | P1 — DAL must not contain transforms |
| `useWanderExDirectory` + `useWanderExProfile` import DAL directly — no controller layer | LAYER VIOLATION | P0 — controller required before activation |
| Architecture Pipeline marks screens MISSING — 4 screens exist with `.screen.jsx` pattern | DOC INACCURACY | P3 |

**Confirmed dead functions (zero import references):** 0  
**Unrouted feature (imported but unreachable):** Full wanderex stack — 2 DAL functions, 16 helper items, 8 hooks, 4 screens  
**Doc function count:** OVERSTATED — 18 listed, 12 actual (6 are constants misclassified as functions)  
**Critical gap:** No controller layer; hooks call DAL directly — feature cannot be safely activated without adding controller + refactoring hooks  
**Critical flag:** `wanderex.routes.jsx` returns an empty array and is never imported — the entire feature is dead at the entry point
