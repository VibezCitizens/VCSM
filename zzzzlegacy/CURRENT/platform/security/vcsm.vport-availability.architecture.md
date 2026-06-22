# MODULE ARCHITECTURE REPORT

**Module:** vcsm.vport-availability  
**Application Scope:** VCSM + ENGINE  
**Module Type:** Sub-module — VPORT Availability Rules + Schedule Management  
**Primary Root:** `apps/VCSM/src/features/dashboard/vport/` (availability sub-system)  
**Engine Root:** `engines/booking/src/` (availability DALs + setAvailabilityRule controller)  
**Independence Status:** DEPENDENT (on vcsm.booking module and engine)  
**Completeness Status:** MOSTLY COMPLETE — Post RC-01 and RC-06 security fix pass  
**Last Updated:** 2026-05-14 (Post Cerebro P0 audit — vport-booking-feed-security-updates branch)

---

## PURPOSE

Manages the availability rule write path for VPORT owner accounts: setting working hours (weekly rules), managing exceptions, and rendering the owner-facing availability calendar/schedule. Delegates read-heavy aggregation to `loadDayScheduleController` and write operations to `manageVportAvailabilityRuleController`. The availability system gates which time slots are bookable by customers.

The module covers two distinct UI surfaces:
1. **Calendar settings** (`VportDashboardCalendarScreen`) — manages weekly availability rules per resource
2. **Schedule view** (`VportDashboardScheduleScreen`) — day-by-day booking + availability grid for the owner

---

## OWNERSHIP

| Domain | Owner |
|---|---|
| Availability rule write | `dashboard/vport/controller/manageVportAvailabilityRule.controller.js` |
| Availability rule read | `dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js` |
| Schedule day assembly | `dashboard/vport/controller/loadDaySchedule.controller.js` |
| Availability read (public, range) | `dashboard/vport/controller/vportPublicBooking.controller.js::getVportResourceAvailabilityController` |
| Availability calendar UI | `dashboard/vport/screens/VportDashboardCalendarScreen.jsx` |
| Schedule UI | `dashboard/vport/screens/VportDashboardScheduleScreen.jsx` |
| Engine availability (org/location path) | `engines/booking/src/controller/setAvailabilityRule.controller.js` |

---

## ENTRY POINTS

| Entry Point | Type | Path | Notes |
|---|---|---|---|
| `VportDashboardCalendarScreen` | Screen | `dashboard/vport/screens/VportDashboardCalendarScreen.jsx` | Availability rule management UI |
| `VportDashboardScheduleScreen` | Screen | `dashboard/vport/screens/VportDashboardScheduleScreen.jsx` | Day schedule grid |
| `useVportManageAvailability` | Hook | `dashboard/vport/hooks/useVportManageAvailability.js` | Write hook — RC-06 fixed |
| `useVportResourceAvailability` | Hook | `dashboard/vport/hooks/useVportResourceAvailability.js` | Read hook |
| `useVportOwnerSchedule` | Hook | `dashboard/vport/hooks/useVportOwnerSchedule.js` | Full day schedule state + mutations |

---

## LAYER MAP

### DAL

| File | Tables | Direction | Notes |
|---|---|---|---|
| `dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js` | `vport.availability_rules` | READ | Filters `is_active = true`, ordered by weekday + start_time |
| `dashboard/vport/dal/write/vportAvailabilityRules.write.dal.js` | `vport.availability_rules` | WRITE | Upsert: update by `id` (existing rule) or insert (new rule); explicit column list |
| `engines/booking/src/dal/vportAvailability.read.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | READ | Engine version — supports `includeInactive`, range-based exception reads |
| `engines/booking/src/dal/vportAvailability.write.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | WRITE | Engine version — upsert on conflict `id` |
| `engines/booking/src/dal/availability.read.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | READ | Legacy/org-booking DAL — separate from vport DAL |
| `engines/booking/src/dal/availability.write.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | WRITE | Legacy/org-booking DAL |
| `dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal.js` | `vport.bookings` | READ | Batch read for all staff resources in a day — used by schedule controller |
| `dashboard/vport/dal/read/vportBookingsInRange.read.dal.js` | `vport.bookings` | READ | Range query per resource |

### Model

| File | Purpose | Notes |
|---|---|---|
| `dashboard/vport/model/vportAvailabilityRule.model.js` | `mapAvailabilityRule(r)` — DB row to domain object | Used by `useVportResourceAvailability` hook |
| `engines/booking/src/model/BookingAvailability.model.js` | `mapAvailabilityRuleRow`, `mapAvailabilityExceptionRow`, `mapResourceAvailabilityModel` | Engine model — richer than dashboard model |

