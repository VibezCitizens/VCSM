# MODULE ARCHITECTURE REPORT

**Module:** vcsm.booking  
**Application Scope:** VCSM + ENGINE  
**Module Type:** Feature Module — Service Booking Write/Read Path  
**Primary Root:** `apps/VCSM/src/features/booking/`  
**Engine Root:** `engines/booking/`  
**Dashboard Extension Root:** `apps/VCSM/src/features/dashboard/vport/` (booking DALs, controllers, hooks, screens)  
**Independence Status:** MOSTLY INDEPENDENT  
**Completeness Status:** MOSTLY COMPLETE — Post RC-01 through RC-06 security fix pass  
**Last Updated:** 2026-05-14 (Post Cerebro P0 audit — vport-booking-feed-security-updates branch)

---

## PURPOSE

Owns all customer-facing and owner-facing booking flows: creating bookings (public and owner-initiated), managing resources (staff/equipment), setting availability rules, listing booking history, confirming/cancelling/completing/rescheduling bookings, and wiring the external `@booking` engine via `setup.js`. UI screens live in `dashboard/vport/` — the feature layer itself has no screens.

---

## OWNERSHIP

| Domain | Owner |
|---|---|
| Engine configuration | `apps/VCSM/src/features/booking/setup.js` |
| Ownership assertion (app layer) | `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` |
| Ownership assertion (engine layer) | `engines/booking/src/controller/assertActorOwnsVportActor.controller.js` |
| Booking creation (customer/public) | `dashboard/vport/controller/vportPublicBooking.controller.js` |
| Booking creation (owner/walk-in) | `dashboard/vport/controller/createOwnerBooking.controller.js` |
| Booking status update / reschedule | `dashboard/vport/controller/updateVportBooking.controller.js` |
| Booking history (owner) | `dashboard/vport/controller/listVportBookingHistory.controller.js` |
| Availability rules write | `dashboard/vport/controller/manageVportAvailabilityRule.controller.js` |
| Services list (for booking form) | `dashboard/vport/controller/listVportServicesForProfile.controller.js` |
| Day schedule assembly | `dashboard/vport/controller/loadDaySchedule.controller.js` |
| Resource enumeration | `dashboard/vport/controller/vportPublicBooking.controller.js::listVportBookingResourcesController` |
| Public booking adapter | `apps/VCSM/src/features/booking/adapters/booking.adapter.js` |

---

## ENTRY POINTS

| Entry Point | Type | Path | Notes |
|---|---|---|---|
| `VportDashboardBookingHistoryScreen` | Screen | `dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx` | Owner booking history + TodayView |
| `VportDashboardScheduleScreen` | Screen | `dashboard/vport/screens/VportDashboardScheduleScreen.jsx` | Day calendar grid |
| `QuickBookingModal` | Component | `dashboard/vport/components/bookingHistory/QuickBookingModal.jsx` | Owner walk-in booking form |
| `booking.adapter.js` | Adapter | `features/booking/adapters/booking.adapter.js` | Cross-feature boundary for hooks and ownership assertion |
| `setup.js` | Bootstrap | `features/booking/setup.js` | Engine DI configuration |

---

## LAYER MAP

### DAL

**App-layer DAL (`apps/VCSM/src/features/booking/dal/`):**

| File | Tables | Direction |
|---|---|---|
| `getActorById.dal.js` | `vc.actors` | READ |
| `readActorOwnerLinkByActorAndUserProfile.dal.js` | `vc.actor_owners` | READ |
| `getBookingById.dal.js` | `vport.bookings` | READ |
| `getBookingResourceById.dal.js` | `vport.resources` | READ |
| `insertBooking.dal.js` | `vport.bookings` | WRITE |
| `insertBookingResource.dal.js` | `vport.resources` | WRITE |
| `listAvailabilityExceptionsInRange.dal.js` | `vport.availability_exceptions` | READ |
| `listAvailabilityRulesByResourceId.dal.js` | `vport.availability_rules` | READ |
| `listBookingsByCustomer.dal.js` | `vport.bookings` | READ |
| `listBookingsByResource.dal.js` | `vport.bookings` | READ |
| `listBookingsInRange.dal.js` | `vport.bookings` | READ |
| `listBookingResourcesByOwnerActorId.dal.js` | `vport.resources` | READ |
| `listBookingResourceServicesByResourceId.dal.js` | `vport.resource_service_overrides` | READ |
| `listBookingServiceProfilesByServiceIds.dal.js` | `vport.service_profiles` | READ |
| `readVportServicesByActor.dal.js` | `vport.services`, `vport.profiles` | READ |
| `saveBookingServiceProfileDurationsByServiceIds.dal.js` | `vport.service_profiles` | WRITE |
| `updateBookingStatus.dal.js` | `vport.bookings` | WRITE |
| `upsertAvailabilityException.dal.js` | `vport.availability_exceptions` | WRITE |
| `upsertAvailabilityRule.dal.js` | `vport.availability_rules` | WRITE |
| `upsertBookingResourceServices.dal.js` | `vport.resource_service_overrides` | WRITE |

