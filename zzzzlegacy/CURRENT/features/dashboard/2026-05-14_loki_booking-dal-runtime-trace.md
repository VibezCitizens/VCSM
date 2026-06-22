# LOKI Runtime Report — Booking DAL System

**Date:** 2026-05-14  
**Reviewer:** LOKI  
**Trigger:** Cerebro-routed runtime verification — RISK-4 (useBookingHistory dead?), RISK-5 (12 diagnostics-only DALs dead?), observability gaps in booking mutation paths  
**Application Scope:** VCSM + ENGINE  
**TypeScript output allowed:** NO  
**Method:** Static import chain analysis (live instrumentation not possible without a running session; all findings are INFERRED from complete import trace)

---

## LOKI TARGET

```
Observed flow:   Booking DAL system — all 20 feature-level DALs + engine booking paths
Application Scope: VCSM + ENGINE
Entry point:     Multiple — useVportBookingHistory, useBookingOps, useBookingServices,
                 useMyAppointments, WeeklyAvailabilityGrid, VportDashboardCalendarScreen
Reason for observation: Verify RISK-4 and RISK-5 from vcsm.dal.booking.md; identify
                        observability gaps in live booking mutation paths
TypeScript output allowed: NO
```

---

## TRACE IDENTITY

**Trace ID:** LOKI-BOOKING-2026-05-14  
**Routes:** `/actor/:actorId/dashboard/calendar` · `/profile/:slug?tab=book` · `/notifications` (my appointments)  
**Screens:** VportDashboardCalendarScreen · BookingOrganizationPanel · useMyAppointments  
**Session state class:** Authenticated VPORT Owner (primary); Authenticated Citizen (appointments)  
**Timestamp:** 2026-05-14  
**Environment:** Development — static trace; not a live session capture

---

## RUNTIME SUMMARY

**Total duration:** Not measurable (static analysis)  
**Primary records returned:** N/A  
**Total DB reads:** N/A (static)  
**Read Amplification Score:** UNKNOWN (static analysis — live instrumentation needed for measurement)  
**Worst bottleneck:** `manageVportAvailabilityRuleController` — no ownership check in hot production write path  
**Cache behavior summary:** No caching on any booking write path; `useBookingHistory` adapter export is dead

---

## CONFIRMED: RISK-4 — useBookingHistory Is Dead at Runtime

**Evidence Type:** INFERRED  
**Confidence:** HIGH

Complete import chain trace:

```
booking.adapter.js
  → exports useBookingHistory (line 7)

useBookingHistory.js
  → imports listBookingHistory from @booking (engine)
  → no production screen or component imports useBookingHistory

RESULT: Zero external consumers of useBookingHistory in production UI.
        The adapter export is live in the bundle but never called.
```

Confirmation: `grep -r "useBookingHistory" apps/VCSM/src` returned only:
- `booking.adapter.js:7` — the export declaration
- `useBookingHistory.js:18` — the function definition

No screen, component, or parent hook consumes it.

**RISK-4 status: CONFIRMED DEAD ✅**  
**Action:** Remove `useBookingHistory` from `booking.adapter.js` (pending S-BOOK-01 / V-BOOK-01 engine fix).

---

## CONFIRMED: RISK-5 — 12 Diagnostics-Only DALs Confirmed Dead in Production

**Evidence Type:** INFERRED  
**Confidence:** HIGH

Full call chain trace for all 12 DALs:

| DAL | Feature Controller | Hook Path | Production Screen | Verdict |
|---|---|---|---|---|
| `insertBooking.dal.js` | `createBooking.controller.js` | Only `bookingFeature.group.js` | None | DEAD ✅ |
| `insertBookingResource.dal.js` | `ensureOwnerBookingResource.controller.js` | Feature controller in diagnostics only; hook imports from `@booking` engine | None | DEAD ✅ |
| `listAvailabilityExceptionsInRange.dal.js` | `getResourceAvailability.controller.js` | Feature controller in diagnostics only; hook imports from `@booking` engine | None | DEAD ✅ |
| `listAvailabilityRulesByResourceId.dal.js` | `getResourceAvailability.controller.js` | Same as above | None | DEAD ✅ |
| `listBookingResourceServicesByResourceId.dal.js` | `getResourceAvailability.controller.js` + `setResourceSlotDuration.controller.js` | Both controllers: diagnostics only | None | DEAD ✅ |
| `listBookingResourcesByOwnerActorId.dal.js` | `ensureOwnerBookingResource.controller.js` + `listOwnerBookingResources.controller.js` | Both in diagnostics | None | DEAD ✅ |
| `listBookingsInRange.dal.js` | `getResourceAvailability.controller.js` | Diagnostics only | None | DEAD ✅ |
| `listBookingsByResource.dal.js` | `listBookingHistory.controller.js` (feature, dead) | useBookingHistory → engine path, not this controller | None | DEAD ✅ |
| `saveBookingServiceProfileDurationsByServiceIds.dal.js` | `setResourceSlotDuration.controller.js` | `bookings.group.tests2.js` only | None | DEAD ✅ |
| `upsertAvailabilityException.dal.js` | `setAvailabilityException.controller.js` | `bookingFeature.group.js` only | None | DEAD ✅ |
| `upsertAvailabilityRule.dal.js` | `setAvailabilityRule.controller.js` | `bookingFeature.group.js` only; dashboard uses `upsertVportAvailabilityRuleDAL` (separate) | None | DEAD ✅ |
| `upsertBookingResourceServices.dal.js` | `setResourceSlotDuration.controller.js` | `bookings.group.tests2.js` only | None | DEAD ✅ |

**Critical note on availability rule production path:**  
The production `WeeklyAvailabilityGrid` → `useVportManageAvailability` → `manageVportAvailabilityRuleController` → `upsertVportAvailabilityRuleDAL` (dashboard-owned DAL). This is entirely separate from the feature-level `upsertAvailabilityRule.dal.js`. The feature DAL is correctly dead.

**RISK-5 status: CONFIRMED — all 12 are diagnostics-only in production ✅**  
**Action:** These are pre-built for upcoming owner dashboard features. Ironman must confirm roadmap status before any removal decision.

---

## CONFIRMED: Production Call Chains — Live Paths

**Evidence Type:** INFERRED  
**Confidence:** HIGH

**Confirmed production active paths:**

```
Path 1 — Customer my-appointments:
  useMyAppointments.js
    → useBookingOps (from booking.adapter.js)
    → listMyBookingsController
    → listBookingsByCustomerDAL (ACTIVE)
    + cancelBookingController / confirmBookingController
    → updateBookingStatusDAL (ACTIVE)

Path 2 — VPORT booking history (owner):
  useVportBookingHistory.js (dashboard)
    → listVportBookingHistoryController (dashboard)
    → listVportBookingHistoryDAL (dashboard)
    ✅ Ownership: assertActorOwnsVportActorController (via adapter)

Path 3 — VPORT booking view (owner):
  useVportBookingView.js (profiles/kinds/vport)
    → via booking.adapter.js hooks
    → updateBookingStatusDAL (ACTIVE)
    ✅ Ownership: confirmed in cancelBooking/confirmBooking controllers

Path 4 — VPORT public booking (customer):
  useVportPublicBooking.js
    → useBookingServices
    → bookingServices.controller.js
    → readVportServicesByActorDAL (ACTIVE)
    → listBookingServiceProfilesByServiceIdsDAL (ACTIVE)

Path 5 — Dashboard calendar / availability:
  VportDashboardCalendarScreen.jsx
    → useVportManageAvailability
    → manageVportAvailabilityRuleController (dashboard)
    → upsertVportAvailabilityRuleDAL (dashboard)
    ⚠️ Ownership: UI-only guard (isOwner string compare) — no controller ownership assertion

Path 6 — Quick booking (owner creates walk-in):
  QuickBookingModal.jsx
    → useQuickBookingModal
    → createOwnerBookingController (dashboard)
    → assertActorOwnsVportActorController (adapter) ✅
    → insertVportBookingDAL (dashboard)
    ⚠️ Service load: listVportServicesForProfileController(profileId) — profileId surface violation
```

---

## NEW LOKI FINDING — L-BOOK-01

