# BLACKWIDOW — Adversarial Verification Report
Generated: 2026-06-05
Branch: vport-booking-feed-security-updates
Mode: SECURITY_WARFARE_SIMULATION / BLUE_TEAM / BLIND_REVERIFY_MODE
Application Scope: VCSM
Reviewer: BLACKWIDOW

ARCHITECT artifacts: PRESENT ✓
VENOM report: PRESENT (2026-06-05) ✓
BLIND_REVERIFY_MODE: ACTIVE — no historical reports loaded before reconstruction

---

## BLIND REVERIFY CHECK

| Check | Status |
|---|---|
| Historical reports not loaded during reconstruction | PASS |
| Current ARCHITECT artifacts loaded | PASS |
| Current source files re-read | PASS |
| Chain rebuilt from source | PASS |
| Exploitability assessed before report comparison | PASS |

---

## REVERIFY DISCOVERY CHECK

| Check | Status |
|---|---|
| Original finding re-tested | PASS |
| Adjacent flows reviewed | PASS |
| Alternate exploit paths searched | PASS |
| Patch regressions searched | PASS |
| New findings assessment completed | PASS |

---

## Adversarial Scenario Results

---

### SCENARIO BW-S-001 — ELEK-004 Kind Check Bypass

```
OWNERSHIP BYPASS ATTEMPT
Target: assertActorOwnsVportActorController
Attack vector: VPORT-kind actor calling with requestActorId === targetActorId
                to trigger self-shortcut before kind gate
Result: BLOCKED
Evidence: kind !== "user" check at line 28 is UNCONDITIONAL and executes
          BEFORE self-shortcut at line 34. VPORT-kind throws before reaching shortcut.
          getActorByIdDAL fires first (line 23); kind verified before any shortcut logic.
Controller gate: PRESENT — unconditional kind check at line 28
Severity: N/A — BLOCKED
```

**Status: EXPLOIT_BLOCKED**

Detailed chain: `requestActorId` → `getActorByIdDAL` (unconditional) → `kind !== "user"` throws → never reaches `requestActorId === targetActorId` check. ELEK-004 patch confirmed as effective against this specific vector.

---

### SCENARIO BW-S-002 — VPD-V-019 customer_actor_id Injection

```
OWNERSHIP BYPASS ATTEMPT
Target: insertVportBookingDAL — customer_actor_id column
Attack vector: Pass forged customer_actor_id through createVportPublicBookingController
Result: BLOCKED
Evidence: Controller constructs row with `customer_actor_id: requestActorId ?? null`.
          requestActorId comes from function parameter, which is session-derived at
          hook/component level. WRITE_COLS allowlist in DAL prevents undeclared columns
          from being picked even if row had extra fields. No client-supplied actor ID
          path reaches customer_actor_id in current source.
Controller gate: PRESENT — requestActorId used directly; no caller-supplied customerActorId
Severity: N/A — BLOCKED
```

**Status: EXPLOIT_BLOCKED**

---

### SCENARIO BW-S-003 — VPD-V-021 Terminal Booking Mutation Replay

```
MUTATION REPLAY ATTEMPT
Target resource: booking with status:"completed" | "cancelled" | "no_show"
Resource state at time of replay: terminal (completed/cancelled/no_show)
Result: BLOCKED
Evidence: TERMINAL_STATUSES check fires BEFORE assertActorOwnsVportActorController.
          Both updateBookingStatusController (line 35) and rescheduleBookingController
          (line 113) check terminal state first. Terminal check is unconditional —
          fires even for the booking's own VPORT owner.
State check: PRESENT
Severity: N/A — BLOCKED
```

**Status: EXPLOIT_BLOCKED**

---

### SCENARIO BW-S-004 — Profile Scope Lock Manipulation

