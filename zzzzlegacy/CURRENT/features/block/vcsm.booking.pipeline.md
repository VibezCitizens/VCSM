# VCSM Booking — Engine Pipeline

## 1 Purpose

Shared appointment booking engine for the VCSM workspace. Manages booking resources, weekly availability rules, time-block exceptions, and appointments. Supports owner day-schedule view, public customer booking flow, QR link entry, availability rule management, and booking status transitions. All active booking tables live in the `vport` PostgreSQL schema.

> **✅ Schema Correction (2026-05-11):** A prior audit (2026-04-29) incorrectly concluded the `vport` schema does not exist and attempted to "fix" DALs to use `vc.*`. Code inspection confirms the opposite: all active booking DALs — engine-level (`engines/booking/src/dal/`) and app-level (`apps/VCSM/src/features/dashboard/vport/dal/`) — use `getVportClient()` / `supabase.schema('vport')`. The `vport` schema exists and is the live schema for all booking tables. The April 29 audit was based on a stale `full_schema.sql` snapshot. All `vc.booking_*` references in prior documentation are incorrect.

## 2 Scope

**Included:**
- Booking resource lifecycle (create, list, ensure)
- Availability rule and exception management
- Appointment creation, confirmation, cancellation, completion, no-show
- Organization + location workspace scaffolding (engine-only; not wired to active booking UI)
- QR link create, resolve, scan tracking
- Resource-to-service price/duration overrides

**Excluded:**
- Payment processing (fields exist; unused)
- Calendar sync (Google/Outlook)
- Recurring bookings
- Dual-schema routing concept (all active booking tables are in `vport` schema; `vc.booking_*` are legacy pre-migration names)
- Vport-specific calendar UI (lives in `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/`)

## 3 Ownership

Application Scope: VCSM + ENGINE
Code Roots:
- `engines/booking/` — domain engine (DAL, models, controllers)
- `apps/VCSM/src/features/booking/` — app-level hooks and adapters
- `apps/VCSM/src/features/dashboard/vport/` — owner schedule screen + its own local DALs
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/` — Vport public booking UI

Related Engines: `engines/hydration` (actor display names, called by consumers not engine)

Primary Features: Vport booking calendar, public booking flow, owner availability management, QR scan entry

## 4 Entry Points

**Setup (once at app startup):**
```js
import { configureBookingEngine } from '@booking'
configureBookingEngine({ supabaseClient, notifyFn })
```
Note: `vportClient` is the active Supabase client for all booking DALs — `supabase.schema('vport')`.

**Import alias:** `@booking` → `engines/booking/index.js`

**Routes / Screens:**
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportBookingView.jsx` — tab entry
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/view/VportPublicBookingFlow.jsx` — public customer booking

**Hooks (in `apps/VCSM/src/features/booking/hooks/`):**
- `useBookingAvailability` — query availability for a resource + date range
- `useCreateBooking` — mutation: create booking
- `useManageAvailability` — mutations: confirm, cancel, set rules/exceptions, slot duration
- `useOwnerBookingResources` — query: vport.resources for an actor
- `useEnsureOwnerBookingResource` — mutation: create resource if missing
- `useBookingServiceProfiles` — query: service booking configs
- `useOrganizationWorkspace` — query: organizations for current actor
- `useOrganizationLocations` — query: locations for an org
- `useLocationResources` — query: resources at a location
- `useResourceServiceOverrides` — query: price/duration overrides for a resource
- `useBookingContextResolver` — resolves booking context from mode + identifiers
- `useBookingHistory` — query: past bookings for an actor
- `useQrLinks` — query: QR links for org / location / profile

**Dashboard-local hooks:**
- `apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnerSchedule.js` — owner day schedule (uses local controller, not engine hook)
- `apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js` — UI-only boolean ownership check via `checkVportOwnershipController`. Re-verifies on window focus/visibility. NOT the security boundary — all mutations enforce ownership independently in controllers.
- `apps/VCSM/src/features/dashboard/vport/hooks/useVportBookingActions.js` — confirm/cancel/complete/noShow actions, passes `callerActorId` from identity context
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` — public booking wizard

**Controllers:** 27 engine + 5 dashboard-local — see Section 12 Files Map.

**DAL:** Engine DAL (23 files, vc schema only for active paths) + Dashboard DAL (7 files) — see Section 12.

> **Schema Confirmed (2026-05-11):** Dashboard-local DALs use `vportClient` (`supabase.schema('vport')`). Code inspection confirms the `vport` schema exists and is live. All booking tables — including those accessed by engine-level DALs — use `vportClient`. The April 29 `full_schema.sql`-based audit was based on a stale snapshot.

## 5 Data Flow

### Active Booking Path (vport schema)

All active booking reads and writes go through `vport.*`. The legacy `vc.booking_*` names predate the schema migration; the live tables use the `vport` schema with simplified names (e.g., `vport.resources`, `vport.bookings`).

### Read Flow (owner day schedule)

```
VportDashboardScheduleScreen
  → useVportOwnerSchedule
    → loadDayScheduleController({ actorId, dateKey })
        → listBookingResourcesByOwnerActorIdDAL({ ownerActorId: actorId })  [vport.resources]
        → listVportAvailabilityRulesByResourceIdDAL({ resourceId })          [vport.availability_rules]
        → listVportBookingsForProfileDayDAL({ resourceIds, rangeStart, rangeEnd })  [vport.bookings]
        → readVportServicesByActorDAL({ actorId })                           [vport.services]
    → Builds: { lanes: [{ resource, dayRules, bookings, isWorking, bookingCount }], services }
```

### Read Flow (public booking calendar)

```
VportPublicBookingFlow
  → useVportPublicBooking({ profile })
    → readVportServicesByActorDAL({ actorId })                               [vport.services]
    → listOwnerBookingResourcesController({ ownerActorId: actorId })         [vport.resources → camelCase]
    → getVportResourceAvailabilityController({ resourceId, rangeStart, rangeEnd })
        → listVportAvailabilityRulesByResourceIdDAL                          [vport.availability_rules]
        → listVportBookingsInRangeDAL                                        [vport.bookings]
    → buildSlotsByDate() + dateStrip for 14-day picker
```

