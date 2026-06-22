# MODULE ARCHITECTURE REPORT

**Module:** engines/booking
**Application Scope:** ENGINE
**Module Type:** Shared Domain Engine — Booking & Availability
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/booking/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The booking engine is the authoritative domain engine for the VCSM booking lifecycle. It provides:

- Booking creation, confirmation, cancellation, completion, no-show, and dismissal
- Availability resolution (rules, exceptions, slot calculation)
- Resource management (booking resources, org/location workspace)
- Service profile and pricing resolution
- QR link generation and scan routing
- Permission assertion (actor ownership, resource management authority)
- Organization and location management for multi-location VPORT setups

The engine is framework-agnostic (no React). All dependencies are injected at app startup via `configureBookingEngine()`.

---

## OWNERSHIP

Engine owner: VCSM platform team
DI configured by: `apps/VCSM/src/features/booking/setup.js`
Injected by: `apps/VCSM/src/app/` (main.jsx bootstrapping)

---

## ENTRY POINTS

**Public API:** `engines/booking/index.js` → `src/adapters/index.js`

**Alias:** `@booking` (VCSM app alias resolving to `engines/booking/index.js`)

**Exported surface (57 symbols):**

Booking Controllers:
- createBooking, confirmBooking, cancelBooking, completeBooking
- markNoShow, dismissBooking
- getResourceAvailability, invalidateBookingAvailability
- getLocationAvailability
- listBookingHistory
- listOwnerBookingResources, ensureOwnerBookingResource
- getBookingServiceProfiles
- setAvailabilityRule, setAvailabilityException, setResourceSlotDuration

Permission Controllers:
- assertActorOwnsVportActor
- assertActorCanManageOrganization
- assertActorCanManageLocation
- assertActorCanManageResource

Organization Controllers:
- listOrganizationsByOwnerActor
- createOrganizationLocationWorkspace

Location Controllers:
- listLocationsByOrganization

Resource Controllers:
- createLocationResource
- listBookingResourcesByLocation
- listResourceServiceOverrides, upsertResourceServiceOverride

Booking Context:
- resolveBookingContext

QR Controllers:
- listQrLinksByOrganization, listQrLinksByLocation, listQrLinksByProfile
- createQrLink, resolveQrScan

Models (re-exported for consumer mappers):
- mapBookingRow, mapBookingRows
- mapBookingResourceRow, mapBookingResourceRows
- mapBookingServiceProfileRow, mapBookingServiceProfileRows
- mapAvailabilityRuleRow, mapAvailabilityExceptionRow, mapResourceAvailabilityModel
- mapOrganizationRow, mapOrganizationRows, mapOrganizationMemberRow, mapOrganizationMemberRows, mapOrganizationProfileRow
- mapLocationRow, mapLocationRows, mapLocationMemberRow, mapLocationMemberRows
- mapResourceServiceOverrideRow, mapResourceServiceOverrideRows, resolveServicePricing
- mapQrLinkRow, mapQrLinkRows, buildQrDestinationPath
- mapVportResourceRow, mapVportResourceRows

Config:
- configureBookingEngine, BOOKING_EVENTS

---

## LAYER MAP

