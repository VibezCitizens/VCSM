# GAS_COMPLEXITY_REPORT

**Ticket:** TICKET-0004 / GAS-ARCH-001
**Phase:** 5 — P2 Gas
**Reference:** Section C — Needs Refactor, Card: gas
**Produced:** 2026-06-02
**Status:** Planning only — no code changes

---

## Module Scale

| Metric | Count |
|---|---|
| Total files | 42 |
| Total LOC | 3,855 |
| Controllers | 5 |
| DALs | 8 |
| Models | 5 |
| Hooks | 7 |
| Components | 9 |
| Screens | 3 (+ DEFER-004) |
| Tests | 5 |

This is the largest card in the dashboard by a significant margin.
The second-largest is team at 17 files / 2,323 LOC.

---

## 1. Controller Responsibilities

### `submitFuelPriceSuggestion.controller.js` — 177 lines (OVERSIZED)

This controller handles two entirely distinct user flows that share an entry point:

**Path A — Citizen Submission:**
1. Fetch station price settings (sanity bounds, toggle flags)
2. Validate proposed price against sanity range (if requireSanityForSuggestion)
3. Validate proposed price vs official price (maxDeltaAbs, maxDeltaPct)
4. Resolve targetActorId from profileId (profile lookup)
5. Check caller is NOT the owner
6. Create submission record via `createFuelPriceSubmissionDAL`
7. Return `{ ok: true, submission }`

**Path B — Owner Direct Update:**
1. Fetch station price settings (sanity bounds)
2. Validate proposed price against sanity range
3. Resolve targetActorId from profileId
4. Check ownership via `checkVportOwnershipController`
5. Upsert official price record via `upsertVportFuelPriceDAL`
6. Create history record via `createVportFuelPriceHistoryDAL`
7. Invalidate fuel price cache (`invalidateFuelPriceCache`)
8. Return `{ ok: true, price }`

These are different callers, different DALs, different success paths, different cache behavior.
They share: settings fetch, price sanity validation, profileId → actorId resolution.

**Candidate Split:**
```
submitCitizenFuelSuggestion.controller.js
  - settings fetch → sanity check → delta check → create submission

updateOwnerFuelPrice.controller.js
  - settings fetch → sanity check → upsert official → history → cache invalidate
```

Shared helper (can be a utility function, not a controller):
```
validateFuelPriceSanity({ proposedPrice, settings, officialPrice })
  → returns { ok, reason }
```

---

### `reviewFuelPriceSuggestion.controller.js` — 136 lines (BORDERLINE)

Single responsibility: owner reviews a pending suggestion (approve or reject).

Flow:
1. Fetch submission by ID
2. Resolve targetActorId from submission's profile_id
3. Ownership gate: caller must own the target VPORT
4. If approved AND applyToOfficial:
   - Upsert official price
   - Create history record
   - Mark submission applied
5. Update submission status (approved/rejected) + decision_reason
6. Create review log record
7. Invalidate pending submissions cache
8. Return `{ ok: true }`

This is a single coherent flow with conditional branching (approve vs reject).
136 lines is acceptable given the branching complexity — does NOT need to be split.
The cache invalidation at step 8 calls `invalidatePendingSubmissionsCache()` directly from
the read DAL — this is the primary candidate for `FuelPriceCacheService`.

---

### `getVportGasPrices.controller.js` — 73 lines (GOOD)

Orchestrates 3 parallel reads:
1. `vportStationPriceSettings` (5m cache)
2. `vportFuelPrices` (60s cache)
3. `vportFuelPriceSubmissions` — pending only (30s cache)

Computes `latestPendingByFuelKey` (community display).
Returns: `{ settings, officialPrices, pendingSubmissions, latestPendingByFuelKey }`

Well-scoped. No split needed.

---

### `publishFuelPriceUpdateAsPost.controller.js` — 93 lines (GOOD)

Single responsibility: create a system post for the feed when prices update.

Flow:
1. Ownership gate (actorId self-check)
2. Validate fuel labels against `FUEL_LABELS` allowlist
3. Validate prices (finite, non-negative)
4. Check 1-hour dedup window (hasRecentFuelPricePostDAL)
5. Resolve station name
6. Create feed post

Well-scoped. No split needed.

---

### `updateStationFuelUnit.controller.js` — 20 lines (GOOD)

Toggle liter ↔ gallon + cache invalidate. Single responsibility, appropriately small.