**Dashboard extension DAL (`dashboard/vport/dal/read/`):**

| File | Tables | Direction |
|---|---|---|
| `actorOwners.read.dal.js` | `vc.actor_owners` | READ |
| `actorVport.read.dal.js` | `vc.actors` | READ |
| `listVportBookingsForProfileDay.read.dal.js` | `vport.bookings` | READ |
| `vportAvailabilityRules.read.dal.js` | `vport.availability_rules` | READ |
| `vportBookingById.read.dal.js` | `vport.bookings` | READ |
| `vportBookingHistory.read.dal.js` | `vport.bookings` | READ |
| `vportBookingsInRange.read.dal.js` | `vport.bookings` | READ |
| `vportProfile.read.dal.js` | `vport.profiles` | READ |
| `vportResource.read.dal.js` | `vport.resources` | READ |
| `vportServices.read.dal.js` | `vport.services` | READ |

**Dashboard extension DAL (`dashboard/vport/dal/write/`):**

| File | Tables | Direction |
|---|---|---|
| `insertVportBooking.write.dal.js` | `vport.bookings` | WRITE |
| `updateVportBooking.write.dal.js` | `vport.bookings` | WRITE |
| `vportAvailabilityRules.write.dal.js` | `vport.availability_rules` | WRITE |
| `vportResource.write.dal.js` | `vport.resources` | WRITE |

**Engine DAL (`engines/booking/src/dal/`):**

| File | Domain | Direction |
|---|---|---|
| `actor.read.dal.js` | `vc.actors`, `vc.actor_owners`, `vport.profiles`, `vport.services` | READ |
| `availability.read.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | READ |
| `availability.write.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | WRITE |
| `booking.read.dal.js` | `vport.bookings` | READ |
| `booking.write.dal.js` | `vport.bookings` | WRITE |
| `vportAvailability.read.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | READ |
| `vportAvailability.write.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | WRITE |
| `vportBooking.read.dal.js` | `vport.bookings` | READ |
| `vportBooking.write.dal.js` | `vport.bookings` | WRITE |
| `vportResource.read.dal.js` | `vport.resources` | READ |
| `vportResource.write.dal.js` | `vport.resources` | WRITE |
| `serviceProfile.read.dal.js` | `vport.service_profiles` | READ |
| `serviceProfile.write.dal.js` | `vport.service_profiles` | WRITE |

### Model

| File | Purpose |
|---|---|
| `features/booking/model/booking.model.js` | App-layer booking row mapper |
| `features/booking/model/bookingAvailability.model.js` | Availability rule/exception mapper |
| `features/booking/model/bookingResource.model.js` | Resource mapper |
| `features/booking/model/bookingServiceProfile.model.js` | Service profile mapper |
| `dashboard/vport/model/vportBooking.model.js` | `mapBooking()` — used by dashboard controllers |
| `dashboard/vport/model/vportAvailabilityRule.model.js` | `mapAvailabilityRule()` — used by dashboard hooks |
| `engines/booking/src/model/Booking.model.js` | Engine-level mapper |
| `engines/booking/src/model/BookingAvailability.model.js` | Engine availability mapper |

### Controller

