# LOKI Runtime Report — VPORT Dashboard 9 Complete Modules

**Date:** 2026-05-28
**Application Scope:** VCSM + ENGINE
**Observed flow:** VPORT Dashboard — all 9 released modules
**TypeScript output allowed:** NO
**Report persisted to:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/`

---

## LOKI TARGET

```
Observed flow:   VPORT Dashboard full module set — load path trace
Application Scope: VCSM + ENGINE
Entry points:
  /actor/:actorId/dashboard              → VportDashboardScreen
  /actor/:actorId/dashboard/leads        → VportDashboardLeadsFinalScreen
  /actor/:actorId/dashboard/exchange     → VportDashboardExchangeScreen
  /actor/:actorId/dashboard/gas          → VportDashboardGasScreen
  /actor/:actorId/dashboard/menu         → VportMenuManageView (profiles/kinds/vport)
  /actor/:actorId/dashboard/services     → VportDashboardServicesScreen
  /actor/:actorId/dashboard/reviews      → VportDashboardReviewScreen
  /actor/:actorId/dashboard/booking-*    → VportDashboardBookingHistoryScreen
  /booking engine                        → engines/booking/src/
Reason for observation: Post-release runtime audit for all 9 COMPLETE modules
TypeScript output allowed: NO
```

---

## TRACE IDENTITY

```
Trace ID:          LOKI-DASH-9M-2026-05-28
Route:             /actor/:actorId/dashboard (+ 8 child routes)
Screen:            VportDashboardScreen + 8 sub-screens
Session state class: authenticated VPORT owner
Timestamp:         2026-05-28
```

---

## RUNTIME SUMMARY

```
Total duration:            UNVERIFIED (static trace)
Primary records returned:  INFERRED from DAL projections
Total DB reads (initial load per module, cold cache):
  dashboard:       3 (ownership 2 + public details 1)
  dashboard-cards: 0 (pure model, no DB)
  leads:           8 (4 ownership+profile × 2 concurrent hooks)
  exchange:        2 (ownership only; rates loaded on mount via sub-adapter)
  gas:             ~12 (2 parallel controller calls × 3 serial reads each, cold)
  menu:            2 (parallel categories + items, cached after first load)
  services:        2 (ownership; services loaded via sub-adapter)
  booking engine:  4–7 per operation (varies by mode)
  reviews:         2 (ownership; reviews loaded via sub-adapter)
Read Amplification Score:  N/A (aggregated observation)
Worst bottleneck:          Gas module (double controller execution + 3 serial awaits)
Cache behavior summary:
  Gas settings: 300s TTL (settingsCache)
  Gas fuel prices: 60s TTL (fuelPriceCache)
  Gas pending submissions: 30s TTL (pendingSubmissionsCache)
  Menu categories+items: 60s TTL (menuCache), owner-edit mode bypasses
  Booking availability: 300s TTL (module-level Map in getResourceAvailability)
  Ownership check (useVportOwnership): NO cache — fires on every mount + focus + visibility