### Controller

| File | Post-Fix State | Ownership Assert | Notes |
|---|---|---|---|
| `dashboard/vport/controller/manageVportAvailabilityRule.controller.js` | RC-01 FIXED | `assertActorOwnsVportActorController` via `booking.adapter.js` | Accepts `callerActorId` + `ownerActorId` |
| `dashboard/vport/controller/loadDaySchedule.controller.js` | Clean (no ownership assert) | NONE | Read-only; resolves actorId → profileId → resources → rules + bookings |
| `dashboard/vport/controller/vportPublicBooking.controller.js::getVportResourceAvailabilityController` | Clean | NONE | Public read — rules + bookings in range; no auth required |
| `engines/booking/src/controller/setAvailabilityRule.controller.js` | Clean | `assertActorOwnsVportActor` or `assertActorCanManageResource` | Dual-path: vport resource vs org resource |
| `engines/booking/src/controller/setAvailabilityException.controller.js` | Present | Ownership asserted | Exception write path (engine) |

### Hook

| File | Post-Fix State | Dependencies | Notes |
|---|---|---|---|
| `useVportManageAvailability.js` | RC-06 FIXED | `manageVportAvailabilityRuleController` | Forwards `callerActorId` + `ownerActorId`; thin `useCallback` wrapper |
| `useVportResourceAvailability.js` | Clean | `getVportResourceAvailabilityController`, `mapAvailabilityRule` | Read-only; public-safe |
| `useVportOwnerSchedule.js` | Clean | `loadDayScheduleController`, `createOwnerBookingController`, `updateBookingStatusController`, `rescheduleBookingController` | Full schedule state machine — date navigation + booking CRUD |
| `useManageAvailability.js` (booking feature) | Clean | engine `setAvailabilityRule` via `@booking` | Separate engine-backed write path — NOT the same as `useVportManageAvailability` |

### Component

| File | Role |
|---|---|
| `components/calendar/WeeklyAvailabilityGrid.jsx` | Grid display for weekly working hours |
| `components/calendar/WorkingHoursDayCard.jsx` | Single-day availability card |
| `components/calendar/DayBody.jsx` | Day column body |
| `components/calendar/DayHeader.jsx` | Day column header |
| `components/calendar/RangeToggle.jsx` | Time range toggle |
| `components/calendar/ResourceDropdown.jsx` | Staff resource selector |
| `components/calendar/TimeBlock.jsx` | Single time block |
| `components/calendar/TimeLabelsColumn.jsx` | Time labels (left column) |
| `components/calendar/calendarUtils.js` | Calendar math utilities |
| `screens/components/schedule/ScheduleGrid.jsx` | Desktop/mobile day grid |
| `screens/components/schedule/ScheduleModals.jsx` | Create + detail booking modals |
| `screens/components/schedule/ScheduleOperationalView.jsx` | Mobile operational view |
| `screens/components/schedule/scheduleConstants.js` | Grid constants |
| `screens/components/schedule/scheduleTimeUtils.js` | Time formatting |
| `screens/components/schedule/ScheduleLaneElements.jsx` | Lane rendering elements |
| `screens/components/schedule/BarberLaneHeader.jsx` | Per-barber lane header |

### Screen

| File | Route | Auth Gate |
|---|---|---|
| `VportDashboardCalendarScreen.jsx` | `/actor/:actorId/dashboard/calendar` | Owner route — implicitly gated |
| `VportDashboardScheduleScreen.jsx` | `/actor/:actorId/dashboard/schedule` | Owner route — implicitly gated |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Availability rules + schedule management for VPORT owners | |
| Owner defined | PASS | `manageVportAvailabilityRuleController` owns write path | |
| Entry points mapped | PASS | Two screens + three hooks | |
| Controllers present/delegated | PASS | Write and read controllers both present | |
| DAL/repository present/delegated | PASS | Read + write DALs with explicit column selects | |
| Models/transformers present | PARTIAL | `mapAvailabilityRule` present; no exception model in dashboard layer | |
| Hooks/view models present | PASS | `useVportManageAvailability`, `useVportResourceAvailability`, `useVportOwnerSchedule` all present | |
| Screens/components present | PASS | Both screens + full calendar component set | |
| Services/adapters present | PASS | Engine-backed path via `useManageAvailability`; dashboard path via `useVportManageAvailability` | |
| Database objects mapped | PASS | `vport.availability_rules`, `vport.availability_exceptions` | Exception table exists in engine DAL but has no dashboard-layer DAL |
| Authorization path mapped | PASS | RC-01 + RC-06 fixed — `callerActorId` + `ownerActorId` forwarded through full chain | |
| Cache/runtime behavior mapped | FAIL | No cache on availability rules — fetched fresh on every schedule load | MEDIUM risk |
| Error/loading/empty states mapped | PASS | `useVportOwnerSchedule` exposes loading/error; `ScheduleSkeleton` renders | |
| Documentation linked | PARTIAL | This document is the first formal architecture record | |
| Tests/validation noted | FAIL | No test files found | HIGH risk |
| Native parity noted | N/A | PWA only | |
| Engine dependencies mapped | PASS | Engine path via `@booking` alias; DI via `setup.js` | |