| File | Post-Fix State | Ownership Assert |
|---|---|---|
| `dashboard/vport/controller/manageVportAvailabilityRule.controller.js` | RC-01 FIXED | `assertActorOwnsVportActorController` via adapter |
| `dashboard/vport/controller/listVportServicesForProfile.controller.js` | RC-02 FIXED — accepts `ownerActorId` | None (read-only, no mutation) |
| `dashboard/vport/controller/listVportBookingHistory.controller.js` | Has ownership assertion | `assertActorOwnsVportActorController` via adapter |
| `engines/booking/src/controller/listBookingHistory.controller.js` | RC-03 FIXED | `assertActorOwnsVportActor` (engine version) |
| `dashboard/vport/controller/createOwnerBooking.controller.js` | Clean | `assertActorOwnsVportActorController` via adapter |
| `dashboard/vport/controller/updateVportBooking.controller.js` | Clean | `assertActorOwnsVportActorController` for owner ops; customer-cancel branch checked separately |
| `dashboard/vport/controller/loadDaySchedule.controller.js` | Clean | No auth (owner-only route — ownership gated at screen level) |
| `dashboard/vport/controller/vportPublicBooking.controller.js` | Clean | Public: optional `requestActorId`; resource.is_active check |
| `dashboard/vport/controller/ensureVportOwnerResource.controller.js` | Clean | Accepts `ownerActorId` correctly |
| `features/booking/controller/assertActorOwnsVportActor.controller.js` | Clean | Self: this IS the assertion |

### Adapter

| File | Role |
|---|---|
| `features/booking/adapters/booking.adapter.js` | Exports hooks + `assertActorOwnsVportActorController`; `useBookingHistory` was REMOVED (RC-05) |

### Hook

| File | Post-Fix State | Notes |
|---|---|---|
| `dashboard/vport/hooks/useVportManageAvailability.js` | RC-06 FIXED — forwards `callerActorId` + `ownerActorId` | Thin wrapper around `manageVportAvailabilityRuleController` |
| `dashboard/vport/hooks/useQuickBookingModal.js` | RC-04 FIXED — accepts `ownerActorId` (was `profileId`) | Fetches services + creates owner booking |
| `dashboard/vport/hooks/useVportBookingHistory.js` | Clean | Passes `actorId` + `callerActorId` to controller |
| `dashboard/vport/hooks/useVportBookingActions.js` | Clean | confirm/cancel/complete/noShow via `updateBookingStatusController` |
| `dashboard/vport/hooks/useVportOwnerSchedule.js` | Clean | Day schedule state + booking create/update |
| `dashboard/vport/hooks/useVportOwnerResources.js` | Clean | Lists resources by `ownerActorId` |
| `dashboard/vport/hooks/useVportResourceAvailability.js` | Clean | Read-only availability query |
| `dashboard/vport/hooks/useVportEnsureResource.js` | Clean | Creates default resource if none exists |
| `features/booking/hooks/useManageAvailability.js` | Clean | Wraps engine `setAvailabilityRule` — separate write path (engine-backed) |
| `features/booking/hooks/useBookingAvailability.js` | Present | Engine-backed read |
| `features/booking/hooks/useCreateBooking.js` | Present | Engine-backed customer booking |

### Component

| File | Role |
|---|---|
| `dashboard/vport/components/bookingHistory/QuickBookingModal.jsx` | Walk-in booking form (owner) |
| `dashboard/vport/components/bookingHistory/BookingCard.jsx` | Booking row display |
| `dashboard/vport/components/bookingHistory/OperationalBookingCard.jsx` | Today-view booking card |
| `dashboard/vport/components/bookingHistory/TodayView.jsx` | Today's schedule panel |
| `dashboard/vport/components/calendar/WeeklyAvailabilityGrid.jsx` | Availability grid |
| `dashboard/vport/components/calendar/WorkingHoursDayCard.jsx` | Day availability card |

### Screen

| File | Route | Auth Gate |
|---|---|---|
| `VportDashboardBookingHistoryScreen.jsx` | `/actor/:actorId/dashboard/booking-history` | `isOwner` check at component root |
| `VportDashboardScheduleScreen.jsx` | `/actor/:actorId/dashboard/schedule` | Implicitly owner-gated via route |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear split: customer vs owner booking, availability rules, schedule | |
| Owner defined | PASS | Controllers clearly own write paths; adapter owns cross-feature boundary | |
| Entry points mapped | PASS | Two screens, one modal, one adapter | |
| Controllers present/delegated | PASS | All write controllers present with ownership assertions | |
| DAL/repository present/delegated | PASS | Full DAL coverage — explicit column selects enforced | |
| Models/transformers present | PASS | `mapBooking`, `mapAvailabilityRule` both present | |
| Hooks/view models present | PASS | Full hook coverage for all booking interactions | |
| Screens/components present | PASS | Both owner screens + key components present | |
| Services/adapters present | PASS | `booking.adapter.js` is clean post RC-05 | |
| Database objects mapped | PASS | Tables: `vport.bookings`, `vport.resources`, `vport.availability_rules`, `vport.services`, `vport.profiles`, `vc.actors`, `vc.actor_owners` | |
| Authorization path mapped | PASS | `assertActorOwnsVportActorController` wired into all write controllers | |
| Cache/runtime behavior mapped | PARTIAL | No TTL cache for booking reads — fresh fetch on every mount | Medium risk for high-frequency owners |
| Error/loading/empty states mapped | PASS | All hooks expose `error`, `loading`; screens render all three states | |
| Documentation linked | PARTIAL | This document is the canonical post-RC map; no Logan governance doc for booking module | |
| Tests/validation noted | FAIL | No test files found for booking feature or engine controllers | HIGH risk |
| Native parity noted | N/A | PWA only at this time | |
| Engine dependencies mapped | PASS | Engine wired via `setup.js`; DI complete | |