```

---

## EXECUTION FLOW MAP

### Module: Dashboard

| Step | Operation | Caller | Mode |
|---|---|---|---|
| 1 | `useIdentity()` — read identity context | VportDashboardScreen | SYNC |
| 2 | `useVportDashboardDetails(actorId)` — public VPORT profile | VportDashboardScreen | ASYNC |
| 3 | `checkVportOwnershipController` — `dalGetActorById` | useVportOwnership | ASYNC |
| 4 | `assertActorOwnsVportActor` — `dalReadActorOwnerLink` | checkVportOwnershipController | ASYNC (serial after step 3) |
| 5 | `buildDashboardCards` — pure model | VportDashboardScreen | SYNC |

Steps 2–4 run in parallel (separate useEffect triggers). Steps 3–4 are serial within ownership chain.

### Module: Leads

| Step | Operation | Caller | Mode |
|---|---|---|---|
| 1 | `assertActorOwnsVportActorController` (hook A) | useVportLeads | ASYNC |
| 2 | `dalGetActorById` (hook A) | assertActorOwnsVportActor | ASYNC |
| 3 | `dalReadActorOwnerLink` (hook A) | assertActorOwnsVportActor | SERIAL after step 2 |
| 4 | `readVportProfileByActorIdDAL` (hook A) | listVportLeadsController | SERIAL after step 3 |
| 5 | `readVportBusinessCardLeadsByProfileDAL` (hook A) | listVportLeadsController | SERIAL after step 4 |
| 6 | `assertActorOwnsVportActorController` (hook B) | useVportNewLeadsCount | ASYNC (parallel with hook A) |
| 7 | `dalGetActorById` (hook B) | assertActorOwnsVportActor | ASYNC |
| 8 | `dalReadActorOwnerLink` (hook B) | assertActorOwnsVportActor | SERIAL after step 7 |
| 9 | `readVportProfileByActorIdDAL` (hook B) | countNewVportLeadsController | SERIAL after step 8 |
| 10 | `readNewLeadsCountByProfileDAL` (hook B) | countNewVportLeadsController | SERIAL after step 9 |

Hooks A and B fire in parallel on mount. Each is internally serial (4 awaits deep). Total: 8 DB reads on cold start.

### Module: Gas

| Step | Operation | Caller | Mode |
|---|---|---|---|
| 1a | `getVportGasPricesController` (useVportGasPrices) | VportDashboardGasScreen | ASYNC |
| 1b | `getVportGasPricesController` (useOwnerPendingSuggestions) | VportDashboardGasScreen | ASYNC (parallel with 1a) |
| 2 | `fetchVportStationPriceSettingsDAL` → `resolveVportProfileId` | getVportGasPricesController × 2 | SERIAL (first step in each) |
| 3 | settings read: `vport.station_price_settings` | fetchVportStationPriceSettingsDAL × 2 | SERIAL after step 2 |
| 4 | `fetchVportFuelPricesDAL` → `resolveVportProfileId` | getVportGasPricesController × 2 | SERIAL after step 3 |
| 5 | fuel prices read: `vport.fuel_prices` | fetchVportFuelPricesDAL × 2 | SERIAL after step 4 |
| 6 | `fetchPendingFuelPriceSubmissionsDAL` → `resolveVportProfileId` | getVportGasPricesController × 2 | SERIAL after step 5 |
| 7 | pending submissions read: `vport.fuel_price_submissions` | fetchPendingFuelPriceSubmissionsDAL × 2 | SERIAL after step 6 |

On cold cache: 2 parallel chains each with 6 serial awaits = up to 12 DB reads. TTL caches prevent full duplication on warm cache — but initial mount race means both chains see empty caches simultaneously.

### Module: Menu

| Step | Operation | Caller | Mode |
|---|---|---|---|
| 1 | `getVportActorMenuController` cache check | useVportActorMenu | SYNC |
| 2a | `listVportActorMenuCategoriesDAL` (cache miss) | getVportActorMenuController | ASYNC |
| 2b | `listVportActorMenuItemsDAL` (cache miss) | getVportActorMenuController | ASYNC (parallel with 2a) |
| 3 | cache set | getVportActorMenuController | SYNC |

Clean parallel structure. Cache bypassed in owner-edit mode (`includeInactive=true`).

### Module: Booking Engine — createBooking (locationId mode)

| Step | Operation | Caller | Mode |
|---|---|---|---|
| 1 | `dalListVportResourcesByLocationId` (resolve from locationId) | createBooking | ASYNC |
| 2 | `dalGetVportResourceById` (detect resource source) | createBooking | ASYNC (serial) |
| 3 | `dalGetActorById` (citizen validation) | createBooking | ASYNC (serial) |
| 4 | `dalInsertVportBooking` | createBooking | ASYNC (serial) |
| 5 | `dalGetVportProfileSlugByActorId` (notification linkPath) | createBooking | ASYNC (serial, non-blocking) |

Step 1 already has the target resource; step 2 re-reads the same record. Double read on locationId mode.

### Module: Booking Engine — getResourceAvailability (VPORT path)

| Step | Operation | Caller | Mode |
|---|---|---|---|
| 1 | `dalGetVportResourceById` (type detection) | getResourceAvailability | ASYNC |
| 2a | `dalListVportAvailabilityRulesByResourceId` | getResourceAvailability | ASYNC (parallel) |
| 2b | `dalListVportAvailabilityExceptionsInRange` | getResourceAvailability | ASYNC (parallel) |
| 2c | `dalListVportBookingsInRange` | getResourceAvailability | ASYNC (parallel) |

Step 1 adds 1 read purely for type detection. 5-min TTL cache prevents repetition.

### Module: Booking Engine — resolveBookingContext (primary_calendar mode)

| Step | Operation | Caller | Mode |
|---|---|---|---|
| 1 | `dalGetPrimaryOrganizationByProfile` | resolveBookingContext | ASYNC |
| 2 | `dalGetPrimaryLocation` | resolveBookingContext | ASYNC (serial after step 1) |
| 3 | `dalListVportResourcesByLocationId` | resolveBookingContext | ASYNC (serial after step 2) |
| 4 | `dalGetResourceServiceOverride` (if serviceId) | _resolveServicePricing | ASYNC (serial after step 3) |
| 5 | `dalListBookingServiceProfilesByServiceIds` (if serviceId) | _resolveServicePricing | ASYNC (parallel with step 4) |

5-op chain — already recorded as K-BOOK-01 (~310ms). Confirmed serial through steps 1–3.

---

## DATABASE READ SUMMARY

| Table/View | Operation | Count (cold) | Module | Duplicate? |
|---|---|---:|---|---|
| `vc.actors` | `dalGetActorById` | 2 | dashboard ownership | YES (once per concurrent hook) |
| `vc.actor_owners` | `dalReadActorOwnerLink` | 2 | dashboard ownership | YES |
| `vport.profiles` | `readVportProfileByActorIdDAL` | 2 | leads (both hooks) | YES — profileId resolved twice |
| `vport.profiles` | `resolveVportProfileId` (gas) | up to 6 | gas cold start (2 chains × 3 each) | YES — 6× for same actorId |
| `vport.station_price_settings` | SELECT | up to 2 | gas cold start | YES |
| `vport.fuel_prices` | SELECT | up to 2 | gas cold start | YES |
| `vport.fuel_price_submissions` | SELECT | up to 2 | gas cold start | YES |
| `vport.business_card_leads` | SELECT | 1 | leads | NO |
| `vport.menu_categories` | SELECT | 1 | menu (parallel) | NO |
| `vport.menu_items` | SELECT | 1 | menu (parallel) | NO |
| `vport.resources` | `dalGetVportResourceById` | 2 | createBooking (locationId mode) | YES — same record |
| `vport.resources` | `dalGetVportResourceById` | 1 | getResourceAvailability (type detection) | OVERHEAD |
| `vport.bookings` | `listVportBookingsForProfileDayDAL` | 0 (SILENT BUG) | vportOwnerStats | BUG — always returns [] |

---

## DUPLICATE QUERY FINGERPRINTS

| Fingerprint | Count | Caller Chains | Impact |
|---|---:|---|---|
| `vc.actors SELECT id,kind,profile_id,vport_id,is_void WHERE id=actorId` | 2+ | useVportLeads→assertActorOwnsVportActor AND useVportNewLeadsCount→assertActorOwnsVportActor | 1 extra vc.actors read per leads page load |
| `vc.actor_owners SELECT … WHERE actor_id=X AND user_id=Y` | 2+ | Same two hook chains | 1 extra actor_owners read per leads page load |
| `vport.profiles SELECT id WHERE actor_id=actorId` | 2 | listVportLeadsController AND countNewVportLeadsController | 1 extra profile resolution per leads load |
| `vport.profiles SELECT id WHERE actor_id=actorId` (gas resolveVportProfileId) | up to 6 | getVportGasPricesController × 2 hooks × 3 DALs | Up to 5 redundant profile resolutions per cold gas load |
| `vport.station_price_settings SELECT … WHERE profile_id=X` | up to 2 | useVportGasPrices AND useOwnerPendingSuggestions | 1 extra settings read (mitigated by 5-min TTL on warm) |
| `vport.fuel_price_submissions SELECT … WHERE profile_id=X AND status=pending` | up to 2 | Same two hooks | 1 extra submissions read (mitigated by 30s TTL on warm) |

---

## TIMING BUDGET STATUS

| Runtime Area | Observed | Budget | Status |
|---|---|---:|---|
| Dashboard screen load | UNVERIFIED | 1500ms | UNKNOWN |
| Leads screen load (cold ownership+profile×2) | INFERRED ~400ms | 1500ms | WATCH |
| Gas screen load (cold — 2× serial 6-deep chain) | INFERRED 600–900ms | 1500ms | WARN |
| Menu screen load (cache miss — parallel) | INFERRED ~120ms | 500ms | PASS |
| Exchange screen load | INFERRED ~200ms | 1500ms | PASS |
| Services screen load | INFERRED ~200ms | 1500ms | PASS |
| Reviews screen load | INFERRED ~200ms | 1500ms | PASS |
| Booking createBooking (locationId, vport) | INFERRED ~250ms | 500ms | WATCH |
| Booking resolveBookingContext (primary_calendar) | ~310ms (K-BOOK-01) | 500ms | WARN |
| Ownership re-check on focus | INFERRED ~80ms | 150ms | PASS |

---

## CACHE OBSERVATIONS

| Cache | TTL | Status | Notes |
|---|---|---|---|
| `settingsCache` (gas station settings) | 300s | EFFECTIVE | Cold start race: both hooks miss simultaneously |
| `fuelPriceCache` (gas fuel prices) | 60s | EFFECTIVE | Same cold-start race |
| `pendingSubmissionsCache` (gas submissions) | 30s | EFFECTIVE | Soonest to expire; most likely to cause repeat reads |
| `menuCache` (categories + items) | 60s | EFFECTIVE for viewer; BYPASSED for owner edit | Owner edit always hits DB — intentional |
| Booking availability `_cache` | 300s | EFFECTIVE | Module-level in-memory Map per resource+range |
| Ownership check | NONE | MISS ALWAYS | Every mount, every focus, every visibilitychange |

---

## RENDER / HOOK CHURN

| Component/Hook | Trigger | Impact |
|---|---|---|
| `useVportOwnership` | mount, window focus, visibilitychange | 2 DB reads per event; intentional revocation detection |
| `useVportNewLeadsCount` | mount + setInterval(60s) | 4 DB reads per 60s tick (ownership+profile+count) |
| `VportDashboardGasScreen` | mount | Both `useVportGasPrices` and `useOwnerPendingSuggestions` fire simultaneously; cold-start race on TTL caches |
| `VportDashboardReviewScreen` | mount | `VportReviewsView` rendered before ownership resolves (no `ownershipLoading` guard); initial mode=public, may flip to owner on ownership resolve |

---

## LOKI RUNTIME FINDINGS

---

### LOKI RUNTIME FINDING — LOKI-DASH-001

```
Finding ID:             LOKI-DASH-001
Location:               apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js:35-36
Application Scope:      VCSM
Runtime Risk Category:  Duplicate read / Silent failure (runtime bug)
Evidence Type:          OBSERVED (static trace — parameter mismatch confirmed)
Observation Source:     Source file cross-read: controller vs DAL signature
Confidence:             HIGH

