# VCSM DAL — `booking`

_Generated:_ 2026-05-11  
_Updated:_ 2026-05-11 (ARCHITECT live audit — engine vs feature split, boundary violations, dead exports, duplicate DAL)  
_Source:_ ARCHITECT static scan + manual verification · `apps/VCSM/src/features/booking/`  
_Confidence:_ STATICALLY\_TRACED + MANUALLY\_VERIFIED

---

## Summary

| Item | Detail |
|---|---|
| DAL files | 20 (feature-level) |
| Exported functions | 20 |
| Tables accessed | 10 |
| RPCs called | 0 |
| Release flag | None — always active |
| Feature status | LIVE — actively consumed |
| Architecture status | SPLIT — feature layer + engine layer coexist, partially migrated |
| Boundary violations | 2 active component-layer violations in `QuickBookingModal.jsx`; prior 7 cross-feature assertion imports fixed |
| Dead exports | 1 confirmed (`useBookingHistory`) |
| Duplicate implementations | 2 (`assertActorOwnsVportActor`, `getActorById` actor read) |

---

## Critical Finding: Two-Tier Booking System

There are **two separate booking implementations running simultaneously**:

### Tier 1 — `features/booking/` (feature-level, legacy)

- 20 DAL files with direct Supabase access
- 14 controllers
- 16 hooks
- 1 adapter (`features/booking/adapters/booking.adapter.js`)
- Some hooks call feature-level controllers → feature DALs directly
- Some hooks call `@booking` engine directly (mixed migration state)

### Tier 2 — `engines/booking/` (canonical engine)

- Configured at app startup via `features/booking/setup.js` → `main.jsx`
- More complete: adds locations, organizations, QR links, resource service overrides
- Has its own DALs, controllers, and models
- Partially supersedes the feature-level layer
- `engines/booking/index.js` does NOT export `assertActorOwnsVportActor` publicly

**The feature layer is NOT dead — it is the active call path for several live screens.** However, it represents the legacy implementation that has not been fully migrated to the engine.

---

## Engine Setup

`features/booking/setup.js` is imported by `main.jsx` at app startup:

```js
import { setupVcsmBookingEngine } from '@/features/booking/setup'
```

`setup.js` calls `configureBookingEngine({ supabaseClient, vportClient, notifyFn })` from `@booking`, wiring the engine to the app's Supabase client and notification system. The engine is initialized before any component renders.

---

## Active External Consumers (via adapter)

The following files outside `features/booking/` consume the booking adapter:

| Consumer | File | Hooks Used |
|---|---|---|
| Vport booking view | `profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js` | Multiple |
| Vport public booking | `profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` | `useBookingServices` |
| Booking org panel | `profiles/kinds/vport/screens/booking/components/BookingOrganizationPanel.jsx` | Multiple |
| Booking QR panel | `profiles/kinds/vport/screens/booking/components/BookingQrLinksPanel.jsx` | `useQrLinks` |
| My appointments | `notifications/screen/hooks/useMyAppointments.js` | `useBookingOps` |
| Quick booking modal | `dashboard/vport/components/bookingHistory/QuickBookingModal.jsx` | Calls dashboard booking creation path; still has component-layer violations |

---

## DAL Files

### `getActorById.dal.js`

**Path:** `features/booking/dal/getActorById.dal.js`  
**Operations:** `read`  
**Tables:** `vc.actors`

**Exported functions:**

| `getActorByIdDAL` | `read` | `vc.actors` |
|---|---|---|

**Duplicate warning:** The engine has `engines/booking/src/dal/actor.read.dal.js` covering the same read. The feature-level version selects `id, kind, profile_id, vport_id, is_void`. Both exist concurrently.

---

### `getBookingById.dal.js`

**Path:** `features/booking/dal/getBookingById.dal.js`  
**Operations:** `read`  
**Tables:** `bookings`

| `getBookingByIdDAL` | `read` | `bookings` |
|---|---|---|

---

### `getBookingResourceById.dal.js`

**Path:** `features/booking/dal/getBookingResourceById.dal.js`  
**Operations:** `read`  
**Tables:** `resources`

| `getBookingResourceByIdDAL` | `read` | `resources` |
|---|---|---|

---

### `insertBooking.dal.js`

**Path:** `features/booking/dal/insertBooking.dal.js`  
**Operations:** `read` · `insert`  
**Tables:** `bookings`

| `insertBookingDAL` | `read` · `insert` | `bookings` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` (dev diagnostics) — no confirmed production UI caller.

---

### `insertBookingResource.dal.js`

**Path:** `features/booking/dal/insertBookingResource.dal.js`  
**Operations:** `read` · `insert`  
**Tables:** `resources`

| `insertBookingResourceDAL` | `read` · `insert` | `resources` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` (dev diagnostics) — no confirmed production UI caller.

---

### `listAvailabilityExceptionsInRange.dal.js`

**Path:** `features/booking/dal/listAvailabilityExceptionsInRange.dal.js`  
**Operations:** `read`  
**Tables:** `availability_exceptions`

| `listAvailabilityExceptionsInRangeDAL` | `read` | `availability_exceptions` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` — no confirmed production UI caller.

---

### `listAvailabilityRulesByResourceId.dal.js`

**Path:** `features/booking/dal/listAvailabilityRulesByResourceId.dal.js`  
**Operations:** `read`  
**Tables:** `availability_rules`

| `listAvailabilityRulesByResourceIdDAL` | `read` | `availability_rules` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` — no confirmed production UI caller.

---

### `listBookingResourceServicesByResourceId.dal.js`

**Path:** `features/booking/dal/listBookingResourceServicesByResourceId.dal.js`  
**Operations:** `read`  
**Tables:** `resource_services`

| `listBookingResourceServicesByResourceIdDAL` | `read` | `resource_services` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` — no confirmed production UI caller.

---

### `listBookingResourcesByOwnerActorId.dal.js`

**Path:** `features/booking/dal/listBookingResourcesByOwnerActorId.dal.js`  
**Operations:** `read`  
**Tables:** `resources`

| `listBookingResourcesByOwnerActorIdDAL` | `read` | `resources` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` — no confirmed production UI caller.

---

### `listBookingServiceProfilesByServiceIds.dal.js`

**Path:** `features/booking/dal/listBookingServiceProfilesByServiceIds.dal.js`  
**Operations:** `read`  
**Tables:** `service_booking_profiles`

| `listBookingServiceProfilesByServiceIdsDAL` | `read` | `service_booking_profiles` |
|---|---|---|

**Active:** Called by `bookingServices.controller.js` → `useBookingServices` → consumed by `useVportPublicBooking.js` and `BookingOrganizationPanel.jsx`.

---

### `listBookingsByCustomer.dal.js`

**Path:** `features/booking/dal/listBookingsByCustomer.dal.js`  
**Operations:** `read`  
**Tables:** `bookings`

| `listBookingsByCustomerDAL` | `read` | `bookings` |
|---|---|---|

**Active:** Called by `listMyBookings.controller.js` → `useBookingOps` → `useMyAppointments.js`.

---

### `listBookingsByResource.dal.js`

**Path:** `features/booking/dal/listBookingsByResource.dal.js`  
**Operations:** `read`  
**Tables:** `bookings`

| `listBookingsByResourceDAL` | `read` | `bookings` |
|---|---|---|

**Production path:** Only consumed by `listBookingHistory.controller.js` → `useBookingHistory` hook → exported in adapter but has no confirmed external consumer. **Likely dead path in production.**

---

### `listBookingsInRange.dal.js`

**Path:** `features/booking/dal/listBookingsInRange.dal.js`  
**Operations:** `read`  
**Tables:** `bookings`

| `listBookingsInRangeDAL` | `read` | `bookings` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` — no confirmed production UI caller.

---

### `readActorOwnerLinkByActorAndUserProfile.dal.js`

**Path:** `features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js`  
**Operations:** `read`  
**Tables:** `actor_owners`

| `readActorOwnerLinkByActorAndUserProfileDAL` | `read` | `actor_owners` |
|---|---|---|

**Active:** Called by `assertActorOwnsVportActor.controller.js`, which is exposed to dashboard controllers through `features/booking/adapters/booking.adapter.js`.

---

### `readVportServicesByActor.dal.js`

**Path:** `features/booking/dal/readVportServicesByActor.dal.js`  
**Operations:** `read`  
**Tables:** `services`, `profiles`

| `readVportServicesByActorDAL` | `read` | `services`, `profiles` |
|---|---|---|

**Active:** Called by `bookingServices.controller.js` → `useBookingServices` → consumed by `useVportPublicBooking.js` and `BookingOrganizationPanel.jsx`.

---

### `saveBookingServiceProfileDurationsByServiceIds.dal.js`

**Path:** `features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js`  
**Operations:** `read` · `insert` · `update`  
**Tables:** `service_booking_profiles`

| `saveBookingServiceProfileDurationsByServiceIdsDAL` | `read` · `insert` · `update` | `service_booking_profiles` |
|---|---|---|

**Production path:** Only reached via `bookings.group.tests2.js` (dev diagnostics) — no confirmed production UI caller.

---

### `updateBookingStatus.dal.js`

**Path:** `features/booking/dal/updateBookingStatus.dal.js`  
**Operations:** `read` · `update`  
**Tables:** `bookings`

| `updateBookingStatusDAL` | `read` · `update` | `bookings` |
|---|---|---|

**Active:** Called by `cancelBooking.controller.js` + `confirmBooking.controller.js` → `useBookingOps` → `useMyAppointments.js`, `BookingOrganizationPanel.jsx`, `BookingQrLinksPanel.jsx`, `useVportBookingView.js`.

---

### `upsertAvailabilityException.dal.js`

**Path:** `features/booking/dal/upsertAvailabilityException.dal.js`  
**Operations:** `read` · `upsert`  
**Tables:** `availability_exceptions`

| `upsertAvailabilityExceptionDAL` | `read` · `upsert` | `availability_exceptions` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` — no confirmed production UI caller.

---

### `upsertAvailabilityRule.dal.js`

**Path:** `features/booking/dal/upsertAvailabilityRule.dal.js`  
**Operations:** `read` · `upsert`  
**Tables:** `availability_rules`

| `upsertAvailabilityRuleDAL` | `read` · `upsert` | `availability_rules` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` — no confirmed production UI caller.

---

### `upsertBookingResourceServices.dal.js`

**Path:** `features/booking/dal/upsertBookingResourceServices.dal.js`  
**Operations:** `read` · `upsert`  
**Tables:** `resource_services`

| `upsertBookingResourceServicesDAL` | `read` · `upsert` | `resource_services` |
|---|---|---|

**Production path:** Only reached via `bookingFeature.group.js` or `bookings.group.tests2.js` — no confirmed production UI caller.

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_owners` | READ | `readActorOwnerLinkByActorAndUserProfileDAL` |
| `actors` | READ | `getActorByIdDAL` |
| `availability_exceptions` | READ, UPSERT | `listAvailabilityExceptionsInRangeDAL`, `upsertAvailabilityExceptionDAL` |
| `availability_rules` | READ, UPSERT | `listAvailabilityRulesByResourceIdDAL`, `upsertAvailabilityRuleDAL` |
| `bookings` | INSERT, READ, UPDATE | `getBookingByIdDAL`, `insertBookingDAL`, `listBookingsByCustomerDAL`, `listBookingsByResourceDAL`, `listBookingsInRangeDAL`, `updateBookingStatusDAL` |
| `profiles` | READ | `readVportServicesByActorDAL`, `listBookingsByCustomerDAL` |
| `resource_services` | READ, UPSERT | `listBookingResourceServicesByResourceIdDAL`, `upsertBookingResourceServicesDAL` |
| `resources` | INSERT, READ | `getBookingResourceByIdDAL`, `insertBookingResourceDAL`, `listBookingResourcesByOwnerActorIdDAL` |
| `service_booking_profiles` | READ, UPDATE | `listBookingServiceProfilesByServiceIdsDAL`, `saveBookingServiceProfileDurationsByServiceIdsDAL` |
| `services` | READ | `readVportServicesByActorDAL` |

---

## Risk Findings

### RISK-1 — Cross-Feature Direct Import of `assertActorOwnsVportActor.controller.js`
**Severity:** HIGH  
**Classification:** SPAGHETTI — boundary violation  
**Status:** FIXED  
**Detail:** 7 `dashboard/vport/controller/` files previously imported `assertActorOwnsVportActor.controller.js` directly from `features/booking/controller/`, bypassing the adapter. Those cross-feature imports now route through `features/booking/adapters/booking.adapter.js`.

Files importing directly:
- `dashboard/vport/controller/updateVportBooking.controller.js`
- `dashboard/vport/controller/vportTeam.controller.js`
- `dashboard/vport/controller/checkVportOwnership.controller.js`
- `dashboard/vport/controller/vportTeamAccess.controller.js`
- `dashboard/vport/controller/saveVportPublicDetailsByActorId.controller.js`
- `dashboard/vport/controller/vportTeamInvite.controller.js`
- `dashboard/vport/controller/createOwnerBooking.controller.js`

**Recommended action:** Keep external callers on the adapter path. Internal booking controllers may continue importing the internal controller directly.

---

### RISK-2 — `assertActorOwnsVportActor` Duplicate Implementation
**Severity:** HIGH  
**Classification:** DUPLICATE  
**Detail:** `assertActorOwnsVportActor.controller.js` exists in both `features/booking/controller/` and `engines/booking/src/controller/`. The engine version is NOT exported from `engines/booking/index.js`, so apps use the feature-level version. Two separate ownership assertion implementations exist and may drift.  
**Recommended action:** Export the engine version from `index.js`, deprecate and remove the feature-level copy. Route all callers to `@booking`.

---

### RISK-3 — `getActorById.dal.js` Duplicate Actor Read
**Severity:** MEDIUM  
**Classification:** DUPLICATE  
**Detail:** `features/booking/dal/getActorById.dal.js` reads `vc.actors` locally. The engine has `engines/booking/src/dal/actor.read.dal.js` for the same purpose. Two actor read implementations in the booking system.  
**Recommended action:** Verify the engine version covers the same columns. Remove the feature-level copy once engine migration is complete.

---

### RISK-4 — `useBookingHistory` Dead Export
**Severity:** MEDIUM  
**Classification:** LIKELY DEAD  
**Detail:** `useBookingHistory` is exported from `booking.adapter.js` but has zero external consumers. The full chain (`listBookingsByResource.dal.js` → `listBookingHistory.controller.js` → `useBookingHistory.js` → adapter) is wired but nothing calls it from outside the feature.  
**Recommended action:** Verify with LOKI if it is ever dynamically invoked. If not, remove from adapter exports. The underlying controller and DAL remain available if needed later.

