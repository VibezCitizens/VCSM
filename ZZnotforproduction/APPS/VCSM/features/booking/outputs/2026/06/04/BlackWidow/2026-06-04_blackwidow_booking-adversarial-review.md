# BLACKWIDOW V2 Adversarial Review — booking

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | booking |
| App | VCSM |
| Run Date | 2026-06-04 |
| BW Protocol Version | BW2.5 V2 |
| Report Schema | BW2.9 |
| Analyst | BLACKWIDOW V2 (automated adversarial runtime verification) |
| Output Path | ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_booking-adversarial-review.md |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Status | FRESH |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Map Age at Scan | ~7h |
| Security Paths (booking) | 8 |
| Total Platform Security Paths | 598 |

---

## 3. Scanner Inputs

| Map | Status | Booking Entries |
|---|---|---|
| security-path-map.json | LOADED | 8 paths, all LOW confidence (null sourceRoute) |
| callgraph.json | LOADED | 412 nodes, 585 edges in feature scope |
| write-execution-map.json | LOADED | 8 write surfaces, all LOW confidence |
| rpc-execution-map.json | LOADED | 0 booking RPC paths |

---

## 4. Attack Surface Inventory

### 4.1 Scanner Security Paths

All 8 security paths have `confidence: LOW` — scanner could not resolve a confirmed route for any write surface. All 8 are PRIMARY ATTACK TARGETS per BW Rule BW-002.

| Path # | DAL Function | Table | Operation | Confidence |
|---|---|---|---|---|
| SP-1 | insertBookingDAL | bookings | INSERT | LOW |
| SP-2 | insertBookingResourceDAL | resources | INSERT | LOW |
| SP-3 | saveBookingServiceProfileDurationsByServiceIdsDAL | vc.service_booking_profiles | INSERT | LOW |
| SP-4 | saveBookingServiceProfileDurationsByServiceIdsDAL | vc.service_booking_profiles | UPDATE | LOW |
| SP-5 | updateBookingStatusDAL | bookings | UPDATE | LOW |
| SP-6 | upsertAvailabilityExceptionDAL | availability_exceptions | UPSERT | LOW |
| SP-7 | upsertAvailabilityRuleDAL | availability_rules | UPSERT | LOW |
| SP-8 | upsertBookingResourceServicesDAL | vc.resource_services | UPSERT | LOW |

### 4.2 Confirmed Dead DAL Surfaces (VENOM findings VEN-BOOKING-002, VEN-BOOKING-003)

- `saveBookingServiceProfileDurationsByServiceIds.dal.js` — references undefined `supabase` at lines 38, 53, 79. Non-functional. Calls from `setResourceSlotDurationController` will throw at runtime.
- `upsertBookingResourceServices.dal.js` — references undefined `supabase` at line 24. Non-functional.

### 4.3 Hook Entry Points (UI-Accessible Writes)

| Hook | Write Operations Exposed |
|---|---|
| `useCreateBooking` | `createBooking` (engine adapter) |
| `useManageAvailability` | `cancelBooking`, `confirmBooking`, `completeBooking`, `markNoShow`, `setAvailabilityRule`, `setAvailabilityException`, `setResourceSlotDuration` |
| `useBookingOps` | `listMyBookings`, `cancelBooking` |
| `useEnsureOwnerBookingResource` | `ensureOwnerBookingResource` (→ `insertBookingResource`) |
| `useVportPublicBooking` | `createBooking` (public flow) |
| `useVportBookingMutations` | `createBooking`, `cancelBooking`, `confirmBooking` |
| `useAddStaffResource` | `createLocationResource` (engine) |

### 4.4 DAL Write Surfaces (All Booking)

8 direct write DALs. 2 confirmed dead (VEN-BOOKING-002, VEN-BOOKING-003).

---

## 5. Scanner Signals