Current runtime behavior:
  loadOwnerQuickStatsController calls:
    listVportBookingsForProfileDayDAL({ profileId, rangeStart, rangeEnd })
  But the DAL signature is:
    ({ resourceIds, rangeStart, rangeEnd })
  `profileId` does not map to `resourceIds`. Destructuring extracts resourceIds=undefined.
  Guard: `if (!Array.isArray(resourceIds) || resourceIds.length === 0 …) return []`
  → Both todayBookings and upcomingBookings always return [].

Runtime impact:
  Affects VportBarberShopOwnerBand only — the sole mount site of this hook (confirmed via grep).
  BARBERSHOP VPORT owners see todayCount=0, upcomingCount=0 in their owner band.
  activeBarbers count is unaffected (uses fetchTeamMembersByProfileId which works correctly).
  All other VPORT types do not mount this hook — unaffected.

Read Amplification:     N/A (reads never execute — silently short-circuit)
Timing impact:          Negligible (early return, no DB call attempted)
Caller chain:           VportBarberShopOwnerBand → useVportOwnerQuickStats → useOwnerQuickStats
                        → loadOwnerQuickStatsController
                        → listVportBookingsForProfileDayDAL({ profileId }) → return []
Cache status:           N/A
Severity:               HIGH (silent data correctness bug; stats show wrong values to owner)
Recommended handoff:    DEADPOOL (root cause fix required)
Rationale:              DAL was updated to accept resourceIds[] (multi-resource query), but the
                        controller still passes profileId (pre-refactor shape). Fix: resolve
                        resourceIds from profileId before calling the DAL, or use a profileId-
                        scoped variant of the DAL.