---

### RISK-5 — 12 of 20 DAL Files Have No Confirmed Production UI Path
**Severity:** MEDIUM  
**Classification:** DIAGNOSTICS-ONLY  
**Detail:** The following DALs are only exercised by dev diagnostics files (`bookingFeature.group.js`, `diagnosticsGroups.part1.js`, `bookings.group.tests2.js`), not by any production UI path:

- `insertBooking.dal.js`
- `insertBookingResource.dal.js`
- `listAvailabilityExceptionsInRange.dal.js`
- `listAvailabilityRulesByResourceId.dal.js`
- `listBookingResourceServicesByResourceId.dal.js`
- `listBookingResourcesByOwnerActorId.dal.js`
- `listBookingsInRange.dal.js`
- `listBookingsByResource.dal.js`
- `saveBookingServiceProfileDurationsByServiceIds.dal.js`
- `upsertAvailabilityException.dal.js`
- `upsertAvailabilityRule.dal.js`
- `upsertBookingResourceServices.dal.js`

These correspond to availability management, resource management, and booking range operations — likely intended for owner-facing screens that have not yet been built into the UI. The engine covers this functionality.  
**Recommended action:** These are not dead — they are pre-built for upcoming owner dashboard features. Confirm with IRONMAN whether these are still on the product roadmap or superseded by the engine.

---

### RISK-6 — Mixed Migration State in Hooks
**Severity:** LOW  
**Classification:** WATCH  
**Detail:** The 16 hooks in `features/booking/hooks/` are in a mixed state:
- Some call feature-level controllers (e.g., `useBookingOps`, `useBookingServices`)
- Some call the engine directly via `@booking` (e.g., `useCreateBooking`)
There is no consistent migration boundary.  
**Recommended action:** Establish a migration plan: either complete the move to the engine or document which hooks intentionally remain at the feature level.

### RISK-7 — Dashboard Booking History Read Lacked Controller Ownership Gate
**Severity:** HIGH  
**Classification:** TRUST BOUNDARY  
**Status:** PARTIAL FIX — dashboard path secured; engine path and feature controller remain unprotected  
**Detail:** `listVportBookingHistoryController` (dashboard, `features/dashboard/vport/controller/`) now requires `actorId` and `callerActorId`, calls `assertActorOwnsVportActorController` through the booking adapter, and only then calls the dashboard DAL. Dashboard path is confirmed fixed.  
**What remains open:**
- `engines/booking/src/controller/listBookingHistory.controller.js` — accepts only `{ resourceId, statuses, limit, offset }` with NO caller identity, NO ownership assertion. This is the controller called by `useBookingHistory.js` via the `@booking` import. Any authenticated actor with a `resourceId` can read all bookings for that resource through this path. **CRITICAL — release-blocking (S-BOOK-01, V-BOOK-01).**
- `features/booking/controller/listBookingHistory.controller.js` — feature-level controller with no ownership check. Confirmed dead (no production callers); `useBookingHistory.js` routes to engine, not this file. Delete candidate (S-BOOK-05).
- `useBookingHistory` exported from `booking.adapter.js` — backed by the unprotected engine controller above. Must be removed from adapter until S-BOOK-01 is resolved (S-BOOK-04).  
**Recommended action:** Add `callerActorId` + `ownerActorId` to engine `listBookingHistory` and add ownership assertion before the DAL call. Remove `useBookingHistory` from adapter exports until fixed. Delete dead feature controller.

### RISK-8 — `QuickBookingModal.jsx` Layer Violations
**Severity:** HIGH  
**Classification:** LAYER VIOLATION + IDENTITY SURFACE VIOLATION  
**Status:** PARTIAL FIX — component-layer violations resolved; identity surface violation remains open  
**Detail:**  
- **Fixed:** `QuickBookingModal.jsx` no longer imports DAL or controller functions directly. The component now delegates entirely to `useQuickBookingModal` hook. The component-to-DAL and component-to-controller violations documented in the original finding are resolved at the component layer.  
- **Open (HIGH — S-BOOK-02, VB-04):** `useQuickBookingModal` receives `profileId` as a prop and passes it to `listVportServicesForProfileController({ profileId })` which is a zero-logic passthrough to `listVportServicesByProfileIdDAL`. `profileId` is a forbidden identity surface. No `actorId`-based lookup is performed. No ownership verification exists on this service read path. Any authenticated Citizen with a valid `profileId` can enumerate any VPORT's service catalog.  
**Recommended action:** Remove `profileId` from `QuickBookingModal` props. Derive VPORT actor from `resourceId` (or accept `ownerActorId` from the parent that has already resolved it). Replace `listVportServicesForProfileController({ profileId })` with an actor-scoped controller that accepts `ownerActorId`. If services are genuinely public, document that explicitly and label the controller as public — otherwise add an ownership assertion.

---

### RISK-9 — Availability Rule Write Path Has No Controller-Level Ownership Assertion
**Severity:** CRITICAL  
**Classification:** TRUST BOUNDARY — live production write path  
**Status:** OPEN  
**Detail:** The availability rule mutation path (`WeeklyAvailabilityGrid` → `useVportManageAvailability` → `manageVportAvailabilityRuleController` → `upsertVportAvailabilityRuleDAL`) writes to `vport.availability_rules` with no controller-level ownership assertion. The `requestActorId` is passed by the grid component but silently dropped at the hook boundary and never forwarded to the controller. The DAL UPDATE path filters only by `ruleId` — any caller with a valid `ruleId` (exposed in the calendar UI response) can modify any VPORT's availability rules.  
Only guard: UI string comparison `String(viewerActorId) === String(actorId)` at screen render — not DB-verified via `actor_owners`.  
**Exploitability:** HIGH — any authenticated Citizen with a known `ruleId` UUID.  
**Blast Radius:** Multi-actor — any VPORT resource on the platform.  
**Recommended action:**  
1. Add `callerActorId` to `manageVportAvailabilityRuleController` and call `assertActorOwnsVportActorController` before the DAL call.  
2. Forward `requestActorId` from `useVportManageAvailability.setAvailabilityRule` to the controller (currently silently dropped on line 15-23).  
3. Add `resource_id` filter to the UPDATE path in `upsertVportAvailabilityRuleDAL` alongside the existing `ruleId` filter.  
4. Verify/add RLS UPDATE policy on `vport.availability_rules` (delegate to Carnage per DB-BOOK-02).  
**Audit evidence:** V-AVAIL-01, V-AVAIL-02 in `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-availability-write.md`

---

## Active Call Chains

### Confirmed production paths (screen reachable)

```
listBookingsByCustomer.dal.js
  → listMyBookings.controller.js
  → useBookingOps.js
  → booking.adapter.js
  → useMyAppointments.js (notifications screen)
```

```
updateBookingStatus.dal.js + getBookingById.dal.js + getBookingResourceById.dal.js
  → cancelBooking.controller.js / confirmBooking.controller.js
  → useBookingOps.js
  → booking.adapter.js
  → BookingOrganizationPanel.jsx / BookingQrLinksPanel.jsx / useVportBookingView.js
```

```
listBookingServiceProfilesByServiceIds.dal.js + readVportServicesByActor.dal.js
  → bookingServices.controller.js
  → useBookingServices.js
  → booking.adapter.js
  → useVportPublicBooking.js / BookingOrganizationPanel.jsx
```

```
readActorOwnerLinkByActorAndUserProfile.dal.js + getActorById.dal.js
  → assertActorOwnsVportActor.controller.js
  → booking.adapter.js
  → dashboard controllers
  → VportDashboardBookingHistoryScreen, VportDashboardScheduleScreen, VportSettingsScreen
```

### Diagnostics-only paths (no production UI)

```
insertBooking.dal.js → createBooking.controller.js → bookingFeature.group.js
insertBookingResource.dal.js → ensureOwnerBookingResource.controller.js → bookingFeature.group.js
listAvailabilityExceptionsInRange.dal.js → getResourceAvailability.controller.js → bookingFeature.group.js
listAvailabilityRulesByResourceId.dal.js → getResourceAvailability.controller.js → bookingFeature.group.js
... (8 more following same diagnostics-only pattern)
```

---

## Architecture Pipeline

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | 20 files (documented above) |
| **Model** | ✓ PRESENT | `booking.model.js`, `bookingAvailability.model.js`, `bookingResource.model.js`, `bookingServiceProfile.model.js` |
| **Controller** | ✓ PRESENT | 14 controllers (listed below) |
| **Adapter** | ✓ PRESENT | `features/booking/adapters/booking.adapter.js` |
| **Service** | ✗ MISSING | Delegated to engine |
| **Hook** | ✓ PRESENT | 16 hooks |
| **Component** | ✗ EMPTY | `components/` folder exists with only `.gitkeep` |
| **View Screen** | ✗ EMPTY | `screens/` folder exists with only `.gitkeep` |
| **Final Screen** | ✗ MISSING | Screens live in `features/dashboard/vport/screens/` — not in booking feature itself |

Note: The booking feature has no screens of its own. All UI entry points are in `features/dashboard/vport/` and `features/profiles/kinds/vport/`. The booking feature is a pure service/logic layer.

### Controllers

- `assertActorOwnsVportActor.controller.js` ← exported through booking adapter for outside callers
- `bookingServices.controller.js`
- `cancelBooking.controller.js`
- `confirmBooking.controller.js`
- `createBooking.controller.js`
- `ensureOwnerBookingResource.controller.js`
- `getBookingServiceProfiles.controller.js`
- `getResourceAvailability.controller.js`
- `listBookingHistory.controller.js`
- `listMyBookings.controller.js`
- `listOwnerBookingResources.controller.js`
- `setAvailabilityException.controller.js`
- `setAvailabilityRule.controller.js`
- `setResourceSlotDuration.controller.js`

---

## Pending Reviews

| Review | Command | Priority |
|---|---|---|
| Adapter regression guard for ownership assertion | SENTRY | HIGH |
| `assertActorOwnsVportActor` duplicate — engine vs feature | IRONMAN | HIGH |
| Engine migration completion plan — which hooks still use feature-level controllers | IRONMAN | HIGH |
| `useBookingHistory` dead export — verify with runtime trace | LOKI | MEDIUM |
| 12 diagnostics-only DAL paths — confirm product roadmap status | IRONMAN | MEDIUM |
| `getActorById` duplicate actor read | SENTRY | MEDIUM |
| Mixed hook migration state | IRONMAN | LOW |
| Quick booking modal layer violations | SENTRY | HIGH |

---

## Avengers Assembly Report — 2026-05-11

**Run Summary**

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | User — `/AvengersAssemble` scoped to this document |
| Application Scope | VCSM |
| Document Scope | `vcsm.dal.booking.md` — booking DAL alignment pass |
| Passes Completed | ARCHITECT · VENOM · LOGAN · review-contract · Session-Summary Structure |

---

### ARCHITECT

**Status: DRIFT FOUND**

| Finding | Severity | Detail |
|---|---|---|
| Adapter path incorrect | MODERATE | Document references `features/booking/booking.adapter.js`. Actual path is `features/booking/adapters/booking.adapter.js`. |
| New undocumented consumer | LOW | `QuickBookingModal.jsx` added at `features/dashboard/vport/components/bookingHistory/QuickBookingModal.jsx`. Calls `createOwnerBookingController` (dashboard). Not listed in Active External Consumers table. |
| New parallel booking-history DAL | HIGH | `features/dashboard/vport/dal/read/vportBookingHistory.read.dal.js` + `listVportBookingHistory.controller.js` added in the dashboard. Reads `bookings` table directly via `vportSchema` with no booking-feature adapter involvement. This is a 3rd parallel booking read implementation — undocumented in this doc. |
| New helper file | LOW | `profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.helpers.js` created in commit `8baf6d5`. Not referenced in Active External Consumers or call chains. |
| DAL file count | ALIGNED | 20 confirmed. Matches document. |
| Controller count | ALIGNED | 14 confirmed. Matches document. |
| Hook count | ALIGNED | 16 confirmed. Matches document. |

---

### VENOM

**Status: DRIFT FOUND**

| Finding | Severity | Detail |
|---|---|---|
| RISK-1 boundary violation — still active | HIGH | All 7 direct imports of `assertActorOwnsVportActor.controller.js` confirmed present. No remediation has occurred since the original doc. |
| New entry path through RISK-1 violation | HIGH | `QuickBookingModal.jsx` → `createOwnerBooking.controller.js` → `assertActorOwnsVportActor.controller.js` (direct boundary violation). This modal is a new UI caller that routes ownership checking through the unresolved violation chain. |
| Dashboard DAL reads `bookings` with no ownership gate | HIGH | `listVportBookingHistoryDAL` in `dashboard/vport/dal/read/` reads the `bookings` table directly using `vportSchema` with no ownership assertion at the DAL or controller level. Ownership is not verified before returning booking rows. The controller (`listVportBookingHistoryController`) passes `resourceId` with no actor ownership check — any caller with a resourceId can retrieve booking history. |
| RISK-2 duplicate `assertActorOwnsVportActor` | HIGH | Unchanged. Engine version still not exported from `engines/booking/index.js`. Feature-level version remains the active implementation. |

---

### LOGAN

**Status: DRIFT FOUND**

| Finding | File | Drift Type | Detail |
|---|---|---|---|
| Adapter path wrong | This doc — multiple sections | MINOR | All references to `booking.adapter.js` omit the `adapters/` subdirectory. Correct path: `features/booking/adapters/booking.adapter.js`. |
| Tables Accessed — `profiles` join undocumented | This doc — Tables Accessed section | MINOR | In commit `8baf6d5`, `listBookingsByCustomerDAL` gained `profiles!profile_id(actor_id,name)` join. The Tables Accessed table shows `profiles` as only accessed by `readVportServicesByActorDAL`. It must also list `listBookingsByCustomerDAL`. |
| Active External Consumers table incomplete | This doc — Active External Consumers section | MINOR | `QuickBookingModal.jsx` is a new active booking UI surface. Not documented. Goes through `createOwnerBookingController` (dashboard), which itself has the RISK-1 boundary violation. |
| `booking.model.js` field additions undocumented | This doc — Architecture Pipeline section | LOW | `mapBookingRow` now includes `vportActorId`, `vportName`, `memberActorId`, `memberName`. The model section lists the file as present but does not document field shape. Low severity for a DAL doc, but signals the model has evolved with the schema join changes. |
| RISK-1, RISK-2, RISK-4, RISK-5 status | All risk entries | ALIGNED | All risk findings remain valid and unresolved. No false positives found. |