---

## 2. Cache Ownership Map

Three separate cache instances exist across the DAL layer with no central owner:

### Cache Instance 1 — `fuelPriceCache` (60s TTL)

```
DEFINED IN: vportFuelPrices.read.dal.js
  const fuelPriceCache = { ... };

INVALIDATED FROM:
  - submitFuelPriceSuggestion.controller.js (owner path, line ~95)
    → calls invalidateFuelPriceCache(targetActorId) directly
  - updateStationFuelUnit.controller.js (line ~17)
    → calls invalidateFuelPriceCache(targetActorId) directly
  - reviewFuelPriceSuggestion.controller.js (line ~120, when applyToOfficial)
    → calls invalidateFuelPriceCache(targetActorId) directly
```

Three separate controllers reach into the read DAL to call its cache invalidation function.
When caching behavior changes (TTL, key structure, partial invalidation), all three controllers
must be updated.

### Cache Instance 2 — `pendingCache` (30s TTL)

```
DEFINED IN: vportFuelPriceSubmissions.read.dal.js
  const pendingCache = { ... };

INVALIDATED FROM:
  - createFuelPriceSubmissionDAL (auto-invalidates after insert)
    → internal — appropriate
  - reviewFuelPriceSuggestion.controller.js (line ~130)
    → calls invalidatePendingSubmissionsCache() directly
```

### Cache Instance 3 — `settingsCache` (5m TTL)

```
DEFINED IN: vportStationPriceSettings.read.dal.js
  const settingsCache = { ... };

INVALIDATED FROM:
  - nowhere (intentional — settings rarely change, no invalidation path)
```

### Cache Problem Summary

| Cache | Owner | External Callers | Risk |
|---|---|---|---|
| `fuelPriceCache` | read DAL | 3 controllers | HIGH — any split/rename of controllers requires cache update |
| `pendingCache` | read DAL | 1 controller + 1 DAL | MEDIUM |
| `settingsCache` | read DAL | 0 | LOW |

The core problem: cache invalidation behavior is spread across controllers. If a new write
path is added (e.g. an admin bulk update), the developer must know to call `invalidateFuelPriceCache`
from the new controller. There is no discovery mechanism or enforcement.

---

## 3. Screen / View Ownership Map

### Current 3-Screen Structure

| File | Purpose | LOC | Layer |
|---|---|---|---|
| `VportDashboardGasScreen.jsx` | Full owner dashboard | 210 | COMBINED: Final + View (DEFER-004) |
| `VportGasPricesScreen.jsx` | Public route entry | 32 | Final (route guard) |
| `VportGasPricesView.jsx` | Public view composition | 95 | View |

**DEFER-004 Analysis:**

`VportDashboardGasScreen.jsx` (210 lines) combines two layers that other cards split:
- **Final layer responsibilities** (ownership gate, identity loading, early-return guards)
- **View layer responsibilities** (hook wiring, component composition, toast management)

The booking card pattern for comparison:
```
VportDashboardBookingHistoryScreen.jsx (20 lines) — Final layer: gate only
VportDashboardBookingHistoryView.jsx (270 lines)  — View layer: full composition
```

Gas currently has no `VportDashboardGasView.jsx` equivalent.

### Target 4-Screen Structure (DEFER-004 resolution)

| File | LOC (est) | Layer |
|---|---|---|
| `VportDashboardGasScreen.jsx` | ~30 | Final (gate only: identity, ownership, loading guards) |
| `VportDashboardGasView.jsx` (new) | ~180 | View (hook wiring, component composition, toast) |
| `VportGasPricesScreen.jsx` | 32 | Final (public route, no change) |
| `VportGasPricesView.jsx` | 95 | View (public, no change) |

DEFER-004 is a structural sprint task — scope is limited to the screen split.
No business logic changes. The two new files contain the same code as the current
`VportDashboardGasScreen.jsx` distributed across the two layers.

---

## 4. DEFER-004 Impact

**DEFER-004** (from `deferred-open-items.md`): `VportDashboardGasScreen` combines Final + View
layers. Classified S2, non-blocking, pre-existing pattern.

**Why it matters for the complexity report:**