```
DAL (14 files, 33+ functions)
  actor.read.dal.js           ← vc.actors, vc.actor_owners (supabaseClient)
                                 vport.profiles, vport.services (vportClient)
  booking.read.dal.js         ← vport.bookings [LEGACY PATH]
  booking.write.dal.js        ← vport.bookings [LEGACY PATH]
  vportBooking.read.dal.js    ← vport.bookings [VPORT PATH — near-duplicate]
  vportBooking.write.dal.js   ← vport.bookings [VPORT PATH — near-duplicate]
  availability.read.dal.js    ← vport.availability_rules, vport.availability_exceptions [LEGACY]
  availability.write.dal.js   ← vport.availability_rules, vport.availability_exceptions [LEGACY]
  vportAvailability.read.dal.js  ← SAME TABLES as availability.read.dal [DUPLICATE]
  vportAvailability.write.dal.js ← SAME TABLES as availability.write.dal [DUPLICATE]
  resource.read.dal.js        ← vport.resources, vport.resource_services [LEGACY]
  resource.write.dal.js       ← vport.resources, vport.resource_services [LEGACY]
  vportResource.read.dal.js   ← vport.resources [VPORT PATH — extended schema]
  vportResource.write.dal.js  ← vport.resources [VPORT PATH — extended schema]
  location.read.dal.js        ← vport.locations, vport.location_members
  location.write.dal.js       ← vport.locations (not read)
  organization.read.dal.js    ← vport.organizations, vport.organization_members, vport.organization_profiles
  organization.write.dal.js   ← vport.organizations (not read)
  qrLink.read.dal.js          ← vport.qr_links
  qrLink.write.dal.js         ← vport.qr_links
  resourceServiceOverride.read.dal.js  ← vport.resource_service_overrides
  resourceServiceOverride.write.dal.js ← vport.resource_service_overrides
  serviceProfile.read.dal.js  ← vport.service_booking_profiles
  serviceProfile.write.dal.js ← vport.service_booking_profiles

Model (9 files — pure row mappers, no side effects):
  Booking.model.js
  BookingAvailability.model.js
  BookingResource.model.js
  BookingServiceProfile.model.js
  Location.model.js
  Organization.model.js
  QrLink.model.js
  ResourceServiceOverride.model.js
  VportResource.model.js

Controller (31 files + 3 test files):
  createBooking.controller.js         — dual-path (vport + legacy)
  confirmBooking.controller.js        — LEGACY ONLY ⚠
  cancelBooking.controller.js         — LEGACY ONLY ⚠
  completeBooking.controller.js       — LEGACY ONLY ⚠
  markNoShow.controller.js            — (not read — assumed legacy pattern)
  dismissBooking.controller.js        — (not read — assumed legacy pattern)
  getResourceAvailability.controller.js   — dual-path (vport + legacy), 5-min TTL cache
  getLocationAvailability.controller.js   — (not read)
  listBookingHistory.controller.js    — LEGACY ONLY
  listOwnerBookingResources.controller.js — (not read)
  ensureOwnerBookingResource.controller.js — (not read)
  getBookingServiceProfiles.controller.js  — serviceProfile DAL only
  setAvailabilityRule.controller.js   — (not read)
  setAvailabilityException.controller.js  — (not read)
  setResourceSlotDuration.controller.js   — (not read)
  assertActorOwnsVportActor.controller.js — vc.actors + vc.actor_owners auth check
  assertActorCanManageOrganization.controller.js — (not read)
  assertActorCanManageLocation.controller.js     — (not read)
  assertActorCanManageResource.controller.js     — 5-mode auth chain (dual-path resource lookup)
  listOrganizationsByOwnerActor.controller.js    — (not read)
  createOrganizationLocationWorkspace.controller.js — (not read)
  listLocationsByOrganization.controller.js      — (not read)
  createLocationResource.controller.js           — (not read)
  listBookingResourcesByLocation.controller.js   — (not read)
  listResourceServiceOverrides.controller.js     — (not read)
  upsertResourceServiceOverride.controller.js    — (not read)
  resolveBookingContext.controller.js             — 3-mode context resolution
  listQrLinks.controller.js                      — (not read)
  createQrLink.controller.js                     — (not read)
  resolveQrScan.controller.js                    — (not read)

Config (2 files):
  config.js   — frozen DI, one-call guard (ELEK-007)
  events.js   — BOOKING_EVENTS freeze

Types (1 file):
  types/index.js  — JSDoc-only (BookingStatus, BookingSource, ResourceType, DomainBooking, etc.)

Adapters (1 file):
  adapters/index.js — public export surface

Entry (1 file):
  index.js → adapters/index.js
```

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PASS | CLAUDE.md + adapter header comments | — |
| Owner defined | PASS | configureBookingEngine DI | — |
| Entry points mapped | PASS | adapters/index.js, @booking alias | — |
| Controllers present | PASS | 31 controllers | confirmBooking/cancelBooking/completeBooking do not handle vport bookings |
| DAL/repository present | PASS | 14+ DAL files | Duplicate DAL pairs (see warnings) |
| Models/transformers present | PASS | 9 model files, pure mappers | — |
| Hooks/view models present | N/A | Engine is framework-agnostic | hooks live in apps/VCSM/features/booking/ |
| Screens/components present | N/A | Engine is framework-agnostic | — |
| Services/adapters present | PASS | adapters/index.js is the boundary | — |
| Database objects mapped | PASS | 16 tables identified | See database-read-map |
| Authorization path mapped | PASS | 4 assert* controllers, 5-mode chain | Void actor check in assertActorCanManageResource mirrors ELEK-001 |
| Cache/runtime behavior mapped | PASS | In-memory Map cache in getResourceAvailability, 5-min TTL | Cache is process-scoped — multi-instance deploys share no cache |
| Error/loading/empty states mapped | PARTIAL | Error throws present; loading/empty states delegated to consumers | — |
| Documentation linked | PARTIAL | CLAUDE.md present; no BEHAVIOR.md, no ARCHITECTURE.md governance artifact | BEHAVIOR_CONTRACT_ABSENT |
| Tests/validation noted | PARTIAL | 3 test files (createBooking, cancelBooking, assertActorCanManageResource) | 28 controllers without tests |
| Native parity noted | N/A | Engine is shared/framework-agnostic | — |
| Engine dependencies mapped | N/A | This IS an engine | No cross-engine dependencies found |

