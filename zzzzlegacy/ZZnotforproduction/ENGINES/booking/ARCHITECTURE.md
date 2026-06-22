# ARCHITECTURE — engines/booking

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** MOSTLY COMPLETE
**Independence:** MOSTLY INDEPENDENT

---

## Engine Purpose

Shared domain engine for booking lifecycle, availability management, resource management, and QR routing. Framework-agnostic (no React). All dependencies are injected at startup.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/booking/`

## Public API Alias

`@booking` — consumed by VCSM app only

## DI Configuration

`apps/VCSM/src/features/booking/setup.js` wires:
- `supabaseClient` — vc schema (actors, actor_owners)
- `vportClient` — vport schema (all booking domain tables)
- `notifyFn` — fire-and-forget notification publisher (publishVcsmNotification)

## Layer Structure

```
config.js        — dependency injection, one-call freeze guard (ELEK-007)
events.js        — BOOKING_EVENTS constants
types/index.js   — JSDoc domain types (no runtime code)
dal/             — 14 files, 2 DB client scopes, dual-path DAL architecture
model/           — 9 pure mapper files (no side effects)
controller/      — 31 controllers (booking lifecycle, permissions, org/location, QR)
adapters/        — public export surface (57 exported symbols)
```

## DB Clients

| Client | Schema | Tables |
|--------|--------|--------|
| supabaseClient (.schema('vc')) | vc | actors, actor_owners |
| vportClient | vport | bookings, resources, availability_rules, availability_exceptions, locations, location_members, organizations, organization_members, organization_profiles, resource_services, resource_service_overrides, service_booking_profiles, qr_links, profiles, services |

## Dual-Path Architecture

The engine supports two coexisting booking systems:
- **Legacy path** — older `vc.booking_resources` + `vport.bookings` (owner_actor_id only)
- **Vport path** — org/location model on `vport.resources` + `vport.bookings` (includes profile_id)

Detection: controllers attempt vportResource lookup first, fall back to legacy resource.

**Architecture Gap:** `cancelBooking`, `confirmBooking`, `completeBooking` only handle the legacy path. Vport booking lifecycle bypasses the engine via dashboard module DALs.

## App Consumers (VCSM)

| File | Engine Symbol Used |
|------|--------------------|
| features/booking/setup.js | configureBookingEngine |
| features/booking/hooks/ (14 hooks) | various controllers |
| features/notifications/screen/hooks/useMyAppointments.js | dismissBooking |
| features/vport/controller/submitCreateVport.controller.js | createOrganizationLocationWorkspace |

## Security Patches Present

- ELEK-001 — void actor validation before isCustomer shortcut (cancelBooking, assertActorCanManageResource)
- ELEK-002 — booking status allowlist; citizen sources always forced to 'pending' (createBooking)
- ELEK-003 — customerActorId pinned to requestActorId on public/citizen paths (createBooking)
- ELEK-007 — configureBookingEngine one-call freeze guard (config.js)
- BW-001 — terminal status check prevents mutation replay (cancelBooking, confirmBooking)

## Known Gaps

- BEHAVIOR.md: MISSING — Blue Team blocked
- SECURITY.md: MISSING — VENOM/ELEKTRA blocked
- cancelBooking/confirmBooking/completeBooking do not handle vport bookings (TICKET-BOOKING-RPC-001)
- QR scan_count increment is non-atomic (race condition risk)
- In-memory availability cache not invalidated on booking mutations

## Duplicate DAL Surfaces (Architecture Debt)

- booking.read.dal + vportBooking.read.dal → same vport.bookings table
- resource.read.dal + vportResource.read.dal → same vport.resources table
- availability.read.dal + vportAvailability.read.dal → same availability tables

## Full Report

`ZZnotforproduction/ENGINES/booking/outputs/2026/06/05/ARCHITECT/engine.booking.architecture.md`