Current 210-line screen owns:
- 6 early-return guards (actorId, identityLoading, ownershipLoading, identity, isOwner)
- 5 hook initializations (useVportGasPrices, useSubmitFuelPriceSuggestion, useOwnerPendingSuggestions, useGasUnitToggle, useAfterSubmitSuggestion)
- 3 callback bindings (afterSubmit cascade, refreshPending, patchRow)
- 1 toast state management block
- 1 createPortal conditional (desktop modal override)
- Component composition (VportDashboardGasPanels, GasUnitToggleBar, modals)

If a new hook needs to be added to the gas dashboard (e.g. a new feature), a developer
must edit this 210-line file and understand which parts are "gate" logic vs "composition"
logic — with no architectural guardrail separating them.

DEFER-004 resolution (screen split) is a prerequisite for any future gas feature work
that touches the screen layer.

---

## 5. Candidate `FuelPriceCacheService` Design

### Purpose
Single point of ownership for all fuel price cache invalidation.
Controllers call the service, not individual DAL cache functions.

### Interface

```javascript
// service/fuelPriceCache.service.js

/**
 * Invalidate official fuel price cache for a specific station.
 * Called after: owner price update, unit toggle, approved suggestion applied.
 */
function invalidateOfficialPrices(targetActorId) {
  invalidateFuelPriceCache(targetActorId); // delegates to read DAL
}

/**
 * Invalidate pending submissions cache (global, not per-station).
 * Called after: submission created, suggestion reviewed.
 */
function invalidatePendingSubmissions() {
  invalidatePendingSubmissionsCache(); // delegates to submissions read DAL
}

/**
 * Invalidate all gas price caches for a station.
 * Called after: owner bulk price update via review approval.
 */
function invalidateAll(targetActorId) {
  invalidateOfficialPrices(targetActorId);
  invalidatePendingSubmissions();
}

export {
  invalidateOfficialPrices,
  invalidatePendingSubmissions,
  invalidateAll,
};
```

### Controller Call Map (After Service)

| Controller | Current Call | After Service |
|---|---|---|
| `submitFuelPriceSuggestion` (owner path) | `invalidateFuelPriceCache(id)` | `FuelPriceCacheService.invalidateOfficialPrices(id)` |
| `updateStationFuelUnit` | `invalidateFuelPriceCache(id)` | `FuelPriceCacheService.invalidateOfficialPrices(id)` |
| `reviewFuelPriceSuggestion` | `invalidateFuelPriceCache(id)` + `invalidatePendingSubmissionsCache()` | `FuelPriceCacheService.invalidateAll(id)` |

### Benefit

A developer adding a new write path sees `FuelPriceCacheService` as the obvious pattern.
If a cache TTL changes or the cache implementation is replaced (e.g. React Query), only
the service needs updating — the three controllers are unchanged.

---

## 6. Additional Complexity Notes

### `useVportGasPrices` Returns 10+ Properties

The hook currently returns:
```javascript
{
  rows,             // fuel price rows (merged official + community)
  settings,         // station price settings
  fuelKeys,         // resolved key order
  unit,             // current display unit
  pendingSubmissions, // owner-only review list
  latestPending,    // community preview map
  loading,          // initial load state
  error,            // load error
  reload,           // manual refresh
  patchOfficialRow, // optimistic update
  patchCommunityRow // optimistic community update
}
```

Consumer screens must destructure all 10. This is a prop-surface explosion.
The public-facing `VportGasPricesView` doesn't need `pendingSubmissions` (owner-only)
but receives the full surface anyway.

**Not a refactor blocker** — but a future split candidate: `useVportGasPrices` (public,
read-only, no owner-specific fields) vs `useVportOwnerGasPrices` (extends public + pending).

### `useSubmitBulkFuelPrices` — 116 Lines

Manages parallel fuel price submissions for all active fuel keys.
The bulk submit hook also optionally cascades `afterSubmitSuggestion` per citizen submission.
At 116 lines it approaches the hook size limit, but the complexity is inherent to the
parallel orchestration pattern. Not a split candidate at this time.

---

## Estimated Effort

| Task | Effort |
|---|---|
| Split `submitFuelPriceSuggestion` into 2 controllers | 2 hours |
| Create `FuelPriceCacheService` | 1 hour |
| Update 3 controllers to use service | 30 min |
| DEFER-004: `VportDashboardGasView.jsx` split | 1 hour |
| Test updates for split controller | 1 hour |
| **Total** | **~5.5 hours** |

Gas complexity work is P2 — should follow schedule (P0) and settings/portfolio (P1).
DEFER-004 screen split is a prerequisite for any new gas dashboard feature work.
