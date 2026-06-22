# KRAVEN Performance Analysis — Booking Status Mutation Serial Read Chain

**Date:** 2026-05-14  
**Reviewer:** KRAVEN  
**Trigger:** Loki L-BOOK-02 — 3-serial-read bottleneck identified before every booking status mutation; routed from Loki to Kraven for impact classification and optimization recommendation  
**Application Scope:** VCSM  
**LOKI Evidence Status:** PARTIAL — chain is structurally inferred from code inspection; timing values are estimated from typical Supabase PK read latency  
**Mode:** READ-ONLY ANALYSIS ONLY — no code modifications applied

---

## KRAVEN TARGET

**Feature / Route:** `features/booking/controller/` — `cancelBookingController`, `confirmBookingController`; and `features/dashboard/vport/controller/createOwnerBookingController`  
**Application Scope:** VCSM  
**Entry point:** `useBookingOps.js` → `cancelBookingController` / `confirmBookingController` → serial DB chain  
**Reason for analysis:** L-BOOK-02 from Loki — every booking status mutation (owner cancel, owner confirm, customer cancel) executes 4 sequential database reads before the actual write, adding an estimated 160–320ms of serial overhead before the mutation lands

---

## RUNTIME EVIDENCE

**Evidence Type:** INFERRED  
**Observation Source:** Static code analysis of controller and DAL files; correlation with Loki L-BOOK-02 trace pattern  
**Confidence:** HIGH — the serial structure is deterministic from the code; no branching can parallelize steps 2–4 given current data dependencies

---

### Exact Serial Chain — `confirmBookingController`

```
Step 1:  getBookingByIdDAL({ bookingId })
         → SELECT 22 columns FROM vport.bookings WHERE id = :bookingId
         → PK lookup ~50ms
         → Result: booking (needs booking.resource_id for step 2)

Step 2:  getBookingResourceByIdDAL({ resourceId: booking.resource_id })
         → SELECT 9 columns FROM vport.resources WHERE id = :resource_id
         → PK lookup ~50ms
         → Result: resource (needs resource.owner_actor_id for step 3)

Step 3a: getActorByIdDAL({ actorId: requestActorId })
         → SELECT 5 columns FROM vc.actors WHERE id = :requestActorId
         → PK lookup ~40ms
         → Result: requesterActor (needs actor.profile_id for step 3b)

Step 3b: readActorOwnerLinkByActorAndUserProfileDAL({ targetActorId, userProfileId })
         → SELECT 5 columns FROM vc.actor_owners WHERE actor_id = :targetActorId AND user_id = :userProfileId
         → Composite index lookup ~50ms
         → Result: ownership confirmed / denied

Step 4:  updateBookingStatusDAL({ bookingId, status, ... })
         → UPDATE vport.bookings SET ... WHERE id = :bookingId
         → RETURNING 22 columns
         → Write + projection ~60ms
```

**Total serial chain (owner path): ~250ms pre-write overhead + ~60ms write = ~310ms per mutation**

---

### Exact Serial Chain — `cancelBookingController` (Customer Path)

For customer self-cancel (`isCustomer = true`), step 3a + 3b are skipped:

```
Step 1: getBookingByIdDAL          → ~50ms
Step 2: getBookingResourceByIdDAL  → ~50ms  (still fetched — needed for notification)
Step 4: updateBookingStatusDAL     → ~60ms
Total: ~160ms
```

**Customer self-cancel is significantly faster** because the ownership assertion is bypassed. The resource is still fetched for notification construction.

---

### Chain for `createOwnerBookingController`

```
Step 1: getVportResourceByIdDAL({ resourceId })          → ~50ms
Step 2: [conditional] getVportActorIdByProfileIdDAL       → ~50ms (only if owner_actor_id missing from resource)
Step 3a: getActorByIdDAL({ actorId: callerActorId })     → ~40ms (inside assertActorOwnsVportActor)
Step 3b: readActorOwnerLinkByActorAndUserProfileDAL       → ~50ms
Step 4: insertVportBookingDAL                             → ~60ms
Total (when owner_actor_id present on resource): ~200ms
Total (when owner_actor_id missing, step 2 runs): ~250ms
```