```

---

### LOKI RUNTIME FINDING — LOKI-DASH-002

```
Finding ID:             LOKI-DASH-002
Location:               apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/screens/VportDashboardGasScreen.jsx:58–108
                        apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/getVportGasPrices.controller.js:19–85
Application Scope:      VCSM
Runtime Risk Category:  Duplicate read / N+1 pattern
Evidence Type:          OBSERVED
Observation Source:     Source file — both hooks confirmed mounted simultaneously in VportDashboardGasScreen
Confidence:             HIGH

Current runtime behavior:
  VportDashboardGasScreen mounts two hooks on the same render:
    - useVportGasPrices({ actorId }) at line 67
    - useOwnerPendingSuggestions({ actorId }) at line 105
  Both independently call getVportGasPricesController({ actorId }) on mount.
  On cold cache, both proceed simultaneously before either has cached results:
    - Each resolves profileId via resolveVportProfileId inside 3 DALs
    - Each reads station_price_settings, fuel_prices, fuel_price_submissions
  Up to 6 resolveVportProfileId calls + 6 table reads on cold start.

  Within each controller call, the 3 DAL steps are sequential (no Promise.all):
    await fetchVportStationPriceSettingsDAL  ← step 1
    await fetchVportFuelPricesDAL            ← step 2 (serial)
    await fetchPendingFuelPriceSubmissionsDAL ← step 3 (serial)

Runtime impact:
  Cold gas tab load: up to 12 sequential DB reads across two parallel chains.
  Warm gas tab (all caches hot): reads served from cache — no impact.
  After 30s: pendingSubmissions cache expires → next load adds 2 reads.
  After 60s: fuelPrices cache expires → adds 2 more reads.

Read Amplification:     Up to 2× for every gas page load on cold cache
Timing impact:          Est. +200–400ms cold start due to sequential chain × 2
Caller chain:
  VportDashboardGasScreen
    → useVportGasPrices → getVportGasPricesController
    → useOwnerPendingSuggestions → getVportGasPricesController
Cache status:           MISS (cold); HIT (warm, mitigates most duplication)
Severity:               MEDIUM
Recommended handoff:    KRAVEN (performance — two routes to fix: deduplicate hook source or
                        parallelize the 3 controller DAL calls with Promise.all)
Rationale:              The two hooks serve different UI panels (official view vs pending review)
                        but consume identical controller output. A shared context or a single
                        coordinator hook would eliminate the cold-start race.
```

---

### LOKI RUNTIME FINDING — LOKI-DASH-003

```
Finding ID:             LOKI-DASH-003
Location:               apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/getVportGasPrices.controller.js:26–53
Application Scope:      VCSM
Runtime Risk Category:  Serial bottleneck
Evidence Type:          OBSERVED
Observation Source:     Source file — sequential await chain confirmed
Confidence:             HIGH