**Finding ID:** L-BOOK-01  
**Location:** `features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js` · `features/dashboard/vport/hooks/useVportManageAvailability.js:15`  
**Application Scope:** VCSM  
**Runtime Risk Category:** Duplicate read · Unknown (missing ownership enforcement in live write path)  
**Evidence Type:** INFERRED  
**Observation Source:** Static import chain — `WeeklyAvailabilityGrid.jsx` → `useVportManageAvailability` → `manageVportAvailabilityRuleController` → `upsertVportAvailabilityRuleDAL`  
**Confidence:** HIGH  

**Current runtime behavior:**  
`WeeklyAvailabilityGrid.jsx` passes `requestActorId: viewerActorId` to `manageAvailability.setAvailabilityRule(...)` at lines 114, 121, and 127. The hook `useVportManageAvailability` receives this parameter but **drops it silently** — it is not forwarded to `manageVportAvailabilityRuleController`. The controller accepts no caller identity parameter. `upsertVportAvailabilityRuleDAL` runs a raw upsert by `resourceId` with no ownership check.

The only gate is the UI-level `isOwner` check on `VportDashboardCalendarScreen.jsx:26`:
```js
const isOwner = Boolean(actorId) && Boolean(viewerActorId) && String(viewerActorId) === String(actorId);
```
This is a string comparison of `params.actorId` (URL param) vs `identity.actorId` (session). It does not verify that the caller actually owns the target actor via `actor_owners`.

**Runtime impact:**  
Any actor who navigates to `/actor/{targetActorId}/dashboard/calendar` where `targetActorId` matches their own `actorId` can modify availability rules. The controller is callable without ownership verification if accessed programmatically.

**Read Amplification:** N/A (write path)  
**Timing impact:** Availability rule mutations currently faster than they should be — no ownership DB read  
**Caller chain:** `WeeklyAvailabilityGrid.jsx` → `useVportManageAvailability.setAvailabilityRule` → `manageVportAvailabilityRuleController` → `upsertVportAvailabilityRuleDAL`  
**Cache status:** None  
**Severity:** HIGH  
**Recommended handoff:** VENOM (missed security gap — live production write path with no controller-level ownership assertion), SENTRY (controller layer violation — no ownership enforcement)

**Rationale:** This is a previously undetected live production path. Unlike the engine `listBookingHistory` which has a dead adapter export, this path is actively used via `VportDashboardCalendarScreen`. The controller must be made self-protecting.

---

## NEW LOKI FINDING — L-BOOK-02

**Finding ID:** L-BOOK-02  
**Location:** `features/booking/controller/cancelBooking.controller.js` · `features/booking/controller/confirmBooking.controller.js` · `features/dashboard/vport/controller/createOwnerBooking.controller.js`  
**Application Scope:** VCSM  
**Runtime Risk Category:** Duplicate read  
**Evidence Type:** INFERRED  
**Observation Source:** Static read of all booking mutation controllers  
**Confidence:** HIGH  

**Current runtime behavior:**  
Every booking mutation (cancel, confirm, create-owner) fetches the booking and then the resource as separate sequential DB reads before performing the ownership check:

```
cancelBookingController:
  1. getBookingByIdDAL         ← read #1 (serial)
  2. getBookingResourceByIdDAL ← read #2 (serial, depends on booking.resource_id)
  3. assertActorOwnsVportActor ← read #3 (actor + actor_owners, serial)
  4. updateBookingStatusDAL    ← write

confirmBookingController:
  1. getBookingByIdDAL         ← read #1 (serial)
  2. getBookingResourceByIdDAL ← read #2 (serial)
  3. assertActorOwnsVportActor ← read #3 (serial)
  4. updateBookingStatusDAL    ← write
```

3 sequential DB reads before every status mutation. All serial.

**Runtime impact:**  
Minimum 3× round-trip latency before any booking status change. With typical Supabase latency, this is ~150ms × 3 = ~450ms before the write even begins. On mobile connections, this could be 600ms–900ms serial overhead.

**Read Amplification:** 3 reads per mutation (WATCH threshold)  
**Timing impact:** ~450ms minimum pre-write overhead (estimate)  
**Caller chain:** Hook → `cancelBookingController` / `confirmBookingController` → 3 serial reads → write  
**Cache status:** BYPASS — no caching on booking or resource reads in mutation path  
**Severity:** MEDIUM  
**Recommended handoff:** KRAVEN (performance bottleneck — serial reads in mutation hot path)