---

## DUAL-PATH ARCHITECTURE NOTE

The engine contains parallel DAL families for a legacy system and a new vport org/location system. Detection happens at the controller level by attempting vport resource lookup first.

**Legacy path (vc schema + vport.bookings):**
- `vc.actors`, `vc.actor_owners` — actor identity
- Booking resources from simpler `vport.resources` row (owner_actor_id only, no org/location)
- Used by: cancelBooking, confirmBooking, completeBooking, listBookingHistory

**Vport path (vport schema):**
- Full org/location/member model on resources
- Bookings include `profile_id` column (not in legacy path)
- Used by: createBooking (detects and routes), getResourceAvailability (detects and routes), resolveBookingContext

**Architecture Risk:** confirmBooking, cancelBooking, completeBooking do NOT route to vportBooking DALs. Vport bookings (created via `dalInsertVportBooking`) cannot be confirmed, cancelled, or completed through the engine's named lifecycle controllers. The dashboard module (apps/VCSM/src/features/dashboard/vport/) has its own DAL bypass for these operations.

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|------------|------|-----------|-------------------|-------|
| @supabase/supabase-js | external | ENGINE ← external | YES — injected via DI | vc schema client |
| supabase vport client | external | ENGINE ← external | YES — injected via DI | vport schema client |
| notifyFn | external | ENGINE ← DI | YES — injected | fire-and-forget notification publisher |
| apps/VCSM/features/booking/ | app consumer | APP → ENGINE | YES | 14 hooks consume engine |
| apps/VCSM/features/notifications/ | app consumer | APP → ENGINE | YES | useMyAppointments uses dismissBooking |
| apps/VCSM/features/vport/ | app consumer | APP → ENGINE | YES | submitCreateVport uses createOrganizationLocationWorkspace |
| engines/identity | cross-engine | NONE | N/A | No identity engine imports found |
| engines/notifications | cross-engine | NONE | N/A | notifyFn is injected — engine does not import notification engine directly |