### Write Flow (public create booking)

```
useVportPublicBooking.handleSubmit()
  → buildBookingPayload({ resourceId, serviceId, selectedDate, selectedTime, ... })
  → createVportPublicBookingController({ resourceId, serviceId, startsAt, endsAt, ... })
      → getVportResourceByIdDAL({ resourceId })                              [vport.resources]
      → readActorVportLinkDAL({ actorId: requestActorId })                   [actor kind validation]
      → insertVportBookingDAL({ row })                                       [vport.bookings INSERT — 23505 caught → "slot unavailable" error]
      → getVportActorIdByProfileIdDAL({ profileId: resource.profile_id })   [vport.profiles — ⚠ unconditional; see KPF-001]
      → publishVcsmNotificationBatch({
            recipientActorIds: [vportActorId, memberActorId].deduplicated(),
            kind: "booking_created"
        })
        Recipients: vport profile actor + resource.member_actor_id (if different)
        Requester excluded from recipients (no self-notification)
```

### Write Flow (owner create booking)

```
VportDashboardScheduleScreen (create modal submit)
  → useVportOwnerSchedule.submitCreateBooking(form)
    → createOwnerBookingController({ callerActorId, resourceId, startsAt, endsAt, ... })
        → getVportResourceByIdDAL({ resourceId })                    [vport.resources]
        → vportActorId = resource.owner_actor_id
              ?? getVportActorIdByProfileIdDAL({ profileId })        [vport.profiles]
        → assertActorOwnsVportActorController({ callerActorId, vportActorId })  ← OWNERSHIP GATE
        → insertVportBookingDAL({ row: { source: 'owner', status: 'confirmed',
              created_by_actor_id: callerActorId, ... } })           [vport.bookings]
```

### Status Transition Flows

```
confirm / cancel / complete / no_show:
  → useVportBookingActions.confirm|cancel|complete|noShow(bookingId)  [passes callerActorId]
    → updateBookingStatusController({ bookingId, status, callerActorId })
        → getVportBookingByIdDAL({ bookingId })                      [vport.bookings — full row fetch]
        → vportActorId = resolveVportActorFromProfileId(booking.profile_id)
        → isCustomer = (callerActorId === booking.customer_actor_id)
        → if isCustomer: only 'cancelled' status allowed
        → if owner: assertActorOwnsVportActorController({ callerActorId, vportActorId })  ← OWNERSHIP GATE
        → updateVportBookingDAL({ bookingId, updates: { status, cancelled_at|completed_at } })
        → [if confirmed or cancelled] notification routing:
            if isCustomer: notify vportActorId
            else: notify customerActorId (if present)

reschedule:
  → rescheduleBookingController({ bookingId, startsAt, endsAt, resourceId, durationMinutes })
    → updateVportBookingDAL({ bookingId, updates })                          [vport.bookings UPDATE]
```

### Availability Management Flow (owner, engine-level)

```
setAvailabilityRule({ requestActorId, resourceId, weekday, startTime, endTime })
  → assertActorOwnsVportActor() → dalUpsertAvailabilityRule()               [vport.availability_rules]

setAvailabilityException({ requestActorId, resourceId, exceptionType, startsAt, endsAt })
  → assertActorOwnsVportActor() → dalUpsertAvailabilityException()          [vport.availability_exceptions]
```

### QR Scan Flow

```
resolveQrScan({ slug, incrementScan })
  → dalGetQrLinkBySlug() [where is_active = true]
  → if incrementScan: dalIncrementQrScanCount()
  → return QrLink model
```

Note: QR link, organization, location, and resource service override DALs in `engines/booking/src/dal/` reference the `vport` schema via `vportClient`. Schema confirmed: `vport.qr_links`, `vport.organizations`, `vport.locations`, `vport.resource_service_overrides` all exist. These DALs are not wired to active booking calendar UI but are schema-compatible and ready to connect.

## 6 Source of Truth

| Domain | Schema | Table |
|---|---|---|
| Booking resources | vport | `vport.resources` |
| Bookings | vport | `vport.bookings` |
| Availability rules | vport | `vport.availability_rules` |
| Availability exceptions | vport | `vport.availability_exceptions` |
| Service booking configs | vport | `vport.service_booking_profiles` |
| Actor ownership | vc | `vc.actor_owners` |
| Services | vport | `vport.services` |
| Availability | in-process Map (engine) | 5-minute TTL cache, invalidated on writes |
| Organizations | vport | `vport.organizations` *(schema confirmed — not wired to active UI)* |
| Locations | vport | `vport.locations` *(schema confirmed — not wired to active UI)* |
| QR links | vport | `vport.qr_links` *(schema confirmed — not wired to active UI)* |
| Resource service overrides | vport | `vport.resource_service_overrides` *(schema confirmed — not wired to active UI)* |

> **Schema Correction (2026-05-11):** Prior documentation (2026-04-29) incorrectly listed these as `vc.*` tables and stated the `vport` schema does not exist. Code inspection of all booking DALs confirms `vport` schema is live with renamed tables (e.g., `vc.booking_resources` → `vport.resources`). The April 29 entry was based on a stale `full_schema.sql` snapshot.

## 7 UI States

**Loading:** Skeleton grid in `BookingCalendarMonthGrid`, spinner in day panel. Availability loading state tracked by `availabilityLoading` in `useVportPublicBooking`.
**Empty:** No availability rules → all days show closed state. No bookings → day panel empty state.
**Success:** Month grid with slot indicators; day panel with time slots and appointment list.
**Error:** Hook-level `error` state surfaced to screen via `useVportOwnerSchedule.error`.
**Blocked:** `viewerCanBook = false` → day panel shows "Switch to citizen profile" notice; reserve CTA hidden.
**Fallbacks:** All `mountedRef` guards prevent setState after unmount on all async hooks.

## 8 Dependencies