---

## POST-FIX CALL CHAIN VERIFICATION

### RC-01 + RC-06 — Availability Rule Write (Full Chain)
```
VportDashboardCalendarScreen
  → useVportManageAvailability (RC-06: forwards callerActorId + ownerActorId)
    → manageVportAvailabilityRuleController (RC-01: ownership assertion added)
      → assertActorOwnsVportActorController (via booking.adapter.js)
        → getActorByIdDAL (vc.actors — verify requester exists + kind === "user")
        → readActorOwnerLinkByActorAndUserProfileDAL (vc.actor_owners — verify ownership link)
      → upsertVportAvailabilityRuleDAL (vport.availability_rules — write)
```
**STATUS: CLEAN** — Double-gated: caller identity verified + owner link verified before any write.

### Schedule Read Path (No Ownership — Read-Only)
```
VportDashboardScheduleScreen
  → useVportOwnerSchedule (actorId from route params)
    → loadDayScheduleController (actorId)
      → getVportProfileIdByActorDAL (vport.profiles)
      → listVportResourcesByProfileIdDAL (vport.resources)
      → Promise.all [ listVportAvailabilityRulesByResourceIdDAL per resource ] (N reads)
      → listVportBookingsForProfileDayDAL (vport.bookings — batch by resource_id IN)
      → listVportServicesByProfileIdDAL (vport.services)
```
**STATUS: CLEAN for reads** — No mutation; N+1 concern for availability rules (see structural concerns).

