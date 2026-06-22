# ARCHITECTURE — Dashboard Module: calendar

**Last ARCHITECT Run:** 2026-06-05
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: calendar
Application Scope: VCSM
Module Type: dashboard card module
Primary Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/
Independence Status: DEPENDENT
Completeness Status: INCOMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Renders the VPORT owner's availability calendar view from the dashboard. The calendar card is a thin shell screen — it delegates all data, components, and logic to the parent vport module's calendar components (`vport/components/calendar/`). This module itself contains only the screen entry point and barrel export.

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard (via vport module)
Write authority: delegated entirely to vport module
Ownership enforcement: delegated — no independent auth or write path in this card

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard/calendar` → VportDashboardCalendarScreen.jsx
- Route: `/vport/:actorId/dashboard/calendar` → redirect via VportToActorDashboardCalendarRedirect
- Exported via: `index.js`

---

## LAYER MAP

DAL: NONE in card — all reads delegated to vport module [SOURCE_VERIFIED]

Model: NONE in card [SOURCE_VERIFIED]

Controller: NONE in card [SOURCE_VERIFIED]

Hook: NONE in card [SOURCE_VERIFIED]

Component: NONE in card — components live at `vport/components/calendar/` [SOURCE_VERIFIED]
(DayBody, DayHeader, RangeToggle, ResourceDropdown, TimeBlock, TimeLabelsColumn, WeeklyAvailabilityGrid, WeeklyAvailabilityMobileGrid, WorkingHoursDayCard, calendarUtils)

Screen:
- `VportDashboardCalendarScreen.jsx` — entry point [SOURCE_VERIFIED]
- `index.js` — barrel [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Screen-only calendar card | Delegated |
| Owner defined | PARTIAL | Delegated to vport module | No independent owner declaration |
| Entry points mapped | PASS | Route confirmed in app.routes.jsx | — |
| Controllers present/delegated | FAIL | No controller in card; delegation path unclear | MISSING |
| DAL/repository present/delegated | FAIL | No DAL in card; delegation path unclear | MISSING |
| Models/transformers present | FAIL | No model in card | MISSING |
| Hooks/view models present | FAIL | No hook in card | MISSING |
| Screens/components present | PARTIAL | Screen present; all components in vport/components | — |
| Services/adapters present | FAIL | No adapter | MISSING |
| Database objects mapped | FAIL | Not documented in this module | MISSING |
| Authorization path mapped | FAIL | No auth in card; assumed delegated via route guard | MISSING |
| Cache/runtime behavior mapped | FAIL | Not documented | MISSING |
| Error/loading/empty states mapped | FAIL | Not in card | MISSING |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | FAIL | No tests in card | MISSING |
| Native parity noted | FAIL | No notes | MISSING |
| Engine dependencies mapped | FAIL | Not documented | MISSING |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| vport module | feature | calendar card → vport | RISK — card is thin shell, true logic in vport | Undocumented delegation |
| OwnerOnlyDashboardGuard | route | route wrapper | YES — route-level guard | Auth delegated to route layer |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Calendar data | read | vport module | calendar card screen | Not documented in card |
| Availability rules | read | vport/dal/read/vportAvailabilityRules | delegated | Not surfaced here |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /actor/:actorId/dashboard/calendar | — |
| Loading state | UNKNOWN | Delegated to vport components | Unverified |
| Empty state | UNKNOWN | Delegated | Unverified |
| Error state | UNKNOWN | Delegated | Unverified |
| Auth/owner gates | PASS | OwnerOnlyDashboardGuard at route level | — |
| Cache behavior | UNKNOWN | Not in card | — |
| Runtime dependencies | PARTIAL | vport module calendar components | Not explicitly declared |
| Hot paths | UNKNOWN | Not identified | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Architecture documentation of delegation pattern | HIGH | No documentation of what vport module owns vs calendar card | LOGAN |
| BEHAVIOR.md | HIGH | No behavioral contract | LOGAN |
| Controller/DAL boundary in vport for calendar | HIGH | Calendar reads/writes undocumented at card level | SENTRY |
| Tests | MEDIUM | No test coverage in card | SPIDER-MAN |
| Native parity | LOW | Not documented | Falcon |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/
Module: calendar
Current dependency: Calendar card is a pure shell — all logic is implicitly in vport module
Expected boundary: Calendar should own its hook, data contract, and document the delegation
Risk: MEDIUM — vport changes silently break calendar; no explicit contract between them
Suggested correction: Add useVportCalendar hook to card, explicitly delegating to vport module hooks

---

## FINAL MODULE STATUS: INCOMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Document delegation contract to vport | Silent dependency is an architecture risk | LOGAN |
| P1 | Add BEHAVIOR.md | No behavioral contract exists | LOGAN |
| P2 | Add hook to own data contract | Card is too thin — shell pattern without documentation is risky | IRONMAN |
| P3 | Add tests | Zero test coverage | SPIDER-MAN |

## RECOMMENDED HANDOFFS: LOGAN, SENTRY, IRONMAN, SPIDER-MAN