Internal:
- `engines/booking/src/config.js` — getSupabaseClient(), getNotifyFn()
- `engines/booking/src/events.js` — BOOKING_EVENTS constants
- `apps/VCSM/src/services/supabase/vportClient.js` — `vport` named export (`supabase.schema('vport')`) — used by all active booking DALs
- `apps/VCSM/src/services/supabase/vcClient.js` — `vc` named export (`supabase.schema('vc')`) — used only by `engines/booking/src/dal/actor.read.dal.js`

Shared engines (called by hook consumers, not by engine itself):
- `engines/hydration` — actor display names in calendar

External services:
- Supabase PostgreSQL — `vport` schema (all active booking tables); `vc` schema (actor lookups only)
- Supabase Auth — JWT for RLS

Database objects:
- `vc.current_actor_id()` — current JWT actor from vc.actors (used in RLS policies on vport tables)
- `vport.bookings.booking_range` — generated `tstzrange` column from starts_at/ends_at (for overlap checks)

## 9 Rules / Invariants

1. **All active booking tables are in `vport.*`.** All booking DALs use `supabase.schema('vport')`. Do not write new booking DALs targeting `vc.*`. The `vc.booking_*` names are legacy pre-migration identifiers.
2. **Citizen-only for public bookings.** `source = 'public'` requires `actor.kind = 'user'`. Vport/business actors cannot create public bookings.
3. **No past-slot bookings.** `createBooking` rejects if `startsAt <= Date.now()`.
4. **Weekday stored as integer.** `vport.availability_rules.weekday` is `smallint` 0–6 (Sunday–Saturday). Never compare against string names like "monday".
5. **`rule_type` is always 'weekly'.** The `vport.availability_rules.rule_type` column has a CHECK constraint allowing only 'weekly'. Do not filter by other rule types.
6. **QR slug lookups filter is_active.** Inactive QR links are invisible to the public scan flow.
7. **Cache must be invalidated on writes.** All write controllers that affect availability call `invalidateBookingAvailability()` or rely on hook-level refresh.
8. **Engine has no React imports.** Framework-agnostic. All React lifecycle is in `apps/VCSM/src/features/booking/hooks/`.
9. **Never import from apps.** Dependency direction: apps → engine. Engine never imports from apps.
10. **`listOwnerBookingResourcesController` returns camelCase.** The controller maps rows via `mapBookingResourceRow` — consumers get `ownerActorId`, `isActive`, `resourceType`, not snake_case. Dashboard-local `loadDayScheduleController` bypasses this controller and uses the raw DAL to get snake_case for schedule lane compatibility.
11. **Slot collision is enforced at the DB layer.** Partial unique index `uq_vport_bookings_resource_starts_active ON vport.bookings(resource_id, starts_at) WHERE status IN ('pending', 'confirmed')` prevents two concurrent bookings from landing on the same slot. Both the app-level DAL (`insertVportBooking.write.dal.js`) and engine-level DAL (`vportBooking.write.dal.js`) catch PostgreSQL error `23505` and translate it to: `"This time slot is no longer available. Please choose another time."` Migration: `apps/VCSM/supabase/migrations/20260527010000_vport_bookings_slot_collision_index.sql`. The index uses `IN` (not `NOT IN`) so that future terminal statuses added to the set remain opt-in without changing the query. (VENOM-BOOK-001, resolved 2026-05-27)

## 10 Failure Risks

- **Engine secondary DAL files (location, organization, QR, override) not wired to active UI.** `engines/booking/src/dal/location.*.dal.js`, `organization.*.dal.js`, `qrLink.*.dal.js`, `resourceServiceOverride.*.dal.js` use `getVportClient()` and target `vport.*` tables. Schema inspection confirms `vport.locations`, `vport.organizations`, `vport.qr_links`, `vport.resource_service_overrides` all exist. These DALs are functional at the DB layer but not connected to any active booking UI path.
- **Engine vportAvailability / vportBooking / vportResource DAL files are likely duplicate/superseded.** `src/dal/vportAvailability.*.dal.js`, `vportBooking.*.dal.js`, `vportResource.*.dal.js` appear to be parallel to the non-prefixed engine DALs. The `vport` schema tables they target are confirmed to exist — so these files are schema-compatible but likely superseded. Read the files to confirm before deleting.
- **Team management DALs.** `apps/VCSM/src/features/dashboard/vport/dal/vportTeam.*.dal.js` and `vportTeamInvite.*.dal.js` reference `vportSchema`. These are separate from the booking calendar path. Schema inspection confirms `vport.profile_actor_access` (the access/membership table) exists.
- **Stale availability cache.** 5-minute TTL means writes within the window won't reflect immediately in public read views.
- **`mountedRef` guards required on all async hooks.** Missing guards cause setState-after-unmount warnings and potential stale data on fast navigation.
- **`vport.bookings.customer_profile_id` is nullable.** The column exists but is optional — owner bookings created without a logged-in customer will have null `customer_actor_id` and `customer_profile_id`.
- **KPF-001 (P3 — open):** `getVportActorIdByProfileIdDAL` is called unconditionally in `createVportPublicBookingController` after every successful insert, including guest bookings where `requestActorId = null`. The result is only used to populate the notification recipient set, which never fires when `requestActorId` is null. Fix: move the DAL call inside the `if (requestActorId)` guard. Impact: ~25–50ms saved per guest booking; eliminates one `vport.profiles` read per walk-in or QR scan-in booking. KRAVEN finding KPF-001 (2026-05-27).

## 11 Debug Notes