---

## PERFORMANCE PATTERNS

**Duplicate reads:** NONE — all 4 reads hit different tables; no repeated table access within one mutation  
**N+1 pattern:** NONE — single booking mutation, no loops  
**Serial async chain:** YES — 4 reads + 1 write, all sequentially dependent on the previous result  
**Controller fan-out:** MODERATE — 4 DAL calls + 1 sub-controller call (assertActorOwnsVportActor itself calls 2 DALs)  
**Cache miss patterns:** MEDIUM RISK — step 3a (`getActorByIdDAL`) fetches the session actor's record from DB; this is stable per session and could be served from the actor hydration store  
**Payload size risk:** LOW-MEDIUM — step 1 fetches 22 columns from `bookings` including full PII (`customer_phone`, `customer_email`, `customer_profile_id`, `internal_note`) when only `resource_id`, `customer_actor_id`, and `service_label_snapshot` are needed for the ownership decision  
**Hydration cost signals:** LOW — booking mutation is not on a render-critical path; result is used only for notification dispatch

---

## QUERY AMPLIFICATION ANALYSIS

| Runtime Path | Primary Operation | DB Operations | Amplification | Severity |
|---|---:|---:|---:|---|
| confirmBooking (owner) | 1 write | 5 total (4R + 1W) | 5.0x | ELEVATED |
| cancelBooking (owner) | 1 write | 5 total (4R + 1W) | 5.0x | ELEVATED |
| cancelBooking (customer) | 1 write | 3 total (2R + 1W) | 3.0x | ELEVATED |
| createOwnerBooking (owner_actor_id present) | 1 write | 4 total (3R + 1W) | 4.0x | ELEVATED |

**Amplification classification:** All paths in the 3–5x range → **ELEVATED** (threshold 2–5 = elevated)

---

## WATERFALL DETECTION

| Caller Chain | Serial Operations | Estimated Total Delay | Optimization Opportunity |
|---|---:|---:|---|
| confirmBooking: booking → resource → actor → ownerLink → write | 5 | ~310ms | Step 1+2 combinable via JOIN; step 3a cacheable from session |
| cancelBooking (owner): booking → resource → actor → ownerLink → write | 5 | ~310ms | Same as confirm |
| cancelBooking (customer): booking → resource → write | 3 | ~160ms | Minimal — resource fetch still needed for notification |
| createOwnerBooking: resource → actor → ownerLink → write | 4 | ~200ms | Step 3a cacheable; resource fetch cannot be eliminated |

**Most impactful waterfall:** confirm/owner-cancel at ~310ms — this is the primary optimization target

---

## RUNTIME CRITICALITY REVIEW

| Area | Criticality | Reason |
|---|---|---|
| confirmBookingController | Booking-critical | Live owner action; user waits for response before UI updates |
| cancelBookingController (owner) | Booking-critical | Live owner action; affects booking state and notification delivery |
| cancelBookingController (customer) | Booking-critical | Live customer action; already 40% faster due to ownership skip |
| createOwnerBookingController | Booking-critical | Owner-created booking; runs on dashboard booking screen |

---

## CACHE EFFICIENCY REVIEW

| Cache Area | Status | Problem | Runtime Impact |
|---|---|---|---|
| Session actor `profile_id` | BYPASSED | Step 3a fetches requester actor from DB on every mutation; `profile_id` is stable for session duration | ~40ms per mutation — avoidable |
| Booking record (step 1) | UNKNOWN | Booking rows are mutable; no safe TTL cache applicable pre-mutation | N/A — cannot cache mutable records pre-write |
| Resource record (step 2) | PARTIAL | Resource record is mostly stable; caching `owner_actor_id` per `resourceId` per session would eliminate step 2 (~50ms) with some invalidation risk | ~50ms per mutation — cacheable with care |
| Actor owner link (step 3b) | PARTIAL | Ownership is stable for session duration; cacheable with session-scoped TTL | ~50ms per mutation — cacheable with low risk |