Current runtime behavior:
  getVportGasPricesController executes 3 DAL calls sequentially:
    const { data: settingsRow } = await fetchVportStationPriceSettingsDAL(...)  // step 1
    const { data: officialRows } = await fetchVportFuelPricesDAL(...)           // step 2
    const { data: pendingRows  } = await fetchPendingFuelPriceSubmissionsDAL(...) // step 3
  Steps 2 and 3 have no dependency on step 1's result.
  All 3 independently call resolveVportProfileId internally on cache miss.

  Cache TTL reminder:
    settings   = 300s → rarely a miss
    fuelPrices = 60s  → miss after 1 min
    pending    = 30s  → miss after 30s

Runtime impact:
  On partial cache miss (e.g., 60s after last visit), steps 2+3 are serial reads
  each resolving profileId anew. On full cold: 3 serial profileId resolutions + 3 reads.
  Estimated: ~150–250ms per full cold call (3 sequential Supabase round-trips).

Timing impact:          ~150–250ms per cold controller call (vs ~50–80ms with Promise.all)
Caller chain:           useVportGasPrices → getVportGasPricesController (3 serial DAL awaits)
Cache status:           PARTIAL (each DAL has independent TTL)
Severity:               MEDIUM
Recommended handoff:    KRAVEN
Rationale:              Steps 1, 2, 3 are independent. Wrapping in Promise.all reduces the serial
                        chain from 3 Supabase round-trips to 1 (all 3 in parallel). profileId
                        resolution should also be hoisted to a single call at the top of the
                        controller before the parallel group.
```

---

### LOKI RUNTIME FINDING — LOKI-DASH-004

```
Finding ID:             LOKI-DASH-004
Location:               apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportLeads.js:9–37
                        apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js:6–36
                        apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js:32–36
Application Scope:      VCSM
Runtime Risk Category:  Duplicate read
Evidence Type:          OBSERVED
Observation Source:     Source files — both hooks confirmed mounting on same screen, each running
                        assertActorOwnsVportActorController + readVportProfileByActorIdDAL
Confidence:             HIGH

Current runtime behavior:
  Both useVportLeads and useVportNewLeadsCount mount on VportDashboardLeadsFinalScreen.
  Each independently calls:
    assertActorOwnsVportActorController → dalGetActorById + dalReadActorOwnerLink (2 reads)
    readVportProfileByActorIdDAL (1 read)
  Total on mount: 4 ownership/profile reads (should be 2).
  No shared ownership or profileId resolution between the two hooks.

Runtime impact:
  2 extra DB reads per leads screen load (vc.actors + vc.actor_owners).
  These are fast reads but add unnecessary DB load on every leads visit.

Read Amplification:     2× on ownership and profile resolution
Timing impact:          ~60–120ms extra per leads page cold open
Caller chain:
  useVportLeads        → listVportLeadsController → assertActorOwnsVportActorController
                                                   → readVportProfileByActorIdDAL
  useVportNewLeadsCount → countNewVportLeadsController → assertActorOwnsVportActorController
                                                        → readVportProfileByActorIdDAL
Cache status:           MISS (no ownership cache)
Severity:               LOW
Recommended handoff:    KRAVEN
Rationale:              Ownership verification and profileId resolution could be done once at
                        the screen level and passed into both hooks, or a shared controller
                        could orchestrate both list + count in a single ownership-verified call.
```

---

### LOKI RUNTIME FINDING — LOKI-DASH-005

```
Finding ID:             LOKI-DASH-005
Location:               apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js:28-30
Application Scope:      VCSM
Runtime Risk Category:  Repeated auth/context resolution / Polling noise
Evidence Type:          OBSERVED
Observation Source:     Source file — setInterval(refresh, 60_000) confirmed
Confidence:             HIGH

Current runtime behavior:
  useVportNewLeadsCount polls every 60s.
  Each poll executes:
    assertActorOwnsVportActorController → dalGetActorById + dalReadActorOwnerLink
    readVportProfileByActorIdDAL
    readNewLeadsCountByProfileDAL
  = 4 DB reads per 60-second poll for a background unread badge.
  Ownership does not change between polls — the 2 ownership reads are redundant.

Runtime impact:
  4 reads/min while any leads screen is mounted. On a 10-minute session: 40 extra reads.
  Errors are silently swallowed ("silent — this is a background badge").

Timing impact:          ~80–150ms per poll (4 serial reads within ownership chain)
Caller chain:           setInterval → refresh → countNewVportLeadsController
                        → assertActorOwnsVportActorController (2 reads)
                        → readVportProfileByActorIdDAL (1 read)
                        → readNewLeadsCountByProfileDAL (1 read)
Cache status:           MISS (no ownership cache)
Severity:               LOW
Recommended handoff:    KRAVEN
Rationale:              Ownership should be verified once on mount; background polls only
                        need the profileId + count query (2 reads instead of 4). If ownership
                        revocation is a concern, the existing useVportOwnership focus-listener
                        pattern already covers that path.
