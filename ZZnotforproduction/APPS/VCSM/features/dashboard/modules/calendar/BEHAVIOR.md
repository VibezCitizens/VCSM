# Dashboard Module Behavior Contract — calendar

Status: PARTIAL

Module: calendar

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - CALENDAR-BEHAVIOR-001
  - CALENDAR-SPIDER-001
  - CALENDAR-RLS-001
  - CALENDAR-FINALVIEW-001
  - CALENDAR-ROUTE-001
  - CALENDAR-CACHE-001
- Security Review Status:
  - VENOM: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.
  - ELEKTRA: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.
  - BLACKWIDOW: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.

---

## 1. User Goal

The calendar module lets a VPORT owner configure weekly working hours for booking resources. It is the owner-facing availability configuration surface used before the schedule module can show operational day activity. Owners select a resource, edit weekly time blocks, save availability rules, and can optionally share saved hours to the social feed for barbershop/barber and locksmith VPORTs.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT actor owner | Load calendar settings, bootstrap a default booking resource, select active resources, edit weekly working hours, save availability rules, optionally publish hours to feed for supported VPORT types. | Must pass `useVportOwnership` screen gate. Adapter write paths must verify ownership with `requestActorId`. |
| Non-owner authenticated actor | None. | Must not render calendar editor, bootstrap resources, write availability rules, or publish hours. |
| Public/anonymous actor | None. | Must not access owner calendar behavior. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/calendar`
- `/vport/:actorId/dashboard/calendar` redirects through `VportToActorDashboardCalendarRedirect` to `/actor/:actorId/dashboard/calendar`.
- No current source route for standalone `/dashboard/calendar` was found.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx`

### Hooks

Calendar has no local card hooks. The screen uses adapter hooks:

- `useOwnerBookingResources`
- `useBookingAvailability`
- `useManageAvailability`
- `useEnsureOwnerBookingResource`
- `useVportOwnership`
- `usePublishBarbershopHoursPost`
- `usePublishLocksmithPost`

### Controllers

No local calendar controller was found. Controller behavior is delegated through adapters to booking/profile controllers, including:

- `setAvailabilityRuleController`
- `ensureOwnerBookingResourceController`
- profile feed publish controllers for barbershop/barber and locksmith hours.

### DALs

No local calendar DAL was found. Booking resource and availability data access is delegated to the booking engine/app booking adapter. Feed post data access is delegated to profiles adapters.

### RPCs

- No calendar-local RPC was found.

### Edge Functions

- No calendar-local edge function was found.

### Engine Dependencies

- Booking adapter/engine for resource reads, resource bootstrap, availability reads, and availability writes.
- Profiles VPORT adapter for optional feed publishing.
- Shared dashboard calendar components under `features/dashboard/vport/components/calendar/`.

### Ownership Gates

- Screen render gate: `useVportOwnership(viewerActorId, actorId)`.
- Resource bootstrap gate: `ensureOwnerBookingResource` receives `requestActorId` and owner actor id; current app and engine controllers verify `assertActorOwnsVportActor`.
- Availability write gate: `WeeklyAvailabilityGrid` passes `requestActorId: viewerActorId` to `manageAvailability.setAvailabilityRule`; current app and engine controllers require `requestActorId` and verify resource ownership/management.
- Feed publish gate: delegated to barbershop/locksmith profile publish controllers through profile adapter hooks.

---

## 4. Happy Paths

### HP-001

BEH-DASH-calendar-001

Preconditions:

Authenticated caller owns the target VPORT actor and opens the calendar dashboard route.

Flow:

User opens `/actor/:actorId/dashboard/calendar` -> `VportDashboardCalendarScreen` reads route actor id and identity -> `useVportOwnership` verifies owner UI access -> `useOwnerBookingResources` loads resources with `enabled: isOwner && Boolean(actorId)` -> active resources populate selector -> first active resource becomes selected -> `useBookingAvailability` loads availability rules for the selected resource -> `WeeklyAvailabilityGrid` renders working hours.

Expected Result:

Owner sees calendar settings with resource selector and weekly working hours editor.