---

## POST-FIX CALL CHAIN VERIFICATION

### RC-01: Availability Rule Write
```
useVportManageAvailability (callerActorId, ownerActorId)
  → manageVportAvailabilityRuleController (asserts callerActorId owns ownerActorId)
    → assertActorOwnsVportActorController (via booking.adapter.js)
      → getActorByIdDAL (vc.actors)
      → readActorOwnerLinkByActorAndUserProfileDAL (vc.actor_owners)
    → upsertVportAvailabilityRuleDAL (vport.availability_rules)
```
STATUS: CLEAN

### RC-02: Services List for Booking Form
```
useQuickBookingModal (ownerActorId)
  → listVportServicesForProfileController (ownerActorId)
    → getVportProfileIdByActorDAL (vport.profiles)
    → listVportServicesByProfileIdDAL (vport.services)
```
STATUS: CLEAN — no profileId leak; ownerActorId resolves to profileId internally

### RC-03: Engine Booking History
```
listBookingHistory (callerActorId, ownerActorId, resourceId)  [engine]
  → assertActorOwnsVportActor (engine ownership check)
  → dalListBookingsByResource (vport.bookings)
  → mapBookingRows
```
STATUS: CLEAN

### RC-04: QuickBookingModal Ownership
```
QuickBookingModal (ownerActorId, resourceId)
  → useQuickBookingModal (ownerActorId)  — fixed param name
    → createOwnerBookingController (callerActorId from identity, resourceId)
      → assertActorOwnsVportActorController
      → insertVportBookingDAL
```
STATUS: CLEAN

### RC-05: Adapter Cleanup
`useBookingHistory` removed from `booking.adapter.js`.  
STATUS: CLEAN — `useVportBookingHistory` is the canonical hook in `dashboard/vport/hooks/`