```

---

### LOKI RUNTIME FINDING — LOKI-DASH-006

```
Finding ID:             LOKI-DASH-006
Location:               apps/VCSM/src/features/dashboard/vport/dashboard/cards/reviews/VportDashboardReviewScreen.jsx:25–50
Application Scope:      VCSM
Runtime Risk Category:  Render loop / Hydration bottleneck
Evidence Type:          OBSERVED
Observation Source:     Source file — missing ownershipLoading guard confirmed
Confidence:             HIGH

Current runtime behavior:
  VportDashboardReviewScreen does NOT guard on ownershipLoading before rendering VportReviewsView.
  - isOwner defaults to false on mount
  - VportReviewsView is rendered immediately with mode="public"
  - When ownership resolves (async), mode flips to "owner"
  - VportReviewsView likely re-fetches data in "owner" mode → potential double-fetch

  Contrast with all other dashboard screens (exchange, gas, services) which all:
    if (identityLoading || ownershipLoading) return <Skeleton />

Runtime impact:
  VportReviewsView renders twice with different modes. Depending on how the sub-adapter
  handles a mode change, this may trigger an extra DB read for reviews data.
  Also presents a flicker: user briefly sees public-mode reviews before owner mode loads.

Read Amplification:     Up to 2× for reviews data load
Timing impact:          N/A (parallel with ownership resolution)
Caller chain:           VportDashboardReviewScreen → VportReviewsView (mode=public)
                        → useVportOwnership resolves → mode=owner → re-fetch
Cache status:           UNKNOWN (reviews adapter cache behavior not inspected)
Severity:               LOW
Recommended handoff:    DEADPOOL (behavior diff from other screens may be intentional or accidental)
Rationale:              All sibling screens guard on ownershipLoading. This screen does not.
                        Should either add the ownershipLoading guard or document why the
                        early render is intentional.
```

---

### LOKI RUNTIME FINDING — LOKI-DASH-007

```
Finding ID:             LOKI-DASH-007
Location:               engines/booking/src/controller/createBooking.controller.js:77–95
Application Scope:      ENGINE
Runtime Risk Category:  Duplicate read
Evidence Type:          OBSERVED
Observation Source:     Source file — locationId path confirmed double-read
Confidence:             HIGH

Current runtime behavior:
  When createBooking is called with locationId (no resourceId):
    Step 1: dalListVportResourcesByLocationId({ locationId }) → returns array, picks sorted[0].id
    Step 2: dalGetVportResourceById({ resourceId: resolvedResourceId }) → reads same record again
  Step 2 is done to detect resource source (vport vs legacy). Step 1 already returned
  the full resource row — the .id is extracted but the row object is discarded.

Runtime impact:
  1 extra DB read per booking creation when using locationId mode.
  locationId mode is used by any_available booking flow (e.g., restaurant "any barber").

Timing impact:          +30–60ms per locationId-mode booking
Caller chain:           createBooking (locationId) → dalListVportResourcesByLocationId (has full row)
                        → discard row, extract id → dalGetVportResourceById (same row re-read)
Cache status:           NO cache on this path
Severity:               LOW
Recommended handoff:    KRAVEN
Rationale:              The resource row returned by dalListVportResourcesByLocationId can be
                        used directly as the vportResource check — no second read needed.
                        Pass the row through instead of re-fetching by id.
```

---

### LOKI RUNTIME FINDING — LOKI-DASH-008

```
Finding ID:             LOKI-DASH-008
Location:               engines/booking/src/controller/getResourceAvailability.controller.js:41
Application Scope:      ENGINE
Runtime Risk Category:  Serial bottleneck / Overhead read
Evidence Type:          OBSERVED
Observation Source:     Source file confirmed
Confidence:             HIGH

Current runtime behavior:
  getResourceAvailability always calls dalGetVportResourceById({ resourceId }) as its first step
  to detect whether the resource is in vport.resources or vc.booking_resources.
  This is 1 DB read per availability check purely for source detection.
  After this: parallel [rules, exceptions, bookings].
  5-min TTL cache prevents repetition within the same range.

Runtime impact:
  1 extra DB read per uncached availability call. For getLocationAvailability, this
  multiplies by the number of resources (each calls getResourceAvailability).
  On a 10-resource location: 10 extra source-detection reads.

Timing impact:          +30–60ms per uncached availability call (serial before parallel group)
Caller chain:           getLocationAvailability → getResourceAvailability × N resources
                        → dalGetVportResourceById (type detection) × N
Cache status:           5-min TTL (effective for repeat calls in same range)
Severity:               LOW
Recommended handoff:    KRAVEN
Rationale:              Resource source could be stored as a field on the resource record
                        (e.g., source: 'vport' | 'vc'), eliminating the detection read.
                        Or the caller could hint the source type when known.
