# ARCHITECTURE — Dashboard Module: vport

**Last ARCHITECT Run:** 2026-06-05
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: vport
Application Scope: VCSM
Module Type: dashboard root module — orchestrator for all dashboard cards
Primary Root: apps/VCSM/src/features/dashboard/vport/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] The vport dashboard module is the orchestration root for all VPORT owner dashboard functionality. It provides: the main dashboard screen (`VportDashboardScreen.jsx`), shared DAL reads used across multiple cards (bookings, availability rules, resources, profile, cities), shared components (calendar components, booking history UI), VPORT ownership verification (`checkVportOwnership.controller.js`), and the card routing model (`dashboardViewByVportType.model.js`). All dashboard card modules (`cards/`) are children of this module.

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: updateVportBooking.write.dal.js (booking status), vportResource.write.dal.js (resources)
Ownership enforcement:
- `checkVportOwnership.controller.js` — dashboard access gate using `assertActorOwnsVportActorController`
- VPORT actor kind check (`actor.kind === "vport" && !actor.is_void`) for self-access
- `assertActorOwnsVportActorController` via `booking.adapter`

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard` → VportDashboardScreen.jsx
- Route: `/vport/:actorId/dashboard` → redirect via VportToActorDashboardRedirect
- All card routes nested under `/actor/:actorId/dashboard/*`
- Exported barrel: via vport module adapter/index

---

## LAYER MAP

DAL (read):
- `dal/read/actorOwners.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/actorVport.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/listVportBookingsForProfileDay.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/vportAvailabilityRules.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/vportBookingById.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/vportBookingsInRange.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/vportCities.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/vportProfile.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/vportProfileActorAccess.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/vportResource.read.dal.js` [SOURCE_VERIFIED]
- `dal/read/vportServices.read.dal.js` [SOURCE_VERIFIED]

DAL (write):
- `dal/write/updateVportBooking.write.dal.js` — UPDATE bookings [SOURCE_VERIFIED]
- `dal/write/vportResource.write.dal.js` — INSERT resources [SOURCE_VERIFIED]

Model:
- `model/buildDashboardCards.model.js` [SOURCE_VERIFIED]
- `model/dashboardViewByVportType.model.js` — card visibility routing by VPORT kind [SOURCE_VERIFIED]
- `model/dashboardVportDetails.model.js` [SOURCE_VERIFIED]
- `screens/model/buildDashboardCards.model.js` (duplicate — possible spaghetti) [SCANNER_LEAD]
- `screens/model/dashboardViewByVportType.model.js` (duplicate) [SCANNER_LEAD]
- `screens/model/vportBookingHistoryView.model.js` [SOURCE_VERIFIED]

Controller:
- `controller/checkVportOwnership.controller.js` — dashboard access gate [SOURCE_VERIFIED]
- `controller/vportOwnerStats.controller.js` — owner stats aggregation [SOURCE_VERIFIED]

Hook:
- `hooks/useOwnerQuickStats.js` [SOURCE_VERIFIED]
- `hooks/useVportOwnership.js` [SOURCE_VERIFIED]

Component (shared — used by cards):
- `components/VportLeadsChip.jsx`
- `components/bookingHistory/BookingCard.jsx`
- `components/bookingHistory/OperationalBookingCard.jsx`
- `components/bookingHistory/QuickBookingModal.jsx`
- `components/bookingHistory/TodayView.jsx`
- `components/calendar/DayBody.jsx`
- `components/calendar/DayHeader.jsx`
- `components/calendar/RangeToggle.jsx`
- `components/calendar/ResourceDropdown.jsx`
- `components/calendar/TimeBlock.jsx`
- `components/calendar/TimeLabelsColumn.jsx`
- `components/calendar/WeeklyAvailabilityGrid.jsx`
- `components/calendar/WeeklyAvailabilityMobileGrid.jsx`
- `components/calendar/WorkingHoursDayCard.jsx`
- `components/calendar/calendarUtils.js`
[All SOURCE_VERIFIED]

Screen:
- `screens/VportDashboardScreen.jsx` [SOURCE_VERIFIED]
- `screens/components/VportDashboardParts.jsx` [SOURCE_VERIFIED]
- `screens/lib/vportSettingsValidation.js` [SOURCE_VERIFIED]
- `screens/styles/vportDashboardShellStyles.js` [SOURCE_VERIFIED]

Adapter:
- `adapters/vport.adapter.js` [SOURCE_VERIFIED]

Style:
- `styles/dashboard-schedule-modern.css` [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Dashboard orchestrator with shared DAL + ownership | — |
| Owner defined | PASS | VCSM:dashboard | — |
| Entry points mapped | PASS | /actor/:actorId/dashboard + redirect confirmed | — |
| Controllers present/delegated | PASS | checkVportOwnership + vportOwnerStats | — |
| DAL/repository present/delegated | PASS | 11 read DALs + 2 write DALs | — |
| Models/transformers present | PARTIAL | 3 models + 3 screen-level model duplicates (spaghetti risk) | DUPLICATE MODELS |
| Hooks/view models present | PASS | useOwnerQuickStats + useVportOwnership | — |
| Screens/components present | PASS | Main screen + 15+ shared components | — |
| Services/adapters present | PASS | vport.adapter.js | — |
| Database objects mapped | PASS | bookings, resources — write-surface-map confirmed | — |
| Authorization path mapped | PASS | checkVportOwnership + assertActorOwnsVportActorController | — |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | PARTIAL | Components exist; not centrally documented | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PARTIAL | vportOwnerStats.controller.test.js | Limited coverage |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | PARTIAL | booking.adapter confirmed; others implied | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| booking.adapter | engine | vport → booking | YES — via adapter | assertActorOwnsVportActorController |
| notifications.adapter | engine | vport → notifications | YES — via adapter | Used in booking write path |
| vc.actors | database | vport → identity | YES | actor.kind, actor.is_void |
| bookings table | database | vport → bookings | YES — owned | UPDATE write |
| resources table | database | vport → resources | YES — owned | INSERT write |
| vport.profile_public_details | database | settings card → vport schema | YES — owned | UPSERT in settings card |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| bookings | read/write | VCSM:dashboard/vport | multiple cards | Status UPDATE, day-range READ |
| resources | read/write | VCSM:dashboard/vport | team, schedule, calendar | INSERT/UPDATE/DELETE |
| vport profile | read | vportProfile.read.dal | multiple controllers | profileId resolution |
| availability rules | read | vportAvailabilityRules.read.dal | schedule, calendar | Rule-based availability |
| actor ownership | read | actorOwners.read.dal | checkVportOwnership | actor_owners pattern |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /actor/:actorId/dashboard | — |
| Loading state | PARTIAL | Individual cards manage | Not centralized |
| Empty state | PARTIAL | Individual cards manage | Not centralized |
| Error state | PARTIAL | Controllers throw; cards handle locally | — |
| Auth/owner gates | PASS | checkVportOwnership.controller + OwnerOnlyDashboardGuard | — |
| Cache behavior | UNKNOWN | Not documented | — |
| Runtime dependencies | PASS | booking.adapter + notifications.adapter | — |
| Hot paths | PARTIAL | VportDashboardScreen load is hot; parallel card queries | KRAVEN — potential N+1 |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | Dashboard Security Sprint 2026-05-29 | PARTIAL |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md | HIGH | Dashboard orchestration undocumented | LOGAN |
| Duplicate model files (screens/model/ vs model/) | HIGH | buildDashboardCards.model.js and dashboardViewByVportType.model.js duplicated | SENTRY |
| Cache/runtime behavior | MEDIUM | Hot path undocumented | LOKI |
| N+1 risk on dashboard load | MEDIUM | Multiple card queries on open | KRAVEN |
| Native parity | LOW | Not documented | Falcon |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/screens/model/
Module: vport
Current dependency: buildDashboardCards.model.js and dashboardViewByVportType.model.js duplicated at screens/model/ AND model/
Expected boundary: Single model layer — screens should not re-declare models
Risk: MEDIUM — divergence risk; two copies of model may drift
Suggested correction: Consolidate to model/ directory; remove screens/model/ copies

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add BEHAVIOR.md | Dashboard orchestration undocumented | LOGAN |
| P1 | Remove duplicate model files | Drift risk in screens/model/ | SENTRY |
| P2 | Document cache/runtime | Hot path undocumented | LOKI |
| P2 | Review N+1 on dashboard open | Multiple parallel card queries | KRAVEN |
| P3 | Native parity notes | Not documented | Falcon |

## RECOMMENDED HANDOFFS: LOGAN, SENTRY, LOKI, KRAVEN