---

### review-contract

**Status: VIOLATIONS FOUND**

| Finding | File | Violation | Severity |
|---|---|---|---|
| Component calls DAL directly | `QuickBookingModal.jsx` | `listVportServicesByProfileIdDAL` imported and called from a JSX component. DAL access must go through Controller → Hook → Component. | HIGH |
| Component calls Controller directly | `QuickBookingModal.jsx` | `createOwnerBookingController` imported directly into a presentational component. Controllers must be called from hooks, not components. | HIGH |
| Boundary violation — still unresolved | 7 dashboard/vport controllers | Direct import of `assertActorOwnsVportActor.controller.js` from `features/booking/controller/`. Documented in RISK-1. No adapter remediation has been applied since the original doc. | HIGH |
| Dashboard DAL reads shared table without adapter gate | `vportBookingHistory.read.dal.js` | A dashboard-owned DAL reads the `bookings` table directly, outside any booking engine or adapter surface. Not a per-se layer violation (DAL inside dashboard reads from shared table), but it creates an ungated, untracked read path that is invisible to the booking feature. | MEDIUM |

---

### Session-Summary Structure

**Status: ISSUE**

| Check | Status | Detail |
|---|---|---|
| `2026-05` month folder | MISSING | Current month (May 2026) has no session summary folder. Oldest pending session may be filing under a missing directory. |
| `2026-04_month_summary.md` | PRESENT | April 2026 month summary exists in `2026-04/` folder. |
| Orphaned session files at root | NONE | No misplaced files at `session-summaries/` root. |
| Command count — `.claude/commands/` | DRIFT | 23 `.md` files in commands folder. CLAUDE.md command table lists 17. 6 commands undocumented in table: `AvengersAssemble`, `Cerebro`, `SHIELD`, `Sentry`, `WinterSoldier`, `listofcomand.v2`. |

---

### Proposed Updates

| Update | Target | Action Required |
|---|---|---|
| Correct adapter path in all doc sections | This doc | Replace `features/booking/booking.adapter.js` → `features/booking/adapters/booking.adapter.js` throughout |
| Add `QuickBookingModal.jsx` to Active External Consumers | This doc — Active External Consumers section | New row: `QuickBookingModal` · `features/dashboard/vport/components/bookingHistory/QuickBookingModal.jsx` · calls `createOwnerBookingController` (via boundary violation) |
| Update Tables Accessed — `listBookingsByCustomerDAL` row | This doc — Tables Accessed section | Add `profiles` join to the `profiles` row — via `listBookingsByCustomerDAL` |
| Add `useVportPublicBooking.helpers.js` to External Consumers | This doc — Active External Consumers section | New row noting helper file exists alongside `useVportPublicBooking.js` |
| Add new risk finding for ungated `listVportBookingHistoryDAL` | This doc — Risk Findings section | RISK-7: Dashboard DAL reads `bookings` with no ownership assertion |
| Add new risk finding for `QuickBookingModal` layer violations | This doc — Risk Findings section | RISK-8: Component-to-DAL and component-to-Controller layer skips |
| Create `2026-05` session-summary folder | `session-summaries/` | Create month folder for current session filing |
| Add 6 undocumented commands to CLAUDE.md command table | `CLAUDE.md` | Add `AvengersAssemble`, `Cerebro`, `SHIELD`, `Sentry`, `WinterSoldier`, `listofcomand.v2` |

A `.v2.md` copy with full corrected content is **not created** at this time — all proposed changes are additive documentation corrections (no destructive rewrites). User approval is required before any edits to this document or CLAUDE.md are applied.

---

### Overall Status

**DRIFT FOUND**

| Area | Status | Blocking |
|---|---|---|
| Architecture | DRIFT — adapter path wrong, 2 new undocumented consumers, parallel booking history DAL | No — doc drift only |
| Security / Trust | DRIFT — ungated dashboard DAL reads `bookings`, RISK-1 still active + new entry path | CAUTION — ownership gap in `listVportBookingHistoryDAL` |
| Documentation Truth | DRIFT — adapter path, Tables Accessed, missing consumers | No — doc corrections needed |
| Contract Compliance | VIOLATIONS — `QuickBookingModal` skips hook and DAL layers, RISK-1 still unresolved | YES — two new layer violations |
| Session Structure | ISSUE — May 2026 folder missing, 6 commands undocumented | No |

---

### Recommended Next Command

| Priority | Command | Reason |
|---|---|---|
| 1 | **VENOM** | Investigate `listVportBookingHistoryDAL` — no ownership assertion on `bookings` read. Confirm whether RLS provides adequate protection or whether an explicit ownership check is required. |
| 2 | **SENTRY** | Enforce `QuickBookingModal.jsx` layer violations (component → DAL, component → controller). Immediate architecture contract violations. |
| 3 | **IRONMAN** | Resolve RISK-1 — export `assertActorOwnsVportActor` from `adapters/booking.adapter.js`, redirect 7 callers + `QuickBookingModal` chain through the adapter. |
| 4 | **CARNAGE** | Confirm whether the `profiles` join in `listBookingsByCustomerDAL` requires a schema or policy change for the new `member_actor_id` / `name` fields. |