```
OWNERSHIP BYPASS ATTEMPT
Target: updateVportBookingDAL — .eq("profile_id", profileId)
Attack vector: Provide alternative profileId to scope update to different profile
Result: BLOCKED
Evidence: Controller reads booking from DB first (getVportBookingByIdDAL), then
          passes booking.profile_id (from DB record) to DAL. profileId is never
          client-supplied — it's always resolved from the booking record. Attacker
          cannot inject a forged profileId.
Controller gate: PRESENT — profileId always from DB read, not caller input
Severity: N/A — BLOCKED
```

**Status: EXPLOIT_BLOCKED**

---

### SCENARIO BW-S-005 — Cross-User Booking Cancellation

```
RUNTIME ABUSE ATTEMPT
Target: updateBookingStatusController — cancel another user's booking
Actor role used: Authenticated Citizen (Actor C, non-owner of VPORT)
Expected access: DENIED
Result: DENIED
Evidence: Customer identification: isCustomer = customerActorId && callerActorId === customerActorId.
          If Actor C is not the booking's customer_actor_id, isCustomer = false.
          Controller routes to owner verification path. assertActorOwnsVportActorController
          with Actor C's ID against VPORT actor — fails if C doesn't own VPORT.
Privilege gate: PRESENT — dual-path dispatch; non-customer must pass ownership check
Severity: N/A — BLOCKED
```

**Status: EXPLOIT_BLOCKED**

---

### SCENARIO BW-S-006 — VENOM-WS-001 Voided Actor Booking Confirmation

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: createVportPublicBookingController
Injected context: requestActorId = voided citizen actor (kind:"user", is_void:true)
Expected result: ERROR
Actual result: ALLOWED — readActorVportLinkDAL selects (id,kind,vport_id); no is_void field;
               controller checks actor existence and kind:"user" but NOT is_void.
               Voided actor passes kind gate and booking is created.
Context validation: WEAK — is_void not checked
Severity: MEDIUM
```

**Status: EXPLOIT_REACHABLE** — Confirms VENOM-WS-001. Voided actor can create bookings.

---

### SCENARIO BW-S-007 — VENOM-WS-002 VPORT-Kind Mutation Blast Radius Survey

BLACKWIDOW surveyed ALL callers of `checkVportOwnershipController` in gasprices feature:

**Confirmed mutation callers:**
1. `reviewFuelPriceSuggestion.controller.js:48` — approve/reject submission
2. `updateStationFuelUnit.controller.js:11` — change fuel unit setting
3. `submitOwnerFuelPriceUpdate.controller.js:27` — direct price write
4. `publishFuelPriceUpdateAsPostController:52-55` — publish to public feed

All 4 allow VPORT-kind actor via self-shortcut when `callerActorId === targetActorId`.

```
RUNTIME ABUSE ATTEMPT
Target: Gas price mutation controllers (4 of 4)
Actor role used: Authenticated VPORT actor (kind:"vport") = targetActorId
Expected access: Mutation should require user-kind ownership verification
Result: ALLOWED — checkVportOwnershipController self-shortcut fires for VPORT-kind
Evidence:
  checkVportOwnership.controller.js:8-10:
    if (callerActorId === targetActorId) {
      const actor = await getActorByIdDAL({ actorId: callerActorId });
      if (actor && actor.kind === "vport" && !actor.is_void) return true;
    }
  No actor_owners query executed for VPORT-kind self-ownership.
  Comment in code explicitly states: "mutations require a user-kind actor" — violated.
Privilege gate: WEAK — VPORT-kind existence check substituted for user-kind ownership
Severity: MEDIUM
```

**Status: EXPLOIT_REACHABLE** — Confirms and EXPANDS VENOM-WS-002. Blast radius: 4 mutation controllers.

---

### SCENARIO BW-S-008 — publishFuelPriceUpdateAsPostController ownership verification analysis

**NEW FINDING — BW-NEW-001**

```
CROSS-FEATURE ABUSE ATTEMPT
Source feature: gas prices / feed publication
Target: createSystemPost — accepts actorId without ownership check
Attack vector: checkVportOwnershipController({ callerActorId: actorId, targetActorId: actorId })
               — both parameters are the SAME actorId; self-shortcut ALWAYS fires for VPORT kind.
               Comment claims "ensures only verified VPORT owners can post on behalf of their station"
               — but actual check is: "is this a non-void VPORT actor?" not "does caller own it?"
