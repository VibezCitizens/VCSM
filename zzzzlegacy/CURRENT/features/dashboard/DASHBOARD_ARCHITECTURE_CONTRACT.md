---
# VPORT Dashboard — Architecture Contract

**Version:** 1.0
**Established:** 2026-06-02
**Maintained by:** ARCHITECT
**Enforced by:** ARCHITECT, SENTRY, review-contract

---

## Scope

This contract governs all code inside:

```
apps/VCSM/src/features/dashboard/vport/dashboard/cards/
```

Every dashboard card module — schedule, bookings, settings, portfolio, gas, leads, team,
calendar, reviews, services, exchange, locksmith — must comply with these rules.

Violations are tracked in the module's `architecture.md` file and the shared
`deferred-open-items.md`. CRITICAL violations block booking controller changes.
All other violations are tracked as P0–P3 deferred items with sprint assignments.

---

## Rule 1 — No Cross-Card Internal Controller Imports

A dashboard card must never import from another card's internal `controller/` directory.

**BAD:**
```javascript
// Inside cards/schedule/hooks/useVportOwnerSchedule.js
import { createOwnerBookingController } from
  "@/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller";
```

**GOOD:**
```javascript
// Create a coordinator in the schedule card that imports from the bookings PUBLIC index
import { createOwnerBookingController } from
  "@/features/dashboard/vport/dashboard/cards/bookings";
```

Cross-card coordination belongs in a local coordinator controller that imports the other
card's public boundary (`index.js`), not its internal implementation files.

---

## Rule 2 — No Cross-Card Internal DAL Imports

A dashboard card must never import from another card's internal `dal/` directory.

**BAD:**
```javascript
import { insertVportBookingDAL } from
  "@/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal";
```

**GOOD:**
Use the importing card's own controller which wraps the booking operation, or create a
coordinator that imports from the bookings public index.

---

## Rule 3 — Cross-Card Interaction via Public Boundary Only

The public boundary of a card is its `index.js`. Any code that must consume another
card's functions must import from that card's `index.js`, never from a subdirectory path.

**GOOD:**
```javascript
import { createOwnerBookingController } from
  "@/features/dashboard/vport/dashboard/cards/bookings";
//                                                    ^^^
//                            public index — no subdirectory
```

---

## Rule 4 — Screens Own Routing, Gating, and Composition Only

Screen files (`*Screen.jsx`, `*View.jsx`) must not contain business logic, validation,
or data transformation. They are responsible for:
- Extracting route params
- Ownership / identity gating (Final screen pattern)
- Composing hooks and components (View screen pattern)
- Conditional rendering based on loaded state

Business logic that appears in a screen belongs in a controller.

---

## Rule 5 — Hooks Own React State and Lifecycle Only

Hooks (`use*.js`) are responsible for:
- Managing React state (`useState`, `useCallback`, `useRef`, `useEffect`)
- Exposing state and callback handlers to the screen or component
- Calling controllers and reflecting their results in state

Hooks must not contain business logic, validation, or data transformation beyond
what is required to bind a controller result to React state.

---

## Rule 6 — Hooks Must Not Own Cross-Domain Business Workflows

A hook that imports and coordinates hooks from 3+ different features is a coordinator
controller in disguise. Coordination of cross-domain writes belongs in a controller.

**BAD:**
```javascript
// Hook coordinates 5 separate features — this is a controller
function useSaveVportSettings() {
  useVportDashboardDetails(actorId)       // profiles feature
  useVportAds(actorId)                    // ads feature
  useVportDirectoryVisibility(...)        // settings/vports feature
  useVportBusinessCardSettings(...)       // settings/vports feature
  // ... validation, save orchestration
}
```

**GOOD:**
```javascript
// settingsCoordinator.controller.js owns the cross-domain write flow
// Hook only manages React state and calls the coordinator
```

---

## Rule 7 — Controllers Own Business Workflows

Controllers (`*.controller.js`) are responsible for:
- Ownership verification (via `assertActorOwnsVportActorController`)
- Cross-DAL orchestration
- Validation delegation (calling model functions)
- Cross-domain write coordination
- Error propagation

Controllers must not manage React state. They are pure async functions.

---

## Rule 8 — DALs Own Persistence Only

DAL files (`*.dal.js`) are responsible for:
- Executing a single database read or write operation
- Column selection (no `SELECT *`)
- Error translation (e.g. PostgreSQL error codes → user-friendly messages)
- In-memory cache management for that query (TTL-based)

DALs must not contain business logic, validation, or ownership checks beyond what is
required for the specific persistence operation.

---

## Rule 9 — DALs Must Not Be Exported from Public Card Indexes

Write DALs (`*.write.dal.js`) must not be exported from a card's `index.js`.
Exporting a write DAL from the public index creates a bypass channel around the
controller's ownership gate.

**BAD:**
```javascript
// cards/settings/index.js
export * from "./dal/vportPublicDetails.write.dal";  // ← exposes write surface
```

**GOOD:**
Write DALs are internal. The controller is the only call site.
Read DALs may be exported if they have no auth side effects and are needed by
other layers (e.g. cache invalidation helpers exported for service use).

---

## Rule 10 — Components Must Not Own Hooks

Hook files must never reside inside a component subdirectory.

**BAD:**
```
cards/portfolio/components/portfolio/hooks/usePortfolioItemSubmit.js  ← WRONG
```