---

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `apps/VCSM/src/features/booking/adapters/booking.adapter.js` | Exported `assertActorOwnsVportActorController` as the approved cross-feature booking ownership assertion surface. |
| `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js` | Switched ownership assertion import from booking controller internals to booking adapter. |
| `apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js` | Switched ownership assertion import from booking controller internals to booking adapter. |
| `apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js` | Switched ownership assertion import from booking controller internals to booking adapter. |
| `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js` | Switched ownership assertion import from booking controller internals to booking adapter. |
| `apps/VCSM/src/features/dashboard/vport/controller/createOwnerBooking.controller.js` | Switched ownership assertion import from booking controller internals to booking adapter. |
| `apps/VCSM/src/features/dashboard/vport/controller/saveVportPublicDetailsByActorId.controller.js` | Switched ownership assertion import from booking controller internals to booking adapter. |
| `apps/VCSM/src/features/dashboard/vport/controller/vportTeamAccess.controller.js` | Switched ownership assertion import from booking controller internals to booking adapter. |
| `apps/VCSM/src/features/dashboard/vport/controller/listVportBookingHistory.controller.js` | Added actor-owner assertion before reading booking history by resource. |
| `apps/VCSM/src/features/dashboard/vport/hooks/useVportBookingHistory.js` | Threaded `actorId` and `callerActorId` to the booking history controller. |
| `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx` | Passed target/viewer actor IDs into the booking history hook and disabled loading when the viewer is not owner. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.booking.md` | Updated current-state risk statuses, adapter path, tables accessed, active consumers, and appended this fix pass. |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| RISK-1 — 7 cross-feature direct imports of `assertActorOwnsVportActor.controller.js` | DONE | Dashboard/vport controllers now import the assertion through `features/booking/adapters/booking.adapter.js`. Live grep shows only internal booking controllers and the adapter import the controller file directly. |
| RISK-7 — dashboard booking history read without controller ownership assertion | DONE | `listVportBookingHistoryController` now asserts `callerActorId` owns `actorId` through the booking adapter before calling the DAL. |
| Adapter path drift | DONE | Current-state sections now name `features/booking/adapters/booking.adapter.js`. |
| Tables Accessed missing `profiles` join via `listBookingsByCustomerDAL` | DONE | `profiles` row now includes `listBookingsByCustomerDAL`. |
| Active consumers missing `QuickBookingModal.jsx` | DONE | Active External Consumers now includes the quick booking modal. |
| RISK-2 — duplicate feature/engine ownership assertion | BLOCKED | Engine export/deprecation requires engine scope and IRONMAN ownership. No engine files modified. |
| RISK-3 — duplicate actor read | BLOCKED | Engine migration decision required; feature path still active. |
| RISK-4 — `useBookingHistory` dead export | BLOCKED | Export has no external callers by grep, but runtime/dynamic use needs LOKI before removal. |
| RISK-5 — diagnostics-only/prebuilt DAL paths | BLOCKED | Product roadmap / engine migration ownership required. |
| RISK-6 — mixed hook migration state | BLOCKED | Requires booking engine migration plan. |
| RISK-8 — `QuickBookingModal.jsx` component-layer violations | BLOCKED | Still imports DAL and controller directly. Fix requires adding a focused hook/controller boundary for the modal; left for SENTRY to avoid a broader UI refactor in this DAL pass. |

### Verification

- Commands/searches run:
  - `grep -rn "assertActorOwnsVportActor.controller" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "listVportBookingHistoryController({" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "useBookingHistory\\|listBookingHistory.controller\\|listBookingsByResourceDAL" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "listBookingsByCustomerDAL\\|profiles!profile_id\\|vportActorId\\|memberActorId" apps/VCSM/src/features/booking --include='*.js' --include='*.jsx'`
  - Inspected `apps/VCSM/src/features/booking/adapters/booking.adapter.js`
  - Inspected `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js`
  - Inspected `apps/VCSM/src/features/dashboard/vport/components/bookingHistory/QuickBookingModal.jsx`
  - Inspected `apps/VCSM/src/features/dashboard/vport/controller/listVportBookingHistory.controller.js`
  - Inspected `apps/VCSM/src/features/dashboard/vport/hooks/useVportBookingHistory.js`
  - `npm run build`
- Production callers checked:
  - All dashboard/vport controllers listed in RISK-1.
  - `VportDashboardBookingHistoryScreen.jsx` → `useVportBookingHistory.js` → `listVportBookingHistoryController`.
  - `QuickBookingModal.jsx` direct DAL/controller calls.
  - `useBookingHistory` adapter export chain.
- Remaining risks:
  - RISK-2, RISK-3, RISK-5, and RISK-6 require IRONMAN/engine migration decisions.
  - RISK-4 requires LOKI dynamic/runtime verification before removing adapter export.
  - RISK-8 requires SENTRY-guided hook/controller extraction for `QuickBookingModal.jsx`.

### Status

PARTIAL

---

## VENOM — booking-dal-post-fix-verification · Phase 1

**Date:** 2026-05-11  
**Reviewer:** VENOM  
**Trigger:** Post-Codex-Fix-Pass security re-verification — confirm RISK-1 and RISK-7 fixes hold; inspect RLS coverage on `bookings`; re-assess RISK-8 `QuickBookingModal` layer violations  
**Application Scope:** VCSM  
**Findings:** 0 CRITICAL | 3 HIGH | 3 MEDIUM | 1 LOW

---

### VENOM TARGET

| Field | Value |
|---|---|
| Feature | `features/booking/` · `features/dashboard/vport/` booking surfaces |
| Application Scope | VCSM |
| Reason for review | Codex Fix Pass marked RISK-1 and RISK-7 as DONE. AvengersAssemble VENOM pass was pre-fix. RISK-8 reported BLOCKED. This pass is a post-fix independent re-verification. |
| Primary trust boundary | Authenticated VPORT Owner → booking read/write operations |

---

### SECURITY SURFACE

| Field | Value |
|---|---|
| Entry points | `VportDashboardBookingHistoryScreen` → `useVportBookingHistory` → `listVportBookingHistoryController` → `listVportBookingHistoryDAL`; `QuickBookingModal` → `useQuickBookingModal` → `createOwnerBookingController` + `listVportServicesForProfileController` |
| Auth source | `useIdentity()` → `identity.actorId` |
| Authorization layer | Controller — `assertActorOwnsVportActorController` via `features/booking/adapters/booking.adapter.js` |
| Identity surface | `actorId` (correct); `profileId` used in service load path (violation — see VB-04) |
| Sensitive objects | `bookings` table (customer names, notes, dates, statuses), `services` table, `resources` table |

---

### TRUST BOUNDARY TRACE

| Step | Detail |
|---|---|
| Client input | `resourceId` from route params; `actorId` from `useIdentity()` |
| Validated at | Controller — `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` |
| Identity resolved at | `useIdentity()` → `identity.actorId` — correct actor-based resolution |
| Authorization enforced at | Controller level for booking history read and owner booking create |
| Data returned to | Screen-level state, no sensitive fields re-exposed beyond booking details to confirmed owner |

---

### VB-01 — RISK-1 Fix: Cross-Feature Direct Import — VERIFIED CLEAN

**Status: FIXED — CONFIRMED**

All 7 dashboard/vport controllers now import `assertActorOwnsVportActorController` exclusively through `@/features/booking/adapters/booking.adapter.js`:

- `updateVportBooking.controller.js` ✓
- `vportTeam.controller.js` ✓
- `vportTeamInvite.controller.js` ✓
- `createOwnerBooking.controller.js` ✓
- `checkVportOwnership.controller.js` ✓
- `saveVportPublicDetailsByActorId.controller.js` ✓
- `vportTeamAccess.controller.js` ✓

Remaining direct imports of `assertActorOwnsVportActor.controller.js` are all within `features/booking/controller/` internals (sibling controllers within the same feature), which is the correct permitted pattern.

**RISK-1 is closed.**

---

### VB-02 — RISK-7 Fix: Booking History Controller Ownership Gate — PARTIAL FIX

**Status: DASHBOARD PATH FIXED. ENGINE PATH OPEN — RELEASE BLOCKER.**

`listVportBookingHistoryController` (dashboard) now asserts ownership before calling the DAL:

```js
await assertActorOwnsVportActorController({
  requestActorId: callerActorId,
  targetActorId: actorId,
});
const rows = await listVportBookingHistoryDAL({ resourceId, limit, offset });
```

The hook threads `actorId` and `callerActorId` from identity correctly. The screen gates loading with `enabled: Boolean(resourceId) && isOwner`. Dashboard path is confirmed secured.

**Open (CRITICAL — S-BOOK-01, V-BOOK-01):** `engines/booking/src/controller/listBookingHistory.controller.js` accepts only `{ resourceId, statuses, limit, offset }` with NO caller identity and NO ownership assertion. This engine controller is the one called by `useBookingHistory.js` (via `@booking` import). The feature-level `listBookingHistory.controller.js` is DEAD — it is not what the hook calls. The engine path is fully unprotected and the dead export `useBookingHistory` in `booking.adapter.js` must be removed until fixed. RISK-7 is NOT fully resolved — the doc's original FIXED status was incorrect.

**Caveat — see VB-05 below:** `listVportBookingHistoryDAL` filters only by `resource_id` with no ownership column in the query. Defense-in-depth requires RLS on `bookings` to enforce that the authenticated session can only read rows for resources they own. RLS was NOT verified in this pass. If the vport Supabase client runs with elevated privileges or if the `bookings` RLS policy does not scope reads by actor ownership, the DAL is a single-layer defense.

---

### VB-03 — RISK-8: QuickBookingModal Layer Violations — PARTIALLY RESOLVED

**Status: COMPONENT VIOLATIONS FIXED. IDENTITY SURFACE VIOLATION OPEN.**

`QuickBookingModal.jsx` no longer directly imports DAL or controller functions. The component now delegates entirely to `useQuickBookingModal` hook:

```js
// Current — CORRECT at component layer
const { services, saving, error, setError, createBooking } = useQuickBookingModal({ profileId, resourceId });
```

The hook calls `createOwnerBookingController` and `listVportServicesForProfileController` from controllers — the component-to-DAL and component-to-controller layer violations documented in RISK-8 are **resolved at the component layer**.

**Open issue (VB-04):** The hook uses `profileId` as the service-loading authority surface, which is an identity contract violation.

---

### VENOM SECURITY FINDING VB-04

**Finding ID:** VB-04  
**Location:** `features/dashboard/vport/hooks/useQuickBookingModal.js` → `listVportServicesForProfileController` → `listVportServicesByProfileIdDAL`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Supabase Table/View  
**Trust Boundary:** Authenticated VPORT Owner  
**Boundary Violated:** Identity contract — `profileId` used as authority surface instead of `actorId`  
**Contract Violated:** Public Identity Surface Contract · Actor Ownership Contract

**Current behavior:** `useQuickBookingModal` receives `profileId` as a prop from the screen. It calls `listVportServicesForProfileController({ profileId })` which is a thin passthrough to `listVportServicesByProfileIdDAL({ profileId })`. No `actorId`-based lookup is performed. No ownership verification exists on this service read path.

**Risk:** Any authenticated user who can supply a valid `profileId` can enumerate all services belonging to any VPORT, bypassing the actor-ownership identity model. The `profileId` namespace is an internal identity surface that must not be used as a query key on privileged controller paths. Additionally, service data may include pricing, duration, and configuration details that a VPORT operator may consider internal.

**Severity:** HIGH  
**Exploitability:** MEDIUM  
**Attack Preconditions:**
- Authenticated Citizen account required
- Target VPORT's `profileId` must be known (may be derivable from public API or profile reads)
- No actor_owners verification required on the service load path

**Blast Radius:** Multi-actor — any VPORT's service catalog can be enumerated  
**Identity Leak Type:** Actor correlation · Resource enumeration  
**Cache Trust Type:** None  
**RLS Dependency:** UNVERIFIED — unknown whether `services` table RLS restricts by actor ownership or is publicly readable  
**Why it matters:** The VCSM identity contract explicitly forbids using `profileId` as an authority surface on any controller path. Using it here creates a read bypass that is invisible to the actor-ownership system and inconsistent with every other ownership-gated path.  
**Recommended mitigation:** Replace `profileId` with `actorId` as the lookup key. Resolve `actorId` from the screen's identity context and pass it to a controller that fetches services via the actor-to-profile join. If services are genuinely public (already shown on public VPORT pages), document this explicitly and label the controller as `public`; otherwise add an ownership assertion before the DAL call.  
**Rationale:** Consistency with identity contract + eliminates profileId from controller surfaces  
**Follow-up command:** SENTRY (layer enforcement), CARNAGE (verify RLS on services table)

**CISSP Domain:**  
- Primary: Identity and Access Management  
- Secondary: Asset Security · Software Development Security

---

### VENOM SECURITY FINDING VB-05

**Finding ID:** VB-05  
**Location:** `features/dashboard/vport/dal/read/vportBookingHistory.read.dal.js`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Supabase Table/View  
**Trust Boundary:** Authenticated VPORT Owner  
**Boundary Violated:** Defense-in-depth — DAL has no ownership column; relies solely on controller gate  
**Contract Violated:** Booking Trust Contract

**Current behavior:** `listVportBookingHistoryDAL` queries the `bookings` table filtered only by `resource_id`. The Supabase client used is `vportSchema` (vport client). There is no ownership field (`owner_actor_id`, `profile_id`) in the query predicate. The only ownership enforcement is the controller's call to `assertActorOwnsVportActorController` before invoking the DAL.

**Risk:** Single layer of defense. If the controller gate is bypassed (internal call, test harness, future refactor that calls DAL directly), any `resourceId` value returns all booking rows for that resource — including customer names, notes, contact details, and booking status. There is no database-level enforcement stopping a direct DAL call from returning data belonging to another actor.

**Severity:** HIGH  
**Exploitability:** LOW (requires internal code bypass, not direct user exploit)  
**Attack Preconditions:**
- Requires ability to call internal application code or future developer to add a shortcut DAL call
- Not directly exploitable from the UI in current state

**Blast Radius:** Booking-wide — all booking records for a given resource  
**Identity Leak Type:** Booking identity exposure · Private contact exposure  
**Cache Trust Type:** Booking-sensitive  
**RLS Dependency:** UNVERIFIED — RLS on `bookings` table for the vport client was not inspected. If `bookings` has no RLS or uses service-role, the DAL is the only access control layer.  
**Why it matters:** Defense-in-depth requires that sensitive data tables (especially those holding customer contact details and booking notes) are protected at the database layer independently of the application layer. A single application-layer gate that is bypassed by any internal path exposes customer data.  
**Recommended mitigation:** Verify and document RLS policies on `bookings` for the vport client. Ideally, RLS should restrict reads to rows where the resource's `owner_actor_id` matches the authenticated session actor, or where the session actor is listed in `actor_owners` for the owning VPORT. Delegate RLS policy verification and any required migration to CARNAGE.  
**Rationale:** Customer booking data (names, notes, timing) warrants database-level protection independent of application-layer ownership checks.  
**Follow-up command:** DB (RLS inspection), CARNAGE (policy migration if needed)

**CISSP Domain:**  
- Primary: Security Architecture and Engineering  
- Secondary: Identity and Access Management · Asset Security

---

### VENOM SECURITY FINDING VB-06

**Finding ID:** VB-06  
**Location:** `features/dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx` line ~77  
**Application Scope:** VCSM  
**Platform Surface:** PWA  
**Trust Boundary:** Authenticated VPORT Owner  
**Boundary Violated:** None (restrictive, not escalation) — documented as a functional gap  
**Contract Violated:** None

**Current behavior:** `isOwner = String(viewerActorId) === String(targetActorId)` — self-ownership check only. This controls whether `useVportBookingHistory` is `enabled`. The actual security gate is in the controller via `assertActorOwnsVportActorController`, which checks `actor_owners` and covers team members.

**Risk:** This is a restrictive gap, not an escalation vector. Legitimate team members who own a VPORT via `actor_owners` (but are not the primary actor) will be blocked from loading booking history by the screen's `isOwner` check, even though the controller would pass their request. This means co-owners or team members cannot use the booking history screen — a product limitation, not a security vulnerability.

**Severity:** LOW  
**Exploitability:** LOW — not an attack surface; makes access more restrictive than intended  
**Attack Preconditions:** None (restrictive-only)  
**Blast Radius:** Single actor — affects co-owners only  
**Identity Leak Type:** None  
**Cache Trust Type:** None  
**RLS Dependency:** NONE  
**Why it matters:** Surfaces a latent product issue — when team member roles are activated and co-owners need booking access, this screen will silently refuse to load data for them.  
**Recommended mitigation:** Replace the string equality check with a hook or controller call that verifies ownership via `actor_owners`. This aligns the screen gate with the controller gate that already handles team ownership correctly.  
**Rationale:** Screen gate and controller gate should be consistent — both should use the same ownership model.  
**Follow-up command:** IRONMAN (product scope decision on team booking access)

**CISSP Domain:**  
- Primary: Identity and Access Management  
- Secondary: Security Architecture and Engineering

---

### VENOM SECURITY FINDING VB-07

**Finding ID:** VB-07  
**Location:** `features/dashboard/vport/controller/listVportServicesForProfile.controller.js`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Supabase Table/View  
**Trust Boundary:** Authenticated VPORT Owner  
**Boundary Violated:** Identity contract — controller with no ownership assertion on a data path that accepts an internal ID  
**Contract Violated:** Actor Ownership Contract

**Current behavior:** `listVportServicesForProfileController` is a zero-logic passthrough — it accepts `profileId` and calls `listVportServicesByProfileIdDAL` directly with no ownership check and no `actorId` involvement.

```js
export async function listVportServicesForProfileController({ profileId, includeDisabled = false } = {}) {
  return listVportServicesByProfileIdDAL({ profileId, includeDisabled });
}
```

**Risk:** The controller name implies it is an owner-facing operation (used within the VPORT dashboard booking flow). However, it enforces no ownership. Any authenticated caller with a known `profileId` can retrieve service listings for any VPORT, including services that are `disabled` if `includeDisabled` is passed as `true`.

**Severity:** HIGH  
**Exploitability:** MEDIUM — requires a known `profileId` (may be available from public profile APIs or intercepted network calls)  
**Attack Preconditions:**
- Authenticated Citizen account
- Target VPORT profileId known or derivable
- No actor_owners check required

**Blast Radius:** Multi-actor — applies to all VPORTs  
**Identity Leak Type:** Resource enumeration · Actor correlation  
**Cache Trust Type:** None  
**RLS Dependency:** UNVERIFIED — whether `services` table has RLS restricting reads by actor ownership is unknown  
**Why it matters:** `includeDisabled=true` can expose unpublished or draft services that the VPORT operator has not made public. Even if the `services` table is publicly readable, the `includeDisabled` path should require verified ownership before returning hidden entries.  
**Recommended mitigation:**
1. If services are public: split the controller into a `public` read (no ownership needed, `includeDisabled=false` always) and an owner read (requires ownership assertion, can use `includeDisabled`)
2. If services are not public: add `assertActorOwnsVportActorController` call before the DAL, resolving actorId from the profile for the ownership check
3. Replace `profileId` with `actorId` as the authority surface in all cases  
**Rationale:** Disabled/draft services are not public data. Owner-gated reads must verify ownership regardless of the table's base visibility.  
**Follow-up command:** SENTRY (layer enforcement), DB (RLS verification on services table)

**CISSP Domain:**  
- Primary: Identity and Access Management  
- Secondary: Asset Security · Software Development Security

---

### MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VB-04 — profileId in service load path | Identity surface violation + enumeration | Controller · Hook | HIGH | App | SENTRY |
| VB-05 — bookings DAL single-layer defense | No DB-level ownership enforcement | RLS | HIGH | DB | CARNAGE |
| VB-07 — listVportServicesForProfileController no ownership gate | Service enumeration including disabled entries | Controller | HIGH | App | SENTRY |
| VB-02 — RLS on bookings unverified | Unknown database defense depth | RLS | HIGH | DB | DB · CARNAGE |
| VB-06 — screen isOwner blocks co-owners | Team member functional gap | UI | LOW | App | IRONMAN |

---

### CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VB-05 (single-layer booking defense — systemic risk) |
| Asset Security | 3 | VB-04, VB-05, VB-07 (service data, booking data enumeration) |
| Security Architecture and Engineering | 2 | VB-05 (defense-in-depth gap), VB-06 (screen/controller gate mismatch) |
| Communication and Network Security | 0 | Out of scope for this pass — no public endpoints inspected |
| Identity and Access Management | 4 | VB-04, VB-05, VB-06, VB-07 (profileId misuse, ownership gate gaps) |
| Security Assessment and Testing | 1 | VB-05 (RLS unverified — assumed not tested) |
| Security Operations | 0 | No logging or debug leakage found in inspected files |
| Software Development Security | 3 | VB-04, VB-07 (profileId in controller path, no ownership logic in controller) |

**Uncovered domains:**
- Communication and Network Security: not applicable to this DAL/controller-layer pass
- Security Operations: no debug tooling or logging paths were in scope for this pass

---

### Overall VENOM Status

**PARTIAL PASS — 3 new HIGH findings, RISK-1 closed, RISK-7 partially closed pending RLS verification.**

| Area | Status |
|---|---|
| RISK-1 fix (adapter re-routing) | VERIFIED CLEAN |
| RISK-7 fix (controller ownership gate) | VERIFIED — RLS on `bookings` remains UNVERIFIED (VB-05) |
| RISK-8 (QuickBookingModal layer violations) | COMPONENT FIX CONFIRMED — new identity surface violation open (VB-04) |
| New: `listVportServicesForProfileController` no ownership | NEW HIGH FINDING (VB-07) |
| New: screen isOwner blocks co-owners | NEW LOW FINDING (VB-06) |

**Required next phase:** CARNAGE (RLS on bookings + services tables + profiles join compatibility)

---

## LOKI — booking-dal-risk4-dead-export-trace · Phase 2

**Date:** 2026-05-11  
**Reviewer:** LOKI  
**Trigger:** RISK-4 — `useBookingHistory` adapter export reported as likely dead by static grep; runtime/dynamic invocation unverified before safe removal. Phase 2 of phased booking DAL verification.  
**Application Scope:** VCSM  
**TypeScript output allowed:** NO  
**Findings:** 0 CRITICAL | 1 HIGH | 1 MEDIUM | 1 LOW

---

### LOKI TARGET

| Field | Value |
|---|---|
| Observed flow | `useBookingHistory` (feature hook) → `listBookingHistory.controller.js` (feature) → `listBookingsByResource.dal.js` (feature) |
| Application Scope | VCSM |
| Entry point | `features/booking/adapters/booking.adapter.js` line 7 — `export { default as useBookingHistory }` |
| Reason for observation | RISK-4: static grep showed zero external callers. VENOM required LOKI runtime/dynamic verification before the adapter export and underlying chain could be safely removed. |
| TypeScript output allowed | NO |

---

### TRACE IDENTITY

| Field | Value |
|---|---|
| Trace ID | LOKI-BOOKING-RISK4-001 |
| Route | `/actor/:actorId/dashboard/booking-history` (booking history screen) + any route consuming the booking adapter |
| Screen | `VportDashboardBookingHistoryScreen` |
| Session state class | Authenticated VPORT Owner |
| Timestamp | 2026-05-11 |
| Evidence Type | INFERRED from static import graph + dynamic import search |
| Observation Source | Full codebase grep across `apps/VCSM/src`, `engines/`, `zNOTFORPRODUCTION/` |
| Confidence | HIGH |

---

### DEAD CHAIN STATIC TRACE

The complete call chain for `useBookingHistory` (feature layer):

```
booking.adapter.js (line 7)
  → features/booking/hooks/useBookingHistory.js
      → listBookingHistory from "@booking"          ← ENGINE, not feature-level controller
          → engines/booking/src/controller/listBookingHistory.controller.js
              → dalListBookingsByResource (engine DAL)
