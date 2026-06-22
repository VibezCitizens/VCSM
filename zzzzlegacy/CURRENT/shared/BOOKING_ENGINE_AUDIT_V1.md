# BOOKING ENGINE AUDIT — V1

**Created:** 2026-04-26
**Engine Root:** `engines/booking/`
**Previous Version:** None (first audit)
**Canonical Logan Doc:** `zNOTFORPRODUCTION/logan/vcsm/booking/vcsm.booking.pipeline.md`

---

## Purpose

Shared domain engine for appointment booking across the VCSM workspace. Provides DAL, domain models, business logic controllers, and React hooks for managing booking resources, availability, appointments, organizations, locations, QR links, and service overrides.

---

## Scope

**In scope:**
- Booking resource management (vc.booking_resources — legacy; vport.resources — neutral)
- Availability rules and exceptions (weekly schedules, time blocks)
- Appointment creation, confirmation, cancellation, completion, no-show
- Organization + location workspace scaffolding
- QR link creation, slug resolution, scan tracking
- Resource-to-service price/duration overrides
- Dual schema routing: vport resources → vport tables; vc resources → vc tables
- Permission guards for org / location / resource / profile management

**Out of scope:**
- Payment processing
- Calendar sync (Google/Outlook)
- Recurring bookings
- Vport-specific UI (calendar grid, day panel, agenda — those live in `apps/VCSM/`)

---

## Engine Root

```
engines/booking/
  index.js                   — re-exports from src/adapters/index.js
  CONTRACT.md                — public API contract
  CLAUDE.md                  — engine rules and setup
  src/
    config.js                — dependency injection (configureBookingEngine)
    events.js                — BOOKING_EVENTS constants
    types/index.js           — JSDoc domain types
    dal/                     — Supabase queries
    model/                   — pure row mappers
    controller/              — business logic
    adapters/index.js        — public API surface
  docs/
    BOOKING_ENGINE_AUDIT_V1.md  — this file
```

---

## Entry Points

**Setup (once at app startup):**
```js
configureBookingEngine({ supabaseClient, vportClient, notifyFn })
```

**Import alias:** `@booking` → `engines/booking/index.js`

**All public exports:** `engines/booking/src/adapters/index.js`

---

## Data Flow

### Dual Schema Routing (core invariant)

The engine detects the resource's origin schema at the start of every booking operation:

```
dalGetVportResourceById({ resourceId })
  ↓ found    → vport flow (vport.resources / vport.bookings / vport.availability_*)
  ↓ not found → vc flow   (vc.booking_resources / vc.bookings / vc.booking_availability_*)
```

This pattern appears in `createBooking`, `getResourceAvailability`, `setAvailabilityRule`, and `setAvailabilityException`.

### Read Flow (availability + calendar)

```
useBookingAvailability({ resourceId, rangeStart, rangeEnd })
  → getResourceAvailability()
      → dalGetVportResourceById()            [detect source]
      → [vport path] dalListVportAvailabilityRulesByResourceId()
                     dalListVportAvailabilityExceptionsInRange()
                     dalListVportBookingsInRange()
      → [vc path]    dalListAvailabilityRulesByResourceId()
                     dalListAvailabilityExceptionsInRange()
                     dalListBookingsInRange()
                     dalListBookingServiceProfilesByServiceIds()
      → mapResourceAvailabilityModel({ resource, rules, exceptions, bookings, serviceProfiles, isVportResource })
```

### Write Flow (create booking)

```
useCreateBooking() → createBooking({ requestActorId, resourceId|locationId, source, ... })
  → [location fallback] dalListVportResourcesByLocationId() → pick first by sort_order
  → dalGetVportResourceById()
  → [vport path] assertActorCanManageResource() (if management source)
                 dalGetActorById() (if public source — citizen-only check)
                 dalInsertVportBooking({ resource_id, profile_id, ... })
  → [vc path]    assertActorOwnsVportActor() (if management source)
                 dalGetActorById() (if public source)
                 dalInsertBooking({ resource_id, ... })
  → notification via notifyFn (public bookings to owner)
```

### Availability Management Flow (owner)

```
setAvailabilityRule({ requestActorId, resourceId, weekday, startTime, endTime })
  → dalGetVportResourceById()
  → [vport path] assertActorCanManageResource()
                 dalUpsertVportAvailabilityRule()
  → [vc path]    assertActorOwnsVportActor()
                 dalUpsertAvailabilityRule()
```

### Booking Context Resolution

```
resolveBookingContext({ mode, profileId|resourceId|locationId })
  Modes:
    selected_resource  → resolve resource + service + pricing
    any_available      → resolve any available resource at location
    primary_calendar   → resolve actor's primary vc.booking_resource
```

### QR Scan Resolution

```
resolveQrScan({ slug, incrementScan })
  → dalGetQrLinkBySlug() [requires is_active=true]
  → if incrementScan: dalIncrementQrScanCount()
  → return QrLink model
```

---

## Source of Truth