**Key cache opportunity:** The session actor's `profile_id` (step 3a) and the actor owner link result (step 3b) are both stable for the duration of a user session. A session-scoped cache for "does actor X own actor Y" — keyed by `(requestActorId, targetActorId)` — would reduce the ownership assertion from 2 DB reads to a memory lookup after the first assertion.

---

## PAYLOAD / HYDRATION REVIEW

| Runtime Area | Payload Risk | Hydration Risk | Cause |
|---|---|---|---|
| `getBookingByIdDAL` step 1 | MODERATE | LOW | Fetches 22 columns including PII (`customer_phone`, `customer_email`, `customer_profile_id`, `internal_note`) — only `resource_id`, `customer_actor_id`, `service_label_snapshot`, `starts_at` are used for the ownership decision and notification |
| `updateBookingStatusDAL` step 4 | MODERATE | LOW | Returns same 22-column projection after write — PII returned even though cancel/confirm operations don't need phone/email (DB-BOOK-05 cross-reference) |

---

## CONTROLLER FAN-OUT REVIEW

| Controller | DAL Calls | Sub-controllers | Total Collaborators | Risk |
|---|---:|---:|---:|---|
| `confirmBookingController` | 3 (getBooking, getResource, updateBooking) | 1 (assertActorOwnsVportActor) | 4 | MODERATE |
| `cancelBookingController` | 3 (getBooking, getResource, updateBooking) | 1 (assertActorOwnsVportActor) | 4 | MODERATE |
| `assertActorOwnsVportActorController` (child) | 2 (getActor, readOwnerLink) | 0 | 2 | HEALTHY |
| **Effective total per mutation (owner path)** | **5 DAL + 1 sub-controller** | | **6** | HIGH |

The effective fan-out of 6 (5 DAL calls across the controller + sub-controller chain) approaches the contract limit of 5 direct collaborators per controller. This is not a violation since the 5 is split across controller + sub-controller, but the cumulative serial depth is worth noting.

---

## KRAVEN PERFORMANCE FINDINGS

---

### KRAVEN PERFORMANCE FINDING — K-BOOK-01

**Finding ID:** K-BOOK-01  
**Location:** `cancelBookingController` + `confirmBookingController` — `apps/VCSM/src/features/booking/controller/`  
**Application Scope:** VCSM  
**Runtime Criticality:** Booking-critical  
**Evidence Type:** INFERRED  
**Observation Source:** Static chain analysis — all await points confirmed in code; timing estimated from typical Supabase single-row latency  
**Confidence:** HIGH

**Current runtime behavior:**