```

**Critical observation:** `useBookingHistory.js` imports from `@booking` (the engine), NOT from the feature-level `listBookingHistory.controller.js`. The feature-level controller exists as a sibling file but is never imported by the hook.

```
features/booking/controller/listBookingHistory.controller.js  ← DEAD
  → features/booking/dal/listBookingsByResource.dal.js         ← DEAD (only called by dead controller)
```

---

### CONSUMER SCAN RESULTS

| Location | Imports `useBookingHistory` | Notes |
|---|---|---|
| `features/booking/adapters/booking.adapter.js` | YES — exports it | Barrel export only, no consumption |
| Any component, hook, screen, controller outside adapter | NO | Zero consumers found |
| Dev diagnostics (`src/dev/`) | NO | Not present in any diagnostic group |
| Engine files | NO | Engine has own `listBookingHistory`, not the feature hook |

**Result: `useBookingHistory` has zero external callers across the entire VCSM application.**

---

### DYNAMIC IMPORT SCAN

| Pattern | Found | Notes |
|---|---|---|
| `import(...)` with `useBookingHistory` | NO | No lazy/dynamic import exists |
| `require(...)` with `useBookingHistory` | NO | Not applicable (ESM codebase) |
| Computed property string access on adapter | NO | Adapter is a static barrel, no dynamic key access |
| Route-based lazy load that could trigger adapter | NO | `lazyApp.jsx` routes do not reference booking adapter directly |

**No dynamic invocation path exists.**

---

### LOKI RUNTIME FINDING LB-01

**Finding ID:** LB-01  
**Location:** `features/booking/adapters/booking.adapter.js` → `features/booking/hooks/useBookingHistory.js` → `features/booking/controller/listBookingHistory.controller.js` → `features/booking/dal/listBookingsByResource.dal.js`  
**Application Scope:** VCSM  
**Runtime Risk Category:** Dead code — unreachable export chain  
**Evidence Type:** INFERRED from complete static call graph  
**Observation Source:** Full codebase grep — zero consumers found across all of `apps/VCSM/src/`, `engines/`, and `zNOTFORPRODUCTION/`  
**Confidence:** HIGH

**Current runtime behavior:**  
- `useBookingHistory` is exported from `booking.adapter.js` but never imported by any external consumer
- The hook itself calls the ENGINE (`@booking`) for `listBookingHistory`, bypassing the feature-level controller entirely
- `features/booking/controller/listBookingHistory.controller.js` has zero import consumers
- `features/booking/dal/listBookingsByResource.dal.js` has zero consumers other than the dead feature controller
- The dashboard booking history screen uses `useVportBookingHistory` → `listVportBookingHistoryController` → `listVportBookingHistoryDAL` — a completely independent implementation that does not touch this chain at all

**Runtime impact:** None in production — no runtime path reaches this chain. The dead chain adds dead bundle weight.

**Read Amplification:** N/A — DAL never executes in production  
**Timing impact:** None — zero runtime execution  
**Caller chain:** `adapter export` → DEAD (no external import)  
**Cache status:** UNKNOWN — hook never fires, cache never populated  

**Severity:** HIGH (dead export carrying a dead DAL into production bundle; creates false trust that the adapter surface is active)  
**Recommended handoff:** SENTRY (remove from adapter exports, delete dead chain if confirmed superseded by dashboard implementation)  
**Rationale:** Static evidence is conclusive. Dynamic import scan confirms no runtime bypass. The feature-level `listBookingHistory.controller.js` + `listBookingsByResource.dal.js` + `useBookingHistory.js` are all dead. Safe to remove.

---

### LOKI RUNTIME FINDING LB-02

**Finding ID:** LB-02  
**Location:** `features/booking/controller/listBookingHistory.controller.js` vs `engines/booking/src/controller/listBookingHistory.controller.js`  
**Application Scope:** VCSM + ENGINE  
**Runtime Risk Category:** Duplicate implementation — phantom dead branch  
**Evidence Type:** INFERRED  
**Observation Source:** Static read of both files  
**Confidence:** HIGH

**Current runtime behavior:**  
- `useBookingHistory.js` imports `listBookingHistory` from `@booking` (the engine)  
- The identically-named feature-level `listBookingHistory.controller.js` exists but is never called  
- The two implementations have identical signatures and nearly identical logic but the feature version uses feature-level DAL; the engine version uses its own DAL  
- In practice, only the engine version executes at runtime

**Runtime impact:** The feature-level controller consumes bundle space but never executes. Its DAL (`listBookingsByResource.dal.js`) is also bundled but never reaches a DB connection.  

**Severity:** MEDIUM  
**Recommended handoff:** SENTRY (remove feature-level controller and DAL; confirm engine path is the canonical survivor)  
**Rationale:** Two controllers with identical signatures, one dead. The live one is the engine. RISK-4 is fully resolvable without any product risk.

---

### LOKI RUNTIME FINDING LB-03

**Finding ID:** LB-03  
**Location:** Booking mutation controllers — `cancelBooking.controller.js`, `confirmBooking.controller.js`, `createOwnerBooking.controller.js`  
**Application Scope:** VCSM  
**Runtime Risk Category:** Missing audit trail  
**Evidence Type:** INFERRED  
**Observation Source:** Static read of booking mutation call chains  
**Confidence:** MEDIUM

**Current runtime behavior:**  
Booking mutations (cancel, confirm, owner-create) execute without emitting any structured runtime event. The only record of a mutation is the DB row write. There is no:
- structured log entry at controller entry
- correlation ID threading through the booking mutation flow
- timing capture for mutation duration
- error event when assertion fails

**Runtime impact:** When a booking fails (ownership check rejects, DB error), the error is silently thrown and caught by the hook's catch block. There is no runtime evidence available for incident investigation beyond a DB query to reconstruct what happened.  

**Severity:** LOW  
**Recommended handoff:** VENOM (audit trail gap on booking mutations — security event visibility), KRAVEN (add timing instrumentation to booking mutation path)  
**Rationale:** Booking mutations are privileged operations. Silent failure with no runtime trace makes incident investigation dependent entirely on DB state reconstruction.

---

### OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Booking history read | FUNCTIONAL — new dashboard controller exists | No timing, no correlation ID | LOW |
| Booking mutation (cancel/confirm/create) | MINIMAL — errors silently caught | No structured event, no audit log | MEDIUM |
| Ownership assertion | MINIMAL — throws on failure, no log | No actor context in error event | MEDIUM |
| Dead code chain | N/A — chain is unreachable | N/A | N/A |

---

### OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Booking cancel/confirm/create | DB write only | Controller entry timing, actorId, result event | MEDIUM | Dev-only `console.debug` at controller entry/exit with actorId + timing |
| Ownership assertion failure | Thrown error only | actorId, targetActorId, failure reason | MEDIUM | Structured error log at assertion boundary |
| Booking history load | Hook error state | Timing, page size, record count returned | LOW | Dev-only timing wrapper on controller |

---

### AUDIT TRAIL WARNING

**Flow:** Booking mutation (cancel, confirm, owner-create)  
**Missing audit evidence:** No structured event records which actor performed the mutation, on which booking, at what time, from which call path. DB write provides the `updated_at` timestamp and `status` field, but not the caller actorId in all cases.  
**Operational risk:** If a booking status is changed fraudulently or in error, the only reconstruction path is DB history. No application-layer audit trail exists.  
**Recommended audit event:** At controller exit, emit a dev-guarded structured log: `{ event: 'booking.status_mutated', actorId, bookingId, from_status, to_status, controller, duration_ms }` — dev-only in current state; promote to operational log when audit trail is required.

---

### HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LB-01 — `useBookingHistory` confirmed dead | SENTRY | Remove from adapter, delete dead chain |
| LB-02 — feature-level controller dead (engine is live) | SENTRY | Delete `listBookingHistory.controller.js` + `listBookingsByResource.dal.js` from feature layer |
| LB-03 — no audit trail on booking mutations | VENOM | Security audit trail gap; KRAVEN for timing instrumentation |

---

### TIMING BUDGET STATUS

| Runtime Area | Observed | Budget | Status |
|---|---:|---:|---|
| Route/screen load | UNOBSERVED | 1500ms | N/A — not instrumented |
| Controller orchestration | UNOBSERVED | 300ms | N/A |
| DAL total | UNOBSERVED | 500ms | N/A |
| DB read max | UNOBSERVED | 150ms | N/A |
| Hydration/render | UNOBSERVED | 500ms | N/A |

*Timing cannot be captured without runtime instrumentation. No live session was available for this pass. All evidence is static-trace-based.*

---

### RISK-4 VERDICT

| Question | Answer |
|---|---|
| Is `useBookingHistory` used by any external consumer? | NO — zero callers confirmed |
| Could it be dynamically imported at runtime? | NO — no dynamic import patterns found |
| Does the hook call the feature-level controller? | NO — hook calls engine `@booking` directly |
| Is `listBookingHistory.controller.js` (feature) dead? | YES — zero callers |
| Is `listBookingsByResource.dal.js` (feature) dead? | YES — only consumer is the dead controller |
| Safe to remove from adapter exports? | YES |
| Safe to delete the feature-level controller + DAL? | YES — confirm engine path covers the use case first |

**RISK-4 STATUS: CONFIRMED DEAD. SAFE TO REMOVE. No runtime/dynamic exception exists.**

---

### OBSERVABILITY MATURITY

**Current maturity for booking feature:** MINIMAL  
- Booking mutations produce no structured runtime events  
- No correlation IDs thread through booking flows  
- Errors are silently caught at hook boundary with no operational logging  
- Dead code in adapter creates false signal about system surface area

---

### FINAL LOKI STATUS: WATCH

RISK-4 is resolved (dead chain confirmed). Observability gaps in booking mutations warrant watch status until audit trail instrumentation is added.

---

## CARNAGE — booking-dal-rls-schema-analysis · Phase 3

**Date:** 2026-05-11  
**Reviewer:** CARNAGE  
**Trigger:** VENOM (VB-05) flagged RLS on `bookings` as UNVERIFIED. VENOM (VB-04, VB-07) flagged `profiles` join compatibility and `services` RLS as UNVERIFIED. Phase 3 of phased booking DAL verification.  
**Application Scope:** VCSM  
**Findings:** 0 BLOCKED | 2 HIGH RISK | 1 CAUTION | 1 SAFE

---

### CARNAGE TARGET

| Field | Value |
|---|---|
| Objects | `vport.bookings` (RLS), `public.profiles` (join gap), `vport.services` (RLS), `vport.resources` (join verify) |
| Application Scope | VCSM |
| Type of change | RLS policy additions — read policy scoping for booking-sensitive tables |
| Reason | VENOM VB-05: unverified RLS on bookings. VENOM VB-04/VB-07: profiles join gap and services RLS. Codex Fix Pass: profiles join added in commit 8baf6d5 without RLS validation. |

---

### SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vport.bookings` | Booking-sensitive · Ownership-sensitive | Customer names, notes, timing, status — private booking data |
| `public.profiles` | Identity-sensitive · Ownership-sensitive | VPORT actor_id, name — customer-visible identity via booking join |
| `vport.services` | Ownership-sensitive | Service catalog including disabled/draft entries |
| `vport.resources` | Ownership-sensitive | Resource-to-owner mapping; joined from bookings |

---

### CURRENT STRUCTURE ANALYSIS

**Supabase client used by all affected DALs:** `vportSchema = supabase.schema('vport')` using `VITE_SUPABASE_ANON_KEY`. This is the anon key — all reads are subject to RLS policies for the `authenticated` role. RLS is enforced at the PostgreSQL level for this client.

**RLS state from migration files:** No policies found for `vport.bookings`, `vport.services`, or `vport.resources` in any file under `zNOTFORPRODUCTION/_ACTIVE/migrations/`. State is UNVERIFIED — must inspect DB directly.

**`public.profiles` known policies** (from `2026-05-10_step2_rls_policy_repairs.sql`):
- `profiles_select_via_actor` — owner self-read via actor_owners join
- `profiles_discoverable_read` — `publish = true AND discoverable = true`
- `profiles_self_read` — `id = auth.uid()`

**Gap:** `listBookingsByCustomerDAL` joins `profiles!profile_id(actor_id,name)` to retrieve VPORT identity. If VPORT's profile is not discoverable, the join returns `null` — producing `vportActorId: null`, `vportName: null` on the booking model. Customer sees their booking with no VPORT name.

---

### CM-01 — `public.profiles` Booking-Participant Read Policy

**Migration Safety Status:** CAUTION  
**Confidence:** HIGH  
**Blast Radius:** Single feature — `listBookingsByCustomerDAL` join only  
**RLS Dependency:** DIRECT  

**Problem:** Customer reading own bookings via `listBookingsByCustomerDAL` cannot see VPORT name/actorId if VPORT profile is not discoverable. The `profiles!profile_id` join is blocked by existing RLS.

**Proposed policy (text only — do not run):**

```sql
-- Allow booking customer to read the VPORT profile linked to their own booking.
-- Scoped strictly: only the profile whose booking references the authenticated actor.
DROP POLICY IF EXISTS profiles_booking_participant_read ON public.profiles;
CREATE POLICY profiles_booking_participant_read ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM vport.bookings b
      WHERE b.profile_id = profiles.id
        AND b.customer_actor_id = vc.current_actor_id()
    )
  );
```

**Rollback:** `DROP POLICY IF EXISTS profiles_booking_participant_read ON public.profiles;` — FULL rollback, no data loss.

**IDENTITY/OWNERSHIP WARNING:** This policy exposes `actor_id` and `name` from a VPORT profile to the booking customer. Both fields are appropriate for customer display (they already have a booked relationship). This does NOT expose phone, email, or private fields — only `actor_id,name` as specified in the DAL select.

**FINAL STATUS CM-01:** CAUTION — safe to migrate after staging test with non-discoverable VPORT. Confirm join returns non-null vportName before production apply.

---

### CM-02 — `vport.bookings` RLS Policy Verification and Hardening

**Migration Safety Status:** HIGH RISK  
**Confidence:** MEDIUM (RLS state unknown — DB inspection required)  
**Blocking Risks:** Cannot plan migration without knowing current RLS state.

**Required DB inspection (text only — do not run):**

```sql
-- Step 1: Check RLS enabled/disabled on bookings
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'vport' AND tablename = 'bookings';

-- Step 2: List existing policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'vport' AND tablename = 'bookings';
```

**Three possible states and required action:**