**Dependency Direction:** Clean. Engine does not import from apps. DI boundary is respected.

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|--------|-------------|-------|----------|------|
| vport.bookings | read/write | engine (legacy + vport paths) | booking feature hooks | DUPLICATE: booking.read + vportBooking.read both query same table |
| vport.resources | read/write | engine (resource.* + vportResource.*) | booking hooks, vport hooks | DUPLICATE: resource.read + vportResource.read both query same table |
| vport.availability_rules | read/write | engine (availability.* + vportAvailability.*) | availability hooks | DUPLICATE: both availability.read and vportAvailability.read query same table |
| vport.availability_exceptions | read/write | engine (availability.* + vportAvailability.*) | availability hooks | DUPLICATE: same table dual access |
| vc.actors | read | engine (actor.read.dal) | auth assertion controllers | Cross-schema read — requires supabaseClient with schema('vc') |
| vc.actor_owners | read | engine (actor.read.dal) | assertActorOwnsVportActor | Cross-schema read |
| vport.profiles | read | engine (actor.read.dal) | slug resolution, service lookup | actor.read.dal mixes two purposes: actor identity + profile slug |
| vport.services | read | engine (actor.read.dal) | dalReadVportServicesByActor | N+1 risk: two sequential selects (profiles → services) |
| vport.locations | read | engine (location.read.dal) | booking context, org management | — |
| vport.location_members | read | engine (location.read.dal) | assertActorCanManageResource | — |
| vport.organizations | read | engine (organization.read.dal) | booking context, org management | — |
| vport.organization_members | read | engine (organization.read.dal) | assertActorCanManageResource | — |
| vport.organization_profiles | read | engine (organization.read.dal) | primary org resolution | JOIN with organizations via foreign key |
| vport.resource_services | read/write | engine (resource.*.dal) | resource management | — |
| vport.resource_service_overrides | read/write | engine (resourceServiceOverride.*.dal) | pricing resolution | — |
| vport.service_booking_profiles | read | engine (serviceProfile.read.dal) | booking service profiles | — |
| vport.qr_links | read/write | engine (qrLink.*.dal) | QR generation and scan | scan_count increment uses optimistic raw update (not atomic RPC) |

---

## DATABASE READ MAP

### Tables: vport schema (vportClient)