Result: PARTIAL — check verifies VPORT existence, not actor_owners ownership chain
Evidence:
  publishFuelPriceUpdateAsPost.controller.js:52-55:
    const isValidVport = await checkVportOwnershipController({
      callerActorId: actorId,
      targetActorId: actorId,  // SAME value — self-shortcut always fires for VPORT kind
    });
  The calling code's security comment is materially misleading — claims actor_owners verification
  but the actual check is VPORT existence + non-void.
Adapter isolation: WEAK — ownership.adapter re-exports a function whose comment overstates strength
Severity: MEDIUM (blast radius: public feed contamination if session token is obtained)
```

**Status: NEW_FINDING_CREATED**
**ID:** BW-NEW-001
**Severity:** MEDIUM
**Blast Radius:** Public feed (VPORT fuel price posts); gas price record integrity

---

### SCENARIO BW-S-009 — VENOM-WS-003 TOCTOU Race Confirmation

```
MUTATION REPLAY ATTEMPT
Target resource: fuel_price_submissions row (status:"pending")
Resource state at time of replay: pending
Result: PARTIAL — app-layer idempotency only; DB write has no status precondition
Evidence:
  updateFuelPriceSubmissionStatusDAL (vportFuelPriceReviews.write.dal.js:34-54):
    .update({ status, reviewed_at, reviewed_by_actor_id, decision_reason })
    .eq("id", submissionId)  — NO .eq("status", "pending") condition on UPDATE
  Two concurrent approvals both pass the app-layer pending check, both execute
  the UPDATE (last write wins on status), both call upsertVportFuelPriceDAL (idempotent),
  both call createVportFuelPriceHistoryDAL (NON-idempotent — insert, not upsert).
  Result: duplicate fuel_price_history entries.
State check: PRESENT at app layer, ABSENT at DB layer
Severity: LOW (requires concurrent requests from same legitimate owner)
```

**Status: PATCH_BYPASS_FOUND** (no DB-level guard; app-layer can be bypassed by concurrent requests)

---

### SCENARIO BW-S-010 — createOwnerBookingController Backdated Booking

**NEW FINDING — BW-NEW-002**

```
RUNTIME ABUSE ATTEMPT
Target: createOwnerBookingController
Actor role used: Authenticated VPORT Owner (user-kind, actor_owners verified)
Expected access: Block past-time bookings
Result: ALLOWED — no startsAt > Date.now() check in owner booking path
Evidence:
  createOwnerBooking.controller.js: validates startsAt < endsAt but NOT startsAt > Date.now()
  createVportPublicBookingController.js:63 has the check; createOwnerBooking.controller.js:22-25 does not.
  Owner can create confirmed booking with startsAt in the past, poisoning booking history.
Privilege gate: ABSENT for past-time validation on owner path
Severity: LOW
```

**Status: NEW_FINDING_CREATED**
**ID:** BW-NEW-002
**Severity:** LOW
**Blast Radius:** Single VPORT booking history; record integrity concern

---

### SCENARIO BW-S-011 — Notification Payload UUID Exposure Survey

```
NOTIFICATION ABUSE ATTEMPT
Notification type: booking_created (publishVcsmNotificationBatch)
Attack vector: Inspect notification payload for raw UUID leakage
Authorization at destination: Enforced (recipient must view their own inbox)
Result: PARTIAL
Evidence:
  linkPath: null — VPD-V-020 confirmed; no raw VPORT UUID in linkPath.
  objectId: String(booking.id) — booking UUID IS present (intended for navigation).
  Booking UUID exposure: acceptable — both VPORT owner and customer are legitimate
  parties to the booking record. No actor correlation risk from booking IDs.
  customer_name in context: free-text from booking; no DB sanitization visible.
  Potential: stored content injection via customer_name into notification context —
  if notification renderer handles this without escaping, stored content injection
  could target notification inbox rendering. LOW risk at controller level.