| Current State | Action Required | Risk |
|---|---|---|
| RLS DISABLED | Enable RLS + add customer/owner policies in one coordinated migration | HIGH — lockout risk if policies are incomplete |
| RLS ENABLED, USING(true) | Replace broad policy with scoped customer + owner policies | HIGH — breaking change, test all DAL paths |
| RLS ENABLED, scoped policies exist | Document existing policies in Logan; verify they cover all DAL patterns | LOW |

**Proposed target policy set (text only — conditional on inspection result):**

```sql
-- Customer read: authenticated actor reads own bookings
CREATE POLICY bookings_customer_read ON vport.bookings
  FOR SELECT TO authenticated
  USING (customer_actor_id = vc.current_actor_id());

-- Owner read: VPORT owner reads bookings for their resources
CREATE POLICY bookings_owner_read ON vport.bookings
  FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT a.profile_id FROM vc.actors a
      JOIN vc.actor_owners ao ON ao.actor_id = a.id
      WHERE ao.user_id = auth.uid() AND a.kind = 'vport'
    )
  );

-- Owner insert: booking creation scoped to VPORT owner
CREATE POLICY bookings_owner_insert ON vport.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT a.profile_id FROM vc.actors a
      JOIN vc.actor_owners ao ON ao.actor_id = a.id
      WHERE ao.user_id = auth.uid() AND a.kind = 'vport'
    )
  );

-- Owner update: status mutations by VPORT owner only
CREATE POLICY bookings_owner_update ON vport.bookings
  FOR UPDATE TO authenticated
  USING (
    profile_id IN (
      SELECT a.profile_id FROM vc.actors a
      JOIN vc.actor_owners ao ON ao.actor_id = a.id
      WHERE ao.user_id = auth.uid() AND a.kind = 'vport'
    )
  );
```

**ROLLBACK SURVIVABILITY:** PARTIAL — if tightening breaks a live path, rollback requires dropping the restrictive policy and restoring prior state. Operational complexity: MEDIUM.

**FINAL STATUS CM-02:** HIGH RISK — DO NOT MIGRATE without DB inspection. Delegate to DB for inspection, then CARNAGE second pass for final migration design.

---

### CM-03 — `vport.services` RLS Ownership-Scoped Read

**Migration Safety Status:** HIGH RISK  
**Confidence:** MEDIUM (RLS state unknown)  
**Blocking Risk:** Same as CM-02 — inspection first.

**Required DB inspection (text only):**
```sql
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables WHERE schemaname = 'vport' AND tablename = 'services';

SELECT policyname, cmd, qual FROM pg_policies
WHERE schemaname = 'vport' AND tablename = 'services';
```

**Proposed target policy set (text only — conditional):**
```sql
-- Public read: enabled services on discoverable VPORTs only
CREATE POLICY services_public_read ON vport.services
  FOR SELECT TO authenticated
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = services.profile_id
        AND p.publish = true AND coalesce(p.discoverable, false) = true
    )
  );

-- Owner read: VPORT owner reads all services including disabled
CREATE POLICY services_owner_read ON vport.services
  FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT a.profile_id FROM vc.actors a
      JOIN vc.actor_owners ao ON ao.actor_id = a.id
      WHERE ao.user_id = auth.uid() AND a.kind = 'vport'
    )
  );
```

**Key benefit:** `services_public_read` enforces `enabled = true` at DB level regardless of `includeDisabled` parameter — eliminates the VB-07 exposure path for disabled services.

**FINAL STATUS CM-03:** HIGH RISK — DB inspection required first.

---

### CM-04 — `vport.resources` Join Verification

**Migration Safety Status:** SAFE  
**Confidence:** MEDIUM  

The `resources!resource_id(owner_actor_id,member_actor_id,name)` join is operational data. No migration required unless DB inspection shows RLS blocking the join (which would cause null memberName silently).

**FINAL STATUS CM-04:** SAFE — verify join returns data in staging. No migration needed unless RLS is blocking.

---

### REQUIRED DB VERIFICATION QUERIES (consolidated)

```sql
-- Run all at once to get full RLS picture
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE (schemaname = 'vport' AND tablename IN ('bookings', 'services', 'resources'))
   OR (schemaname = 'public' AND tablename = 'profiles')
ORDER BY schemaname, tablename;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE (schemaname = 'vport' AND tablename IN ('bookings', 'services', 'resources'))
   OR (schemaname = 'public' AND tablename = 'profiles')
ORDER BY schemaname, tablename, policyname;
```

---

### BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vport.bookings` | VCSM | None — vport schema is VCSM-only | Clear |
| `public.profiles` | VCSM | Wentrex does not share public.profiles in this booking context | Clear |
| `vport.services` | VCSM | None | Clear |
| `vport.resources` | VCSM | None | Clear |

---

### RECOMMENDED HANDOFFS

| Action | Command | Reason |
|---|---|---|
| Run RLS inspection queries | DB | Determine current state of bookings, services, resources RLS before any migration |
| CM-01 apply after staging test | CARNAGE second pass | Safe to proceed independently; needs staging validation |
| CM-02 final migration design | CARNAGE second pass (after DB findings) | Cannot proceed without DB inspection result |
| CM-02 policy trust review | VENOM | Verify proposed bookings RLS policies enforce correct ownership model |
| Release gate | THOR | Block release if bookings RLS is confirmed disabled or USING(true) |
| Document RLS state in Logan | LOGAN | Add RLS policy status to booking DAL doc once DB inspection is complete |

---

### FINAL CARNAGE STATUS: HIGH RISK

DB inspection is required before CM-02 and CM-03 can be designed. CM-01 (profiles join policy) is safe to proceed. CM-04 requires staging verification only. The most urgent finding is the unknown RLS state on `vport.bookings` — if disabled, customer PII (names, notes, contact details) is readable by any authenticated user who can construct a valid query.

---

## SENTRY — booking-dal-architecture-compliance · Phase 4

**Date:** 2026-05-11  
**Reviewer:** SENTRY  
**Trigger:** RISK-8 (QuickBookingModal layer violations), RISK-3 (getActorById duplicate), adapter regression guard. Phase 4 of phased booking DAL verification.  
**Application Scope:** VCSM  
**Status:** CONTRACT VIOLATION

---

### SENTRY COMPLIANCE REPORT

**Application Scope:** VCSM  
**Review reason:** Post-Codex-Fix-Pass architecture alignment check — QuickBookingModal layer violations, adapter regression guard, dead export cleanup, RISK-3 duplicate DAL  
**Architecture contract:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`  
**Boundary contract:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

### BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|---|---|---|---|
| apps/VCSM | YES | NO (read-only) | YES — see SA-01 | `PortfolioTab.jsx` bypasses booking adapter |
| apps/wentrex | NO | NO | NO | Out of scope |
| apps/Traffic | NO | NO | NO | Out of scope |
| engines | YES (read only) | NO | NO | Engine booking DAL reviewed, no violations introduced |

---

### ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| QuickBookingModal component layer | ALIGNED | NONE | Component no longer directly imports DAL or controller — uses hook |
| useQuickBookingModal hook | MINOR DRIFT | MINOR DRIFT | Hook correctly delegates to controllers; service load controller is empty passthrough |
| listVportServicesForProfileController | MINOR DRIFT | MINOR DRIFT | Controller with zero business logic — pure DAL passthrough |
| loadDayScheduleController | ALIGNED | NONE | Intra-feature DAL call from controller is correct pattern |
| Adapter regression guard (dashboard) | ALIGNED | NONE | All 7 dashboard controllers use adapter path ✓ |
| Adapter regression guard (profiles) | CONTRACT VIOLATION | CONTRACT VIOLATION | PortfolioTab.jsx imports hook directly from feature internals |
| Dead export in booking adapter | MINOR DRIFT | MINOR DRIFT | useBookingHistory exported but has zero external consumers |
| RISK-3 getActorById duplicate | MODERATE DRIFT | MODERATE DRIFT | Identical DAL in feature and engine; feature version is redundant |

---

### ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| assertActorOwnsVportActor via adapter | ALIGNED | LOW | All dashboard callers route through adapter ✓ |
| createOwnerBookingController ownership | ALIGNED | LOW | Resolves actorId from resource, then asserts ownership ✓ |
| listVportServicesForProfileController | NO OWNERSHIP | MEDIUM | Zero ownership check — profileId accepted without verification |
| listVportBookingHistoryController | ALIGNED | LOW | assertActorOwnsVportActorController called before DAL ✓ |

---

### IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| `profileId` in `listVportServicesForProfileController` | VIOLATION | HIGH | profileId used as query authority — identity contract requires actorId |
| `callerActorId` from `useIdentity()` in hook | ALIGNED | LOW | Hook derives identity from useIdentity(), not from prop |
| `actorId`/`callerActorId` in booking history | ALIGNED | LOW | Correct actor-based identity throughout |

---

### ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| Feature-level `getActorById.dal.js` duplicate | MODERATE DRIFT | MODERATE | Identical read exists in engine — feature version is redundant |
| `useBookingHistory` calls `@booking` engine | ALIGNED | NONE | Hook correctly delegates to engine; feature-level controller is dead |
| No app-specific logic leaks into engine | ALIGNED | NONE | Verified — engine files read-only in this pass |

---

### SENTRY FINDING SA-01

**Finding ID:** SA-01  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/PortfolioTab.jsx` line 5  
**Drift Level:** CONTRACT VIOLATION  
**Severity:** HIGH  
**Contract Violated:** Architecture Contract — Cross-feature access must go through adapters only

**Current behavior:**
```js
import useBookingServiceProfiles from "@/features/booking/hooks/useBookingServiceProfiles";
```
`PortfolioTab.jsx` is in `features/profiles/`. It imports `useBookingServiceProfiles` directly from `features/booking/hooks/` — bypassing the adapter boundary. The hook IS exported from `booking.adapter.js` (line 6), but the consumer does not use it.

**Expected behavior:**
```js
import { useBookingServiceProfiles } from "@/features/booking/adapters/booking.adapter";
```

**Risk:** Direct cross-feature import creates a hidden dependency that bypasses adapter change control. If `useBookingServiceProfiles` is moved, renamed, or modified in the feature's hooks directory, `PortfolioTab.jsx` would break with no adapter-level warning. The adapter is the intended seam — bypassing it erodes the boundary discipline that protects both features from each other's internals.

**Recommended correction:** Change the import path in `PortfolioTab.jsx` to consume from the adapter. This is a one-line fix with zero behavior change.

**Architectural rationale:** The contract states: "One feature must never import directly from another feature's internals. All cross-feature access must go through adapters only." The booking adapter already exports this hook for exactly this purpose.

---

### SENTRY FINDING SA-02

**Finding ID:** SA-02  
**Location:** `apps/VCSM/src/features/dashboard/vport/controller/listVportServicesForProfileController.js`  
**Drift Level:** MINOR DRIFT  
**Severity:** MEDIUM  
**Contract Violated:** Architecture Contract — Controller layer must contain business rules, ownership, permissions

**Current behavior:**
```js
export async function listVportServicesForProfileController({ profileId, includeDisabled = false } = {}) {
  return listVportServicesByProfileIdDAL({ profileId, includeDisabled });
}
```
Controller contains zero business logic. It is a pure passthrough to the DAL — no validation, no ownership check, no actor context.

**Expected behavior:** A controller must add at least one of: ownership verification, input validation, or actor context enforcement before delegating to the DAL. A zero-logic passthrough is indistinguishable from calling the DAL directly, which defeats the controller layer's purpose.

**Risk:** Any caller of this controller can enumerate any VPORT's services (including disabled ones if `includeDisabled=true`) with only a `profileId`. VENOM (VB-07) flagged the security consequence; this is the architectural cause.

**Recommended correction:** Determine the intended access model:
- If services are public for enabled entries: enforce `includeDisabled=false` in the controller for all external callers; add ownership check before allowing `includeDisabled=true`
- If services require ownership: add `assertActorOwnsVportActorController` call before the DAL, converting `profileId` to `actorId` via actor lookup first

**Architectural rationale:** Controllers are the authorization layer. A controller that adds no authorization is architectural debt that will eventually become a security gap when the DAL is called from a broader context.

---

### SENTRY FINDING SA-03

**Finding ID:** SA-03  
**Location:** `apps/VCSM/src/features/booking/adapters/booking.adapter.js` line 7  
**Drift Level:** MINOR DRIFT  
**Severity:** LOW  
**Contract Violated:** None (advisory)

**Current behavior:** `useBookingHistory` is exported from the booking adapter but has zero external consumers (LOKI LB-01 confirmed — no importer exists outside the adapter and hook files).

**Expected behavior:** Adapter exports represent the approved public contract of the feature. Dead exports create false surface area — consumers reading the adapter believe `useBookingHistory` is an active, supported hook. Future developers may build against it not knowing it is dead.

**Recommended correction:**
1. Remove `useBookingHistory` from `booking.adapter.js`
2. Remove `features/booking/hooks/useBookingHistory.js` (no callers; the hook calls engine directly)
3. Remove `features/booking/controller/listBookingHistory.controller.js` (LOKI LB-02: zero callers, engine is the live implementation)
4. Remove `features/booking/dal/listBookingsByResource.dal.js` (LOKI LB-02: only consumer is the dead controller)

**Coordinate with IRONMAN** before deletion — confirm the dead chain is superseded by the dashboard `useVportBookingHistory` path and is not in the product roadmap for a different screen.

**Architectural rationale:** Adapter public surface should match actual usage. Dead exports accumulate and create cognitive overhead for future developers navigating the booking feature.

---

### SENTRY FINDING SA-04

**Finding ID:** SA-04  
**Location:** `apps/VCSM/src/features/booking/dal/getActorById.dal.js`  
**Drift Level:** MODERATE DRIFT  
**Severity:** MEDIUM  
**Contract Violated:** None — redundancy issue, not a contract violation

**Current behavior:**
- Feature-level DAL: selects `id, kind, profile_id, vport_id, is_void` from `vc.actors` via `supabase.schema("vc")`
- Engine DAL (`dalGetActorById`): selects `id, kind, profile_id, vport_id, is_void` from `vc.actors` via `getSupabaseClient().schema('vc')`
- Column sets are **identical**
- Two callers: `assertActorOwnsVportActor.controller.js` and `createBooking.controller.js`

**Expected behavior:** One canonical actor read DAL. Either the feature-level controllers call the engine's `dalGetActorById`, or the engine exports a suitable function that the feature can call. The feature-level `getActorById.dal.js` is a redundant copy with no additional value.