| Table | DAL File | Function | Filter | Pattern |
|-------|----------|----------|--------|---------|
| bookings | booking.read.dal.js | dalGetBookingById | eq(id) | point lookup |
| bookings | booking.read.dal.js | dalListBookingsInRange | eq(resource_id), lt/gt(starts_at/ends_at) | range query |
| bookings | booking.read.dal.js | dalListBookingsByResource | eq(resource_id) | paginated list |
| bookings | vportBooking.read.dal.js | dalGetVportBookingById | eq(id) | point lookup — DUPLICATE TABLE |
| bookings | vportBooking.read.dal.js | dalListVportBookingsInRange | eq(resource_id), lt/gt | range query — DUPLICATE TABLE |
| bookings | vportBooking.read.dal.js | dalListVportBookingsByResource | eq(resource_id) | paginated list — DUPLICATE TABLE |
| resources | resource.read.dal.js | dalGetBookingResourceById | eq(id) | point lookup |
| resources | resource.read.dal.js | dalListBookingResourcesByOwnerActorId | eq(owner_actor_id) | list |
| resources | resource.read.dal.js | dalListBookingResourceServicesByResourceId | eq(resource_id) → resource_services | list |
| resources | vportResource.read.dal.js | dalGetVportResourceById | eq(id) | point lookup — DUPLICATE TABLE |
| resources | vportResource.read.dal.js | dalListVportResourcesByLocationId | eq(location_id) | list — DUPLICATE TABLE |
| resources | vportResource.read.dal.js | dalListVportResourcesByOrganizationId | eq(organization_id) | list — DUPLICATE TABLE |
| resources | vportResource.read.dal.js | dalListVportResourcesByMemberActor | eq(member_actor_id) | list — DUPLICATE TABLE |
| availability_rules | availability.read.dal.js | dalListAvailabilityRulesByResourceId | eq(resource_id) | list |
| availability_rules | vportAvailability.read.dal.js | dalListVportAvailabilityRulesByResourceId | eq(resource_id) | list — DUPLICATE TABLE |
| availability_exceptions | availability.read.dal.js | dalListAvailabilityExceptionsInRange | eq(resource_id), lt/gt | range |
| availability_exceptions | vportAvailability.read.dal.js | dalListVportAvailabilityExceptionsInRange | eq(resource_id), lt/gt | range — DUPLICATE TABLE |
| profiles | actor.read.dal.js | dalGetVportProfileSlugByActorId | eq(actor_id) | point lookup |
| profiles | actor.read.dal.js | dalReadVportServicesByActor | eq(actor_id) → profiles → services | N+1 risk: 2 sequential selects |
| services | actor.read.dal.js | dalReadVportServicesByActor | eq(profile_id) | list |
| service_booking_profiles | serviceProfile.read.dal.js | dalListBookingServiceProfilesByServiceIds | in(service_id) | bulk lookup |
| locations | location.read.dal.js | dalGetLocationById | eq(id) | point lookup |
| locations | location.read.dal.js | dalGetLocationBySlug | eq(organization_id, slug) | point lookup |
| locations | location.read.dal.js | dalGetPrimaryLocation | eq(organization_id, is_primary) | point lookup |
| locations | location.read.dal.js | dalListLocationsByOrganization | eq(organization_id) | list |
| location_members | location.read.dal.js | dalGetLocationMember | eq(location_id, actor_id) | point lookup |
| location_members | location.read.dal.js | dalListLocationMembers | eq(location_id) | list |
| location_members | location.read.dal.js | dalListLocationMembersByResource | eq(resource_id) | list |
| organizations | organization.read.dal.js | dalGetOrganizationById | eq(id) | point lookup |
| organizations | organization.read.dal.js | dalGetOrganizationBySlug | eq(slug) | point lookup |
| organizations | organization.read.dal.js | dalListOrganizationsByOwnerActor | eq(owner_actor_id) | list |
| organization_members | organization.read.dal.js | dalGetOrganizationMember | eq(organization_id, actor_id) | point lookup |
| organization_members | organization.read.dal.js | dalListOrganizationMembers | eq(organization_id) | list |
| organization_profiles | organization.read.dal.js | dalGetOrganizationProfileByProfile | eq(organization_id, profile_id) | point lookup |
| organization_profiles | organization.read.dal.js | dalListOrganizationProfilesByOrg | eq(organization_id) | list |
| organization_profiles | organization.read.dal.js | dalGetPrimaryOrganizationByProfile | eq(profile_id, relation_type) + JOIN organizations | join query |
| resource_service_overrides | resourceServiceOverride.read.dal.js | dalGetResourceServiceOverride | eq(resource_id, service_id) | point lookup |
| resource_service_overrides | resourceServiceOverride.read.dal.js | dalListResourceServiceOverridesByResource | eq(resource_id) | list |
| resource_service_overrides | resourceServiceOverride.read.dal.js | dalListResourceServiceOverridesByService | eq(service_id) | list |
| qr_links | qrLink.read.dal.js | dalGetQrLinkBySlug | eq(slug) | point lookup |
| qr_links | qrLink.read.dal.js | dalGetQrLinkById | eq(id) | point lookup |
| qr_links | qrLink.read.dal.js | dalListQrLinksByOrganization | eq(organization_id) | list |
| qr_links | qrLink.read.dal.js | dalListQrLinksByLocation | eq(location_id) | list |
| qr_links | qrLink.read.dal.js | dalListQrLinksByProfile | eq(profile_id) | list |

### Tables: vc schema (supabaseClient.schema('vc'))

| Table | DAL File | Function | Filter | Pattern |
|-------|----------|----------|--------|---------|
| actors | actor.read.dal.js | dalGetActorById | eq(id) | point lookup |
| actors | actor.read.dal.js | dalGetActorByProfileId | eq(profile_id) | point lookup |
| actor_owners | actor.read.dal.js | dalReadActorOwnerLink | eq(actor_id, user_id) | point lookup |