**Rationale:** The serial read chain is architecturally correct (ownership must be verified before mutation) but the sequence could be partially parallelized. The booking and resource reads could potentially be merged into a single join query.

---

## OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Booking creation (owner) | NONE | No correlation ID, no audit event on success | HIGH |
| Booking cancel (customer/owner) | NONE | No audit trail — cancel fires, no structured event | HIGH |
| Booking confirm (owner) | NONE | No audit trail — status update is silent | HIGH |
| Ownership assertion (success) | NONE | Assertion passes silently — no log of who asserted ownership for what | HIGH |
| Ownership assertion (failure) | PARTIAL | Throws Error — caught by hook, surfaced as UI error | MEDIUM |
| Availability rule mutation | NONE | No log of who changed what rule, when, for which resource | HIGH |
| Engine listBookingHistory | NONE | No caller tracking — dead path, but if reactivated, no trace | LOW |
| DAL errors | PARTIAL | Supabase errors thrown and caught — not structured | MEDIUM |

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Booking cancel | Error if failed; silent if succeeded | Caller actorId, bookingId, resourceId, timestamp, cancel reason | HIGH | Dev console log in `cancelBookingController` on success: `actorId, bookingId, mode (customer/owner)` |
| Booking confirm | Same | Same | HIGH | Dev console log in `confirmBookingController` on success |
| Owner booking creation | Silent | callerActorId, resourceId, startsAt, serviceId | HIGH | Dev console log in `createOwnerBookingController` |
| Ownership assertion | Silent on pass | requestActorId, targetActorId, mode (self/actor_owner) | HIGH | Dev log `[assertOwnership] ok: mode=actor_owner actorId=... target=...` |
| Availability rule upsert | Silent on pass; error swallowed (`{ ok: false, error }`) | Who changed what rule, when, for which resource | HIGH | Dev log in `manageVportAvailabilityRuleController` |
| Booking history read | No trace | callerActorId, resourceId, count returned | MEDIUM | Dev log in `listVportBookingHistoryController` |

---

## AUDIT TRAIL WARNINGS

**AUDIT TRAIL WARNING — Booking Status Mutations**  
**Flow:** cancelBooking, confirmBooking  
**Missing audit evidence:** No structured event is emitted when a booking status changes. The `updateBookingStatusDAL` writes the status, and notifications are fired, but there is no internal audit log (even dev-only) of who changed what booking to what state and when.  
**Operational risk:** If a booking is incorrectly cancelled, there is no trail to determine which actor triggered the cancellation and what time it occurred without querying the DB directly.  
**Recommended audit event:** Dev-only log: `{ event: 'booking.status_changed', bookingId, fromStatus, toStatus, actorId, mode, timestamp }`

**AUDIT TRAIL WARNING — Availability Rule Changes**  
**Flow:** `manageVportAvailabilityRuleController`  
**Missing audit evidence:** No log of availability rule changes. The controller silently upserts rules via the dashboard DAL. Errors are returned as `{ ok: false }` rather than thrown.  
**Operational risk:** If availability is incorrectly set, there is no trail of when it changed or who triggered it.  
**Recommended audit event:** Dev-only log: `{ event: 'availability.rule_changed', resourceId, ruleId, ruleType, weekday, isActive, timestamp }`

**AUDIT TRAIL WARNING — Error Suppression in Availability Controller**  
**Flow:** `manageVportAvailabilityRuleController` catch block  
**Missing audit evidence:** The controller catches errors and returns `{ ok: false, error: err }` silently. If the DB write fails, the caller receives `{ ok: false }` but the error detail is not logged anywhere accessible.  
**Operational risk:** Silent failures in availability management are invisible without DB-level inspection.  
**Recommended audit event:** At minimum: `console.error('[manageVportAvailabilityRule] upsert failed:', err.message)` — dev-only, no PII.

---

## INSTRUMENTATION RECOMMENDATIONS