- `getResourceAvailability` (engine) caches by `resourceId:rangeStart:rangeEnd:pub|own`. Call `invalidateBookingAvailability()` after writes.
- Dashboard-local `loadDayScheduleController` does NOT use the engine cache — it re-fetches on every `dateKey` change.
- `availabilityLoading` in `useVportPublicBooking` is a hard gate — the "Next" button on the service step is disabled until availability loads and `hasAvailabilityRules && hasUpcomingSlots`.
- Weekday integer comparison: `Number(r.weekday) === dateObj.getDay()`. The DB stores 0–6; `getDay()` returns 0–6 (Sun–Sat). These align.
- If owner schedule shows no lanes, check that `vport.resources` has rows with `owner_actor_id` matching the actor and `is_active = true`.
- If public booking shows no available dates, check `vport.availability_rules` has rows for the resource with `is_active = true` and correct integer `weekday`.
- **`@debuggers` imports are production-safe (approved pattern).** `useVportBookingView.js` unconditionally imports `useActorConsistencyCheck` from `@debuggers/identity/useActorConsistencyCheck`. This is safe: `vite.config.js` lines 49–52 mode-gate the `@debuggers` alias — in production it resolves to `apps/VCSM/src/debuggers-stub/` which contains no-op stubs (`export function useActorConsistencyCheck() {}`). The import is unconditional by design; the Vite alias swap handles environment gating at bundle time. Do not add `import.meta.env.DEV` guards to `@debuggers` imports — the alias approach is the approved pattern. SENTRY SF-BOOK-001 confirmed (2026-05-27).
- **Dual-path booking hooks (SF-BOOK-002 design note).** The Book tab on a VPORT profile has two structurally distinct paths: **visitor** (`VportPublicBookingFlow → useVportPublicBooking`) uses a 14-day strip, simplified wizard, fetches 2 months of availability, and routes through dashboard-local controllers; **owner** (`VportOwnerBookingView → useVportBookingView`) uses a full calendar grid, fetches 1 month of availability, and uses engine hooks via `booking.adapter`. This divergence is intentional — visitor simplicity vs owner complexity. Risk: the two paths can diverge further without explicit governance. Both paths are separately secured at the controller layer; there is no security risk from the split. See SENTRY SF-BOOK-002 (MINOR DRIFT, 2026-05-27).

## 12 Files Map

### Engine Core

| File | Purpose |
|---|---|
| `engines/booking/index.js` | Re-export from adapters |
| `engines/booking/src/config.js` | Dependency injection |
| `engines/booking/src/events.js` | BOOKING_EVENTS constants |
| `engines/booking/src/adapters/index.js` | Full public API surface |
| `engines/booking/CONTRACT.md` | Public API contract and allowed DAL operations |

### Engine DAL Layer

| File | Schema | Status |
|---|---|---|
| `src/dal/actor.read.dal.js` | vc | Active — actor lookups only |
| `src/dal/availability.read.dal.js` | vport | Active — `vport.availability_rules`, `vport.availability_exceptions` |
| `src/dal/availability.write.dal.js` | vport | Active — `vport.availability_rules`, `vport.availability_exceptions` |
| `src/dal/booking.read.dal.js` | vport | Active — `vport.bookings` |
| `src/dal/booking.write.dal.js` | vport | Active — `vport.bookings` |
| `src/dal/resource.read.dal.js` | vport | Active — `vport.resources`, `vport.resource_services` |
| `src/dal/resource.write.dal.js` | vport | Active — `vport.resources` |
| `src/dal/serviceProfile.read.dal.js` | vport | Active — `vport.service_booking_profiles` |
| `src/dal/serviceProfile.write.dal.js` | vport | Active — `vport.service_booking_profiles` |
| `src/dal/location.read.dal.js` | vport | Schema confirmed — not wired to active UI |
| `src/dal/location.write.dal.js` | vport | Schema confirmed — not wired to active UI |
| `src/dal/organization.read.dal.js` | vport | Schema confirmed — not wired to active UI |
| `src/dal/organization.write.dal.js` | vport | Schema confirmed — not wired to active UI |
| `src/dal/qrLink.read.dal.js` | vport | Schema confirmed — not wired to active UI |
| `src/dal/qrLink.write.dal.js` | vport | Schema confirmed — not wired to active UI |
| `src/dal/resourceServiceOverride.read.dal.js` | vport | Schema confirmed — not wired to active UI |
| `src/dal/resourceServiceOverride.write.dal.js` | vport | Schema confirmed — not wired to active UI |
| `src/dal/vportAvailability.read.dal.js` | vport | Likely duplicate of `availability.read.dal.js` — verify and clean up |
| `src/dal/vportAvailability.write.dal.js` | vport | Likely duplicate of `availability.write.dal.js` — verify and clean up |
| `src/dal/vportBooking.read.dal.js` | vport | Likely duplicate of `booking.read.dal.js` — verify and clean up |
| `src/dal/vportBooking.write.dal.js` | vport | Likely duplicate of `booking.write.dal.js` — verify and clean up |
| `src/dal/vportResource.read.dal.js` | vport | Likely duplicate of `resource.read.dal.js` — verify and clean up |
| `src/dal/vportResource.write.dal.js` | vport | Likely duplicate of `resource.write.dal.js` — verify and clean up |

### Dashboard-Local DAL Layer (`apps/VCSM/src/features/dashboard/vport/dal/`)

| File | Schema | Status |
|---|---|---|
| `read/vportAvailabilityRules.read.dal.js` | vport (`availability_rules`) | Active |
| `read/vportBookingsInRange.read.dal.js` | vport (`bookings`) | Active |
| `read/listVportBookingsForProfileDay.read.dal.js` | vport (`bookings`, by `resource_id`) | Active |
| `read/vportResource.read.dal.js` | vport (`resources`) | Added 2026-04-30 |
| `read/vportProfile.read.dal.js` | vport (`profiles`) | Active — `getVportProfileIdByActorDAL`, `getVportActorIdByProfileIdDAL` (added 2026-05-10) |
| `read/vportBookingById.read.dal.js` | vport (`bookings`, by `id`) | Added 2026-05-11 — used by `updateVportBooking.controller.js` for status transitions + reschedule |
| `read/vportServices.read.dal.js` | vport (`services`) | Active — `getVportServiceByIdDAL`, `listVportServicesByProfileIdDAL` |
| `write/insertVportBooking.write.dal.js` | vport (`bookings`) | Active |
| `write/updateVportBooking.write.dal.js` | vport (`bookings`) | Active |

### Model Layer