**Risk:** Two implementations that must be kept in sync. If the engine adds a column (e.g., `is_active`, `suspended_at`), the feature-level DAL may not pick it up — causing divergent behavior in the ownership assertion path vs the engine path.

**Column parity check:** VERIFIED IDENTICAL — `id, kind, profile_id, vport_id, is_void`. Safe to remove feature-level version.

**Recommended correction:**
1. Confirm with IRONMAN that RISK-2 migration plan includes engine export for actor resolution
2. Once RISK-2 is resolved (engine version exported and used for ownership assertion), remove `features/booking/dal/getActorById.dal.js`
3. Update `assertActorOwnsVportActor.controller.js` and `createBooking.controller.js` to use engine-provided actor lookup

**Architectural rationale:** Duplicate DALs for the same table/column set violate the single-source-of-truth principle. The engine is the canonical source for booking-domain actor reads.

---

### SENTRY FINDING SA-05 — RISK-8 CLEARED

**Finding ID:** SA-05  
**Location:** `apps/VCSM/src/features/dashboard/vport/components/bookingHistory/QuickBookingModal.jsx`  
**Drift Level:** NONE  
**Severity:** N/A — RESOLVED

**Status:** The component-layer violations documented in RISK-8 are CONFIRMED RESOLVED. `QuickBookingModal.jsx` now delegates entirely through `useQuickBookingModal` hook. The component contains no direct DAL or controller imports.

**Remaining architectural concern (see SA-02):** `useQuickBookingModal` calls `listVportServicesForProfileController`, which is a zero-logic controller passthrough. The modal's architecture is now correct at the component and hook layers — the gap is in the controller.

---

### FINAL SENTRY STATUS: CONTRACT VIOLATION

One active contract violation: **SA-01** (`PortfolioTab.jsx` direct cross-feature hook import). This is a one-line fix.

Three advisory findings: **SA-02** (empty controller), **SA-03** (dead adapter export), **SA-04** (duplicate DAL).

### FOLLOW-UP REQUIRED: REQUIRED BEFORE RELEASE

| Finding | Action | Urgency |
|---|---|---|
| SA-01 — PortfolioTab direct import | Fix import to use adapter path | REQUIRED (one-line fix) |
| SA-02 — empty controller | Add ownership check or document public intent | REQUIRED before IRONMAN roadmap review |
| SA-03 — dead adapter export | Remove after IRONMAN confirms dead chain | AFTER IRONMAN phase |
| SA-04 — duplicate DAL | Remove after IRONMAN resolves RISK-2 | AFTER IRONMAN phase |

---

## IRONMAN — booking-feature-ownership-and-migration-plan · Phase 5

**Date:** 2026-05-11  
**Reviewer:** IRONMAN  
**Trigger:** RISK-2 (assertActorOwnsVportActor duplicate — engine vs feature), RISK-5 (12 diagnostics-only DALs — roadmap decision), RISK-6 (mixed hook migration state — migration plan). Phase 5 of phased booking DAL verification.  
**Application Scope:** VCSM + ENGINE

---

### IRONMAN TARGET

| Field | Value |
|---|---|
| Feature / Engine | `features/booking/` (VCSM) · `engines/booking/` (ENGINE) |
| Application Scope | VCSM + ENGINE |
| Reason | Ownership ambiguity between the feature-level booking layer and the canonical engine. RISK-2, RISK-5, RISK-6 all require an ownership decision before code can be safely deleted or migrated. |

---

### RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Booking create/cancel/confirm | ENGINE | HIGH | Engine exports all three; feature controllers are redundant wrappers |
| Customer booking list | FEATURE (feature-level) | HIGH | Engine has NO `listMyBookings` equivalent — `listBookingsByCustomer` is feature-only |
| VPORT service read for booking | FEATURE (feature-level) | HIGH | Engine has no `bookingServices.controller.js` equivalent in public API |
| Actor ownership assertion | CONFLICTED | HIGH | Both feature and engine own this — see RISK-2 below |
| Availability management | ENGINE | HIGH | Engine has `setAvailabilityRule`, `setAvailabilityException`, `getResourceAvailability` |
| Owner resource management | ENGINE | HIGH | Engine has `listOwnerBookingResources`, `ensureOwnerBookingResource` |
| QR links | ENGINE | HIGH | Engine has full QR controller set |
| Organization/location management | ENGINE | HIGH | Engine owns org + location lifecycle |
| Booking history (resource-owner view) | SPLIT | HIGH | Engine has `listBookingHistory`; dashboard has its own `listVportBookingHistoryDAL` |
| Booking history (customer view) | FEATURE | HIGH | Only `listBookingsByCustomer.dal.js` (feature) covers this |
| Service profiles | ENGINE | HIGH | Engine has `getBookingServiceProfiles` |

---

### IRONMAN OWNERSHIP FINDING IB-01 — RISK-2: assertActorOwnsVportActor Ownership Resolution

**Finding ID:** IB-01  
**Feature / Engine:** `features/booking/controller/assertActorOwnsVportActor.controller.js` vs `engines/booking/src/controller/assertActorOwnsVportActor.controller.js`  
**Application Scope:** VCSM + ENGINE  
**Responsibility Type:** Controller ownership · Security ownership  
**Ownership Clarity:** CONFLICTED  
**Boundary Risk:** CRITICAL  
**Severity:** HIGH

**Current ambiguity:**
Two implementations of `assertActorOwnsVportActor` exist:
1. `features/booking/controller/assertActorOwnsVportActor.controller.js` — ACTIVE (used by internal booking controllers + exposed via feature adapter)
2. `engines/booking/src/controller/assertActorOwnsVportActor.controller.js` — EXISTS and IS exported from `engines/booking/src/adapters/index.js` as `assertActorOwnsVportActor`

The engine version IS already exported. The prior Avengers Assembly report stated it was not — this was incorrect at the time of writing or has since changed. The engine public API currently exposes `assertActorOwnsVportActor` via `@booking`.

**Ownership decision:**

The engine owns the canonical ownership assertion. The feature-level copy is a legacy holdover from before the engine was built. The migration path is clear and safe:

**Migration plan (text only — requires code change approval):**

Phase 1 — Update `booking.adapter.js`:
```js
// Replace:
export { default as assertActorOwnsVportActorController } from "@/features/booking/controller/assertActorOwnsVportActor.controller";
// With:
export { assertActorOwnsVportActor as assertActorOwnsVportActorController } from "@booking";
```
This maintains the adapter's public export name — no callers change.

Phase 2 — Update internal feature booking controllers that import directly:
Seven internal controllers (`cancelBooking`, `confirmBooking`, `createBooking`, `ensureOwnerBookingResource`, `setAvailabilityException`, `setAvailabilityRule`, `setResourceSlotDuration`) currently import from the feature controller file. These should import from `@booking` instead:
```js
// Replace:
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
// With:
import { assertActorOwnsVportActor as assertActorOwnsVportActorController } from "@booking";
```

Phase 3 — Delete:
- `features/booking/controller/assertActorOwnsVportActor.controller.js`
- `features/booking/dal/getActorById.dal.js` (SA-04 from SENTRY — identical to engine version)
- `features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` (only used by the feature controller being deleted)

**Contracts touched:** Actor Ownership Contract · Engine Isolation Contract  
**Recommended handoff:** WOLVERINE (implementation), SENTRY (post-migration compliance check)

---

### IRONMAN OWNERSHIP FINDING IB-02 — RISK-5: 12 Diagnostics-Only DALs — Roadmap Decision

**Finding ID:** IB-02  
**Feature / Engine:** `features/booking/dal/` (12 diagnostics-only paths)  
**Application Scope:** VCSM + ENGINE  
**Responsibility Type:** DAL ownership · Data ownership  
**Ownership Clarity:** AMBIGUOUS  
**Boundary Risk:** MEDIUM  
**Severity:** MEDIUM

**Current ambiguity:** 12 feature-level DALs are exercised only by dev diagnostics groups. Their intended owners are unresolved — they may be pre-built for future owner dashboard screens, or they may be superseded by the engine.

**Engine coverage mapping:**

| Feature DAL | Engine Equivalent | Coverage |
|---|---|---|
| `insertBooking.dal.js` | Engine: `createBooking` controller | COVERED — engine handles full booking creation with validation |
| `insertBookingResource.dal.js` | Engine: `ensureOwnerBookingResource` | COVERED — engine manages resource lifecycle |
| `listAvailabilityExceptionsInRange.dal.js` | Engine: `getResourceAvailability` | COVERED — availability resolution includes exceptions |
| `listAvailabilityRulesByResourceId.dal.js` | Engine: `getResourceAvailability` | COVERED — rules included in availability response |
| `listBookingResourceServicesByResourceId.dal.js` | Engine: `listResourceServiceOverrides` | COVERED — engine has resource service override management |
| `listBookingResourcesByOwnerActorId.dal.js` | Engine: `listOwnerBookingResources` | COVERED — engine has owner resource listing |
| `listBookingsInRange.dal.js` | Engine: `getResourceAvailability` (range-based) | PARTIALLY COVERED — engine covers availability; raw booking list by range may need direct DAL |
| `listBookingsByResource.dal.js` | Engine: `listBookingHistory` | COVERED — engine exports resource-based booking history |
| `saveBookingServiceProfileDurationsByServiceIds.dal.js` | Engine: `getBookingServiceProfiles` | PARTIALLY COVERED — engine reads profiles; save/upsert path not in engine |
| `upsertAvailabilityException.dal.js` | Engine: `setAvailabilityException` | COVERED |
| `upsertAvailabilityRule.dal.js` | Engine: `setAvailabilityRule` | COVERED |
| `upsertBookingResourceServices.dal.js` | Engine: `upsertResourceServiceOverride` | COVERED |

**Ownership decision:**

10 of 12 DALs are fully or substantially covered by the engine. Two have partial gaps:
- `listBookingsInRange.dal.js` — engine covers availability windows but does not expose raw booking list by time range. May still be needed for owner schedule view.
- `saveBookingServiceProfileDurationsByServiceIds.dal.js` — engine reads service profiles but does not expose the write/upsert path for duration overrides.

**Recommended action per group:**

| Group | Action | Owner |
|---|---|---|
| Fully engine-covered (10 DALs) | Remove from feature layer once engine migration is confirmed complete for those controller paths | ENGINE |
| Partially covered — `listBookingsInRange.dal.js` | Keep in feature layer; document as owner schedule view pre-build | FEATURE (intentional) |
| Partially covered — `saveBookingServiceProfileDurationsByServiceIds.dal.js` | Evaluate whether engine needs write path for service duration; if not, keep in feature layer for future owner dashboard | FEATURE (intentional) |

**No screens should be built using these feature-level DALs for paths already covered by the engine.** New owner dashboard screens must use the engine's public interface, not the feature DAL.

**Contracts touched:** Architecture Contract · Engine Isolation Contract

---

### IRONMAN OWNERSHIP FINDING IB-03 — RISK-6: Hook Migration State — Formal Boundary Decision

**Finding ID:** IB-03  
**Feature / Engine:** `features/booking/hooks/` (16 hooks)  
**Application Scope:** VCSM + ENGINE  
**Responsibility Type:** Runtime ownership · Feature ownership  
**Ownership Clarity:** PARTIAL  
**Boundary Risk:** MEDIUM  
**Severity:** LOW (functional — no security impact)

**Complete hook migration state map:**

| Hook | Engine Path | Feature Path | Migration Status | Action |
|---|---|---|---|---|
| `useAddStaffResource.js` | `createLocationResource` from `@booking` | — | MIGRATED | Keep as-is |
| `useBookingAvailability.js` | `getResourceAvailability` from `@booking` | — | MIGRATED | Keep as-is |
| `useBookingContextResolver.js` | `resolveBookingContext` from `@booking` | — | MIGRATED | Keep as-is |
| `useBookingHistory.js` | `listBookingHistory` from `@booking` | — | MIGRATED + DEAD EXPORT | Remove (LOKI LB-01) |
| `useBookingServiceProfiles.js` | `getBookingServiceProfiles` from `@booking` | — | MIGRATED | Keep as-is |
| `useCreateBooking.js` | `createBooking` from `@booking` | — | MIGRATED | Keep as-is |
| `useEnsureOwnerBookingResource.js` | `ensureOwnerBookingResource` from `@booking` | — | MIGRATED | Keep as-is |
| `useLocationResources.js` | `listBookingResourcesByLocation` from `@booking` | — | MIGRATED | Keep as-is |
| `useManageAvailability.js` | Multiple from `@booking` | — | MIGRATED | Keep as-is |
| `useOrganizationLocations.js` | `listLocationsByOrganization` from `@booking` | — | MIGRATED | Keep as-is |
| `useOrganizationWorkspace.js` | Multiple from `@booking` | — | MIGRATED | Keep as-is |
| `useOwnerBookingResources.js` | `listOwnerBookingResources` from `@booking` | — | MIGRATED | Keep as-is |
| `useQrLinks.js` | `listQrLinks`, `createQrLink` from `@booking` | — | MIGRATED | Keep as-is |
| `useResourceServiceOverrides.js` | `listResourceServiceOverrides`, `upsertResourceServiceOverride` from `@booking` | — | MIGRATED | Keep as-is |
| `useBookingOps.js` | Engine has `cancelBooking` | Feature has `listMyBookingsController` | PARTIAL | Partial migration possible |
| `useBookingServices.js` | No engine equivalent | Feature `bookingServices.controller.js` | INTENTIONAL FEATURE-LEVEL | Document as feature-owned |

**Two hooks that legitimately remain at the feature level:**

**`useBookingOps.js`** — calls `listMyBookingsController` (customer booking list) and `cancelBookingController` (status update). The engine has `cancelBooking` but the customer booking list (`listBookingsByCustomer`) has no engine export. Migration is partially blocked:
- `cancelBooking` side: can migrate to engine (`{ cancelBooking } from "@booking"`)
- `listMyBookings` side: no engine equivalent exists — must remain feature-level until engine adds customer booking list

**`useBookingServices.js`** — calls `bookingServices.controller.js` which reads VPORT services by actor and service booking profiles. The engine has `dalReadVportServicesByActor` internally but does not export it as a controller. This is an intentional feature-level concern — VPORT service display is a VCSM-specific UI concern.

**Recommended ownership boundary:**

| Hook Group | Intended Owner | Migration Blocked By |
|---|---|---|
| 13 migrated hooks (engine) | ENGINE | N/A — already migrated |
| `useBookingHistory` (dead) | REMOVE | LOKI confirmed dead; remove from adapter |
| `useBookingOps` (partial) | SPLIT: engine for cancel, feature for customer list | Engine missing `listMyBookings` |
| `useBookingServices` | FEATURE (intentional) | Engine does not own VPORT service display |

