# KRAVEN Performance Analysis — VPORT Book Tab

**Date:** 2026-05-27
**Time:** 06:30
**Application Scope:** VCSM + ENGINE
**Feature:** VPORT Book Tab — public booking calendar, availability read path, booking insert fan-out
**Reviewer:** KRAVEN

---

## KRAVEN TARGET

Feature / Route: VPORT Book Tab (`?tab=book`)
Application Scope: VCSM + ENGINE
Entry point: `VportProfileTabContent.jsx` → `VportBookingView` → `useVportPublicBooking` / `useVportBookingView`
Reason for analysis: Post BOOK-001/002 resolution; SENTRY/KRAVEN/LOGAN required before THOR gate

---

## LOKI EVIDENCE STATUS

**MISSING** — No Loki runtime traces were available. All analysis is based on static code inspection. Findings are classified as INFERRED or HYPOTHESIS where appropriate. Confidence is MEDIUM for controller fan-out findings (directly readable from code) and LOW for client-side slot computation cost (no profiling available).

---

## RUNTIME EVIDENCE

**Observed controllers (public booking path):**
- `getVportResourceAvailabilityController` — rules + bookings fetch
- `listVportBookingResourcesController` — resource list for barber selection
- `createVportPublicBookingController` — booking insert + notification routing

**Observed DAL calls (public booking path, per `createVportPublicBookingController`):**
1. `getVportResourceByIdDAL` — `vport.resources` (1 read, conditional: only if resource found)
2. `readActorVportLinkDAL` — `vc.actors` (1 read, conditional: only if `requestActorId` non-null)
3. `getVportServiceByIdDAL` — `vport.services` (1 read, conditional: only if `serviceId` non-null)
4. `insertVportBookingDAL` — `vport.bookings` (1 write)
5. `getVportActorIdByProfileIdDAL` — `vport.profiles` (1 read, **unconditional after insert**)

**Total DB operations per booking (worst-case, logged-in citizen with service):** 4 reads + 1 write = 5 operations.
**Total DB operations per guest booking (no requestActorId):** 2 reads + 1 write = 3 operations, BUT step 5 still fires.

**Observed DAL calls (availability fetch, per `getVportResourceAvailabilityController`):**
- `listVportAvailabilityRulesByResourceIdDAL` — `vport.availability_rules` (parallelized)
- `listVportBookingsInRangeDAL` — `vport.bookings` (parallelized)
Execution: `Promise.all([rules, bookings])` — already parallelized ✅

**Observed DAL calls (resource list, per `listVportBookingResourcesController`):**
- `getVportProfileIdByActorDAL` — `vport.profiles` (serial step 1)
- `listVportResourcesByProfileIdDAL` — `vport.resources` (serial step 2)
Execution: **Sequential** — 2 serial reads.

**Observed tables:**
- `vport.resources`, `vport.availability_rules`, `vport.bookings`, `vport.profiles`, `vport.services`
- `vc.actors` (actor kind validation)

---

## RUNTIME CRITICALITY REVIEW

| Area | Criticality | Reason |
|---|---|---|
| `createVportPublicBookingController` | Booking-critical | Every public booking passes through this path |
| `getVportResourceAvailabilityController` | Booking-critical | Calendar rendering; called on every resource ID change |
| `listVportBookingResourcesController` | Booking-critical | Initial data load; barber selection |
| `buildSlotsByDate` (client-side) | Booking-critical | Slot grid computation; blocking before user can select a date |
| `useVportBookingView` availability refetch | Booking-critical | Month navigation triggers full re-fetch |

---

## PERFORMANCE PATTERNS

**Duplicate reads:** KPF-001 — `getVportActorIdByProfileIdDAL` called unconditionally post-insert even for guest bookings where no notification will fire.

**N+1 suspicion:** LOW — single-resource availability fetches are the design; no loop-per-item pattern detected in hot path.

**Serial async chains:**
- KPF-002: `listVportBookingResourcesController` — 2 serial reads (profile ID → resources)
- KPF-001: `getVportActorIdByProfileIdDAL` wasteful call after guest bookings