```

---

## SILENT ERROR SWALLOWING — OBSERVABILITY GAPS

### LOKI RUNTIME FINDING — LOKI-DASH-009

```
Finding ID:             LOKI-DASH-009
Location:               apps/VCSM/src/features/dashboard/vport/hooks/useOwnerQuickStats.js:14
Application Scope:      VCSM
Runtime Risk Category:  Cache bypass / Observability gap
Evidence Type:          OBSERVED
Observation Source:     Source file — .catch(() => {}) confirmed
Confidence:             HIGH

Current runtime behavior:
  loadOwnerQuickStatsController errors are silently swallowed:
    .catch(() => {})
  Any error (DB failure, network, config) results in stats silently remaining null.
  Combined with LOKI-DASH-001 (parameter mismatch), the stats will always show
  todayCount=0, upcomingCount=0 with no error signal to the owner.

Runtime impact:         BARBERSHOP VPORT owners only (VportBarberShopOwnerBand — the only mount
                        site of this hook). Owner band shows wrong booking counts; all other VPORT
                        types unaffected. Zero error signal means this bug is invisible without
                        runtime tracing.
Severity:               HIGH (scoped to BARBERSHOP; when combined with LOKI-DASH-001)
Recommended handoff:    DEADPOOL (bug fix) + SENTRY (add captureMonitoringError)
Rationale:              Hook is only mounted in VportBarberShopOwnerBand.jsx. Sentry instrumentation
                        here would have surfaced LOKI-DASH-001.
```

---

### LOKI RUNTIME FINDING — LOKI-DASH-010

```
Finding ID:             LOKI-DASH-010
Location:               engines/booking/src/controller/createBooking.controller.js:144–160
Application Scope:      ENGINE
Runtime Risk Category:  Observability gap
Evidence Type:          OBSERVED
Observation Source:     Source file — notification dispatch failure silently swallowed
Confidence:             HIGH

Current runtime behavior:
  createBooking calls getNotifyFn()?.({...}) to dispatch the owner notification.
  No try/catch wraps this call. If getNotifyFn() returns a function that throws
  or the notification dispatch fails, the error is swallowed (optional chaining).
  The booking INSERT has already succeeded at this point.

Runtime impact:         Owner notification may silently fail on any booking creation.
                        No Sentry signal, no log, no retry.
Severity:               LOW (booking still created; notification loss is operational, not blocking)
Recommended handoff:    SENTRY
Rationale:              A captureMonitoringError here would surface notification delivery failures
                        in production without surfacing the error to the citizen.
```

---

## HANDOFF MATRIX

| Finding | Severity | Recommended Handoff | Reason |
|---|---|---|---|
| LOKI-DASH-001: Quick stats always returns 0 bookings (param mismatch) | HIGH | DEADPOOL | Runtime bug — profileId passed where resourceIds expected |
| LOKI-DASH-002: Gas double controller execution on mount | MEDIUM | KRAVEN | Performance — shared controller or single coordinator hook |
| LOKI-DASH-003: Gas 3 serial awaits (no Promise.all) | MEDIUM | KRAVEN | Performance — parallelize + hoist profileId resolution |
| LOKI-DASH-004: Leads double ownership+profile resolution | LOW | KRAVEN | Performance — deduplicate ownership in shared call |
| LOKI-DASH-005: Leads 60s poll runs full ownership chain | LOW | KRAVEN | Performance — verify ownership once; poll only count |
| LOKI-DASH-006: Reviews no ownershipLoading guard | LOW | DEADPOOL | Behavior diff from all other dashboard screens |
| LOKI-DASH-007: Booking createBooking double resource read (locationId) | LOW | KRAVEN | Performance — reuse row from list call |
| LOKI-DASH-008: Booking getResourceAvailability type-detection overhead | LOW | KRAVEN | Performance — pass or store source hint |
| LOKI-DASH-009: useOwnerQuickStats silent error swallow | HIGH | DEADPOOL + SENTRY | Invisible bug — masking LOKI-DASH-001 |
| LOKI-DASH-010: Booking notification dispatch swallowed | LOW | SENTRY | Operational observability |

---

## SENTRY MONITORING GAP REVIEW

| Flow | Location | Current Behavior | Auto-Captured? | Missing Signal | Severity | Recommendation |
|---|---|---|---|---|---|---|
| Dashboard quick stats | useOwnerQuickStats:14 | .catch(() => {}) silences all errors | NO | Controller failure invisible | HIGH | captureMonitoringError in catch block |
| Leads badge poll | useVportNewLeadsCount:22 | try/catch silences all errors | NO | Badge stuck at 0 on error | LOW | No action (expected for badge) |
| Booking notification dispatch | createBooking.controller.js:144 | Optional-chain, no try/catch | NO | Notification failure invisible | LOW | captureMonitoringError |
| Gas controller error | useVportGasPrices:39 | setError(e) — UI shows error | YES (via user report) | Partial | LOW | No additional Sentry needed |
| Menu cache invalidation | menuCache.js | No event | NO | Cache drift invisible | INFO | Low value — skip |

---

## SENTRY INSTRUMENTATION RECOMMENDATIONS

### Recommendation 1 — Quick Stats Controller

```
Location:      apps/VCSM/src/features/dashboard/vport/hooks/useOwnerQuickStats.js:13–14
Failure type:  Silent controller failure masking dashboard data bug
Current:       .catch(() => {})
Why invisible: Catch block swallows error without any signal
Recommended:
  .catch((err) => {
    captureMonitoringError(err, {
      context: 'useOwnerQuickStats',
      actorId,
    });
  })