Severity: INFO (booking UUID); LOW (customer_name raw content in notification context)
```

**Status: EXPLOIT_BLOCKED** for UUID exposure (VPD-V-020 confirmed); **CAUTION** for customer_name content in notifications.

---

### SCENARIO BW-S-012 — BOOK-001 Slot Collision Translation Bypass

```
MUTATION REPLAY ATTEMPT
Target resource: bookings slot (resource_id, starts_at unique constraint)
Resource state at time of replay: slot already taken
Result: BLOCKED
Evidence:
  insertVportBookingDAL:39-41: error.code === "23505" caught; translated to
  "This time slot is no longer available. Please choose another time."
  Translation is exact string match on PostgreSQL error code, not swallowed.
  No other code path allows re-insert into the same slot.
State check: PRESENT
Severity: N/A — BLOCKED
```

**Status: EXPLOIT_BLOCKED**

---

## Summary of Adversarial Results

| Scenario | Target | Result |
|---|---|---|
| BW-S-001 | ELEK-004 kind check | EXPLOIT_BLOCKED |
| BW-S-002 | VPD-V-019 customer_actor_id | EXPLOIT_BLOCKED |
| BW-S-003 | VPD-V-021 terminal booking | EXPLOIT_BLOCKED |
| BW-S-004 | Profile scope lock | EXPLOIT_BLOCKED |
| BW-S-005 | Cross-user booking cancel | EXPLOIT_BLOCKED |
| BW-S-006 | VENOM-WS-001 voided actor | EXPLOIT_REACHABLE |
| BW-S-007 | VENOM-WS-002 VPORT-kind blast radius | EXPLOIT_REACHABLE (4 controllers) |
| BW-S-008 | publishFuelPriceUpdateAsPost ownership | NEW_FINDING_CREATED (BW-NEW-001) |
| BW-S-009 | VENOM-WS-003 TOCTOU | PATCH_BYPASS_FOUND |
| BW-S-010 | Owner backdated bookings | NEW_FINDING_CREATED (BW-NEW-002) |
| BW-S-011 | Notification UUID exposure | EXPLOIT_BLOCKED (linkPath) / CAUTION (customer_name) |
| BW-S-012 | BOOK-001 slot collision | EXPLOIT_BLOCKED |

---

## New Findings

| ID | Severity | Description |
|---|---|---|
| BW-NEW-001 | MEDIUM | publishFuelPriceUpdateAsPost: ownership check is VPORT existence check, not actor_owners — comment is materially misleading |
| BW-NEW-002 | LOW | createOwnerBookingController: no past-time validation; owner can create backdated confirmed bookings |

---

## BLACKWIDOW Finding Count

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 new (BW-NEW-001) + 2 confirmed reachable (WS-001, WS-002) |
| LOW | 1 new (BW-NEW-002) + 1 partial (WS-003) |
| BLOCKED | 7 |

---

## BLACKWIDOW Recommendation

**BLUE TEAM STATUS: CAUTION**

Prior patches are holding (7 scenarios BLOCKED). No CRITICAL or HIGH exploits found.

However:
- 2 MEDIUM VENOM findings confirmed EXPLOIT_REACHABLE from adversarial simulation
- BW-NEW-001 expands WS-002 blast radius: 4 gas price mutation controllers + feed publication all use VPORT-kind self-shortcut as mutation gate
- VENOM-WS-003 TOCTOU confirmed: DB write has no status precondition; concurrent approvals create duplicate history entries (PATCH_BYPASS_FOUND)
- BW-NEW-002: owner backdated bookings is LOW but undermines booking record integrity

**Sudden Death assessment:** No CRITICAL, no PRIVILEGE_ESCALATION_PATH, no REALM_ESCAPE, no BOUNDARY_BROKEN. Sudden Death rule NOT triggered.

BLACKWIDOW emits: **CAUTION**

BLACKWIDOW does NOT emit: THOR_RELEASE_ELIGIBLE
Release authority belongs exclusively to THOR.