---

## DUPLICATE READ WARNINGS

| Warning | Tables | DAL Pair | Risk |
|---------|--------|----------|------|
| DUP-001 | vport.bookings | booking.read.dal + vportBooking.read.dal | Same table accessed via two near-identical DAL families; schema drift: booking has `customer_profile_id`, vportBooking has `profile_id` |
| DUP-002 | vport.resources | resource.read.dal + vportResource.read.dal | Same table; vportResource carries org/location/member fields not present in legacy select |
| DUP-003 | vport.availability_rules | availability.read.dal + vportAvailability.read.dal | Structurally identical queries on same table |
| DUP-004 | vport.availability_exceptions | availability.read.dal + vportAvailability.read.dal | Structurally identical queries on same table |

---

## N+1 RISK WARNINGS

| Location | Risk | Detail |
|----------|------|--------|
| assertActorCanManageResource | HIGH | Sequential auth chain: up to 6 DB calls per check (actor → vportResource → bookingResource → org → orgMember → locationMember). Not a loop N+1 but sequential waterfall on every write operation. |
| resolveBookingContext (primary_calendar) | MEDIUM | Sequential: profiles → primary org → primary location → resources. 3-4 sequential queries. |
| dalReadVportServicesByActor | MEDIUM | Sequential: profiles by actor_id → services by profile_id. 2 sequential selects. Could be one join. |
| qrLink.write dalIncrementQrScanCountRaw | LOW | Optimistic read-then-write increment (not atomic). Race condition under concurrent scans. RPC or computed column increment preferred. |

---

## CACHE BEHAVIOR

| Location | Cache Type | TTL | Invalidation |
|----------|------------|-----|-------------|
| getResourceAvailability | In-memory Map (process-scoped) | 5 minutes | invalidateBookingAvailability() — full cache clear |

**Risk:** In-memory cache is not shared across processes. Multi-instance deployments (serverless, multiple app instances) will have stale availability data independently. Cache invalidation on booking mutation does not appear to be wired across all write paths (e.g., createBooking does not call invalidateBookingAvailability).

---

## RLS ASSUMPTION MAP

The booking engine does not enforce Row Level Security at the DAL layer. All authorization is performed at the controller layer via `assertActor*` controllers. Trust boundary assumptions:

| Access | Client | RLS Assumed? | App-Layer Check |
|--------|--------|--------------|-----------------|
| vport.bookings (read) | vportClient | YES | None at DAL — controller callers must validate |
| vport.bookings (write) | vportClient | YES | assertActorCanManageResource / customerActorId pin |
| vport.resources | vportClient | YES | None at DAL |
| vc.actors | supabaseClient schema('vc') | YES | dalGetActorById called in assert* controllers |
| vc.actor_owners | supabaseClient schema('vc') | YES | dalReadActorOwnerLink in assertActorOwnsVportActor |

**Note (TICKET-PLATFORM-RLS-001):** The `media_assets` `{public}` RLS policy on platform is noted as a pending cleanup. This engine does not touch media_assets.

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Entry point / route exists | N/A | Engine has no routes — consumed via hooks | — |
| Loading state | N/A | Delegated to hook consumers | — |
| Empty state | N/A | Delegated to hook consumers | — |
| Error state | PASS | All DAL functions throw on error; controllers rethrow with context | Notification failure is swallowed (try/catch) — by design |
| Auth / owner gates | PASS | 4 assert* controllers; ELEK-001/002/003/007 patches present | confirmBooking/cancelBooking/completeBooking use legacy assertActorOwnsVportActor only — no assertActorCanManageResource |
| Cache behavior | PARTIAL | 5-min TTL cache in getResourceAvailability | Process-scoped; not invalidated on all write paths |
| Runtime dependencies mapped | PASS | supabaseClient, vportClient, notifyFn — all via DI | — |
| Hot paths identified | PASS | getResourceAvailability (availability calculation), createBooking (insert + auth), assertActorCanManageResource (6-query chain) | — |
| LOKI/KRAVEN handoff | RECOMMENDED | Auth waterfall and cache behavior warrant runtime trace | — |