**Controller fan-out:** MODERATE — `createVportPublicBookingController` performs up to 4 sequential DB reads before/after the write. Parallelization is limited by data dependencies (resource must be validated before insert, actor lookup depends on requestActorId).

**Cache miss patterns:** Availability cache has 5-min TTL. Month change forces full re-fetch regardless of prior navigation to same month (within 5 min = cache hit; after 5 min = miss).

**Payload size risk:** LOW — availability queries return only IDs + time columns; no media or large text.

**Hydration cost signals:** `buildSlotsByDate` is CPU-bound; generates all slots for 1 month × N slots/day. Re-runs on `occupiedIntervalsByDate` change (optimistic updates). MEDIUM risk for calendars with many existing bookings.

---

## QUERY AMPLIFICATION ANALYSIS

| Runtime Path | Primary Records | DB Operations | Amplification | Severity |
|---|---:|---:|---:|---|
| `createVportPublicBookingController` (citizen + service) | 1 booking | 5 (4R+1W) | 5× | ELEVATED |
| `createVportPublicBookingController` (guest) | 1 booking | 3 (2R+1W) + 1 wasted = 4 | 4× | ELEVATED |
| `listVportBookingResourcesController` | N resources | 2 (both reads) | 2× | HEALTHY |
| `getVportResourceAvailabilityController` | 1 resource | 2 (parallelized) | 2× | HEALTHY |

---

## WATERFALL DETECTION

| Caller Chain | Serial Operations | Estimated Delay | Optimization Opportunity |
|---|---:|---:|---|
| `createVportPublicBookingController` (happy path) | 3 serial reads before insert | ~75-150ms overhead | Move actor lookup before resource lookup to exit early on kind mismatch? Minor — not blocking. |
| `createVportPublicBookingController` (post-insert) | `getVportActorIdByProfileIdDAL` unconditional | ~25-50ms per guest booking | Skip when `requestActorId = null` — saves one DB read |
| `listVportBookingResourcesController` | profileId → resources | ~25-50ms | Single JOIN query possible; low priority (called once on init) |

---

## CACHE EFFICIENCY REVIEW

| Cache Area | Status | Problem | Runtime Impact |
|---|---|---|---|
| Availability rules + bookings (engine) | EFFECTIVE | 5-min TTL — helps re-navigation within window | LOW |
| `buildSlotsByDate` (useMemo) | EFFECTIVE | React memoizes on deps — only recomputes when rules/exceptions/bookings/duration changes | LOW |
| `getVportActorIdByProfileIdDAL` | UNKNOWN | No caching observed; called unconditionally | MEDIUM (guest path waste) |
| Resource list (`listVportBookingResourcesController`) | UNKNOWN | No caching; called on mount | LOW (called once) |

---

## PAYLOAD / HYDRATION REVIEW

| Runtime Area | Payload Risk | Hydration Risk | Cause |
|---|---|---|---|
| `listVportBookingsInRangeDAL` response | LOW | LOW | Returns only time/status/minimal customer fields — explicit column list ✅ |
| `listVportAvailabilityRulesByResourceIdDAL` | LOW | LOW | Returns only scheduling columns — explicit column list ✅ |
| `buildSlotsByDate` client computation | N/A | MEDIUM | CPU cost of slot grid generation; re-runs on optimistic booking state changes |

---

## CONTROLLER FAN-OUT REVIEW

| Controller | DAL Calls | Dependencies | Risk |
|---|---:|---:|---|
| `createVportPublicBookingController` | 4 reads + 1 write | resource → actor → service → insert → profile | MODERATE |
| `getVportResourceAvailabilityController` | 2 (parallel) | rules ∥ bookings | HEALTHY |
| `listVportBookingResourcesController` | 2 (serial) | profileId → resources | HEALTHY |

---

## KRAVEN PERFORMANCE FINDINGS

---

### KRAVEN PERFORMANCE FINDING