| File | Domain |
|---|---|
| `src/model/Booking.model.js` | Booking row mapper, status/source enums |
| `src/model/BookingAvailability.model.js` | Rule + exception mappers, mapResourceAvailabilityModel |
| `src/model/BookingResource.model.js` | vport.resources mapper |
| `src/model/BookingServiceProfile.model.js` | Service profile mapper |
| `src/model/Location.model.js` | Location + member mappers |
| `src/model/Organization.model.js` | Organization + member + profile mappers |
| `src/model/QrLink.model.js` | QR link mapper (isActive, scanCount) |
| `src/model/ResourceServiceOverride.model.js` | Override mapper + resolveServicePricing |
| `src/model/VportResource.model.js` | Vport resource mapper — references profileId (legacy, tied to broken vport DALs) |

### Controller Layer

| File | Purpose |
|---|---|
| `src/controller/createBooking.controller.js` | Create appointment (engine-level) |
| `src/controller/confirmBooking.controller.js` | pending → confirmed |
| `src/controller/cancelBooking.controller.js` | → cancelled |
| `src/controller/completeBooking.controller.js` | confirmed → completed |
| `src/controller/markNoShow.controller.js` | confirmed → no_show |
| `src/controller/getResourceAvailability.controller.js` | Fetch availability, cached |
| `src/controller/getLocationAvailability.controller.js` | Aggregate availability across location resources |
| `src/controller/listBookingHistory.controller.js` | Past bookings for an actor |
| `src/controller/listOwnerBookingResources.controller.js` | vport.resources for an actor (returns camelCase) |
| `src/controller/ensureOwnerBookingResource.controller.js` | Create vport resource if missing |
| `src/controller/getBookingServiceProfiles.controller.js` | Service profile configs |
| `src/controller/setAvailabilityRule.controller.js` | Weekly rule — `vport.availability_rules` |
| `src/controller/setAvailabilityException.controller.js` | Time block — `vport.availability_exceptions` |
| `src/controller/setResourceSlotDuration.controller.js` | Sync duration across service profiles |
| `src/controller/assertActorOwnsVportActor.controller.js` | Permission: vc.actor_owners chain |
| `src/controller/assertActorCanManageOrganization.controller.js` | Permission: org ownership |
| `src/controller/assertActorCanManageLocation.controller.js` | Permission: via org |
| `src/controller/assertActorCanManageResource.controller.js` | Permission: via profiles |
| `src/controller/listOrganizationsByOwnerActor.controller.js` | Orgs for actor |
| `src/controller/createOrganizationLocationWorkspace.controller.js` | Scaffold org + location + resource atomically |
| `src/controller/listLocationsByOrganization.controller.js` | Locations for org |
| `src/controller/listBookingResourcesByLocation.controller.js` | Resources at location |
| `src/controller/listResourceServiceOverrides.controller.js` | Overrides for resource |
| `src/controller/upsertResourceServiceOverride.controller.js` | Create/update override |
| `src/controller/resolveBookingContext.controller.js` | Resolve resource + service from context mode |
| `src/controller/createQrLink.controller.js` | Create QR link with permission guard |
| `src/controller/resolveQrScan.controller.js` | Slug → QrLink, optional scan increment |
| `src/controller/listQrLinks.controller.js` | QR links by org / location / profile |

**Dashboard-local controllers:**
| File | Purpose |
|---|---|
| `apps/VCSM/src/features/dashboard/vport/controller/vportOwnerSchedule.controller.js` | Owner day schedule: load lanes |
| `apps/VCSM/src/features/dashboard/vport/controller/createOwnerBooking.controller.js` | Owner booking create: resource lookup → vportActorId resolve → assertActorOwnsVportActor ownership gate → insert confirmed booking |
| `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js` | Public booking: citizen validation, service label resolve (server-side), insert, batch-notify vport + team member |
| `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js` | `updateBookingStatusController` (confirm/cancel/complete/no_show + ownership gate + bidirectional notification) + `rescheduleBookingController` (overlap check + ownership gate) |
| `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js` | Boolean ownership check — try/catch wrapper over assertActorOwnsVportActor. UI convenience only; NOT the security boundary. |

### App Hook Layer (`apps/VCSM/src/features/booking/hooks/`)

| Hook | Purpose |
|---|---|
| `useBookingAvailability.js` | Query: availability model for resource + range |
| `useCreateBooking.js` | Mutation: create booking |
| `useManageAvailability.js` | Mutations: confirm, cancel, set rules/exceptions, slot duration |
| `useOwnerBookingResources.js` | Query: vport.resources for actor |
| `useEnsureOwnerBookingResource.js` | Mutation: ensure resource exists |
| `useBookingServiceProfiles.js` | Query: service booking configs |
| `useOrganizationWorkspace.js` | Query: orgs for current actor (mountedRef guarded) |
| `useOrganizationLocations.js` | Query: locations for org (mountedRef guarded) |
| `useLocationResources.js` | Query: resources at location (mountedRef guarded) |
| `useResourceServiceOverrides.js` | Query: overrides for resource (mountedRef guarded) |
| `useBookingContextResolver.js` | Resolve booking context from mode + identifiers |
| `useBookingHistory.js` | Query: past bookings |
| `useQrLinks.js` | Query: QR links by org / location / profile |

### Customer Appointments Layer (`apps/VCSM/src/features/booking/` + notifications screen)

The customer-facing "My Appointments" tab in the Notifications screen reads bookings for the logged-in citizen actor and displays vport identity (avatar + name) and team member identity using the hydration engine.