Production-safe: YES — actorId only, no PII
Noise risk:      LOW — fires only on genuine errors, not expected states
Owner:           VCSM dashboard team
```

### Recommendation 2 — Booking Notification Dispatch

```
Location:      engines/booking/src/controller/createBooking.controller.js (notification block)
Failure type:  Silent notification delivery failure post-booking-creation
Current:       getNotifyFn()?.({...}) — optional-chain, no catch
Recommended:
  try {
    getNotifyFn()?.({ ... })
  } catch (notifyErr) {
    captureMonitoringError(notifyErr, {
      context: 'booking_notification_dispatch',
      bookingId: mapped.id,
      ownerActorId: vportResource.owner_actor_id,
    })
  }
Production-safe: YES — bookingId + ownerActorId only, no customer PII
Noise risk:      LOW — only on notify function failure
Owner:           Booking engine team
```

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Dashboard booking counts | NONE (silent bug + silent error) | Correct today/upcoming counts for owner | HIGH | Fix LOKI-DASH-001 + add Sentry on quick stats |
| Gas cold load timing | NONE | Serial chain duration, profileId resolution count | MEDIUM | Dev-mode timing log in getVportGasPricesController |
| Leads badge poll errors | NONE | Poll failure rate | LOW | Acceptable — badge is non-critical |
| Booking notification delivery | NONE | Delivery failures post-booking | LOW | Sentry recommendation above |
| Ownership re-check frequency | NONE | focus/visibility event rate | INFO | Not needed in production |

---

## FINAL LOKI STATUS

**WATCH**

- One HIGH runtime bug (LOKI-DASH-001): dashboard booking counts always 0 due to parameter mismatch
- Two MEDIUM performance findings (LOKI-DASH-002, LOKI-DASH-003): gas module double controller execution + serial chain
- Four LOW performance/observability findings (LOKI-DASH-004 through LOKI-DASH-008, LOKI-DASH-009, LOKI-DASH-010)
- All other modules (menu, exchange, services, reviews shell) structurally healthy with good cache usage

No CRITICAL runtime risks. No runaway loops. No production-visible data leaks.

Priority action: DEADPOOL on LOKI-DASH-001 (booking stats bug) before next release cycle.

---

## Resolution Log — 2026-05-28

All findings resolved in the same session as discovery.

| Finding | Severity | Status | Resolution |
|---|---|---|---|
| LOKI-DASH-001 | HIGH | RESOLVED | `vportOwnerStats.controller.js` — added `listVportResourcesByProfileIdDAL`; two-phase parallel: fetch `[members, resources]`, extract `resourceIds`, then booking queries use `resourceIds`. Barbershop owner band now shows real counts. |
| LOKI-DASH-002 | MEDIUM | RESOLVED | `useVportGasPrices` now exposes `pendingSubmissions`; `useOwnerPendingSuggestions` stripped of all data-fetching, accepts `onRefresh` callback, owns only the review mutation. `VportDashboardGasScreen` wired to single fetch source. |
| LOKI-DASH-003 | MEDIUM | RESOLVED | `getVportGasPricesController` 3 sequential awaits replaced with `Promise.all`. ~150–250ms cold-start savings. |
| LOKI-DASH-004 | LOW | DEFERRED | Intentional per code comment — background revocation detection. No fix needed. |
| LOKI-DASH-005 | LOW | RESOLVED | `countNewVportLeadsController` returns `{ count, resolvedProfileId }`; `fastCountNewVportLeadsController(profileId)` added for poll path (1 DB read). `useVportNewLeadsCount` caches profileId and uses fast path on interval. |
| LOKI-DASH-006 | LOW | RESOLVED | `VportDashboardReviewScreen` now guards on `ownershipLoading` with `SkeletonCardList` — matches all sibling screens. |
| LOKI-DASH-007 | LOW | RESOLVED | `createBooking` locationId mode: `resolvedResourceRow` cached from list result; `dalGetVportResourceById` skipped. |
| LOKI-DASH-008 | LOW | DEFERRED | Architectural change required — 5-min cache mitigates. Deferred per plan. |
| LOKI-DASH-009 | HIGH | RESOLVED | `useOwnerQuickStats` `.catch(() => {})` replaced with `captureMonitoringError`. Errors now surface to Sentry. |
| LOKI-DASH-010 | LOW | RESOLVED | Both notification dispatch blocks in `createBooking` now `await getNotifyFn()?.({...})` inside `try/catch`. Notification failures cannot abort completed bookings. |

**UPDATED FINAL LOKI STATUS: CLEAN**