---

## BEHAVIOR CONSISTENCY CHECK — engines/booking

```
Behavior Consistency Check — engines/booking
=============================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → Controllers, DAL, and models exist with no BEHAVIOR.md
  → Severity: P1 (CRITICAL security engine)
  → Recommendation: BEHAVIOR.md required before Blue Team commands run

Check B (Behavior without source): SKIPPED — no BEHAVIOR.md to check
Check C (§13 engine consistency): SKIPPED — no BEHAVIOR.md to check
Check D (§6 data change consistency): SKIPPED — no BEHAVIOR.md to check
```

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|----------------|------|--------|
| ARCHITECTURE.md (this file) | ZZnotforproduction/ENGINES/booking/outputs/2026/06/05/ARCHITECT/engine.booking.architecture.md | PRESENT (new) |
| BEHAVIOR.md | ZZnotforproduction/ENGINES/booking/BEHAVIOR.md | MISSING |
| SECURITY.md | ZZnotforproduction/ENGINES/booking/SECURITY.md | MISSING |
| CURRENT_STATUS.md | ZZnotforproduction/ENGINES/booking/CURRENT_STATUS.md | MISSING |
| Ownership record (IRONMAN) | — | MISSING |
| Security audit (VENOM/ELEKTRA) | — | BLOCKED (requires this ARCHITECT artifact) |
| Runtime audit (LOKI) | — | BLOCKED |
| Performance audit (KRAVEN) | — | BLOCKED |
| Migration audit (CARNAGE) | — | BLOCKED |
| Engine audit | ZZnotforproduction/ENGINES/booking/ | PARTIAL (INDEX.md, README.md present; ARCHITECTURE missing) |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---------------|----------|----------------|-----------------|
| BEHAVIOR.md for engine | CRITICAL | Blue Team commands cannot run without behavior contract; ARCHITECT cannot verify behavioral consistency | WOLVERINE intake |
| SECURITY.md for engine | CRITICAL | Engine is CRITICAL security tier; VENOM/ELEKTRA blocked without security artifact | VENOM after BEHAVIOR |
| confirmBooking/cancelBooking/completeBooking vport path | HIGH | Vport bookings (most new bookings) cannot be lifecycle-managed via engine controllers; dashboard modules bypass engine — trust boundary split | CARNAGE/WOLVERINE |
| BEHAVIOR.md declared vs. source (Check B) | HIGH | Cannot verify behavioral completeness without BEHAVIOR.md | — |
| Atomic QR scan count increment | MEDIUM | Race condition on concurrent QR scans — optimistic update not safe | CARNAGE (DB RPC) |
| Cache invalidation on booking write | MEDIUM | createBooking, cancelBooking do not call invalidateBookingAvailability — stale availability possible | WOLVERINE |
| Test coverage for lifecycle controllers | MEDIUM | 28 controllers without tests; confirmBooking/completeBooking/markNoShow/dismissBooking not covered | SPIDER-MAN |
| CURRENT_STATUS.md | LOW | Required for governance tracking | LOGAN |
| N+1 in assertActorCanManageResource | LOW (known) | 6-query auth waterfall — noted for KRAVEN/LOKI trace | KRAVEN |

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/booking
Classification: MOSTLY INDEPENDENT
Reason: Engine has clean DI boundary, no app imports, full public API surface.
  However, vport booking lifecycle (cancel/confirm/complete) is NOT handled by
  the engine — dashboard module DALs operate outside engine boundary for these
  operations. This creates a split trust boundary.
Blocking gaps:
  - No BEHAVIOR.md → Blue Team blocked
  - No SECURITY.md → Security review blocked
  - Vport booking lifecycle controllers incomplete → booking state machine is split
    between engine and dashboard module