| Domain | Source | Table(s) |
|---|---|---|
| Vport booking resources | vport schema | `vport.resources` |
| Vport bookings | vport schema | `vport.bookings` |
| Vport availability rules | vport schema | `vport.availability_rules` |
| Vport availability exceptions | vport schema | `vport.availability_exceptions` |
| Legacy booking resources | vc schema | `vc.booking_resources` |
| Legacy bookings | vc schema | `vc.bookings` |
| Legacy availability rules | vc schema | `vc.booking_availability_rules` |
| Legacy availability exceptions | vc schema | `vc.booking_availability_exceptions` |
| Organizations | vport schema | `vport.organizations` |
| Locations | vport schema | `vport.locations` |
| QR links | vport schema | `vport.qr_links` |
| Service overrides | vport schema | `vport.resource_service_overrides` |
| Service profiles | vc schema | `vc.booking_service_profiles` |
| Actor ownership | vc schema | `vc.actor_owners` |
| Availability cache | in-process Map | 5-minute TTL, invalidated on writes |

---

## Dependencies

**Injected (never hard-imported):**
- `supabaseClient` — Supabase JS client (scoped to `vc` schema)
- `vportClient` — Supabase JS client pre-scoped to `vport` schema
- `notifyFn(payload)` — notification dispatch function

**Internal engine dependencies:**
- `engines/hydration` — actor display names (consumers call directly; engine does not import)

**No React imports.** Engine is framework-agnostic. Hooks live in `apps/VCSM/src/features/booking/hooks/`.

---

## File Map

### DAL Layer (`src/dal/`)

| File | Schema | Operations |
|---|---|---|
| `actor.read.dal.js` | vc | dalGetActorById, dalGetActorByProfileId |
| `availability.read.dal.js` | vc | dalListAvailabilityRulesByResourceId, dalListAvailabilityExceptionsInRange |
| `availability.write.dal.js` | vc | dalUpsertAvailabilityRule, dalUpsertAvailabilityException |
| `booking.read.dal.js` | vc | dalGetBookingById, dalListBookingsInRange, dalListBookingsByResource |
| `booking.write.dal.js` | vc | dalInsertBooking, dalUpdateBookingStatus |
| `location.read.dal.js` | vport | dalGetLocationById, dalListLocationsByOrganizationId |
| `location.write.dal.js` | vport | dalInsertLocation, dalUpdateLocation |
| `organization.read.dal.js` | vport | dalGetOrganizationById, dalListOrganizationsByOwnerActorId |
| `organization.write.dal.js` | vport | dalInsertOrganization, dalUpsertOrganizationMember |
| `qrLink.read.dal.js` | vport | dalGetQrLinkBySlug, dalListQrLinksByOrganization, dalListQrLinksByLocation, dalListQrLinksByProfile |
| `qrLink.write.dal.js` | vport | dalInsertQrLink, dalIncrementQrScanCount |
| `resource.read.dal.js` | vc | dalGetBookingResourceById, dalListBookingResourcesByOwnerActorId, dalListBookingResourceServicesByResourceId |
| `resource.write.dal.js` | vc | dalInsertBookingResource |
| `resourceServiceOverride.read.dal.js` | vport | dalListResourceServiceOverridesByResourceId |
| `resourceServiceOverride.write.dal.js` | vport | dalUpsertResourceServiceOverride |
| `serviceProfile.read.dal.js` | vc | dalListBookingServiceProfilesByServiceIds |
| `serviceProfile.write.dal.js` | vc | dalSaveBookingServiceProfileDurationsByServiceIds |
| `vportAvailability.read.dal.js` | vport | dalListVportAvailabilityRulesByResourceId, dalListVportAvailabilityExceptionsInRange |
| `vportAvailability.write.dal.js` | vport | dalUpsertVportAvailabilityRule, dalUpsertVportAvailabilityException |
| `vportBooking.read.dal.js` | vport | dalGetVportBookingById, dalListVportBookingsInRange, dalListVportBookingsByResource |
| `vportBooking.write.dal.js` | vport | dalInsertVportBooking, dalUpdateVportBookingStatus |
| `vportResource.read.dal.js` | vport | dalGetVportResourceById, dalListVportResourcesByLocationId, dalListVportResourcesByOwnerActorId |
| `vportResource.write.dal.js` | vport | dalInsertVportResource |

### Model Layer (`src/model/`)

| File | Domain |
|---|---|
| `Booking.model.js` | Booking row mapper, status/source enums |
| `BookingAvailability.model.js` | Rule mapper, exception mapper, mapResourceAvailabilityModel (dual-resource) |
| `BookingResource.model.js` | Legacy vc.booking_resource mapper |
| `BookingServiceProfile.model.js` | Service profile mapper |
| `Location.model.js` | Location + member mappers |
| `Organization.model.js` | Organization + member + profile mappers |
| `QrLink.model.js` | QR link mapper (includes isActive) |
| `ResourceServiceOverride.model.js` | Override mapper + resolveServicePricing |
| `VportResource.model.js` | Vport resource mapper (includes profileId) |