| File | Purpose |
|---|---|
| `apps/VCSM/src/features/booking/dal/listBookingsByCustomer.dal.js` | Reads `vport.bookings` filtered by `customer_actor_id`. Selects `profiles!profile_id(actor_id,name)` (always resolves vport regardless of resource_id) and `resources!resource_id(owner_actor_id,member_actor_id,name)` (resolves team member when booking has a resource). |
| `apps/VCSM/src/features/booking/model/booking.model.js` | Maps `vportActorId` (`profiles.actor_id`), `vportName` (`profiles.name`), `memberActorId` (`resources.member_actor_id`), `memberName` (`resources.name`). |
| `apps/VCSM/src/features/booking/adapters/booking.adapter.js` | Exposes `listMyBookings({ actorId })` — calls `listBookingsByCustomerDAL`, maps rows, returns `{ bookings, ownerNames }`. |
| `apps/VCSM/src/features/notifications/screen/hooks/useMyAppointments.js` | Loads bookings via `listMyBookings`, pre-warms hydration store by calling `hydrateActorsByIds([...vportActorIds, ...memberActorIds])` after load. Splits rows into `upcoming` / `pending` / `past` buckets. Handles `cancelAppointment` and `dismissAppointment`. |
| `apps/VCSM/src/features/notifications/screen/views/MyAppointmentsView.jsx` | Renders tabbed appointment list. `VportCell` sub-component displays vport avatar + name using `useActorSummary(vportActorId)` with `vportName` from DB join as instant fallback (no flash). `MemberLine` sub-component shows "with [name]" using `useActorSummary(memberActorId)` with `memberName` fallback. Both sub-components call `hydrateActorsByIds` on `summary.missing` as a safety net. |

**Actor resolution strategy:** `vportActorId` comes from `profiles!profile_id(actor_id)` — reliable because every booking has `profile_id`. `memberActorId` comes from `resources!resource_id(member_actor_id)` — only present when the customer chose a specific team member. Avatar falls back to `/avatar.jpg` on hydration miss or image load error.

### Migration Layer

| File | Purpose |
|---|---|
| `apps/VCSM/supabase/migrations/20260527010000_vport_bookings_slot_collision_index.sql` | Partial unique index `uq_vport_bookings_resource_starts_active ON vport.bookings(resource_id, starts_at) WHERE status IN ('pending', 'confirmed')` — slot collision protection (VENOM-BOOK-001, added 2026-05-27) |

### Test Coverage

| File | Coverage | Tests |
|---|---|---|
| `apps/VCSM/src/features/dashboard/vport/controller/__tests__/vportPublicBooking.controller.test.js` | `createVportPublicBookingController` — kind gate (BOOK-002) + slot collision error propagation (BOOK-001) | 25 total (20 BOOK-002 + 5 BOOK-001) |
| `apps/VCSM/src/features/dashboard/vport/dal/write/__tests__/insertVportBooking.write.dal.test.js` | `insertVportBookingDAL` — required field validation, success path, 23505 translation, error pass-through | 14 tests |
| `engines/booking/src/controller/__tests__/createBooking.controller.test.js` | `createBookingController` — slot collision regression (engine path) | 11 total (8 original + 3 BOOK-001) |
| `engines/booking/src/controller/__tests__/assertActorCanManageResource.controller.test.js` | `assertActorCanManageResource` — ownership enforcement (engine path) | Added 2026-05-27 |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/__tests__/upsertVportRate.controller.test.js` | `upsertVportRateController` — ownership gate, DAL call, cache invalidation | VPORT exchange module regression |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/__tests__/publishExchangeRateUpdateAsPost.controller.test.js` | `publishExchangeRateUpdateAsPost` — dedup throttle, missing currencies, system post routing | VPORT exchange module regression |

## Audit References