- Zero RPC paths attributed to booking — all mutations are direct Supabase client writes.
- No route-confirmed (HIGH confidence) security paths — all 8 paths are unresolved. Scanner cannot trace UI routes to writes.
- BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants declared. All §9 attack harnesses are inferred from source semantics only.
- Existing open VENOM findings: VEN-BOOKING-001 (CRITICAL), VEN-BOOKING-002 (CRITICAL), VEN-BOOKING-003 (CRITICAL), VEN-BOOKING-004 (HIGH), VEN-BOOKING-006 (HIGH), VEN-BOOKING-007 (HIGH), VEN-BOOKING-008 (LOW), VEN-BOOKING-009 (MEDIUM), VEN-BOOKING-010 (MEDIUM).

---

## 6. Adversarial Path Analysis

### 6.A — Ownership Bypass

#### Attack: Can actor A submit mutations against actor B's booking resource?

**Target controller:** `confirmBookingController`, `cancelBookingController`, `setAvailabilityRuleController`, `setAvailabilityExceptionController`, `setResourceSlotDurationController`, `ensureOwnerBookingResourceController`

**All of the above call chain:**

```
controller → getBookingResourceByIdDAL → assertActorOwnsVportActorController
```

`assertActorOwnsVportActorController` (line 23–57) performs:
1. Actor lookup + void check (unconditional)
2. Kind check: `requesterActor.kind !== "user"` throws (line 28)
3. Self-shortcut gated behind kind===user (line 34)
4. actor_owners DB query via `readActorOwnerLinkByActorAndUserProfileDAL` (line 43)
5. Target actor void check (line 52)

**Result:** BLOCKED — ownership chain is thorough, kind checked before self-shortcut.

**Residual concern for `updateBookingStatusDAL` (VEN-BOOKING-001):** the DAL itself has no ownership filter — it issues `UPDATE bookings SET ... WHERE id = $bookingId`. Ownership is enforced only at controller level (bookingId → resource → owner) or via RLS. This was already documented as OPEN. BW verifies: the controller path is sound; the RLS unverification is the residual exposure.

**Finding:** BW-BOOK-001 (INFO) — Ownership bypass at controller layer: BLOCKED. RLS dependency for DAL-level defense per VEN-BOOKING-001 remains open (not re-raised here).

---

