# Dashboard Module Behavior Contract — vport

Status: PARTIAL

Module: vport

Parent Feature: dashboard

Category Key: dashboard

Created By: LOGAN — structural fix 2026-06-04
Updated By: LOGAN — TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001 (2026-06-05)
Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

Last Updated: 2026-06-05

Architecture Status: MOSTLY COMPLETE (ARCHITECT wave 2026-06-05)

Security Tier: HIGH

Current Security Status:
- THOR: NOT EVALUATED
- Open Findings: Duplicate models (screens/model/ copies), N+1 risk on dashboard load
- Security Review Status:
  - VENOM: PARTIAL — Dashboard Security Sprint 2026-05-29 covered shell; module-level audit pending
  - ELEKTRA: PARTIAL
  - BLACKWIDOW: NOT RUN

---

## Notice

This BEHAVIOR.md is a structural stub. The `vport` dashboard module is the shared
infrastructure layer under `apps/VCSM/src/features/dashboard/vport/`. It contains
shared DALs, controllers, adapters, and hooks consumed by the individual dashboard
card modules (bookings, calendar, gasprices, schedule, team, vportOwnerStats, etc.).

A full behavior contract requires source reading by PROFESSOR X or ARCHITECT before
this file can reach REVIEWED or APPROVED status.

---

## 1. User Goal

The `vport` dashboard module provides the shared VPORT owner infrastructure that
underpins all dashboard card modules. It handles:

- VPORT profile resolution for the dashboard context
- Shared availability rule DALs
- Shared resource DALs
- Shared booking write DALs
- Dashboard adapter layer (`vport.adapter.js`) used by profile screens to access
  dashboard-domain hooks without direct cross-feature imports

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner | Access shared dashboard infrastructure through card modules | Must pass ownership gate on all write surfaces |
| Non-owner | None — all write surfaces require ownership verification | No direct access |

---

## 3. Module Architecture

### Source Path

`apps/VCSM/src/features/dashboard/vport/`

### Known Sub-surfaces (from branch scope)

- `controller/vportOwnerStats.controller.js` — owned by vportOwnerStats module
- `dal/read/vportAvailabilityRules.read.dal.js` — shared by calendar module
- `dal/read/vportResource.read.dal.js` — shared by calendar and bookings
- `dal/write/updateVportBooking.write.dal.js` — shared by bookings module
- `adapters/vport.adapter.js` — cross-feature adapter used by profiles feature
- `hooks/useOwnerQuickStats.js` — owned by vportOwnerStats module

### Engine Dependencies

UNKNOWN — source read required.

### Ownership Gates

UNKNOWN — individual card modules each assert ownership before calling shared DALs.
Whether the shared DALs themselves enforce ownership is unverified at this module level.

---

## 4. Security Rules

### SEC-001 — Shared DALs Must Not Be Called Without Prior Ownership Verification

Rule:
Any shared DAL in `dashboard/vport/dal/` must only be called after the consuming
card module's controller has verified actor ownership.

Enforcement Layer:
Individual card module controllers (bookings, calendar, gasprices, etc.).

Current Status:
UNVERIFIED AT MODULE LEVEL — individual modules assert ownership before calling
shared DALs, but this module has not been independently audited.

---

## 5. Must Never Happen

### MNH-001

Invariant:
A shared read DAL must never be invoked with an unverified `profileId` or `actorId`
from a public or unauthenticated surface.

Current Status:
UNVERIFIED — source read by VENOM required.

---

## 6. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| BEHAVIOR.md present | DRAFT | NO — stub is structural fix |
| VENOM run | NOT RUN | YES — HIGH tier module requires VENOM |
| ARCHITECT run | NOT RUN | YES — hard THOR blocker |
| SPIDER-MAN run | NOT RUN | YES — write DALs in scope |

---

## 7. Open Questions

| ID | Question |
|---|---|
| OQ-DASH-vport-001 | Do shared DALs enforce RLS independently, or do they rely on calling modules for ownership? |
| OQ-DASH-vport-002 | Is `vport.adapter.js` the only cross-feature import point into this module? |
| OQ-DASH-vport-003 | Should this module have its own BEHAVIOR.md sections independent of the card modules that use its DALs? |

---

## 8. Architecture Map (ARCHITECT Wave 2026-06-05)

ARCHITECT V2 has now run on this module. The following is confirmed [ARCHITECT_VERIFIED]:

### Layer Map
- 11 read DALs: actorOwners, actorVport, listVportBookingsForProfileDay, vportAvailabilityRules, vportBookingById, vportBookingsInRange, vportCities, vportProfile, vportProfileActorAccess, vportResource, vportServices
- 2 write DALs: updateVportBooking (bookings table), vportResource (resources table)
- 2 controllers: checkVportOwnership, vportOwnerStats
- 2 hooks: useOwnerQuickStats, useVportOwnership
- 3 models: buildDashboardCards, dashboardViewByVportType, dashboardVportDetails
- 1 adapter: vport.adapter.js
- 15+ shared components (bookingHistory, calendar)
- 1 main screen: VportDashboardScreen.jsx

### Write Surfaces

| Table | Operation | Controller | Ownership Gate |
|---|---|---|---|
| bookings | UPDATE | updateVportBooking.write.dal (via bookings card) | assertActorOwnsVportActorController |
| resources | INSERT | vportResource.write.dal (via team card) | assertActorOwnsVportActorController |

### Ownership Verification

[ARCHITECT_VERIFIED] — `checkVportOwnership.controller.js`:
- Self-access: actor.kind === "vport" && !actor.is_void — navigation gate only, no writes
- Full ownership: `assertActorOwnsVportActorController` via booking.adapter
- DB-backed: YES — actor_owners table

### Identified Architecture Issues

1. Duplicate model files [ARCHITECT_VERIFIED]: `buildDashboardCards.model.js` and `dashboardViewByVportType.model.js` exist at both `model/` AND `screens/model/` — drift risk
2. Cross-module DAL imports: bookings, schedule, team cards import vport DALs directly — boundary violations documented in each card's ARCHITECTURE.md
3. N+1 risk: VportDashboardScreen loads multiple data sources in parallel on mount — KRAVEN audit recommended

---

## 9. Known Gaps

| Gap | Severity | Source | Handoff |
|---|---|---|---|
| BEHAVIOR.md previously a stub — now PARTIAL | HIGH | ARCHITECT wave 2026-06-05 | LOGAN |
| Duplicate model files (screens/model/ vs model/) | HIGH | ARCHITECT_VERIFIED | SENTRY |
| Cross-module DAL imports by card modules | HIGH | ARCHITECT_VERIFIED | SENTRY |
| VENOM/BLACKWIDOW audit not run at vport module level | HIGH | Security gap | VENOM |
| N+1 risk on VportDashboardScreen mount | MEDIUM | ARCHITECT_VERIFIED | KRAVEN |
| Cache/runtime behavior undocumented | MEDIUM | ARCHITECT_VERIFIED | LOKI |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: 1 test file (vportOwnerStats.controller.test.js) — coverage incomplete for module scope.

---

## 10. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vport/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §6 BEH-DASHBOARD-FEATURE-001, §9
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_PARTIAL — ARCHITECT data incorporated. Full source-verified BEHAVIOR requires VENOM + SENTRY audit.