**Finding ID:** KPF-001
**Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js` lines 98–124
**Application Scope:** VCSM
**Runtime Criticality:** Booking-critical
**Evidence Type:** INFERRED (code inspection)
**Observation Source:** Static analysis of `createVportPublicBookingController`
**Confidence:** HIGH

**Current runtime behavior:**
`getVportActorIdByProfileIdDAL` is called unconditionally after every successful `insertVportBookingDAL`, regardless of whether `requestActorId` is null. The resulting `vportActorId` is only used to build `recipientSet`, and the notification batch fires only when `requestActorId && recipientActorIds.length > 0`. For guest bookings (`requestActorId = null`), the notification never fires — but the DB read still executes.

**Detected pattern:** Unconditional DB read gating an operation that is conditionally executed.

**Query Amplification:** 4× (citizen) → could be reduced to 3× for guest path.

**Payload/Hydration Impact:** NONE

**Controller Fan-Out:** MODERATE — one preventable post-insert read.

**Cache Efficiency:** UNKNOWN — no cache on this DAL.

**Blast Radius:** Guest booking path (all guests — walk-ins, QR scan-ins).

**Estimated impact:** LOW-MEDIUM — 1 wasted `vport.profiles` read per guest booking. In a high-volume barbershop with many walk-in QR bookings, this accumulates.

**Root cause hypothesis:** Notification routing code was extracted as a unit; `getVportActorIdByProfileIdDAL` was placed before the notification guard rather than inside it.

**Recommended optimization:**
```js
// BEFORE (unconditional):
const vportActorId = await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id });
const memberActorId = resource.member_actor_id ?? null;
const recipientSet = new Set();
if (vportActorId) recipientSet.add(String(vportActorId));
if (memberActorId) recipientSet.add(String(memberActorId));
if (requestActorId) recipientSet.delete(String(requestActorId));
const recipientActorIds = [...recipientSet];
if (requestActorId && recipientActorIds.length > 0) {
  publishVcsmNotificationBatch(...);
}

// AFTER (conditional — skip DB read for guests):
if (requestActorId) {
  const vportActorId = await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id });
  const memberActorId = resource.member_actor_id ?? null;
  const recipientSet = new Set();
  if (vportActorId) recipientSet.add(String(vportActorId));
  if (memberActorId) recipientSet.add(String(memberActorId));
  recipientSet.delete(String(requestActorId));
  const recipientActorIds = [...recipientSet];
  if (recipientActorIds.length > 0) {
    publishVcsmNotificationBatch(...);
  }
}
```

**Optimization ROI:** MODERATE — eliminates 1 DB read on 100% of guest bookings. Guest bookings include all walk-ins, QR code scans, and unauthenticated flows.

**Architectural/Security Risk:** LOW — the read provides no security value; it is notification-routing only. Removing it from the guest path does not affect booking insertion or ownership validation.

**Expected improvement:** ~25-50ms reduction per guest booking; 1 fewer `vport.profiles` read per guest insert.

**Recommended handoff:** WOLVERINE for implementation (controller-layer change, no architecture concern).

---

### KRAVEN PERFORMANCE FINDING

**Finding ID:** KPF-002
**Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js` lines 26–33
**Application Scope:** VCSM
**Runtime Criticality:** Booking-critical (initial load only)
**Evidence Type:** INFERRED
**Confidence:** HIGH

**Current runtime behavior:**
`listVportBookingResourcesController` performs two sequential reads: first `getVportProfileIdByActorDAL({ actorId })` to resolve the profile ID, then `listVportResourcesByProfileIdDAL({ profileId })` to fetch resources. These are two separate round trips.

**Detected pattern:** Serial async chain — data dependency allows these reads to be combined into a single JOIN query (resources join profiles on actor_id = actorId).

**Query Amplification:** 2× per resource-list call.

**Blast Radius:** Single route (initial barber/resource list load on booking tab open).

**Estimated impact:** LOW — called once on mount; not in the hot booking write path.

**Root cause hypothesis:** The two DALs were written independently; no JOIN was added when they were combined in the controller.

**Recommended optimization:** Add a `listVportResourcesByActorIdDAL` that joins `vport.resources` and `vport.profiles` on `profiles.id = resources.profile_id WHERE profiles.actor_id = $actorId`. Eliminates the profile ID resolution step.

**Optimization ROI:** LOW — one-time load, minimal user-facing latency impact. P4.

**Architectural/Security Risk:** NONE — read-only optimization, no boundary change.

**Recommended handoff:** WOLVERINE (low priority — P4).

