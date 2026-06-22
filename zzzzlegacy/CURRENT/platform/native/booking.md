# Module: Booking / resources relationship

## PWA Source of Truth

**Routes:** Embedded in public VPORT profile and `/actor/:actorId/dashboard/*` booking screens

**Screens/components:**
- `apps/VCSM/src/features/booking/*`
- `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardScheduleScreen.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/*`

**Services/DAL:**
- `apps/VCSM/src/features/booking/dal/*`
- `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js`

**Supabase schema/tables/RPCs:**
- `vport.resources`
- `vport.availability_rules`
- `vport.availability_exceptions`
- `vport.resource_services`
- `vport.service_booking_profiles`
- `vport.bookings`
- `vc.actor_owners`

**RLS expectations:** Public booking reads must only expose bookable resources; owner schedule/history writes must require actor ownership.

**Current PWA status:** Source of truth for booking resource/service relationships and schedule/booking dashboard behavior.

---

## Native Transfer Status

**Status:** `Complete`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Booking/*`
- `VCSMNativeApp/Features/Booking/DAL/BookingResourceReads.dal.swift`
- `VCSMNativeApp/Features/Booking/DAL/BookingAvailabilityReads.dal.swift`
- `VCSMNativeApp/Features/Booking/DAL/BookingWrites.dal.swift`
- `VCSMNativeApp/Features/Dashboard/Components/DashboardCalendarEditor.swift`
- `VCSMNativeApp/Features/Dashboard/DAL/DashboardCalendar.dal.swift`

---

## Native Behavior Currently Present

- Native booking feature has DAL, models, controllers, hooks, components, screens, adapters.
- Native reads booking_resources, availability tables, resource services, service profiles, and writes bookings.
- Dashboard calendar editor exists.

---

## Native Gaps

- Status is Complete for file/behavior presence, but schema names must be validated against current `vport.*` table names.
- Ongoing test coverage needed for public access token path and owner-only history/update paths.

---

## Risk Notes

- **Schema migration already happened.** Booking tables moved from `vc.booking_*` to `vport.*`. The current risk is stale docs or agents using old `vc.booking_*` table names in native DAL code.
- Native DAL files (`BookingResourceReads.dal.swift`, `BookingAvailabilityReads.dal.swift`, `BookingWrites.dal.swift`) must query `vport.*` tables — verify they are not using stale `vc.booking_*` names.
- Do **not** rename booking PostgREST relationship names (`booking_resources`, `booking_resource_services`, `booking_service_profiles`, `booking_availability_*`) without updating native DAL and PWA DAL together — these relationship names may differ from the underlying table names.
- Dashboard schedule route parity is tracked separately in [dashboard-routes.md](dashboard-routes.md).

---

## Pending Transfer Checklist

- [x] Verify native DAL files use `vport.*` table names, not stale `vc.booking_*` names — migrated 2026-05-09: all 7 booking DAL files + DashboardCalendar.dal.swift updated. `booking_resources`→`resources`, `booking_availability_rules`→`availability_rules`, `booking_availability_exceptions`→`availability_exceptions`, `booking_resource_services`→`resource_services`, `booking_service_profiles`→`service_booking_profiles`, `bookings` schema changed to vport. Zero `booking_` prefixed table references remain.
- [ ] Add/keep regression fixtures for resource → services → service profile duration relationships.
- [ ] Retest public booking creation end-to-end after schema name verification.
- [ ] Keep dashboard schedule route parity item under Dashboard routes module.

---

## PWA → Native Transfer Log

- Date:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Transfer History

- Last synced date: 2026-05-09
- Native files updated: BookingBookingReads.dal.swift, BookingHistoryReads.dal.swift, BookingResourceReads.dal.swift, BookingAvailabilityReads.dal.swift, BookingWrites.dal.swift, DashboardCalendar.dal.swift — all migrated from `vc.booking_*` to `vport.*`
- Delta status: Complete — all native booking DALs now use `vport` schema with correct table names matching PWA
- Notes: Full schema migration: `booking_resources`→`resources`, `booking_availability_rules`→`availability_rules`, `booking_availability_exceptions`→`availability_exceptions`, `booking_resource_services`→`resource_services`, `booking_service_profiles`→`service_booking_profiles`. `vc.actors` and `vc.actor_owners` intentionally kept in `vc` schema. `vc.list_subscribers` RPC also stays in `vc`.

### Previous entries

- Synced: 2026-05-02
- Delta: Complete — tracker docs corrected but native DAL code still used stale `vc.booking_*`
- Notes: Booking tables migrated from vc to vport schema in a prior PWA session. Tracker docs were stale and have been corrected.

---

## Archived Notes

**Prior tracker entry (stale — corrected 2026-05-02):** PWA Source of Truth listed `vc.booking_resources`, `vc.booking_availability_rules`, `vc.booking_availability_exceptions`, `vc.booking_resource_services`, `vc.booking_service_profiles`, `vc.bookings` — these were the pre-migration table names. The actual PWA DAL uses `vport.*` tables. Native DAL must be verified to match.