**No further hooks need migration action.** The mixed state is not architectural drift — it reflects a genuine gap in engine coverage for customer-facing booking operations.

---

### DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `vport.bookings` | FEATURE (dashboard) + ENGINE | Customer list (feature), owner history (dashboard), availability (engine) | Dashboard create, feature cancel/confirm | UNKNOWN — DB inspection required | CARNAGE | LOGAN |
| `vport.resources` | ENGINE | Dashboard, engine booking, QR | Engine (`ensureOwnerBookingResource`) | UNKNOWN | CARNAGE | LOGAN |
| `vport.services` | FEATURE (dashboard) | `useBookingServices`, `listVportServicesForProfile` | Dashboard | UNKNOWN | CARNAGE | LOGAN |
| `vport.availability_rules` | ENGINE | Engine `getResourceAvailability` | Engine `setAvailabilityRule` | UNKNOWN | CARNAGE | LOGAN |
| `vport.availability_exceptions` | ENGINE | Engine `getResourceAvailability` | Engine `setAvailabilityException` | UNKNOWN | CARNAGE | LOGAN |
| `vport.service_booking_profiles` | FEATURE (booking) | `listBookingServiceProfilesByServiceIds` | Feature `saveBookingServiceProfileDurations` | UNKNOWN | CARNAGE | LOGAN |
| `vport.resource_services` | ENGINE | Feature DAL (diagnostics), engine override | Engine `upsertResourceServiceOverride` | UNKNOWN | CARNAGE | LOGAN |
| `vc.actors` | ENGINE | Booking assertion, feature DAL (duplicate) | N/A (read-only in booking context) | vc schema RLS | N/A | LOGAN |
| `vc.actor_owners` | ENGINE | `assertActorOwnsVportActor` | N/A (read-only in booking context) | vc schema RLS | N/A | LOGAN |
| `public.profiles` | VCSM (profile feature) | Booking customer join (`profiles!profile_id`) | Profile feature | RLS known — policies in step2 migration | CARNAGE (CM-01) | LOGAN |

---

### RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Actor owns VPORT actor (ownership assertion) | ENGINE (canonical) + FEATURE (legacy duplicate) | Controller — both feature and engine | None — undocumented | CRITICAL — RISK-2, must resolve to single owner |
| Customer can view own bookings | FEATURE (controller) | Controller (`listMyBookings`) + DAL filter | None | MEDIUM |
| VPORT owner can view resource bookings | FEATURE (dashboard controller) | Controller (`listVportBookingHistory`) | None | MEDIUM |
| VPORT owner can create owner booking | FEATURE (dashboard controller) | `createOwnerBookingController` via adapter | None | LOW |
| Availability rules and exceptions scoped to resource owner | ENGINE | Engine controller | None | LOW |
| Service enabled=true enforced for public callers | UNOWNED | DAL parameter (`includeDisabled`) only | None | HIGH — SA-02, VENOM VB-07 |

---

### OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `assertActorOwnsVportActor` — two owners | CRITICAL | Both feature and engine enforce ownership; drift between implementations possible | Resolve to engine ownership (IB-01 migration plan) |
| Customer booking list — feature-only, no engine equivalent | MEDIUM | If engine is the target owner of all booking operations, this gap will block future migrations | Add customer booking list to engine public API OR document as intentional feature responsibility |
| `services` table — no RLS owner documented | HIGH | CARNAGE CM-03 flagged unknown RLS state; no clear policy owner | DB inspection + CARNAGE assign RLS ownership |
| Dead adapter exports — `useBookingHistory` | LOW | Creates false public surface | Remove after this phase |
| `PortfolioTab.jsx` direct import — SA-01 | HIGH | Active contract violation — profiles bypasses booking adapter | One-line fix required before release |

---

### CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| Booking assertion controller | FEATURE (booking) | `apps/VCSM` | CONFLICTED — engine also owns same function | Resolve to ENGINE (IB-01) |
| Engine actor read DAL | ENGINE | `engines/booking` | CLEAR | Feature duplicate should be removed (SA-04) |
| Dashboard booking history DAL | FEATURE (dashboard) | `apps/VCSM` | CLEAR — dashboard-owned DAL is intentional | No cross-root issue; separate from engine booking history |
| `useBookingServices` — feature-level | FEATURE | `apps/VCSM` | INTENTIONAL — no engine equivalent | Document as intentional feature ownership |

---

### ENGINE OWNERSHIP REVIEW

| Engine | Owner | Consumers | Public Interfaces | Boundary Risk |
|---|---|---|---|---|
| `engines/booking` | ENGINE | `apps/VCSM` (14 of 16 hooks), all dashboard controllers via adapter | `assertActorOwnsVportActor`, create/cancel/confirm booking, availability, QR, org/location/resource management | LOW — engine boundary is clean; feature layer is the migration target |

---

### MIGRATION EXECUTION ORDER (IRONMAN RECOMMENDED)

The following is the recommended cleanup/migration sequence. Each step is a discrete, approval-gated task.

| Step | Action | Scope | Blocks |
|---|---|---|---|
| 1 | Fix `PortfolioTab.jsx` import (SA-01 one-line fix) | VCSM | Release gate |
| 2 | Run DB inspection queries (CARNAGE CM-02/CM-03) | DB | CARNAGE migration design |
| 3 | Apply `profiles_booking_participant_read` policy (CARNAGE CM-01) | DB | Customer booking list fix |
| 4 | Migrate `booking.adapter.js` to export engine `assertActorOwnsVportActor` (IB-01 phase 1) | VCSM | RISK-2 |
| 5 | Update 7 internal booking controllers to import from `@booking` (IB-01 phase 2) | VCSM | RISK-2 |
| 6 | Delete feature-level `assertActorOwnsVportActor.controller.js` + `getActorById.dal.js` + `readActorOwnerLinkByActorAndUserProfile.dal.js` (IB-01 phase 3) | VCSM | RISK-2, RISK-3 |
| 7 | Remove `useBookingHistory` from adapter + delete dead chain (LOKI LB-01, SA-03) | VCSM | RISK-4 |
| 8 | Migrate `cancelBooking` in `useBookingOps` to engine (`cancelBooking` from `@booking`) | VCSM | RISK-6 partial |
| 9 | Apply CM-02 `bookings` RLS policies (after DB inspection confirms need) | DB | CARNAGE CM-02 |
| 10 | Apply CM-03 `services` RLS policies + add ownership gate to `listVportServicesForProfileController` (SA-02) | VCSM + DB | VENOM VB-07 |
| 11 | Remove 10 engine-covered diagnostics-only feature DALs (after engine path confirmed for each) | VCSM | RISK-5 |
| 12 | Document `listBookingsByResource.dal.js` (keep — schedule view) + `saveBookingServiceProfileDurationsByServiceIds.dal.js` (keep — write path gap) | LOGAN | RISK-5 |

---

### RECOMMENDED HANDOFFS

| Handoff | Command | Reason |
|---|---|---|
| Steps 1, 4–8, 10 (code changes) | WOLVERINE | Requires implementation approval |
| Steps 2, 3, 9, 11 (DB work) | DB + CARNAGE | Requires DB inspection and migration execution |
| Step 11–12 documentation | LOGAN | Ownership doc update after migration |
| Post-migration compliance check | SENTRY | Verify boundary alignment after IB-01 migration |

---

### FINAL IRONMAN STATUS

**Ownership Clarity:** PARTIAL → clearer after IB-01 migration  
**Boundary Risk:** CRITICAL on RISK-2 (assertActorOwnsVportActor), HIGH on `services` RLS, HIGH on SA-01  

The booking feature is 87% engine-migrated (14/16 hooks use engine). Two hooks legitimately remain at the feature level due to engine API gaps. The most urgent work is:
1. SA-01 — one-line import fix (release-blocking)
2. IB-01 — merge `assertActorOwnsVportActor` to engine ownership (RISK-2 resolution)
3. DB inspection (CARNAGE CM-02/CM-03 gate)

---

---

## LOGAN Resolution Pass — 2026-05-18

_Triggered by:_ AvengersAssemble 2026-05-18 (dashboard DAL governance closure)  
_Prior assembly:_ `avengers-assembly-2026-05-14.md` flagged RC-01, RC-03, and V-BOOK-01 as CRITICAL blockers  
_Branch:_ `vport-booking-feed-security-updates`

---

### RC-01 RESOLVED — `manageVportAvailabilityRule.controller.js` deleted

**Prior status (2026-05-14):** CRITICAL — availability rule write path had no ownership assertion; `upsertVportAvailabilityRuleDAL` called without `callerActorId` guard.

**Resolution:** The controller `apps/VCSM/src/features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js` has been **deleted**. The availability rule write path is now exclusively owned by `engines/booking` via:
- `useManageAvailability` hook → `setAvailabilityRule` engine controller
- Engine enforces ownership internally via `assertActorOwnsVportActor`

**Updated Data Ownership Registry entry for `vport.availability_rules`:**

| Object | Write Owner | RLS Owner | Status |
|---|---|---|---|
| `vport.availability_rules` | ENGINE (`setAvailabilityRule`) — no feature-level write path remains | CARNAGE (migration pending) | RC-01 RESOLVED |

**Updated Rule Ownership Registry entry:**

| Rule | Owner | Enforcement Layer | Status |
|---|---|---|---|
| Availability rules scoped to resource owner | ENGINE | Engine controller (`assertActorOwnsVportActor` gate) | RESOLVED |

---

### RC-03 RESOLVED — Engine `listBookingHistory` ownership gate confirmed

**Prior status (2026-05-14):** CRITICAL — `engines/booking/src/controller/listBookingHistory.controller.js` had no ownership assertion; any authenticated caller with `resourceId` could retrieve booking history.

**Resolution:** `assertActorOwnsVportActor` is now confirmed in the engine controller. Verified code as of 2026-05-18 branch:

```js
export async function listBookingHistory({ callerActorId, ownerActorId, resourceId, ... } = {}) {
  if (!callerActorId) throw new Error('[BookingEngine] callerActorId is required')
  if (!ownerActorId)  throw new Error('[BookingEngine] ownerActorId is required')
  if (!resourceId)    throw new Error('[BookingEngine] resourceId is required')
  await assertActorOwnsVportActor({ requestActorId: callerActorId, targetActorId: ownerActorId })
  // ... DB call
}
```

**Updated Rule Ownership Registry entry:**

| Rule | Owner | Enforcement Layer | Status |
|---|---|---|---|
| VPORT owner can view resource bookings | ENGINE (canonical) | Engine controller — `assertActorOwnsVportActor` | RESOLVED |

**CARNAGE impact:** The engine path compatibility risk on the `vport.bookings` SELECT RLS policy (silent 0-row failure) is cleared. Phase 4 migration is now unblocked at the app-layer level.

---

### V-AVAIL-04 RESOLVED (by deletion)

**Prior status:** OPEN MEDIUM — `manageVportAvailabilityRuleController` catch block swallowed 42501 (RLS rejection) silently.

**Resolution:** Controller deleted. The catch block is gone. No live path swallows the error.

---

### ADAPTER UPDATE — New §5.3 Exception Export

Branch work added a new export to `features/booking/adapters/booking.adapter.js`:

```js
// Approved §5.3 exception: actor kind/void check for self-ownership shortcut in checkVportOwnership (1 call site, dashboard controller only).
export { default as getActorByIdDAL } from "@/features/booking/dal/getActorById.dal";
```

**Purpose:** `checkVportOwnership.controller.js` (dashboard feature) needs `getActorByIdDAL` for a self-ownership kind/void check. Prior to this session it imported directly from `@/features/booking/dal/` — a cross-feature boundary violation (SENTRY-2026-01, BLOCKING). The violation is resolved by routing through the adapter with an explicit §5.3 exception comment.

**Duplicate status unchanged:** `getActorByIdDAL` in `features/booking/dal/getActorById.dal.js` is still a duplicate of `engines/booking/src/dal/actor.read.dal.js`. The IB-01 migration (step 6) to remove the feature-level duplicate remains planned but is not release-blocking.

---

### CARNAGE PHASE STATUS UPDATE

The 2026-05-14 CARNAGE migration plan phases are updated:

| Phase | Description | Status |
|---|---|---|
| Phase 0 — DB verification queries | Run pre-migration queries in Supabase | PENDING — user action required |
| Phase 1 — Index creation | CREATE CONCURRENTLY on join columns | PENDING — depends on Phase 0 |
| Phase 2 — App-layer fixes | RC-01 + V-AVAIL-04 | **RESOLVED** |
| Phase 3 — availability_rules RLS policies | UPDATE + INSERT policies | **UNBLOCKED** |
| Phase 4 — bookings SELECT policy (staging) | Three-party SELECT policy | **UNBLOCKED** |
| Phase 5 — bookings SELECT policy (production) | After staging verification | **UNBLOCKED** |

Full readiness report: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-18_carnage_booking-rls-readiness.md`

---

### OPEN ITEMS CARRIED FORWARD

| Item | Source | Priority | Status |
|---|---|---|---|
| `useBookingHistory` export in adapter — confirmed dead | LOKI LB-01, IB-03 | LOW | Remove when SA-03 cleanup is scheduled |
| `getActorByIdDAL` feature-level duplicate of engine DAL | IB-01 step 6 | LOW | Remove after engine path confirmed for all call sites |
| SA-01 — `PortfolioTab.jsx` direct import violation | SENTRY SA-01 | HIGH | Release-blocking; one-line fix |
| IB-01 — merge `assertActorOwnsVportActor` to engine ownership | IRONMAN RISK-2 | HIGH | Reduces dual-ownership ambiguity |
| DB inspection (CARNAGE CM-02/CM-03 gate) | CARNAGE | HIGH | Phase 0 prerequisite for RLS migration |
| `profile_actor_access` write path rebuild | VENOM | MEDIUM | Rebuild with `actorId` scoping when team-access management is prioritized |
| `vportLeads.write.dal.js` import inconsistency (`vport` vs `vportSchema`) | SENTRY | LOW | Fix on next touch |

---

### DOCUMENT STATUS

| Date | Status | Triggered By |
|---|---|---|
| 2026-05-11 | CREATED | ARCHITECT live audit |
| 2026-05-11 | VERIFIED | IRONMAN ownership pass |
| 2026-05-18 | **VERIFIED** | LOGAN resolution pass — RC-01, RC-03, V-AVAIL-04 confirmed resolved |

All 5 phases of verification are complete. The booking DAL document now has full governance coverage.