---

### KRAVEN PERFORMANCE FINDING

**Finding ID:** KPF-003
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js` lines 74–83
**Application Scope:** VCSM
**Runtime Criticality:** Booking-critical (owner calendar navigation)
**Evidence Type:** INFERRED
**Confidence:** MEDIUM

**Current runtime behavior:**
`useVportBookingView` fetches availability for a single-month range (`startOfMonth(monthCursor)` to `endOfMonth(monthCursor)`). Month navigation (`onPrevMonth`, `onNextMonth`) changes `monthCursor`, changing `rangeStart`/`rangeEnd`, triggering a new `useBookingAvailability` fetch. No adjacent-month prefetching exists.

Contrast with `useVportPublicBooking` (visitor path): fetches current + next month in one request (`rangeStart` = current month start, `rangeEnd` = end of next month), reducing navigation latency.

**Detected pattern:** Single-month fetch window on owner path; 2-month window on visitor path. Behavioral divergence.

**Cache Efficiency:** PARTIAL — the 5-min availability cache helps for same-month re-navigation but not first-time visits to new months.

**Blast Radius:** Owner calendar view — every month-navigation interaction.

**Estimated impact:** MEDIUM — owners actively navigating their booking calendar feel a loading state on every backward/forward navigation.

**Root cause hypothesis:** The two booking hooks (`useVportPublicBooking` for visitors, `useVportBookingView` for owners) were developed independently. The visitor hook was optimized to pre-fetch 2 months; the owner hook was not.

**Recommended optimization:** Option A: Widen `rangeEnd` in owner hook to cover current + next month (mirrors visitor path). Option B: Prefetch adjacent month reactively when user approaches month boundary. Option A is the simpler fix.

**Optimization ROI:** MODERATE — eliminates loading state on forward-month navigation for owners.

**Architectural/Security Risk:** NONE — availability reads are public/owner-scoped by the engine hook (`publicMode: !isOwner`).

**Recommended handoff:** WOLVERINE (P3).

---

## KRAVEN PRIORITY MATRIX

| Priority | Finding | Runtime Criticality | Estimated Impact | ROI | Severity |
|---|---|---|---|---|---|
| 1 | KPF-001 — unconditional `getVportActorIdByProfileIdDAL` on guest path | Booking-critical | LOW-MEDIUM | MODERATE | LOW |
| 2 | KPF-003 — single-month fetch on owner path vs 2-month on visitor path | Booking-critical | MEDIUM | MODERATE | LOW |
| 3 | KPF-002 — 2 serial reads in `listVportBookingResourcesController` | Booking-critical (init only) | LOW | LOW | LOW |

---

## OPTIMIZATION SAFETY REVIEW

| Optimization | Architectural Risk | Security Risk | Requires SENTRY/VENOM |
|---|---|---|---|
| KPF-001: conditional `getVportActorIdByProfileIdDAL` | NONE — stays in controller | NONE — no auth change | No |
| KPF-002: combine resource list reads into JOIN | NONE — stays in DAL layer | NONE — read-only | No |
| KPF-003: widen owner fetch window | NONE — availability read only | NONE | No |

---

## FINAL KRAVEN STATUS

**Overall performance posture: WATCH**

No CRITICAL or HIGH findings. All three findings are LOW severity, addressable at P3-P4 priority. The most actionable is KPF-001 (unconditional DB read on guest path) — small fix, immediate benefit.

The booking path's parallelization of rules + bookings in `getVportResourceAvailabilityController` is well-designed. The visitor hook's 2-month pre-fetch is a good pattern. The main gaps are the unconditional post-insert profile read and the owner-path single-month window.

**THOR assessment:** No performance findings block release. WATCH status applies — KPF-001 and KPF-003 are recommended for a follow-up pass after release.

---

## Governance Events

| Finding | Status | Priority | Recommended Owner |
|---|---|---|---|
| KPF-001 — unconditional `getVportActorIdByProfileIdDAL` | OPEN | P3 | WOLVERINE |
| KPF-002 — serial profile+resource reads | OPEN | P4 | WOLVERINE |
| KPF-003 — owner single-month window | OPEN | P3 | WOLVERINE |