Every owner cancel and every confirm mutation executes 5 sequential DB operations before returning:
1. `getBookingByIdDAL` — 22-col SELECT on `vport.bookings`
2. `getBookingResourceByIdDAL` — 9-col SELECT on `vport.resources`
3. `getActorByIdDAL` — 5-col SELECT on `vc.actors` (for requester's `profile_id`)
4. `readActorOwnerLinkByActorAndUserProfileDAL` — 5-col SELECT on `vc.actor_owners`
5. `updateBookingStatusDAL` — UPDATE + 22-col SELECT on `vport.bookings`

Steps 1–5 are entirely serial; no parallelism is possible because each depends on the previous result.

**Detected pattern:** Serial waterfall — 4 reads gating 1 write  
**Query Amplification:** 5.0x (ELEVATED)

**Estimated impact:**
- Owner path: ~250ms read overhead + ~60ms write = ~310ms total
- Customer-cancel path: ~100ms read overhead + ~60ms write = ~160ms total (faster — skip steps 3a/3b)
- Against DAL budget: reads consume ~250ms of 500ms total budget, leaving ~250ms margin
- Against controller budget: ~310ms total approaches the 300ms controller orchestration budget

**Root cause hypothesis:**

The serial chain is architecturally correct given the data dependencies — step 2 needs step 1's `resource_id`, step 3a needs step 2's `owner_actor_id`, and step 3b needs step 3a's `profile_id`. No re-ordering is possible. The optimization surface is:
1. Eliminate step 3a by caching the session actor's `profile_id` (stable per session)
2. Eliminate step 1+2 latency by combining them via a single JOIN query
3. Short-circuit the ownership assertion entirely via a single RPC call

**Recommended optimization:**

**Option A — Session actor profile_id cache (LOW complexity, HIGH ROI):**  
Cache the result of `getActorByIdDAL({ actorId: requestActorId })` in the actor hydration store (already exists at `engines/hydration/src/store.js`) or a session-scoped TTL cache. The requesting actor's `profile_id` is invariant for the session — it never changes while the actor is logged in. After the first ownership assertion, all subsequent ownership checks in the same session skip step 3a entirely.

Expected reduction: ~40ms saved per mutation. Amplification drops from 5.0x to 4.0x.

**Option B — Combined booking + resource JOIN query (MEDIUM complexity, MODERATE ROI):**  
Replace step 1 + step 2 with a single query that JOINs `bookings` with `resources`:
```js
// Proposed: getBookingWithResourceDAL({ bookingId })
SELECT b.id, b.resource_id, b.customer_actor_id, b.status, b.service_label_snapshot,
       b.starts_at, r.owner_actor_id, r.name
FROM vport.bookings b
JOIN vport.resources r ON r.id = b.resource_id
WHERE b.id = :bookingId
```

Expected reduction: ~50ms saved (one fewer round trip). Amplification drops from 5.0x to 4.0x.

**Option A + B combined:** ~90ms saved. Amplification drops from 5.0x to 3.0x. Total mutation time: ~220ms.

**Option C — Ownership check + write as single RPC (HIGH complexity, EXTREME ROI):**  
Create a DB-level RPC function `cancel_booking_if_owner(booking_id, requester_profile_id)` that combines the ownership verification and the status update in a single atomic transaction. RLS policy on the function ensures the call only succeeds if `auth.uid()` matches an active owner. This eliminates all 4 reads and reduces the round trips to 1 (the RPC itself). Requires Carnage for schema/function creation. Security-reviewed must confirm RLS policy correctness before use.

Expected reduction: ~250ms saved. Total mutation time: ~70ms.

**Recommended owner:** Wolverine (Option A+B implementation), Carnage (Option C planning)

**Optimization ROI:**
- Option A: HIGH ROI, LOW complexity, ZERO architectural risk
- Option B: MODERATE ROI, LOW-MEDIUM complexity, LOW architectural risk (JOIN may affect payload projection)
- Option C: EXTREME ROI, HIGH complexity, requires Carnage + Venom security review

**Expected improvement:** Option A alone: ~13% faster. Option A+B: ~29% faster. Option C: ~77% faster.

---

### KRAVEN PERFORMANCE FINDING — K-BOOK-02

**Finding ID:** K-BOOK-02  
**Location:** `apps/VCSM/src/features/booking/dal/getBookingById.dal.js` (lines 3–26)  
**Application Scope:** VCSM  
**Runtime Criticality:** Booking-critical  
**Evidence Type:** INFERRED  
**Confidence:** HIGH

**Current runtime behavior:**

`getBookingByIdDAL` fetches 22 columns from `vport.bookings`:

```js
const BOOKING_SELECT = [
  "id", "resource_id", "service_id", "customer_actor_id", "customer_profile_id",
  "status", "source", "starts_at", "ends_at", "timezone",
  "service_label_snapshot", "duration_minutes",
  "customer_name", "customer_phone", "customer_email", "customer_note",
  "internal_note", "cancelled_at", "completed_at",
  "created_by_actor_id", "created_at", "updated_at"
].join(",");
```

For the purposes of the ownership check and notification dispatch, the controllers need only:
- `resource_id` (for step 2)
- `customer_actor_id` (for `isCustomer` check)
- `service_label_snapshot` (for notification context)
- `starts_at` (for notification context)

The full PII set (`customer_phone`, `customer_email`, `customer_profile_id`, `internal_note`) is fetched on every cancel and confirm mutation — 4 columns that are not used in the cancel/confirm flow.

**Detected pattern:** Overfetch  
**Payload/Hydration Risk:** MODERATE (PII in memory unnecessarily — aligns with DB-BOOK-05 from DB audit)

**Recommended optimization:**

Introduce a slim projection for mutation-path reads:

```js
// Proposed: getBookingForMutationDAL({ bookingId }) — mutation-path only
const BOOKING_MUTATION_SELECT = [
  "id", "resource_id", "customer_actor_id", "status",
  "service_label_snapshot", "starts_at", "ends_at"
].join(",");
```

This reduces the projected payload from 22 columns to 7 — excluding all PII from the cancel/confirm mutation path. Full PII access (phone, email, note) should be reserved for a separate `getBookingDetailDAL` used only when the owner explicitly opens a booking detail view.

**Optimization ROI:** MODERATE — reduces payload size, eliminates PII from cancel/confirm memory context  
**Cross-reference:** DB-BOOK-05 in DB audit recommends the same change for `updateBookingStatusDAL`'s return projection. Both DALs should be aligned.

---

### KRAVEN PERFORMANCE FINDING — K-BOOK-03

**Finding ID:** K-BOOK-03  
**Location:** `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` + `apps/VCSM/src/features/booking/dal/getActorById.dal.js`  
**Application Scope:** VCSM  
**Runtime Criticality:** Booking-critical (impacts every ownership-gated mutation)  
**Evidence Type:** INFERRED  
**Confidence:** HIGH

**Current runtime behavior:**

`assertActorOwnsVportActorController` always fetches the requesting actor from the database to obtain their `profile_id`:

```js
const requesterActor = await getActorByIdDAL({ actorId: requestActorId });
// ... uses requesterActor.profile_id for the actor_owners lookup
```

The requesting actor is the session user. Their `actorId → profile_id` mapping is:
- Stable: does not change during a session
- Already resolved: the identity provider loaded it during auth

However, `profile_id` is intentionally excluded from `toPublicIdentity()` (confirmed: identity model does not expose `profile_id`). The identity layer correctly hides it per §1.3 of the architecture contract.

**Detected pattern:** Repeated session-stable DB read — avoidable via internal (not public-surface) cache

**Root cause:** The `profile_id` is needed for the `actor_owners` ownership check but cannot be read from the public identity surface. The only way to obtain it currently is a DB read on every assertion.

**Recommended optimization:**

Add a session-scoped actor cache inside `assertActorOwnsVportActorController` or within the booking adapter:

```js
// Proposed: internal session-scoped Map — never exposed to public surface
const _actorProfileCache = new Map(); // actorId → profile_id, cleared on auth state change

export async function assertActorOwnsVportActorController({ requestActorId, targetActorId }) {
  // ... short-circuit if requestActorId === targetActorId
  
  let requesterProfileId = _actorProfileCache.get(requestActorId);
  if (!requesterProfileId) {
    const requesterActor = await getActorByIdDAL({ actorId: requestActorId });
    // ... validate kind === 'user', is_void === false
    requesterProfileId = requesterActor.profile_id;
    _actorProfileCache.set(requestActorId, requesterProfileId);
  }
  
  // ... proceed to readActorOwnerLinkByActorAndUserProfileDAL
}
```

**Security constraint:** This cache must:
1. Be a module-level Map (not exposed to any public surface)
2. Be cleared on auth state change / session end — integrate with the auth callback / sign-out flow
3. Never expose `profile_id` outside this module

**Optimization ROI:** HIGH — eliminates 1 DB round trip per mutation after first ownership assertion in the session  
**Architectural risk:** LOW — cache is entirely internal to the controller module  
**Security risk:** LOW — `profile_id` stays internal; never surfaces to public hook or component layer  
**Recommended owner:** Wolverine (can implement alongside K-BOOK-01 Option A)

---

## PERFORMANCE BLAST RADIUS

**Affected systems:** `cancelBookingController`, `confirmBookingController`, `createOwnerBookingController` — all 3 booking mutation controllers are affected by the serial ownership chain  
**User-facing impact:** Booking cancel and confirm UI operations take ~310ms before the user sees a result — noticeably slow on mobile  
**Operational impact:** Every ownership assertion generates 2 DB reads (`vc.actors`, `vc.actor_owners`); under booking-heavy usage (event VPORTs, shared resources), this multiplies linearly with mutation count  
**Release impact:** NOT release-blocking — functional correctness is maintained; this is a performance optimization

---

## OPTIMIZATION SAFETY REVIEW

| Optimization | Architectural Risk | Security Risk | Requires SENTRY/VENOM |
|---|---|---|---|
| K-BOOK-01 Option A — session actor profile_id cache | LOW — internal to assertActorOwnsVportActor | LOW — profile_id stays internal, never surfaced | NO — but Venom should spot-check cache invalidation on sign-out |
| K-BOOK-01 Option B — combined JOIN DAL | LOW — new DAL function, replaces two | NONE | NO |
| K-BOOK-01 Option C — ownership+write RPC | MEDIUM — schema change, RLS function | HIGH — RLS correctness on RPC is critical | YES — Carnage (migration) + Venom (RLS review) |
| K-BOOK-02 — slim projection | NONE — additive DAL, existing DAL unchanged | POSITIVE — removes PII from memory | NO |
| K-BOOK-03 — internal profile_id cache | LOW — same as Option A | LOW — same as Option A | NO |

---

## KRAVEN PRIORITY MATRIX

| Priority | Finding | Runtime Criticality | Estimated Impact | ROI | Severity |
|---|---|---|---|---|---|
| 1 | K-BOOK-01 Option A+B — session cache + JOIN DAL | Booking-critical | ~90ms saved per mutation | HIGH | MEDIUM |
| 2 | K-BOOK-03 — internal profile_id cache in assertActorOwnsVportActor | Booking-critical | ~40ms saved per mutation after first | HIGH | MEDIUM |
| 3 | K-BOOK-02 — slim booking projection for mutation path | Booking-critical | Payload reduction; PII isolation | MODERATE | LOW |
| 4 | K-BOOK-01 Option C — ownership+write RPC | Booking-critical | ~250ms saved per mutation | EXTREME | HIGH (requires Carnage) |

---

## TIMING BUDGET STATUS

| Runtime Area | Observed (estimated) | Budget | Status |
|---|---:|---:|---|
| Controller orchestration (owner path) | ~310ms | 300ms | WARN |
| DAL total (reads only, owner path) | ~250ms | 500ms | PASS |
| Single DB read (max) | ~50ms | 150ms | PASS |
| Mutation (write) | ~60ms | 150ms | PASS |

The controller orchestration budget (300ms) is borderline exceeded on the owner path (~310ms estimated). Under higher network latency or database load, this will breach consistently.

---

## LOKI EVIDENCE STATUS

**PARTIAL** — Loki traced the L-BOOK-02 finding identifying the serial ownership chain and estimated ~450ms overhead in the runtime trace. The chain structure is confirmed from static analysis. Exact production timing should be validated with a live Loki trace under production-equivalent load before implementing Option C (RPC approach).

---

## FINAL KRAVEN STATUS: WATCH

**Reason:** The serial 5-step chain is architecturally correct but unoptimized. It is not release-blocking at current booking volume. Under booking-heavy usage (event VPORTs, multi-resource providers), mutation latency will be user-visible. Optimization Options A+B are low-risk and high-value — recommend Wolverine for implementation in the same sprint as the P0 security fixes. Option C (RPC) should be planned for a subsequent Carnage pass.

---

## RECOMMENDED HANDOFF

| Finding | Action Required | Handoff |
|---|---|---|
| K-BOOK-01 Option A+B | Implement session actor cache + combined booking+resource JOIN DAL | Wolverine |
| K-BOOK-02 | Add slim booking projection DAL for mutation path; reduce PII overfetch | Wolverine |
| K-BOOK-03 | Add internal profile_id cache inside assertActorOwnsVportActor | Wolverine (same task as Option A) |
| K-BOOK-01 Option C | Plan ownership+write RPC function for booking mutations | Carnage (schema) + Venom (RLS review) |
| Cache invalidation on sign-out | Ensure K-BOOK-03 cache is cleared on auth state change | Venom (spot-check) + Wolverine |