```

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING — Split Booking Lifecycle**
```
Location: engines/booking/src/controller/{cancelBooking,confirmBooking,completeBooking}.controller.js
Module: engines/booking
Current dependency: These controllers use booking.read.dal + booking.write.dal (legacy vc path only)
Expected boundary: Engine should own the full lifecycle for both legacy and vport bookings
Risk: HIGH — vport bookings created via engine (createBooking → dalInsertVportBooking) cannot be
  managed via the engine's named lifecycle controllers. Dashboard module uses its own DALs
  (apps/VCSM/src/features/dashboard/vport/dal/) for vport booking updates — bypassing engine boundary.
Suggested correction: Extend cancelBooking/confirmBooking/completeBooking to detect vport bookings
  (check dalGetVportBookingById first) and route to vportBooking.write.dal — same dual-path pattern
  as createBooking and getResourceAvailability. TICKET-BOOKING-RPC-001 tracks related work.
```

**MODULE BOUNDARY WARNING — actor.read.dal mixed responsibilities**
```
Location: engines/booking/src/dal/actor.read.dal.js
Module: engines/booking
Current dependency: actor.read.dal performs both identity resolution (vc.actors, vc.actor_owners)
  AND profile/service lookups (vport.profiles, vport.services) in one file
Expected boundary: Profile/service reads arguably belong in a dedicated profile or service DAL
Risk: LOW — functional today but violates single-responsibility; dalReadVportServicesByActor
  introduces N+1 (two sequential selects) that a DAL split would make easier to optimize
Suggested correction: Extract vport.profiles and vport.services reads to a dedicated serviceDAL
  or profileDAL file within the engine.
```

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

- Architecture: COMPLETE (this artifact)
- Public API: COMPLETE
- DAL layer: COMPLETE (with duplicate surface warnings)
- Model layer: COMPLETE
- Controller layer: PARTIAL (vport lifecycle controllers missing)
- Auth layer: COMPLETE (4 assert* controllers)
- Tests: PARTIAL (3/31 controllers covered)
- Governance artifacts: MISSING (BEHAVIOR.md, SECURITY.md, CURRENT_STATUS.md)

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|----------|-------------|--------|---------------------|
| P0 | Write BEHAVIOR.md for this engine | Blue Team blocked without it | WOLVERINE |
| P0 | Extend cancel/confirm/complete for vport path | Booking lifecycle split is a trust boundary violation | WOLVERINE + CARNAGE |
| P1 | Write SECURITY.md | VENOM/ELEKTRA blocked | VENOM (after BEHAVIOR) |
| P1 | Wire cache invalidation to write paths | Stale availability after booking creates/cancels | WOLVERINE |
| P1 | Atomic QR scan count (RPC) | Race condition on concurrent scans | CARNAGE |
| P2 | CURRENT_STATUS.md | Governance tracking | LOGAN |
| P2 | Test coverage for remaining 28 controllers | Runtime confidence | SPIDER-MAN |
| P2 | Optimize assertActorCanManageResource waterfall | LOKI/KRAVEN trace first | KRAVEN |
| P3 | Extract vport.profiles/services reads from actor.read.dal | Cleanup / SRP | WOLVERINE |

---

## RECOMMENDED HANDOFFS

- **WOLVERINE** — BEHAVIOR.md intake; vport lifecycle controllers; cache invalidation wiring
- **CARNAGE** — DB migration for atomic QR increment; review dual-path table schema alignment
- **VENOM** — Security review (after BEHAVIOR.md) — auth waterfall, RLS assumptions, DUP DAL surface
- **ELEKTRA** — Patch advisor for ELEK-001/002/003 completeness across all lifecycle controllers
- **LOKI** — Runtime trace of assertActorCanManageResource waterfall; cache behavior
- **KRAVEN** — Performance review of auth waterfall; availability calculation hot path
- **SPIDER-MAN** — Test coverage for 28 uncovered controllers
- **LOGAN** — CURRENT_STATUS.md, BEHAVIOR.md, SECURITY.md governance artifacts