**GOOD:**
```
cards/portfolio/hooks/usePortfolioItemSubmit.js  ← card-level hooks directory
```

A component that needs state receives it from a hook via props or a parent hook.
The component directory contains only JSX files and their direct sub-components.

---

## Rule 11 — Hooks Live in Card-Level `/hooks`

All hooks belong in the `hooks/` directory at the card root, not nested inside
`components/`, `controller/`, or any other subdirectory.

```
cards/[card-name]/
  hooks/          ← all hook files here
  controller/
  dal/
  model/
  components/
  __tests__/
```

---

## Rule 12 — Models Own Pure Logic Only

Model files (`*.model.js`) are responsible for:
- Data validation (pure functions, no side effects)
- Data normalization (formatting, sanitization)
- Data mapping (snake_case → camelCase, DB row → client shape)
- Constants and allowlists specific to the domain

Models must not import from DALs, controllers, or hooks.
Models must not have side effects.

---

## Rule 13 — Cache Invalidation Must Have a Clear Owner

When a card has multiple write paths that all invalidate the same cache, the invalidation
must be centralized in a cache service or utility, not called directly from each controller.

**BAD:**
```javascript
// submitFuelPriceSuggestion.controller.js
invalidateFuelPriceCache(targetActorId);  // direct DAL cache call

// updateStationFuelUnit.controller.js
invalidateFuelPriceCache(targetActorId);  // same direct call, different file

// reviewFuelPriceSuggestion.controller.js
invalidateFuelPriceCache(targetActorId);  // third caller, no single owner
```

**GOOD:**
```javascript
// service/fuelPriceCache.service.js — single owner
export function invalidateOfficialPrices(targetActorId) { ... }
export function invalidateAll(targetActorId) { ... }

// Each controller calls the service
FuelPriceCacheService.invalidateOfficialPrices(targetActorId);
```

---

## Rule 14 — Final/View Screen Split Required for Non-Trivial Cards

Cards with meaningful screen logic must split their screen into two files:

- **Final screen** (`*FinalScreen.jsx` or `*Screen.jsx`): route entry, identity loading,
  ownership gate, early-return guards. Renders the View or an access-denied state.
- **View** (`*View.jsx` or `*HistoryView.jsx`): hook wiring, component composition,
  modal state, toast lifecycle. Assumes verified owner.

**Reference pattern:** `cards/bookings/`
- `VportDashboardBookingHistoryScreen.jsx` (~20 lines) — gate only
- `VportDashboardBookingHistoryView.jsx` (~270 lines) — full composition

Cards with fewer than ~80 LOC in the screen may skip this split.

---

## Rule 15 — Every Exception Must Be Documented

If a module cannot comply with a rule in this contract (pre-existing pattern, known
technical debt, DEFER status), the exception must be documented in the module's
`architecture.md` file with:
- The rule being violated
- The reason for the exception
- The DEFER reference or sprint assignment
- The resolution timeline

Undocumented violations are not exceptions — they are open findings.

---

## Examples Summary

| Pattern | Classification | Rule |
|---|---|---|
| Schedule → scheduleBookingCoordinator → bookings index → booking controller | CORRECT | 1, 3 |
| Schedule hook → bookings/controller/createOwnerBooking.controller.js | VIOLATION | 1 |
| Portfolio hooks in components/portfolio/hooks/ | RESOLVED — hooks live in card-level `hooks/` | 10, 11 |
| Write DAL exported from card index.js | VIOLATION | 9 |
| Hook coordinates 5 features, does validation, manages toast | VIOLATION | 5, 6 |
| FuelPriceCacheService.invalidateAll() | CORRECT | 13 |
| invalidateFuelPriceCache() called from 3 controllers directly | VIOLATION | 13 |

---

## Open Violations (as of 2026-06-02)

See `deferred-open-items.md` for full tracking.

| Violation | Module | Rule | Priority | Status |
|---|---|---|---|---|
| Cross-card booking controller import | schedule | 1 | P0 | RESOLVED — DEFER-013 (TICKET-0004) |
| Write DAL exported from index.js | settings | 9 | P1 | RESOLVED — VENOM-SETTINGS-001 (TICKET-0009, TICKET-DASH-SENTRY-001 verified) |
| Hook acting as coordinator | settings | 6 | P1 | RESOLVED — DEFER-012 (TICKET-0009, TICKET-DASH-SENTRY-001 verified) |
| Write DAL exported from index.js | bookings | 9 | P1 | OPEN — TICKET-DASH-BOOKINGS-RULE9 — bookings/index.js exports insertVportBooking.write.dal; bypass channel around createOwnerBookingController |
| Hooks in components/portfolio/hooks/ | portfolio | 10, 11 | P1 | RESOLVED — TICKET-DASH-PORTFOLIO-COMPLETE-001; submit/upload hooks moved to card-level `hooks/` |
| 177-line dual-path controller | gas | 7 | P2 | RESOLVED — TICKET-DASH-GAS-SOURCE-COMPLETE-001; owner/citizen submit paths split |
| Cache invalidation without service | gas | 13 | P2 | RESOLVED — TICKET-DASH-GAS-SOURCE-COMPLETE-001; `FuelPriceCacheService` owns invalidation |
| Final/View screen not split | gas | 14 | P2 | RESOLVED — TICKET-DASH-GAS-SOURCE-COMPLETE-001; `VportDashboardGasView.jsx` added |