### Public Availability Read Path
```
useVportResourceAvailability (resourceId, rangeStart, rangeEnd)
  → getVportResourceAvailabilityController
    → listVportAvailabilityRulesByResourceIdDAL (vport.availability_rules)
    → listVportBookingsInRangeDAL (vport.bookings)
  → mapAvailabilityRule
```
**STATUS: CLEAN** — Read-only, no auth required (public calendar display).

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `features/booking/adapters/booking.adapter.js` | Adapter | dashboard/vport → booking adapter | YES | Cross-feature boundary — only approved path |
| `features/booking/controller/assertActorOwnsVportActor` | Controller | adapter → booking feature | YES — via adapter | |
| `engines/booking` | Engine | `useManageAvailability` hook → engine | YES — via `@booking` alias | Parallel engine-backed path for org/resource booking |
| `vport.availability_rules` | Database | write controllers → DB | YES | Primary write table |
| `vport.availability_exceptions` | Database | engine DAL → DB | YES | Exception table — no dashboard-layer exception write yet |
| `vport.resources` | Database | `loadDayScheduleController` → DB | YES | Resource enumeration |
| `vport.bookings` | Database | `loadDayScheduleController`, availability controller → DB | YES | Schedule data |
| `vport.profiles` | Database | Multiple controllers → DB | YES | actorId → profileId resolution |
| `vport.services` | Database | `loadDayScheduleController` → DB | YES | Service catalog for schedule form |
| `vc.actors` | Database | ownership assertion → DB | YES | Identity verification |
| `vc.actor_owners` | Database | ownership assertion → DB | YES | Owner link verification |
| `state/identity/identityContext` | State | `useVportOwnerSchedule` → identity | YES | Reads `actorId` from identity |
| `@hydration` | Engine | `useVportOwnerSchedule` → hydration | YES — via alias | Hydrates staff member actor IDs |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vport.availability_rules` | read/write | `manageVportAvailabilityRuleController` | Calendar UI, schedule assembly, public availability check | Write gated by RC-01 fix |
| `vport.availability_exceptions` | read (engine DAL only) | Engine controller | Public availability check | No dashboard-layer exception write exists |
| `vport.resources` | read | `loadDayScheduleController`, `listVportBookingResourcesController` | Schedule grid (one lane per resource) | |
| `vport.bookings` | read | `loadDayScheduleController`, `listVportBookingsForProfileDayDAL` | Schedule grid (bookings per lane) | |
| `vport.profiles` | read | All controllers that need profileId | actorId → profileId resolution step | Never returned to UI |
| `vport.services` | read | `loadDayScheduleController`, `listVportServicesForProfileController` | Schedule create-booking modal | |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | Both screens routed under `/actor/:actorId/dashboard/` | |
| Loading state | PASS | `ScheduleSkeleton` component; `loading` state in all hooks | |
| Empty state | PASS | "No team members yet" + "No bookings today" + empty rule states | |
| Error state | PASS | Error displayed in schedule screen; hooks expose `error` | |
| Auth/owner gate | PARTIAL | Screen-level: schedule screen implicitly owner-gated by route; calendar screen similar | Write controller assertion is the real gate (RC-01) |
| Cache behavior | FAIL | No cache — every navigation to schedule screen fires full `loadDayScheduleController` | MEDIUM risk for frequent owner interactions |
| Runtime dependencies | PASS | Engine configured; hydration available | |
| Hot paths | WATCH | `loadDayScheduleController` — N parallel reads (rules per resource) + 3 sequential reads (profile, resources, services) | |

---

## STRUCTURAL CONCERNS

### 1. N+1 Availability Rules Read — loadDayScheduleController
**Location:** `dashboard/vport/controller/loadDaySchedule.controller.js` lines 19-26
**Pattern:**
```js
const rulesResults = await Promise.all(
  staff.map((m) => listVportAvailabilityRulesByResourceIdDAL({ resourceId: m.id }))
)
```
**Classification:** WATCH — Parallelized N+1. For a barbershop with 3 staff: 3 individual `availability_rules` reads instead of 1 batch query with `resource_id IN (id1, id2, id3)`.
**Recommendation:** Add `listVportAvailabilityRulesByResourceIds({ resourceIds: [] })` DAL using `.in("resource_id", resourceIds)`.

### 2. Two Availability Write Paths — Risk of Divergence
**Path A (dashboard):**
`useVportManageAvailability` → `manageVportAvailabilityRuleController` → `upsertVportAvailabilityRuleDAL`

**Path B (engine):**
`useManageAvailability` → `setAvailabilityRule` (engine) → `dalUpsertVportAvailabilityRule` or `dalUpsertAvailabilityRule`

**Both paths write to `vport.availability_rules`.** The engine path supports more fields (`validFrom`, `validUntil`). The dashboard path uses a simpler upsert. Both are active.
**Risk:** MEDIUM — If the engine path is adopted as canonical, the dashboard controller becomes redundant. If both evolve independently, field coverage diverges.
**Recommendation:** Determine canonical write path. If engine is preferred, migrate `manageVportAvailabilityRuleController` to delegate to the engine controller.

### 3. No Exception Write Path in Dashboard Layer
**Observation:** `vport.availability_exceptions` is readable via the engine DAL (`dalListVportAvailabilityExceptionsInRange`) but there is no dashboard-layer DAL or controller for writing exceptions.
**Risk:** MEDIUM — If a VPORT owner needs to set a day-off or holiday exception from the dashboard UI, there is no write path. The engine `setAvailabilityException` exists but is not wired to any dashboard hook.
**Recommendation:** Confirm whether exception management is a planned UI feature. If so, wire engine controller through `useVportManageAvailability` or a new hook.

### 4. loadDayScheduleController — No Caller Ownership Assertion
**Location:** `dashboard/vport/controller/loadDaySchedule.controller.js`
**Pattern:** Accepts `actorId` and returns full schedule without verifying caller identity.
**Risk:** MEDIUM — This is a read-only controller today. But if called outside the protected dashboard route, it would expose all bookings and availability rules for any actorId. The current protection is only the React Router route guard.
**Recommendation:** Accept `callerActorId` and assert ownership, OR clearly document that this is intentionally public-readable (in which case it must not return customer PII like `customer_name`, `customer_note`).

### 5. Model Gap — Exception Mapper Missing in Dashboard Layer
**Observation:** `mapAvailabilityRule` exists in `dashboard/vport/model/vportAvailabilityRule.model.js`. There is no corresponding `mapAvailabilityException` in the dashboard layer. The engine has `mapAvailabilityExceptionRow` in `BookingAvailability.model.js`.
**Risk:** LOW — Exceptions are not currently surfaced in dashboard UI. Risk becomes MEDIUM when exception UI is added.

---

## MODULE BOUNDARY WARNINGS

### Warning 1 — `useManageAvailability` and `useVportManageAvailability` coexist
**Location:** Both hooks are exported from the codebase and write to the same table.
**Risk:** MEDIUM — Two independent hook surfaces for the same domain. Consumers may accidentally use the wrong one. `useManageAvailability` (from `features/booking/`) uses the engine path with richer fields; `useVportManageAvailability` (from `dashboard/vport/`) uses the simpler dashboard controller. No single canonical hook declared.

### Warning 2 — Calendar components not gated by availability adapter
**Location:** `components/calendar/` files are imported directly by calendar screen.
**Note:** Acceptable — these are presentational components within the same feature boundary.

### Warning 3 — `ScheduleGrid.jsx` imports from `scheduleTimeUtils.js` (sibling utility)
**Note:** `screens/components/schedule/scheduleTimeUtils.js` is a utility file within the screen subfolder. Acceptable proximity — not a cross-feature import.

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Batch `listVportAvailabilityRulesByResourceIds` DAL | HIGH | Eliminates N+1 in schedule assembly | CARNAGE |
| Exception write path in dashboard layer | HIGH | Owners cannot set time-off/exceptions from dashboard | booking controller + CARNAGE |
| Caller ownership assertion in `loadDayScheduleController` | MEDIUM | Read path is caller-agnostic | VENOM |
| Exception model (`mapAvailabilityException`) in dashboard layer | MEDIUM | Needed when exception UI is added | booking model |
| Canonical availability write path decision | MEDIUM | Two active write paths to same table | IRONMAN |
| Cache layer for availability rules | MEDIUM | Fresh read every schedule navigation | KRAVEN |
| Tests for `manageVportAvailabilityRuleController` (post RC-01) | HIGH | P0 security fix is untested | SENTRY |
| Logan governance doc | LOW | No canonical doc for this sub-module | LOGAN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | None | MISSING |
| Ownership record | This document | PRESENT |
| Security audit | Cerebro P0 audit (RC-01, RC-06, branch: vport-booking-feed-security-updates) | PRESENT |
| Runtime audit | LOKI handoff recommended | MISSING |
| Performance audit | KRAVEN handoff recommended | MISSING |
| Migration audit | None | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | `engines/booking/CLAUDE.md` | PRESENT |

---

## SPAGHETTI SCORE

**Module:** vcsm.vport-availability  
**Score:** WATCH  
**Reasons:**
- Two active write paths to `vport.availability_rules` (dashboard controller + engine controller) with no declared canonical path
- `loadDayScheduleController` performs 3+ sequential + N parallel reads without ownership check
- No exception write path in dashboard layer despite exception read being available in engine
- Availability rule model only partially implemented (rule mapper present; exception mapper missing at dashboard layer)

**Release risk:** LOW — Core write path (RC-01 + RC-06) is secured. WATCH items are architectural hygiene issues.

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Tests for `manageVportAvailabilityRuleController` | Security fix without test coverage | SENTRY |
| P1 | Batch availability rules DAL | N+1 in schedule assembly | CARNAGE |
| P1 | Exception write path for dashboard | Owners cannot set time-off from dashboard | CARNAGE + booking controller |
| P2 | Caller ownership assertion in `loadDayScheduleController` | Defense-in-depth | VENOM |
| P2 | Canonical write path decision (dashboard vs engine) | Dual write paths risk divergence | IRONMAN |
| P2 | Cache for availability rules | Performance — fresh fetch every navigation | KRAVEN |
| P3 | Exception model in dashboard layer | Needed for future exception UI | booking model |
| P3 | Logan governance doc | Documentation | LOGAN |

---

## FINAL MODULE STATUS

**MOSTLY COMPLETE**

The two P0 security findings affecting this module (RC-01: missing ownership assertion in availability write; RC-06: missing parameter forwarding in hook) are both resolved. The core availability rule write chain is clean and double-gated. The schedule assembly read path is functional. Remaining concerns are structural quality issues (dual write paths, N+1, no exception write surface) that should be addressed in the next hardening pass.

## RECOMMENDED HANDOFFS

- **VENOM** — verify `loadDayScheduleController` caller-agnostic read risk
- **KRAVEN** — audit N+1 in schedule assembly and cache absence
- **SENTRY** — test coverage for RC-01/RC-06 fixes
- **CARNAGE** — batch DAL + exception write path schema work
- **IRONMAN** — declare canonical availability write path (dashboard vs engine)
- **LOGAN** — create Logan governance doc for vport-availability sub-module