**INSTRUMENTATION RECOMMENDATION — Booking Mutation Correlation**  
**Location:** `cancelBooking.controller.js:8`, `confirmBooking.controller.js:8`, `createOwnerBooking.controller.js:6`  
**Purpose:** Enable runtime reconstruction of booking mutation sequences  
**Suggested signal:**
```js
// Dev-only — at top of each controller
if (import.meta.env.DEV) {
  console.log('[Booking] cancel|confirm|create', { bookingId, requestActorId, timestamp: Date.now() });
}
```
**Log level:** DEBUG  
**Production-safe:** NO — must be gated by `import.meta.env.DEV`  
**Dev-only:** YES  
**Recommended owner:** App

---

**INSTRUMENTATION RECOMMENDATION — Ownership Assertion Trace**  
**Location:** `assertActorOwnsVportActor.controller.js:42` (success return)  
**Purpose:** Confirm ownership assertion fired and which mode resolved  
**Suggested signal:**
```js
if (import.meta.env.DEV) {
  console.log('[assertOwnership] ok', { requestActorId, targetActorId, mode: result.mode });
}
return result;
```
**Log level:** DEBUG  
**Production-safe:** NO  
**Dev-only:** YES  
**Recommended owner:** App

---

**INSTRUMENTATION RECOMMENDATION — Availability Rule Mutation Visibility**  
**Location:** `manageVportAvailabilityRuleController` — success path and error catch  
**Purpose:** Trace availability rule changes during dev; surface silent errors  
**Suggested signal:**
```js
if (import.meta.env.DEV) {
  console.log('[Availability] rule upsert', { resourceId, ruleId, ruleType, weekday, isActive });
}
// In catch:
if (import.meta.env.DEV) {
  console.error('[Availability] rule upsert failed:', err?.message);
}
```
**Log level:** DEBUG / ERROR  
**Production-safe:** NO  
**Dev-only:** YES  
**Recommended owner:** App

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Booking cancel | NO | MEDIUM | Add `bookingId` as correlation anchor in all mutation logs |
| Booking confirm | NO | MEDIUM | Same |
| Owner booking creation | NO | MEDIUM | Add `resourceId + startsAt` as correlation anchor |
| Ownership assertion | NO | LOW | Derive from caller context — `requestActorId + targetActorId` |
| Availability rule mutation | NO | MEDIUM | `resourceId + ruleId + timestamp` as correlation |
| Booking history read | NO | LOW | `resourceId + callerActorId` as correlation |

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| RISK-4 confirmed dead | SENTRY (S-BOOK-04) | Remove from adapter pending engine fix |
| RISK-5 12 DALs confirmed dead | Ironman | Roadmap confirmation before any removal |
| L-BOOK-01 — manageVportAvailabilityRuleController no ownership gate | VENOM | Live production write path with no controller ownership assertion |
| L-BOOK-01 — useVportManageAvailability drops requestActorId | SENTRY | Identity context dropped silently by hook |
| L-BOOK-02 — serial reads in cancel/confirm | KRAVEN | Performance bottleneck — 3 serial round-trips per mutation |
| Observability gaps (all) | LOGAN | Document instrumentation placement in booking logan docs |
| Error suppression in manageVportAvailabilityRuleController | DEADPOOL | Silent failure risk — operational visibility gap |

---

## OBSERVABILITY MATURITY: BASIC

**Rationale:**  
- Booking mutation paths have no structured logging
- Ownership assertions are silent on success
- Availability mutations are silent and swallow errors
- Error events surface to UI but are not logged in a queryable form
- No correlation IDs on any booking or availability flow
- Notification dispatch is the closest thing to an event trail (notification records written to DB)

The system is functional but not observable. Runtime failure reconstruction requires direct DB inspection.

---

## FINAL LOKI STATUS: WATCH

**Reason:**  
- RISK-4 and RISK-5 are confirmed safe (dead in production) — no active risk from either
- L-BOOK-01 is a NEW live production gap (availability mutation has no ownership gate) — routed to VENOM
- L-BOOK-02 is a performance watch item — serial reads in mutation path
- Observability maturity is BASIC — booking mutations leave no internal audit trail
- No CRITICAL runtime finding; no query storms, no N+1 in live paths