### RC-06: useVportManageAvailability
```
useVportManageAvailability.setAvailabilityRule({ callerActorId, ownerActorId, ... })
  → manageVportAvailabilityRuleController({ callerActorId, ownerActorId, ... })
```
STATUS: CLEAN — both params forwarded correctly

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `engines/booking` | Engine | app → engine | YES — via `@booking` alias + `setup.js` DI | |
| `vc.actors` | Database | app → DB | YES — read-only for ownership check | |
| `vc.actor_owners` | Database | app → DB | YES — ownership assertion | |
| `vport.bookings` | Database | app → DB | YES — primary write table | |
| `vport.availability_rules` | Database | app → DB | YES — availability write table | |
| `vport.resources` | Database | app → DB | YES — resource management | |
| `vport.profiles` | Database | app → DB | YES — actorId → profileId resolution | |
| `vport.services` | Database | app → DB | YES — read-only service catalog | |
| `features/notifications/adapters` | Feature | dashboard/vport → notifications | YES — via adapter boundary | Used in `createVportPublicBookingController` and `updateVportBooking.controller.js` |
| `state/identity/identityContext` | State | hooks → identity | YES — reads `actorId` from identity only | |
| `@hydration` | Engine | screen → hydration | YES — actor hydration for customer names | Used in `VportDashboardBookingHistoryScreen` |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vport.bookings` | read/write | `dashboard/vport` + engine | Owner screens, customer booking surface | Write gated by ownership assertion |
| `vport.availability_rules` | read/write | `dashboard/vport/controller/manageVportAvailabilityRule` | Availability calendar UI | Write gated by RC-01 fix |
| `vport.resources` | read/write | `dashboard/vport` | Schedule screen, booking history | Create via `ensureVportOwnerResource` |
| `vport.services` | read | `dashboard/vport/controller/listVportServicesForProfile` | QuickBookingModal | RC-02 fixed — actorId-based lookup |
| `vport.profiles` | read | Various DALs | Profile ID resolution step | Indirect — never returned to UI |
| `vc.actors` | read | `assertActorOwnsVportActorController` | Ownership assertion | Identity verification |
| `vc.actor_owners` | read | `readActorOwnerLinkByActorAndUserProfileDAL` | Ownership assertion | Actor-profile link verification |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | Both screens routed | |
| Loading state | PASS | All hooks expose `loading`; screens render spinner | |
| Empty state | PASS | TodayView, history, and upcoming modes all have empty state renders | |
| Error state | PASS | Error rendered in all view modes | |
| Auth/owner gate | PASS | `isOwner` check in `VportDashboardBookingHistoryScreen`; ownership assertion in all write controllers | |
| Cache behavior | PARTIAL | No cache — fresh fetch every mount; `hydrateActorsByIds` uses hydration store TTL | Medium |
| Runtime dependencies | PASS | Engine configured via `setup.js` before render | |
| Hot paths | WATCH | `loadDaySchedule` fires N+1 availability queries (one per staff member) | See Structural Concerns |
| N+1 risk | WATCH | `loadDayScheduleController` calls `listVportAvailabilityRulesByResourceIdDAL` per staff member in loop via `Promise.all` | Parallel but N reads |

---

## STRUCTURAL CONCERNS

### 1. N+1 Pattern — loadDayScheduleController
**Location:** `dashboard/vport/controller/loadDaySchedule.controller.js`
**Pattern:**
```js
const rulesResults = await Promise.all(
  staff.map((m) => listVportAvailabilityRulesByResourceIdDAL({ resourceId: m.id }))
)
```
**Classification:** WATCH — Parallel N+1 (not sequential). Each staff member requires one DB read for availability rules. For teams of 5-10 this is acceptable; for 50+ it becomes a bottleneck.
**Recommendation:** Add a `listVportAvailabilityRulesByResourceIds` batch DAL that accepts `resource_id IN (...)`.

### 2. Duplicate Read — `getVportProfileIdByActorDAL` called in multiple controllers
**Locations:**
- `listVportServicesForProfileController`
- `listVportBookingResourcesController`
- `loadDayScheduleController`
- `ensureVportOwnerResourceController`
**Pattern:** Every controller that needs a profileId independently resolves it from an actorId via the same DAL.
**Classification:** WATCH — No cache, repeated identical query per page load. Should be memoized or cached at hook level.

### 3. Dual Ownership Assertion Implementations
**Location:**
- App layer: `features/booking/controller/assertActorOwnsVportActor.controller.js`
- Engine layer: `engines/booking/src/controller/assertActorOwnsVportActor.controller.js`
**Pattern:** Both implement the exact same logic (actor lookup → kind check → actor_owners join). The app layer is used by dashboard controllers via `booking.adapter.js`; the engine version is used by engine controllers.
**Classification:** WATCH — Logic duplication. Acceptable for now because the engine must be DI-independent, but drift risk exists if one is updated without the other.

### 4. `loadDaySchedule` bypasses ownership check
**Location:** `dashboard/vport/controller/loadDaySchedule.controller.js`
**Pattern:** No `assertActorOwnsVportActorController` call. The controller receives `actorId` and reads schedule data without verifying the caller is the owner.
**Risk:** MEDIUM — The screen-level `isOwner` check (`VportDashboardScheduleScreen` reads identity but does not explicitly verify) is a client-side guard only. If this controller were ever called from a context without a screen gate, it would expose all booking data for any actorId.
**Recommendation:** Add server-side caller ownership assertion, or document that this controller is intentionally read-only and caller-agnostic (e.g., calendar data is shown to public visitors too).

### 5. `createOwnerBookingController` — `service_label_snapshot` trusts client-supplied value
**Location:** `dashboard/vport/controller/createOwnerBooking.controller.js` line 57
**Pattern:** `serviceLabelSnapshot` is passed directly from the hook/form without server-side resolution from the service catalog.
**Risk:** LOW for owner-initiated bookings (owner controls their own data), but inconsistent with the public booking path which resolves the label server-side.
**Recommendation:** Resolve label from `getVportServiceByIdDAL` server-side when `serviceId` is provided (consistent with `createVportPublicBookingController`).

---

## MODULE BOUNDARY WARNINGS

### Warning 1 — Layer proximity: hook calls controller directly (acceptable)
**Location:** `useVportManageAvailability.js`
**Note:** Hooks in `dashboard/vport/` call `dashboard/vport/` controllers directly without an adapter layer. This is acceptable within the same feature boundary. No cross-feature import.

### Warning 2 — Screen performs filtering logic
**Location:** `VportDashboardBookingHistoryScreen.jsx` — `filterBookings()` and `groupByDate()` functions defined inside screen file.
**Risk:** LOW — these are pure utility functions, not business logic. However, they belong in a model or utility file, not inline in the screen.

### Warning 3 — `useVportOwnerSchedule` calls engine directly via controller (OK)
**Location:** `useVportOwnerSchedule.js` calls `createOwnerBookingController` directly.
**Note:** This is within the same feature boundary (`dashboard/vport/`). Compliant with architecture rules.

### Warning 4 — `vportTeam.read.dal.js` has business logic inside DAL
**Location:** `dashboard/vport/dal/read/vportTeam.read.dal.js` — `findEligibleBarbersDAL` performs multi-step actor resolution, hydration, and social graph queries (follows → actor kinds → barber profiles).
**Risk:** HIGH — This is a DAL file performing orchestration that belongs in a controller. The function crosses schema boundaries (vc.actor_follows → vc.actors → vport.profile_categories) and calls the hydration engine.

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Batch availability rules DAL | HIGH | `loadDayScheduleController` fires N reads per staff member | CARNAGE + booking controller |
| Logan governance doc for booking module | MEDIUM | No canonical doc links this module to contracts | LOGAN |
| Tests for write controllers | HIGH | All P0 security fixes are untested | SENTRY |
| Server-side ownership assertion in `loadDayScheduleController` | MEDIUM | Read path is caller-agnostic — relies on screen-level gate only | VENOM |
| Server-side label resolution in `createOwnerBookingController` | LOW | Inconsistency with public booking path | booking controller |
| Model layer for `filterBookings`/`groupByDate` | LOW | Currently inline in screen | SENTRY |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | None | MISSING |
| Ownership record | This document | PRESENT |
| Security audit | Cerebro P0 audit (RC-01..RC-06, branch: vport-booking-feed-security-updates) | PRESENT |
| Runtime audit | LOKI handoff recommended | MISSING |
| Performance audit | KRAVEN handoff recommended | MISSING |
| Migration audit | None | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | CLAUDE.md in `engines/booking/` | PRESENT |

---

## SPAGHETTI SCORE

**Module:** vcsm.booking  
**Score:** WATCH  
**Reasons:**
- `findEligibleBarbersDAL` is a controller-level orchestrator masquerading as a DAL (HIGH concern within team management DAL)
- Dual `assertActorOwnsVportActor` implementations (app + engine) with identical logic
- `filterBookings`/`groupByDate` inline in screen
- `loadDayScheduleController` has no caller-level ownership assertion
- Booking history, availability rules, and resource listing all independently resolve `profileId` from `actorId` — no shared memoization

**Release risk:** LOW — core write paths all have ownership assertions post RC fixes. WATCH items are quality/performance concerns, not security blockers.

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Batch availability rules DAL | Eliminates N+1 in schedule controller | CARNAGE |
| P1 | Tests for RC-01..RC-06 write controllers | Security fixes without test coverage | SENTRY |
| P2 | Ownership assertion in `loadDayScheduleController` | Defense-in-depth for schedule read | VENOM |
| P2 | Extract `filterBookings`/`groupByDate` to model layer | Screen responsibility violation | SENTRY |
| P2 | `profileId` resolution cache at hook level | Repeated identical DAL reads | KRAVEN |
| P3 | Server-side label resolution in `createOwnerBookingController` | Consistency with public booking path | Booking controller |
| P3 | Logan governance doc | Documentation gap | LOGAN |

---

## FINAL MODULE STATUS

**MOSTLY COMPLETE**

All six P0 Cerebro security findings (RC-01 through RC-06) are resolved. Ownership assertions are present in all booking write paths. The post-fix call chain is clean end-to-end. Remaining concerns are quality, performance, and consistency issues — none are release blockers.

## RECOMMENDED HANDOFFS

- **VENOM** — verify `loadDayScheduleController` caller-agnostic read risk
- **KRAVEN** — audit `loadDayScheduleController` N+1 pattern and `profileId` resolution duplication
- **SENTRY** — extract filtering logic from screen; review `findEligibleBarbersDAL` layer violation
- **CARNAGE** — design batch `listVportAvailabilityRulesByResourceIds` DAL
- **LOGAN** — create Logan governance doc for booking module