#### Attack: `updateBookingStatusController` (vport dashboard path) — can caller bypass ownership?

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js`

**Flow for isCustomer=false path:** booking → `resolveVportActorFromProfileId(booking.profile_id)` → `assertActorOwnsVportActorController`. If `vportActorId` is null (profile_id missing or unresolvable), line 51 throws `"Could not resolve VPORT ownership."` before ownership assertion. BLOCKED.

**Flow for isCustomer=true path:** The check is `String(callerActorId) === String(customerActorId)` where `customerActorId = booking.customer_actor_id` fetched from DB — not from caller. The caller supplies only `callerActorId` (from session). This is sound.

**Finding:** BW-BOOK-002 (INFO) — Ownership bypass in dashboard update controller: BLOCKED.

---

#### Attack: `rescheduleBookingController` — can caller hijack another actor's reschedule window?

**File:** `updateVportBooking.controller.js` line 99–146.

Reschedule always requires `assertActorOwnsVportActorController` (line 120). Only owner can reschedule. Customer reschedule path does not exist. BLOCKED.

---

### 6.B — Session Mutation

#### Attack: Can a caller supply an arbitrary `requestActorId` bypassing session trust?

**createBookingController (public source, lines 86–98):**
`requestActorId` is accepted as a parameter. In the public source path, line 91 fetches the actor from DB to validate existence and kind===user. However, the caller can supply ANY actorId. If an attacker knows a victim's actorId, they can pass it as `requestActorId`.

**Consequence:** The booking would be attributed to the victim's actorId as the requester/creator. However, `buildBookingPayload.model.js` line 70 sets `customerActorId = requestActorId` — so the booking appears as if the victim booked it.

**This is the existing VEN-BOOKING-007 finding:** caller-supplied `customerActorId` is trusted for non-public sources. For the public source, `requestActorId` drives both `customerActorId` and `created_by_actor_id`. The UI hook (`useVportPublicBooking`) draws `requestActorId = citizenActorId` from identity context — session-sourced and safe. But the controller itself does not independently verify that `requestActorId === session actor`. A direct API consumer could bypass this.

**Finding:** BW-BOOK-003 (HIGH) — Controller trusts caller-supplied `requestActorId` without session binding. The only defense is Supabase RLS on the bookings table (unverified) + the UI sourcing it from session. Direct invocation with a forged `requestActorId` would create a booking attributed to an arbitrary citizen. Result: PARTIAL (UI path BLOCKED via session; direct caller path BYPASSED). [SOURCE_VERIFIED: createBooking.controller.js lines 15-124, buildBookingPayload.model.js line 70]

---

#### Attack: Null/undefined `requestActorId` for management source

`createBookingController` line 76: `if (!requestActorId) throw`. BLOCKED for management source.

For public source line 87: `if (!requestActorId) throw "Only citizens can book."`. BLOCKED.

**Finding:** BW-BOOK-004 (INFO) — Null requestActorId rejected by all controller branches: BLOCKED.

---

#### Attack: Stale identity — can a session with a revoked/voided actor proceed?

`assertActorOwnsVportActorController` line 24: `if (!requesterActor || requesterActor.is_void === true) throw`. DB lookup is live. Void check is unconditional.

For public bookings: `createBookingController` line 91–96 fetches actor and checks `is_void === true` and `kind !== 'user'`.

**Finding:** BW-BOOK-005 (INFO) — Stale/voided actor session: BLOCKED by live DB lookup.

---

### 6.C — Runtime Abuse (Privileged Endpoint Actor Kind Check)

#### Attack: Can a VPORT-kind actor reach owner management endpoints?

`assertActorOwnsVportActorController` line 28: `if (requesterActor.kind !== "user") throw`. This executes BEFORE the self-shortcut. A VPORT-kind actor with `requestActorId === targetActorId` cannot bypass this (ELEK-004 fix is present).

**Confirming:** line 23 fetches actor, line 28 checks kind unconditionally, line 34 self-shortcut only fires if kind===user already confirmed.

**Finding:** BW-BOOK-006 (INFO) — VPORT-kind actor impersonation attempt at owner endpoints: BLOCKED by kind check pre-self-shortcut. [SOURCE_VERIFIED: assertActorOwnsVportActor.controller.js lines 23-36]

---

#### Attack: Can a non-owner access `listOwnerBookingResources` for a foreign `ownerActorId`?

`listOwnerBookingResourcesController` (lines 4-20): takes `ownerActorId` param, queries `listBookingResourcesByOwnerActorIdDAL`. **No ownership assertion is performed.** Any caller who knows an `ownerActorId` can enumerate that actor's booking resources.

This is a read-only endpoint (no writes), so the severity is lower, but it exposes resource metadata (resource names, types, calendars) for any actor.

**Finding:** BW-BOOK-007 (MEDIUM) — `listOwnerBookingResourcesController` has no ownership or auth assertion — any caller with a known `ownerActorId` can enumerate foreign actors' booking resources. Result: BYPASSED. [SOURCE_VERIFIED: listOwnerBookingResources.controller.js lines 4-20]

---

#### Attack: `useVportBookingMutations` — can a non-owner send owner-level `status: "confirmed"` booking?

In the hook (line 51-61), `isOwner` gates the `source: "owner"` and `status: "confirmed"` path. However, `isOwner` is a client-side prop passed to the hook — it is not validated server-side at the time of the `createBooking` call.

**Trace:** `createBooking({ source: "owner", status: "confirmed" })` → `createBookingController` → line 75: `MANAGEMENT_SOURCES.has("owner")` is true → line 80: `assertActorOwnsVportActorController` is called. Controller enforces ownership.

**Finding:** BW-BOOK-008 (INFO) — Owner-source booking gate enforced at controller layer regardless of client-side `isOwner` prop: BLOCKED. [SOURCE_VERIFIED: createBooking.controller.js lines 75-84]

---

### 6.D — RLS Verification

#### Attack: DAL writes with no ownership filter — relying on unverified RLS

**updateBookingStatusDAL (lines 47-56):**
```js
.from("bookings")
.update(patch)
.eq("id", bookingId)   // ← only filter is bookingId
```
No `owner_actor_id`, `customer_actor_id`, or `profile_id` filter. Ownership is entirely controller-layer enforced. RLS is the DB-level barrier, but VENOM notes it as unverified.

**upsertAvailabilityRuleDAL (lines 54-59):**
```js
.from("availability_rules")
.upsert(payload, { onConflict: "id" })
```
No `resource_id` scoping in the upsert key beyond the row payload. A caller who crafts a row with an existing `id` and a different `resource_id` would attempt to hijack that rule. However, `onConflict: "id"` means the conflict resolution uses the `id` field — the controller pre-validates ownership of the resource, so if the `id` belongs to a different resource, ownership check would still pass for the attacker's own resource and the hijacked record would be overwritten.

**Finding: BW-BOOK-009 (HIGH)** — `upsertAvailabilityRuleDAL` uses `onConflict: "id"` but does not scope the upsert to `resource_id`. If an attacker can obtain a foreign rule `id` and passes it with their own `resourceId` (for which they are authorized), the upsert will update the foreign rule's fields while the controller only verified ownership of the attacker's resourceId. Result: BYPASSED (Multi-step). [SOURCE_VERIFIED: upsertAvailabilityRule.dal.js line 55-59, setAvailabilityRule.controller.js lines 34-42]

**Details of the exploit chain:**
1. Attacker owns resource R1. Victim owns resource R2 with availability rule UUID = X.
2. Attacker calls `setAvailabilityRuleController({ requestActorId: A, resourceId: R1, ruleId: X, ... })`.
3. Controller fetches R1 (attacker's resource) → ownership check passes.
4. `upsertAvailabilityRuleDAL({ id: X, resource_id: R1, ... })` — upserts on `id = X`, overwriting victim's rule with new values (potentially `resource_id: R1`).
5. Victim's availability rule is destroyed/hijacked.

This requires the attacker to know a foreign rule UUID (possible via enumeration if listBookingResourcesByOwnerActorId returns rule IDs, or via other read endpoints).

---

#### Attack: `upsertAvailabilityExceptionDAL` — same issue?

`upsertAvailabilityExceptionDAL` (line 50-57) uses `onConflict: "id"`. Same pattern applies.

**Finding: BW-BOOK-010 (HIGH)** — `upsertAvailabilityExceptionDAL` uses `onConflict: "id"` without scoping to `resource_id`. Identical exploit chain to BW-BOOK-009 — attacker can overwrite a foreign actor's availability exception by supplying a known exception UUID paired with an owned resourceId. Result: BYPASSED (Multi-step). [SOURCE_VERIFIED: upsertAvailabilityException.dal.js lines 49-57, setAvailabilityException.controller.js lines 36-42]

---

### 6.E — Viewer Context Fuzzing

#### Attack: Null viewerActorId paths

**`confirmBookingController` line 17:** `if (!requestActorId) throw`. BLOCKED.
**`cancelBookingController` line 17:** `if (!requestActorId) throw`. BLOCKED.
**`setAvailabilityRuleController` line 18:** `if (!requestActorId) throw`. BLOCKED.
**`setAvailabilityExceptionController` line 15:** `if (!requestActorId) throw`. BLOCKED.
**`ensureOwnerBookingResourceController` line 20:** `if (!requestActorId) throw`. BLOCKED.
**`setResourceSlotDurationController` line 20:** `if (!requestActorId) throw`. BLOCKED.

**Finding:** BW-BOOK-011 (INFO) — Null viewerActorId rejected at all controller gates: BLOCKED.

---

#### Attack: `cancelBookingController` isCustomer determination — can a null `customerActorId` cause misbehavior?

Line 26-29:
```js
const isCustomer =
  booking.customer_actor_id &&
  String(booking.customer_actor_id) === String(requestActorId);