Data Changes:

None.

---

### HP-002

BEH-DASH-calendar-002

Preconditions:

Owner has no existing booking resource, ownership is confirmed, and resource load is complete.

Flow:

Screen detects no resource -> bootstrap effect calls `ensureOwnerResource({ requestActorId: viewerActorId, ownerActorId: actorId, timezone })` once per actor mount -> booking controller verifies ownership -> default resource is created or existing race-created resource is returned -> resources refresh.

Expected Result:

A default active booking resource exists and can be selected for availability editing.

Data Changes:

Insert into booking resource table through booking adapter/engine if no existing resource exists.

---

### HP-003

BEH-DASH-calendar-003

Preconditions:

Owner has selected a resource and availability rules are loaded.

Flow:

Owner edits time blocks in weekly grid -> clicks save -> `WeeklyAvailabilityGrid.save` compares local blocks with existing rules -> for each weekday it calls `manageAvailability.setAvailabilityRule` with `requestActorId`, `resourceId`, rule metadata, time range, and active state -> booking controller verifies request actor owns the resource owner actor -> availability rule upserts or deactivations persist -> availability refreshes -> save message displays.

Expected Result:

Weekly availability rules are saved for the selected resource, including inactive writes for closed days or removed extra blocks.

Current Cache Note:

`getResourceAvailabilityController` uses a 5-minute TTL cache, and the calendar save path calls `availability.refresh()` without invalidating that cache. If the resource/month cache is warm, the post-save refresh may re-read cached availability until cache expiry or explicit invalidation.

Data Changes:

Upsert/update `vport.availability_rules` or booking engine availability rule table through booking adapter/engine.

---

### HP-004

BEH-DASH-calendar-004

Preconditions:

Owner is editing a barbershop/barber or locksmith VPORT calendar and enables `Share these hours to my feed`.

Flow:

Owner saves working hours -> save succeeds -> `handleSaveSuccess` clears `shareToFeed` and calls either `publishBarbershopHoursPost({ blocks })` or `publishLocksmithHoursPost({ blocks })` -> profile adapter/controller publishes supported hours post or fails non-blocking in DEV logging.

Expected Result:

Availability remains saved. Supported VPORT types may publish hours to feed when the adapter succeeds.

Data Changes:

Feed/post write through profiles adapter when publish succeeds.

---

### HP-005

BEH-DASH-calendar-005

Preconditions:

Owner uses quick edit actions in the weekly grid.

Flow:

Owner applies Monday to weekdays, sets 9-5 weekdays, toggles closed days, clears all, changes week view, or changes standard/full-day grid mode -> local block state updates -> no database write happens until owner clicks save.

Expected Result:

UI reflects draft working hours. Persisted data remains unchanged until save.

Data Changes:

None until save.

---

## 5. Failure Paths

### FP-001

BEH-DASH-calendar-101

Trigger:

Identity or ownership is still loading.

Expected System Behavior:

Calendar editor does not initialize owner write behavior until ownership status resolves.

Expected UI Behavior:

Skeleton card list renders.

Expected Logging:

No module-local logging found.

---

### FP-002

BEH-DASH-calendar-102

Trigger:

No authenticated identity exists.

Expected System Behavior:

Calendar editor does not render.

Expected UI Behavior:

`Sign in required.`

Expected Logging:

No module-local logging found.

---

### FP-003

BEH-DASH-calendar-103

Trigger:

Missing route actor id.

Expected System Behavior:

Calendar editor does not render.

Expected UI Behavior:

`Invalid vport.`

Expected Logging:

No module-local logging found.

---

### FP-004

BEH-DASH-calendar-104

Trigger:

Caller is authenticated but not an owner of the target VPORT.

Expected System Behavior:

`useVportOwnership` resolves false; booking adapter hooks are disabled or not rendered; bootstrap and grid save cannot run from the screen.

Expected UI Behavior:

`You can only manage your own calendar.`

Expected Logging:

No module-local logging found.

---

### FP-005

BEH-DASH-calendar-105

Trigger:

Resource load, bootstrap, or availability read fails.

Expected System Behavior:

Adapter hook exposes error.

Expected UI Behavior:

DEV renders raw error message; production renders `Calendar settings are unavailable right now.`

Expected Logging:

No module-local logging found.

---

### FP-006

BEH-DASH-calendar-106

Trigger:

Save operation fails for any weekday/rule write.

Expected System Behavior:

`WeeklyAvailabilityGrid.save` catches adapter error and stops save flow.

Expected UI Behavior:

Save message shows failed day and adapter error message.

Expected Logging:

No module-local logging found.

---

### FP-007

BEH-DASH-calendar-107

Trigger:

Share-to-feed publish fails after availability save.

Expected System Behavior:

Availability save remains committed. Publish failure is caught.

Expected UI Behavior:

No user-facing failure message found; DEV logs a console error.

Expected Logging:

DEV-only `console.error` for feed publish failures.

---

### FP-008

BEH-DASH-calendar-108

Trigger:

Availability is saved while the selected resource/month availability result is already cached.

Expected System Behavior:

Availability writes can succeed, but the follow-up `availability.refresh()` may receive the cached pre-save result because `invalidateBookingAvailability()` is not called by the save/write path.

Expected UI Behavior:

Save message may show `Saved.` while the grid can continue reflecting stale loaded rules until cache expiry or another uncached range/resource read.

Expected Logging:

No module-local logging found.

Finding Links:

- CALENDAR-CACHE-001

---

## 6. Security Rules

### SEC-001

BEH-DASH-calendar-201

Rule:

Only VPORT owners may render and operate the calendar settings editor.

Enforcement Layer:

`VportDashboardCalendarScreen` via `useVportOwnership`.

Current Status:

IMPLEMENTED as UI gate.

Finding Links:

- CALENDAR-FINALVIEW-001

---

### SEC-002

BEH-DASH-calendar-202

Rule:

Resource bootstrap must require the caller actor and verify that caller owns the target VPORT.

Enforcement Layer:

Booking adapter/engine `ensureOwnerBookingResource` controllers require `requestActorId` and verify `assertActorOwnsVportActor`.

Current Status:

IMPLEMENTED in current source.

Finding Links:

- CALENDAR-RLS-001

---

### SEC-003

BEH-DASH-calendar-203

Rule:

Availability rule saves must pass caller identity and be authorized by the booking adapter/engine before writing.

Enforcement Layer:

`WeeklyAvailabilityGrid` passes `requestActorId`; the current app booking `setAvailabilityRuleController` loads the resource and verifies ownership of `resource.owner_actor_id` before DAL write.

Current Status:

IMPLEMENTED in current source.

Finding Links:

- CALENDAR-RLS-001

---

### SEC-004

BEH-DASH-calendar-204

Rule:

Optional hours feed posts must be published only through profile adapters that enforce their own ownership/auth rules.

Enforcement Layer:

`usePublishBarbershopHoursPost` and `usePublishLocksmithPost` delegate to profile controllers.

Current Status:

DELEGATED / NEEDS MODULE-LOCAL TEST COVERAGE.

Finding Links:

- CALENDAR-SPIDER-001

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-calendar-301

Invariant:

A non-owner must never bootstrap a booking resource or edit availability rules for another VPORT.

Current Status:

Screen gate and adapter/controller gates present in current source.

Related Findings:

- CALENDAR-RLS-001

Required Tests:

- TESTREQ-DASH-calendar-001
- TESTREQ-DASH-calendar-003

---

### MNH-002

BEH-DASH-calendar-302

Invariant:

The dashboard calendar must never call availability writes without forwarding `requestActorId`.

Current Status:

Current `WeeklyAvailabilityGrid` forwards `requestActorId: viewerActorId`.

Related Findings:

- CALENDAR-SPIDER-001

Required Tests:

- TESTREQ-DASH-calendar-002

---

### MNH-003

BEH-DASH-calendar-303

Invariant:

Feed publish failure must never roll back or corrupt already-saved availability rules.

Current Status:

Feed publish runs after save and failures are caught separately.