Latest Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/BOOKING_ENGINE_AUDIT_V1.md`

Previous Engine Audit:
None (V1 is first)

> A V2 engine audit should be created after the secondary vport DAL files (location, organization, QR, resource service override) are verified against the live database and either wired to active UI or removed. See Section 10 Failure Risks.

## 13 Change Log

### 2026-05-27

Task: BOOK-001 slot collision protection + secondary architecture audit (KRAVEN/SENTRY/LOGAN)
Application Scope: VCSM + ENGINE

**BOOK-001 — Slot collision race condition (VENOM-BOOK-001, resolved)**
- Added partial unique index `uq_vport_bookings_resource_starts_active ON vport.bookings(resource_id, starts_at) WHERE status IN ('pending', 'confirmed')` via migration `20260527010000_vport_bookings_slot_collision_index.sql`. Index uses `IN` not `NOT IN` so future terminal statuses opt-in without rewriting the query.
- App-level DAL (`insertVportBooking.write.dal.js`): catches PostgreSQL `23505` and throws `Error("This time slot is no longer available. Please choose another time.")`.
- Engine-level DAL (`vportBooking.write.dal.js`): same 23505 handler added.
- Test coverage: 14 new DAL tests (`insertVportBooking.write.dal.test.js`), 5 new controller regression tests (extended `vportPublicBooking.controller.test.js`), 3 new engine regression tests (extended `createBooking.controller.test.js`) = 22 new tests.

**BOOK-002 — Kind-gate regression (VENOM-BOOK-002, resolved)**
- 20 regression tests added to `vportPublicBooking.controller.test.js` covering: citizen-only enforcement, guest path, VPORT actor rejection, expired slot rejection, missing field validation.

**KRAVEN audit (2026-05-27 — WATCH status)**
- KPF-001 (P3 open): `getVportActorIdByProfileIdDAL` called unconditionally post-insert even for guests — should be inside `if (requestActorId)` guard.
- KPF-002 (P4 open): `listVportBookingResourcesController` — 2 serial reads; could be a single JOIN.
- KPF-003 (P3 open): Owner calendar fetch window is 1 month; visitor is 2 months — should widen owner window.
- No CRITICAL or HIGH findings. All three are LOW severity, P3-P4.

**SENTRY audit (2026-05-27 — MINOR DRIFT)**
- SF-BOOK-001: `@debuggers` import in `useVportBookingView.js` confirmed production-safe via Vite mode-gated alias → `src/debuggers-stub/` no-op stubs. Downgraded from MODERATE DRIFT to INFO. Pattern is approved.
- SF-BOOK-002: Dual-path booking hooks (visitor vs owner) intentional design. Documented in Section 11. MINOR DRIFT, no immediate action.

Files Changed (implementation):
1. `apps/VCSM/supabase/migrations/20260527010000_vport_bookings_slot_collision_index.sql` (NEW)
2. `apps/VCSM/src/features/dashboard/vport/dal/write/insertVportBooking.write.dal.js` — 23505 handler
3. `engines/booking/src/dal/vportBooking.write.dal.js` — 23505 handler
4. `apps/VCSM/src/features/dashboard/vport/controller/__tests__/vportPublicBooking.controller.test.js` — BOOK-001 regression block
5. `apps/VCSM/src/features/dashboard/vport/dal/write/__tests__/insertVportBooking.write.dal.test.js` (NEW)
6. `engines/booking/src/controller/__tests__/createBooking.controller.test.js` — slot collision block

Documentation Truth Status: VERIFIED — Section 5 write flow annotated, Section 9 Rule 11 added, Section 10 KPF-001 noted, Section 11 @debuggers pattern documented, Section 12 Migration + Test tables added

### 2026-05-11

Task: Schema correction — all `vc.booking_*` references updated to `vport.*` throughout Logan documentation
Application Scope: VCSM + ENGINE
Prompt Registry Entry: Session continued from context compaction
Code Status Before: Code used `vportClient` / `supabase.schema('vport')` throughout; documentation incorrectly said `vc` schema
Code Status After: Documentation now matches code — `vport` schema, renamed tables
Files Changed (Logan docs):
- `vcsm.booking.pipeline.md` — major correction: Purpose, Section 2, 4, 5, 6, 8, 9, 10, 11, 12 (engine DAL layer, models, controllers, hooks, customer appointments)
- `vcsm.runtime.mutation-matrix.md` — booking section rows + setResourceSlotDuration flow
- `vcsm.runtime.authority-matrix.md` — booking section rows
- `vcsm.runtime.transaction-boundary-map.md` — booking section rows
- `vcsm.runtime.high-risk-mutations.md` — rank 9
- `vcsm.notifications.pipeline.md` — Appointments tab DAL label
- `vcsm.notifications.coverage-audit.md` — DB trigger suggestion
- `platform/vcsm.platform.pipeline-map.md` — booking row
- `platform/vcsm.platform.read-optimization-plan.md` — booking row
- `engines/engines.vcsm.architecture-inspection.md` — booking schema + booking creation step
- `architecture/database-read-map.md` — booking read chain tables
- `vports/vcsm.vport.business-pipeline.md` — dual-schema routing statement
- `vports/vcsm.vport.tripoint-integration.md` — booking availability table
- `vports/vcsm.vport.external-site-integration.md` — booking tables + leads insert
- `vports/vcsm.vport.barber-profile-spec.md` — booking infrastructure section
- `marvel/architect/event-flow-map.md`, `dependency-map.md`, `api-exposure-map.md`, `vcsm-migration-risk-report.md`, `database-read-map.md` — booking table references
- `traffic/TRAFFIC_VPORT_INTEGRATION_AUDIT.md` — booking availability tables
Documentation Truth Status: VERIFIED — all active booking table references now match code inspection results

### 2026-05-10 (2)

Task: Customer appointments view — vport + team member identity display
Scope: VCSM (booking DAL + model, notifications screen)

Summary:

**1. Appointment card was showing "User" with default avatar**
Root cause: `booking.ownerActorId` was null — derived from `resources!resource_id(owner_actor_id)` join, but general appointments have no `resource_id`, so the join returned null and `useActorSummary` got no ID.

Fix: Added `profiles!profile_id(actor_id,name)` to `listBookingsByCustomerDAL`. Every booking has `profile_id`, so this join always resolves the vport. Added `vportActorId`, `vportName`, `memberActorId`, `memberName` to `mapBookingRow`.

**2. Hydration engine wired into useMyAppointments**
After booking rows load, `hydrateActorsByIds` is called with all unique vport and member actor IDs in a single batch. This pre-warms the hydration store before the appointment cards mount.

**3. VportCell + MemberLine sub-components in MyAppointmentsView**
`VportCell` uses `useActorSummary(vportActorId)` for live avatar + name, with `vportName` (from DB join) as instant fallback — no "Unknown place" flash. `MemberLine` uses `useActorSummary(memberActorId)` with `memberName` fallback. Both call `hydrateActorsByIds` on `summary.missing` as a safety net.

Files Changed (4):
1. `apps/VCSM/src/features/booking/dal/listBookingsByCustomer.dal.js` — added `profiles!profile_id(actor_id,name)` + `member_actor_id,name` to resources join
2. `apps/VCSM/src/features/booking/model/booking.model.js` — added `vportActorId`, `vportName`, `memberActorId`, `memberName`
3. `apps/VCSM/src/features/notifications/screen/hooks/useMyAppointments.js` — added `hydrateActorsByIds` batch call
4. `apps/VCSM/src/features/notifications/screen/views/MyAppointmentsView.jsx` — added `VportCell` + `MemberLine` sub-components

### 2026-05-10

Task: Booking dashboard UX + notification correctness (wrong vport actorId, missing status notifications, team member notification)
Scope: VCSM (dashboard)

Summary:

**1. Booking dashboard 3-mode UX**
`VportDashboardBookingHistoryScreen` was using a 2-mode toggle (Today / History). Pending/upcoming bookings were appearing under History > Upcoming sub-tab. Replaced with a 3-mode toggle: Today | Upcoming | History.
- Upcoming mode: dedicated view for future appointments (tomorrow+, non-cancelled/completed/no_show) with `BookingCard` action buttons (confirm, cancel, etc.)
- History tabs reduced to: Past | Cancelled | All (removed Upcoming and Pending from history sub-tabs)
- `historyTab` default changed from `"upcoming"` to `"past"`
- Added `upcomingFiltered` + `upcomingGrouped` memos
- `useVportBookingActions` now receives `actorId: targetActorId`

**2. booking_created sent to wrong vport actorId**
`resource.owner_actor_id` on the specific barbershop resource pointed to a different vport actor than the one the user manages. Fixed by resolving recipient from `vport.profiles.actor_id` via the resource's `profile_id`.
- Added `getVportActorIdByProfileIdDAL({ profileId })` to `read/vportProfile.read.dal.js`
- `createVportPublicBookingController` now uses `getVportActorIdByProfileIdDAL({ profileId: resource.profile_id })` as primary recipient
- Switched to `publishVcsmNotificationBatch` — sends to both vport profile actor + `resource.member_actor_id` (deduped Set, requester excluded)

**3. No notification on confirm or cancel**
`updateBookingStatusController` had zero notification logic. Added `STATUS_TO_EVENT` map and bidirectional routing:
- `confirmed` → notify other party
- `cancelled` → notify other party
- `completed` and `no_show` intentionally excluded
- Bidirectional: `isClientActing = (actorId === booking.customer_actor_id)` → if client acting, notify vport; else notify customer
- `actorId` param added to `updateBookingStatusController` and `useVportBookingActions`; all 4 action callbacks pass it

**4. Dev-only error logging**
`publishVcsmNotification` `catch {}` changed to `catch (err) { if (import.meta.env.DEV) console.error(...) }` — notification failures now visible in dev without breaking production.

Files Changed (6):
1. `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx`
2. `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js`
3. `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js`
4. `apps/VCSM/src/features/dashboard/vport/hooks/useVportBookingActions.js`
5. `apps/VCSM/src/features/dashboard/vport/dal/read/vportProfile.read.dal.js`
6. `apps/VCSM/src/features/notifications/publish.js`

Documentation Updated: `notification-event-matrix.md`, `vcsm.notifications.pipeline.md`, `vcsm.booking.pipeline.md`

### 2026-04-29

Task: Schema fix — remove non-existent `vport` schema from app-level booking calendar path
Scope: VCSM (dashboard + public booking path)
Root Cause: All dashboard-local booking DALs used `supabase.schema('vport')` which does not exist in the database. The `vport` schema was never created; all booking tables are in `vc.*`.
Summary:
- Confirmed `vport` schema does NOT exist (inspected `full_schema.sql` — schemas are: auth, chat, extensions, vc, vc_public, wanders, platform, learning, omd — no `vport`)
- Fixed all 5 dashboard-local DALs to use `vc` schema with correct table names
- Fixed `profile_id` → `customer_profile_id` column reference (actual `vport.bookings` column)
- Fixed weekday comparison: was string "monday" lookup via WEEKDAY_LABELS array; correct is `Number(r.weekday) === dateObj.getDay()` (smallint 0–6)
- Fixed `rule_type` filter: was checking `=== "open"`; only valid value is 'weekly' per CHECK constraint
- Changed `listVportBookingsForProfileDay` signature from `{ profileId }` (no such column) to `{ resourceIds }` querying via `.in("resource_id", resourceIds)`
- Fixed `vportOwnerSchedule.controller.js`: replaced `fetchTeamMembersByProfileId` (queried non-existent `vport.resources`) with `listBookingResourcesByOwnerActorIdDAL` (vc)
- Fixed `vportPublicBooking.controller.js`: replaced `vportSchema.from("resources")` lookup with `getBookingResourceByIdDAL`; removed `profile_id` from insert payload; notification now uses `resource.owner_actor_id` directly
- Fixed `useVportPublicBooking.js`: replaced `getTeamMembersController` with `listOwnerBookingResourcesController`; updated all field refs from `member_actor_id` → `ownerActorId` (camelCase from mapper)
- Fixed `VportPublicBookingFlow.jsx`: updated barber selection from `barber.member_actor_id` → `barber.ownerActorId`
- Fixed `useVportOwnerSchedule.js`: updated hydration pre-warm from `member_actor_id` → `owner_actor_id`
- Fixed `VportDashboardScheduleScreen.jsx`: updated `useActorSummary` call from `member_actor_id` → `owner_actor_id`

Files Changed (11):
1. `apps/VCSM/src/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js`
2. `apps/VCSM/src/features/dashboard/vport/dal/read/vportBookingsInRange.read.dal.js`
3. `apps/VCSM/src/features/dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal.js`
4. `apps/VCSM/src/features/dashboard/vport/dal/write/insertVportBooking.write.dal.js`
5. `apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js`
6. `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js`
7. `apps/VCSM/src/features/dashboard/vport/controller/vportOwnerSchedule.controller.js`
8. `apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnerSchedule.js`
9. `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardScheduleScreen.jsx`
10. `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js`
11. `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/view/VportPublicBookingFlow.jsx`

Not In Scope (still broken, separate task):
- `engines/booking/src/dal/vport*.dal.js` (14 engine DAL files) — still reference `vportClient`/`vport` schema
- `apps/VCSM/src/features/dashboard/vport/dal/vportTeam.*.dal.js` — team management screens, separate from booking calendar

Documentation Drift Before Fix: MAJOR — doc described "dual schema routing" as an active invariant; source-of-truth table listed vport.* as primary tables; rules section required `profile_id` for vport bookings
Documentation Status After Fix: ALIGNED (for the app-level booking calendar path)

### 2026-04-26

Task: Engine extraction + dual schema routing + RLS migration + QR fixes + documentation sync
Code Status Before: App-local at `apps/VCSM/src/features/booking/`
Summary:
- Extracted full booking system to `engines/booking/`
- Added org/location/resource/QR/override domain
- Added dual schema routing concept (now known to be invalid — vport schema never existed)
- Added 4 vport DAL files (vportBooking read/write, vportAvailability read/write) — now marked BROKEN
- Fixed QR `is_active` filter in DAL + model
- Added `createQrLink` permission guard
- Added `mountedRef` guards to 4 async hooks
Files Changed: See 26-03.md execution summary

### 2026-04-09

Task: Past-slot expiry enforcement, citizen-only booking
Code Status Before: App-local pre-extraction
Summary: Added `isSlotExpired()` multi-layer enforcement; added `canCitizenBook()` guard
Files Changed: `bookingCalendarDate.model.js`, `createBookingController`, `useVportBookingMutations`, `useVportBookingView`, `BookingCalendarDayPanel`

### 2026-04-08

Task: Initial booking system documentation
Code Status Before: App-local, undocumented
Summary: First Logan doc created from code inspection