### Controller Layer (`src/controller/`) — 27 controllers

| Controller | Purpose |
|---|---|
| `createBooking` | Create appointment — dual-routed by resource schema |
| `confirmBooking` | Transition pending → confirmed |
| `cancelBooking` | Transition to cancelled (owner or customer) |
| `completeBooking` | Transition confirmed → completed |
| `markNoShow` | Transition confirmed → no_show |
| `getResourceAvailability` | Fetch rules + exceptions + bookings + slots — dual-routed |
| `getLocationAvailability` | Aggregate availability across all resources at a location |
| `listBookingHistory` | List past bookings for an actor |
| `listOwnerBookingResources` | List vc.booking_resources for an actor |
| `ensureOwnerBookingResource` | Create vc.booking_resource if missing |
| `getBookingServiceProfiles` | Fetch service profile configs |
| `setAvailabilityRule` | Create/update weekly rule — dual-routed |
| `setAvailabilityException` | Create/update time block — dual-routed |
| `setResourceSlotDuration` | Sync duration across service profiles |
| `assertActorOwnsVportActor` | Permission: vc actor_owners chain |
| `assertActorCanManageOrganization` | Permission: vport.organizations ownership |
| `assertActorCanManageLocation` | Permission: vport.locations via organization |
| `assertActorCanManageResource` | Permission: vport.resources via profile |
| `listOrganizationsByOwnerActor` | List organizations for an actor |
| `createOrganizationLocationWorkspace` | Scaffold org + location + resource atomically |
| `listLocationsByOrganization` | List locations for an org |
| `listBookingResourcesByLocation` | List resources at a location |
| `listResourceServiceOverrides` | List service overrides for a resource |
| `upsertResourceServiceOverride` | Create/update service override |
| `resolveBookingContext` | Resolve resource + service + pricing from context mode |
| `createQrLink` | Create QR link with permission guard |
| `resolveQrScan` | Resolve slug → QrLink, optionally increment scan count |
| `listQrLinks` | List QR links by org / location / profile |

---

## RLS Summary

| Table | INSERT | SELECT | UPDATE | DELETE |
|---|---|---|---|---|
| `vport.bookings` | `bookings_insert_public_pending` (citizen + pending + public) + `bookings_insert_owner` (profile manager + management sources) | existing policies | existing policies | existing policies |
| `vport.availability_rules` | full CRUD RLS — profile managers | full CRUD RLS | full CRUD RLS | full CRUD RLS |
| `vport.availability_exceptions` | full CRUD RLS — profile managers | full CRUD RLS | full CRUD RLS | full CRUD RLS |
| `vc.bookings` | via RLS (owner/customer) | existing | existing | N/A |
| `vc.booking_availability_*` | via RLS | existing | existing | N/A |

**Pending migration to apply:** `apps/VCSM/supabase/migrations/20260426020000_vport_bookings_insert_rls.sql`

---

## Changes Since Previous Version

This is V1 — the first audit snapshot. It captures the state after the full engine extraction from `apps/VCSM/src/features/booking/` plus the dual-schema routing additions.

Key changes from the pre-extraction app-local system:
- Moved from `apps/VCSM/src/features/booking/` to `engines/booking/`
- Added organization, location, resource, QR, service override domain
- Added dual schema routing: vport resources → vport tables
- Added 4 new vport DAL files
- Fixed `vport.bookings` INSERT RLS gap
- Added permission controllers for org/location/resource management
- Added QR link system
- Booking context resolver (3 modes)
- `mapResourceAvailabilityModel` now accepts `isVportResource` flag

---

## Debug Notes

- `getResourceAvailability` has a 5-minute in-process cache keyed on `resourceId:rangeStart:rangeEnd:pub|own`. Call `invalidateBookingAvailability()` after writes that affect availability.
- `dalGetVportResourceById` is called speculatively (`.catch(() => null)`) to detect resource schema — treat `null` result as "vc resource", not as an error.
- `dalInsertVportBooking` requires `profile_id` — missing `profile_id` on the resource will throw before the INSERT. Ensure `vportResource.profile_id` is non-null before routing to the vport flow.
- `vport.bookings` INSERT policies use `vc.current_actor_id()` — the Supabase JWT must be present (authenticated session) for inserts to pass RLS.

---

## Verification Notes

- Dual routing confirmed correct by code inspection of `createBooking`, `getResourceAvailability`, `setAvailabilityRule`, `setAvailabilityException`.
- `vport.availability_rules` and `vport.availability_exceptions` table names confirmed via live RLS migration (`20260416140000_rls_vport_notification_platform.sql`).
- `vport.bookings.resource_id` FK confirmed from user correction — no new table required.
- `vport.resources.profile_id` confirmed from RLS policies using `r.profile_id` in `vport.actor_can_manage_profile`.

---

## Related Logan Docs

Canonical System Doc:
`zNOTFORPRODUCTION/logan/vcsm/booking/vcsm.booking.pipeline.md`