Related Findings:

- CALENDAR-SPIDER-001

Required Tests:

- TESTREQ-DASH-calendar-005

---

### MNH-004

BEH-DASH-calendar-304

Invariant:

Draft grid edits must never persist until the owner explicitly clicks save.

Current Status:

Current quick actions mutate local block state only; `save` performs adapter writes.

Related Findings:

- CALENDAR-SPIDER-001

Required Tests:

- TESTREQ-DASH-calendar-004

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| Booking resources | `useOwnerBookingResources` reads owner resources. | `useEnsureOwnerBookingResource` may create default resource. | No calendar-local update found. | No |
| Availability rules | `useBookingAvailability` reads selected resource rules. | Save can create new weekly rules through adapter. | Save can update or deactivate existing weekly rules. | No hard delete found; removed/closed blocks are saved as inactive. |
| Feed/post system | No calendar-local read found. | Optional barbershop/barber or locksmith hours post through profile adapter. | No | No |

---

## 9. Side Effects

Notifications:

No notification side effect found.

Analytics:

No calendar-local analytics side effect found.

Media:

None found.

Exports:

None found.

Jobs:

None found.

Cache:

Calendar has no local cache, but the delegated booking availability controller has a 5-minute TTL cache. Current calendar save calls `availability.refresh()` but does not invalidate that delegated cache.

Other:

Resource bootstrap runs at most once per actor mount through `didBootstrap` ref. Feed publish is optional and non-blocking after save.

---

## 10. UI Outputs

Loading States:

Skeleton card list while identity or ownership loads; inline loading text for resource/bootstrap loading.

Success States:

Calendar settings page, working hours editor, resource dropdown, weekly grid, mobile working-hours cards, saved message.

Error States:

Sign-in required, invalid VPORT, non-owner access denied, unavailable calendar settings, per-day save failure message.

Empty States:

If no active resource exists after loading/bootstrap, screen prompts owner to add a team member and links to the team dashboard.

Owner States:

Owner can edit working hours and optionally share hours to feed for supported VPORT types.

Public States:

No public calendar behavior is documented.

---

## 11. Acceptance Criteria

### AC-DASH-calendar-001

Requirement:

Calendar editor only renders for target VPORT owners.

Evidence:

`VportDashboardCalendarScreen` blocks non-owner render and enables resource hook only when `isOwner`.

Status:

PASS at source review level.

---

### AC-DASH-calendar-002

Requirement:

Availability writes include caller identity and delegate authorization to booking adapter/engine.

Evidence:

`WeeklyAvailabilityGrid.save` passes `requestActorId: viewerActorId`; current app booking controller requires `requestActorId`, loads the resource, and verifies ownership of `resource.owner_actor_id` before DAL write.

Status:

PASS at source review level.

---

### AC-DASH-calendar-003

Requirement:

Resource bootstrap happens only once per actor mount and only for an owner.

Evidence:

Screen effect requires `isOwner`, `actorId`, `viewerActorId`, no active resource, and `didBootstrap.current === false`.

Status:

PASS at source review level.

---

### AC-DASH-calendar-004

Requirement:

Calendar has module-level behavior and SPIDER-MAN coverage.

Evidence:

Behavior contract exists. No dashboard-local calendar tests were found; existing booking tests cover the shared ownership gate only, not calendar-specific bootstrap/save/UI behavior.

Status:

PARTIAL / OPEN.

---

### AC-DASH-calendar-005

Requirement:

Calendar route documentation matches the current app route table.

Evidence:

`protected/app.routes.jsx`, `appRoutes.redirects.jsx`, `VportDashboardScreen.jsx`, `TodayView.jsx`.

Status:

SOURCE VERIFIED / DOCUMENTED.

---

### AC-DASH-calendar-006

Requirement:

Post-save availability refresh must return fresh rules or explicitly document cache staleness.

Evidence:

`getResourceAvailability.controller.js`, `WeeklyAvailabilityGrid.jsx`, `VportDashboardCalendarScreen.jsx`.

Status:

OPEN / DOCUMENTED. Current source has delegated 5-minute TTL cache and no invalidation on availability writes.

---

## 12. Test Requirements

### TESTREQ-DASH-calendar-001

Validates:

Non-owner cannot render editor, load owner resources, bootstrap resources, or save availability.

Type:

Screen/hook integration security test.

Status:

MISSING.

---

### TESTREQ-DASH-calendar-002

Validates:

`WeeklyAvailabilityGrid.save` forwards `requestActorId` on every active/inactive availability rule write.

Type:

Component/unit test.

Status:

MISSING.

---

### TESTREQ-DASH-calendar-003

Validates:

Booking adapter rejects resource bootstrap and availability write when `requestActorId` does not own the target VPORT/resource owner actor.

Type:

Adapter/controller security test.

Status:

MISSING in dashboard module evidence; may exist outside dashboard, not found in this pass.

---

### TESTREQ-DASH-calendar-004

Validates:

Local grid actions (`Apply Mon`, `Set 9-5`, `Clear All`, closed-day toggles) do not call write adapters until save.

Type:

Component interaction test.

Status:

MISSING.

---

### TESTREQ-DASH-calendar-005

Validates:

Feed publish failure after successful save does not roll back availability save and does not throw out of the save flow.

Type:

Integration test.

Status:

MISSING.

---

### TESTREQ-DASH-calendar-006

Validates:

DB/RLS prevents direct non-owner writes to resources and availability rules if adapter/controller is bypassed.

Type:

DB/RLS security test.

Status:

MISSING / DELEGATED TO BOOKING/AVAILABILITY GOVERNANCE.

---

### TESTREQ-DASH-calendar-007

Validates:

Route map contains `/actor/:actorId/dashboard/calendar` plus `/vport/:actorId/dashboard/calendar` redirect, and no standalone `/dashboard/calendar` route is assumed.

Type:

Route/source assertion.

Status:

MISSING / TRACKED BY CALENDAR-ROUTE-001.

---

### TESTREQ-DASH-calendar-008

Validates:

Saving availability invalidates delegated availability cache or the UI explicitly handles stale cached refresh results.

Type:

Controller/hook integration cache regression.

Status:

MISSING / TRACKED BY CALENDAR-CACHE-001.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| CALENDAR-BEHAVIOR-001 | MEDIUM | RESOLVED BY DRAFT | BEH-DASH-calendar-001 through BEH-DASH-calendar-304 |
| CALENDAR-SPIDER-001 | MEDIUM | OPEN | BEH-DASH-calendar-301 through BEH-DASH-calendar-304 |
| CALENDAR-RLS-001 | HIGH | NEEDS_VERIFICATION / DELEGATED | BEH-DASH-calendar-202, BEH-DASH-calendar-203, BEH-DASH-calendar-301 |
| CALENDAR-FINALVIEW-001 | LOW | OPEN / DEFERRED | BEH-DASH-calendar-201 |
| CALENDAR-ROUTE-001 | LOW / documentation drift | OPEN | AC-DASH-calendar-005, TESTREQ-DASH-calendar-007 |
| CALENDAR-CACHE-001 | MEDIUM / stale state | OPEN | BEH-DASH-calendar-003, BEH-DASH-calendar-108, AC-DASH-calendar-006, TESTREQ-DASH-calendar-008 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Dashboard matrix THOR classification | CAUTION | No, but tracked caution remains. |
| Module DR_STRANGE command coverage | BLOCKED | Yes for module-level release sign-off; only DR. STRANGE PARTIAL evidence exists. |
| BEHAVIOR.md draft | PRESENT | No. |
| SPIDER-MAN module tests | MISSING | Yes for promoted-module test sign-off. |
| Adapter/RLS verification | DELEGATED / NEEDS_VERIFICATION | Yes for full security approval. |
| Availability cache invalidation or stale-state handling | OPEN | Yes for behavior approval coverage. |
| Final/View screen split | DEFERRED | No, but architecture debt remains. |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Weekly working hours editor | Unknown | MISSING SOURCE |
| Mobile working-hours editor | Unknown | MISSING SOURCE |
| Resource selector | Unknown | MISSING SOURCE |
| Optional feed publish for hours | Unknown | MISSING SOURCE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Booking adapter/engine | Resource reads, resource bootstrap, availability reads, availability writes. | ACTIVE |
| Profiles VPORT adapter | Optional barbershop/barber and locksmith hours feed publishing. | ACTIVE |
| Dashboard shared calendar components | Weekly grid, mobile grid, day cards, resource dropdown, calendar utility functions. | ACTIVE |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-calendar-001 | Should `VportDashboardCalendarScreen.jsx` be split into Final Screen and View Screen? | OPEN |
| OQ-DASH-calendar-002 | Are booking/availability RLS policies verified for direct non-owner writes outside adapters? | OPEN |
| OQ-DASH-calendar-003 | Should feed publish failures surface a user-facing toast/status instead of DEV-only console logging? | OPEN |
| OQ-DASH-calendar-004 | What native or alternate UI parity contract applies to calendar working-hours editing? | OPEN |
| OQ-DASH-calendar-005 | Should availability writes call `invalidateBookingAvailability()` or should `availability.refresh()` bypass cache after saves? | OPEN / TRACKED BY CALENDAR-CACHE-001 |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | YES — module README and source. |
| Actors / Roles | HIGH | YES — screen and ownership docs. |
| Module Architecture | HIGH | YES — source inventory and adapters. |
| Happy Paths | HIGH | YES — screen/grid/adapter source. |
| Failure Paths | MEDIUM | YES — source reviewed; runtime not executed. |
| Security Rules | HIGH | YES — current adapter/controller source verified. |
| Must Never Happen | HIGH | YES — source and governance. |
| Data Changes | MEDIUM | YES for delegated surfaces; exact DB table ownership delegated to booking/profile modules. |
| Side Effects | MEDIUM | YES — feed publish and bootstrap source. |
| UI Outputs | HIGH | YES — screen/grid source. |
| Acceptance Criteria | MEDIUM | YES — source review only. |
| Test Requirements | HIGH | YES — no dashboard-local tests found. |
| Security Findings Linked | MEDIUM | YES — findings are module-contract identifiers based on current gaps. |
| THOR Release Gates | MEDIUM | YES — dashboard matrix and module DR_STRANGE conflict preserved. |
| Native / Alternate UI Parity | LOW | NO — no native parity source found. |
| Engine Dependencies | HIGH | YES — imports. |
| Open Questions | HIGH | YES — from source/governance gaps. |

---

## 19. Command Sign-Off

ARCHITECT: DRAFTED_FROM_SOURCE

VENOM: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

ELEKTRA: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

BLACKWIDOW: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

SPIDER-MAN: MISSING — no dashboard-local calendar tests found.

PROFESSOR X: DRAFT_READY_FOR_REVIEW

THOR: CAUTION at dashboard matrix; BLOCKED for module-level command evidence.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding | Handoff |
|---|---|---|---|
| Calendar card is a pure delegation shell — delegation target not documented | HIGH | ARCHITECT_VERIFIED | LOGAN |
| No controller, DAL, hook, or model in card — all delegated to vport module | HIGH | ARCHITECT_VERIFIED | IRONMAN |
| No explicit delegation contract documenting what vport module owns | HIGH | ARCHITECT_VERIFIED | SENTRY |
| No tests in calendar card | MEDIUM | ARCHITECT_VERIFIED | SPIDER-MAN |
| Cache/runtime behavior undocumented | MEDIUM | ARCHITECT_VERIFIED | LOKI |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required. Zero test files in calendar card module.

Ownership enforcement: The calendar card has no write surfaces. Read ownership is delegated to the vport module via route guard (OwnerOnlyDashboardGuard). The authoritative ownership check for any calendar writes is in the availability engine adapter.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/calendar/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §5 (route: /actor/:actorId/dashboard/calendar), §7 (card reads: availability rules)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_PARTIAL — Calendar card is a delegation shell. Behavior of calendar data display is owned by vport module components. Full contract requires delegation documentation.