```

If `booking.customer_actor_id` is null, `isCustomer` is falsy. The code then falls through to the owner-path at line 34. This means if a booking has no customer (e.g., an owner-created walk-in), any requestActorId that is NOT the customer will attempt owner-path verification. Correct behavior. BLOCKED.

However: if `booking.customer_actor_id` is null AND `resource` is null (line 35), the error "Booking resource not found" is thrown before ownership check. A race condition here is not exploitable — there's no write path without ownership verification.

---

### 6.F — Mutation Replay (State Machine Protection)

#### Attack: Can a completed booking be re-confirmed? Can a cancelled booking be re-activated?

**Path 1: `updateBookingStatusController` (vport dashboard controller):**

Lines 35-38 (VPD-V-021 terminal state guard):
```js
if (TERMINAL_STATUSES.includes(booking.status)) {
  throw new Error(`Booking is already ${booking.status} and cannot be modified.`);
}
TERMINAL_STATUSES = ["completed", "cancelled", "no_show"]
```

This fires BEFORE ownership resolution — terminal state rejection is unconditional.

**Result:** BLOCKED for the vport dashboard path. [SOURCE_VERIFIED: updateVportBooking.controller.js lines 35-38]

**Path 2: `confirmBookingController` (core booking controller):**

No terminal-state check is present. `confirmBookingController` will call `updateBookingStatusDAL` with `status: "confirmed"` even if the booking is already "completed" or "cancelled". The DAL will execute the UPDATE. There is no status allowlist or state transition guard in this path.

**Finding: BW-BOOK-012 (HIGH)** — `confirmBookingController` lacks a terminal-state gate. A cancelled or completed booking can be re-confirmed by the owner. The updateBookingStatusDAL will succeed because it only filters by `bookingId` with no status precondition. Result: BYPASSED (Replay). [SOURCE_VERIFIED: confirmBooking.controller.js lines 38-44, updateBookingStatus.dal.js lines 47-56]

---

#### Attack: `cancelBookingController` — can a cancelled booking be re-cancelled?

No terminal-state check in `cancelBookingController`. Calling cancel on an already-cancelled booking re-runs `updateBookingStatusDAL` with `status: "cancelled"` and a new `cancelledAt` timestamp. This is a replay that mutates `cancelled_at` and `internal_note` on an immutable terminal record.

**Finding: BW-BOOK-013 (MEDIUM)** — `cancelBookingController` lacks a terminal-state guard. Cancelled/completed bookings can be repeatedly re-cancelled, mutating `cancelled_at` and `internal_note`. Result: BYPASSED (Replay). [SOURCE_VERIFIED: cancelBooking.controller.js lines 44-51, updateBookingStatus.dal.js lines 47-56]

---

### 6.G — Hydration Poisoning

`listMyBookingsController` calls `fetchActorSummaries` (hydration engine) for owner summaries at line 15. This is read-only consumption — no hydration store writes occur in the booking feature. The hydration data is used only for display enrichment.

**Finding:** BW-BOOK-014 (INFO) — Hydration interaction is read-only (fetchActorSummaries). No poisoning vector in the booking feature. BLOCKED.

---

### 6.H — URL Surface / Notification linkPath Exposure

#### Finding VEN-BOOKING-005 (CLOSED): cancel/confirm linkPath — FIXED. Slug-based paths confirmed in source.

#### Attack: `createBookingController` — line 138 notification linkPath

```js
linkPath: `/actor/${resource.owner_actor_id}/dashboard/booking-history`,
```

**This constructs a linkPath using raw `resource.owner_actor_id` UUID.** This is stored in the notification row. This is the existing VEN-BOOKING-009 finding (OPEN, MEDIUM). BW confirms: the fix applied to `cancelBookingController` and `confirmBookingController` was not applied here.

**Finding:** BW-BOOK-015 (MEDIUM) — `createBookingController` line 138 stores raw UUID `resource.owner_actor_id` in notification `linkPath` (recipient is the VPORT owner — their own actorId, but UUIDs stored in notification rows are enumerable via DB read). Confirmed open. Result: BYPASSED. [SOURCE_VERIFIED: createBooking.controller.js line 138]

Note: this is consistent with VEN-BOOKING-009 — BW is confirming the same finding from source. Not re-numbered; cross-referenced.

---

#### Attack: `updateBookingStatusController` (vport dashboard) — notification linkPath

Lines 80-93: `publishVcsmNotification` is called with no `linkPath` field (not present in the payload). No UUID exposure.

**Finding:** BW-BOOK-016 (INFO) — Dashboard `updateBookingStatusController` omits `linkPath` in notification — no UUID exposure. BLOCKED.

---

#### Attack: `rescheduleBookingController` — no notification emitted. No linkPath surface.

---

### 6.I — §9 Invariant Attack Map

BEHAVIOR.md is a PLACEHOLDER — all §9 invariants are UNANCHORED. The following invariants are inferred from source semantics and attacked below.

#### Inferred Invariant 1: "A booking must be created for a real, active resource"

**Attack:** `createBookingController` line 62-65: fetches resource, checks `is_active === true`. BLOCKED.

#### Inferred Invariant 2: "Only the resource owner or the customer may mutate a booking"

**Attack:** Covered in §6.A and §6.C. Owner path requires `assertActorOwnsVportActorController`. Customer path requires `booking.customer_actor_id === requestActorId` match from DB. BLOCKED for direct bypass.

**However:** For availability rules/exceptions (not booking rows themselves): BW-BOOK-009 and BW-BOOK-010 demonstrate that a foreign rule/exception can be overwritten via the UUID-as-onConflict vector. The authorization check validates ownership of the supplying resourceId, not the targeted ruleId. BYPASSED.

#### Inferred Invariant 3: "Terminal bookings (completed, cancelled, no_show) must not be re-mutated"

**Attack:** `updateBookingStatusController` — BLOCKED (VPD-V-021 guard present, line 35).
**Attack:** `confirmBookingController` — BYPASSED. No terminal state check. Can re-confirm a cancelled booking. (BW-BOOK-012)
**Attack:** `cancelBookingController` — BYPASSED for re-cancel mutation of `cancelled_at`. (BW-BOOK-013)

#### Inferred Invariant 4: "Only user-kind actors can create public bookings"

**Attack:** `createBookingController` public path, line 91-96: fetches actor and checks `kind !== 'user'`. BLOCKED.

#### Inferred Invariant 5: "Booking slot must be in the future"

**Attack:** `createBookingController` line 101: `if (slotStartTime <= Date.now()) throw`. BLOCKED.

#### Inferred Invariant 6: "Duration must be bounded"

**Attack:** `createBookingController` line 58: `parsedDuration <= 0 || parsedDuration > 1440` throws. BLOCKED.

---

## 7. Exploitability Assessment

| Finding | Severity | Exploitability | Preconditions |
|---|---|---|---|
| BW-BOOK-003 | HIGH | Moderate | Attacker must know victim citizenActorId; direct API access required |
| BW-BOOK-007 | MEDIUM | Low-Medium | Requires knowing a foreign `ownerActorId` — readable from public profiles |
| BW-BOOK-009 | HIGH | Moderate-High | Requires knowing foreign rule UUID; multi-step; both actors must be authenticated |
| BW-BOOK-010 | HIGH | Moderate-High | Same as BW-BOOK-009 for exceptions |
| BW-BOOK-012 | HIGH | Low | Owner must already be authenticated; can re-confirm own bookings in terminal state |
| BW-BOOK-013 | MEDIUM | Low | Owner or customer can replay cancel; mutates timestamps only |
| BW-BOOK-015 | MEDIUM | Low | UUID stored in notification row — notification DB is internal; attacker needs DB read access |

---

## 8. Source Verification Summary

All BYPASSED findings are [SOURCE_VERIFIED] with file and line citations.

| Finding | Verification | File | Lines |
|---|---|---|---|
| BW-BOOK-003 | SOURCE_VERIFIED | createBooking.controller.js, buildBookingPayload.model.js | 15-124, 70 |
| BW-BOOK-006 | SOURCE_VERIFIED | assertActorOwnsVportActor.controller.js | 23-36 |
| BW-BOOK-007 | SOURCE_VERIFIED | listOwnerBookingResources.controller.js | 4-20 |
| BW-BOOK-008 | SOURCE_VERIFIED | createBooking.controller.js | 75-84 |
| BW-BOOK-009 | SOURCE_VERIFIED | upsertAvailabilityRule.dal.js, setAvailabilityRule.controller.js | 55-59, 34-42 |
| BW-BOOK-010 | SOURCE_VERIFIED | upsertAvailabilityException.dal.js, setAvailabilityException.controller.js | 49-57, 36-42 |
| BW-BOOK-012 | SOURCE_VERIFIED | confirmBooking.controller.js, updateBookingStatus.dal.js | 38-44, 47-56 |
| BW-BOOK-013 | SOURCE_VERIFIED | cancelBooking.controller.js, updateBookingStatus.dal.js | 44-51, 47-56 |
| BW-BOOK-015 | SOURCE_VERIFIED | createBooking.controller.js | 138 |

---

## 9. Confidence Summary

| Category | Count |
|---|---|
| SOURCE_VERIFIED findings | 9 |
| SCANNER_LEAD findings | 0 |
| SCANNER_LOW_CONF findings | 0 |
| BYPASSED (confirmed exploitable) | 7 |
| BLOCKED (invariant held) | 8 |
| PARTIAL (UI blocked, direct call bypassed) | 1 |

---

## 10. §9 Invariant Attack Map

| Inferred Invariant | Attack Result | Finding |
|---|---|---|
| Real, active resource required for booking | BLOCKED | — |
| Only resource owner or customer may mutate booking | BYPASSED (rule/exception hijack) | BW-BOOK-009, BW-BOOK-010 |
| Terminal bookings must not be re-mutated | BYPASSED (confirm/cancel replay) | BW-BOOK-012, BW-BOOK-013 |
| Only user-kind actors can create public bookings | BLOCKED | — |
| Booking slot must be in the future | BLOCKED | — |
| Duration must be bounded | BLOCKED | — |
| Session actor must equal booking requester | BYPASSED (direct API) | BW-BOOK-003 |
| Owner-only endpoints require ownership assertion | BLOCKED (controller) | — |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md Status: PLACEHOLDER

- VEN-BOOKING-006 (OPEN, HIGH): All §9 invariants are UNANCHORED because BEHAVIOR.md is a placeholder.
- BW confirms: 8 inferred invariants tested; 4 held, 3 violated (BW-BOOK-003, BW-BOOK-009/010, BW-BOOK-012/013).
- Authoring BEHAVIOR.md with explicit §9 invariants is required before THOR clearance.

---

## 12. THOR Impact (Release Blockers)

The following BW findings are NEW (not previously captured by VENOM) and constitute THOR release blockers:

| Finding | Severity | Type | THOR Impact |
|---|---|---|---|
| BW-BOOK-009 | HIGH | Multi-step availability rule hijack via UUID onConflict | RELEASE BLOCKER |
| BW-BOOK-010 | HIGH | Multi-step availability exception hijack via UUID onConflict | RELEASE BLOCKER |
| BW-BOOK-012 | HIGH | Terminal-state replay — confirm on cancelled/completed booking | RELEASE BLOCKER |
| BW-BOOK-007 | MEDIUM | Unauthenticated resource enumeration via listOwnerBookingResources | RELEASE BLOCKER (per platform policy — any MEDIUM data disclosure) |

Previously documented VENOM blockers remain unchanged:
VEN-BOOKING-001, VEN-BOOKING-002, VEN-BOOKING-003, VEN-BOOKING-004, VEN-BOOKING-006, VEN-BOOKING-007.

---

## 13. SPIDER-MAN Test Requirements

The following regression tests are required for the BYPASSED findings:

| Test ID | Covering | Description |
|---|---|---|
| SM-BOOK-001 | BW-BOOK-003 | `createBookingController` with forged `requestActorId` ≠ session actor should fail or be flagged |
| SM-BOOK-002 | BW-BOOK-007 | `listOwnerBookingResourcesController` called with foreign `ownerActorId` — expect RLS/auth rejection |
| SM-BOOK-003 | BW-BOOK-009 | `setAvailabilityRuleController` with foreign `ruleId` paired to attacker's `resourceId` — expect row isolation, not hijack |
| SM-BOOK-004 | BW-BOOK-010 | `setAvailabilityExceptionController` with foreign `exceptionId` — same as above for exceptions |
| SM-BOOK-005 | BW-BOOK-012 | `confirmBookingController` on a booking with `status: "cancelled"` — expect terminal-state rejection |
| SM-BOOK-006 | BW-BOOK-012 | `confirmBookingController` on a booking with `status: "completed"` — expect terminal-state rejection |
| SM-BOOK-007 | BW-BOOK-013 | `cancelBookingController` on already-cancelled booking — expect idempotent no-op or rejection |

---

*End of BLACKWIDOW V2 Report — booking — 2026-06-04*
