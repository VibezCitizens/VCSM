# SPIDER-MAN Coverage Report

**Date:** 2026-06-05
**Branch:** vport-booking-feed-security-updates
**Mode:** SECURITY_WARFARE_SIMULATION / BLUE_TEAM
**Application Scope:** VCSM + ENGINE
**Reviewer:** SPIDER-MAN
**BEHAVIOR.md Gate:** PASS (bookings: ACTIVE 2026-06-04, gasprices: ACTIVE 2026-06-04)
**ARCHITECT Gate:** PASS (system-map + security-surface, 2026-06-05)

**Coverage Summary:** 5 HIGH | 4 MEDIUM | 2 LOW
**Security Regression Tests Present:** 7
**Security Regression Tests Missing:** 6
**Release Safety:** UNDERTESTED (gas prices + feed publication); WATCH (bookings)

---

## SPIDER-MAN PREFLIGHT PASS

```
ARCHITECT Gate:   PASS (security-surface.json present, 2026-06-05, scope: VCSM+ENGINE)
BEHAVIOR Gate:
  - dashboard/modules/bookings/BEHAVIOR.md: PRESENT, ACTIVE, 2026-06-04 — PASS
  - dashboard/modules/gasprices/BEHAVIOR.md: PRESENT, ACTIVE, 2026-06-04 — PASS

Proceeding with behavior validation.
```

---

## Module Inventory (From ARCHITECT + BEHAVIOR.md)

### Bookings Module

| Layer | Module | Test File | Status |
|---|---|---|---|
| CONTROLLER | createOwnerBookingController | NONE | MISSING |
| CONTROLLER | updateBookingStatusController | updateVportBooking.controller.test.js | COVERED |
| CONTROLLER | rescheduleBookingController | updateVportBooking.controller.test.js | PARTIAL |
| CONTROLLER | createVportPublicBookingController | vportPublicBooking.controller.test.js | COVERED |
| ENGINE | assertActorOwnsVportActorController | assertActorOwnsVportActor.controller.test.js | COVERED |
| ENGINE | checkVportOwnershipController | NONE | MISSING |
| DAL | insertVportBookingDAL | insertVportBooking.write.dal.test.js | COVERED |
| DAL | updateVportBookingDAL | updateVportBooking.controller.test.js | COVERED (via controller) |

### Gas Prices Module

| Layer | Module | Test File | Status |
|---|---|---|---|
| CONTROLLER | reviewFuelPriceSuggestionController | NONE | MISSING |
| CONTROLLER | publishFuelPriceUpdateAsPostController | NONE | MISSING |
| CONTROLLER | updateStationFuelUnitController | NONE | MISSING |
| CONTROLLER | submitOwnerFuelPriceUpdateController | NONE | MISSING |
| CONTROLLER | submitFuelPriceSuggestionController | submitFuelPriceSuggestion.controller.test.js | COVERED |
| CONTROLLER | getVportGasPricesController | getVportGasPrices.controller.test.js | COVERED |
| DAL | updateFuelPriceSubmissionStatusDAL | vportFuelPriceSubmissions.write.dal.test.js | PARTIAL |
| DAL | vportFuelPriceSubmissions (read) | vportFuelPriceSubmissions.read.dal.test.js | COVERED |

---

## Security Regression Coverage Audit

### Covered Security Invariants

| Invariant | Test | Finding Proven |
|---|---|---|
| ELEK-004: VPORT-kind self-match rejected | assertActorOwnsVportActor.controller.test.js | PASS — test explicitly proves vport-kind throws |
| ELEK-004: kind check before self-shortcut | assertActorOwnsVportActor.controller.test.js | PASS — getActorByIdDAL called first |
| VPD-V-021: Terminal booking immutability | updateVportBooking.controller.test.js | PASS — terminal state rejects before auth |
| BOOK-001: 23505 slot collision translation | insertVportBooking.write.dal.test.js | PASS — error code to user message |
| BOOK-002: Kind gate for public booking | vportPublicBooking.controller.test.js | PASS — VPORT-kind actor rejected |
| VPD-V-019: customer_actor_id session-derived | vportPublicBooking.controller.test.js | PASS — no client-supplied actorId path |
| Actor_owners ownership: void/null link rejection | assertActorOwnsVportActor.controller.test.js | PASS — 4 scenarios covered |

### Missing Security Regression Tests (HIGH RISK)

---

#### MISSING TEST 1 — VENOM-WS-002: VPORT-kind mutation bypass in reviewFuelPriceSuggestion

```
SPIDER-MAN MISSING COVERAGE FINDING

Finding ID:        SPM-2026-06-05-001
Controller:        reviewFuelPriceSuggestionController
Security Finding:  VENOM-WS-002
Severity:          HIGH
Risk:              Without this test, a future refactor that fixes the checkVportOwnership
                   call could accidentally reintroduce the same bug — or the current bug
                   (VPORT-kind bypass) is not regression-protected.
Missing tests:
  - [ ] VPORT-kind actor with callerActorId === targetActorId passes checkVportOwnership via
        self-shortcut and can approve/reject submissions (proves the current vulnerability exists)
  - [ ] After patch: assertActorOwnsVportActorController substitution rejects VPORT-kind actor
  - [ ] Non-owner user-kind actor is rejected
  - [ ] Valid user-kind owner can approve a pending submission
  - [ ] Already-reviewed submission returns { ok: false, reason: "not_pending" }
  - [ ] Invalid decision enum returns { ok: false, reason: "invalid_decision" }
  - [ ] Invalid fuel_key on approve returns { ok: false, reason: "invalid_fuel_key" }

Test file to create: __tests__/reviewFuelPriceSuggestion.controller.test.js
Recommended mock targets:
  - checkVportOwnershipController (to control bypass path)
  - fetchFuelPriceSubmissionByIdDAL
  - updateFuelPriceSubmissionStatusDAL
  - upsertVportFuelPriceDAL
  - createFuelPriceSubmissionReviewDAL
  - createVportFuelPriceHistoryDAL
```

---

#### MISSING TEST 2 — ELEK-2026-06-05-005 / BW-NEW-001: publishFuelPriceUpdateAsPost ownership bypass

```
SPIDER-MAN MISSING COVERAGE FINDING

Finding ID:        SPM-2026-06-05-002
Controller:        publishFuelPriceUpdateAsPostController
Security Finding:  ELEK-2026-06-05-005, BW-NEW-001
Severity:          HIGH
Risk:              No test validates that non-VPORT actors are rejected. The ownership gate
                   is bypassed by both user-kind and VPORT-kind actors via self-reference.
                   No test will catch a regression if the gate is accidentally strengthened
                   or further weakened.
Missing tests:
  - [ ] User-kind actor calling with own actorId passes checkVportOwnershipController
        via assertActorOwns self-shortcut (proves ELEK-005 bypass)
  - [ ] After patch: user-kind actor is rejected with { published: false, reason: "not_vport_actor" }
  - [ ] After patch: VPORT-kind non-owner is rejected (actor_owners check fails)
  - [ ] Valid VPORT owner publishes successfully
  - [ ] Empty updatedFuels returns { published: false, reason: "no_fuels" }
  - [ ] All invalid fuelKeys filtered; if none valid, returns { published: false, reason: "no_valid_fuels" }
  - [ ] Throttle: recent post returns { published: false, reason: "throttled" }

Test file to create: __tests__/publishFuelPriceUpdateAsPost.controller.test.js
Recommended mock targets:
  - checkVportOwnershipController (to test current bypass + post-patch behavior)
  - hasRecentFuelPricePostDAL
  - resolveVportStationNameDAL
  - createSystemPost
```

---

#### MISSING TEST 3 — createOwnerBookingController: entire controller untested

```
SPIDER-MAN MISSING COVERAGE FINDING

Finding ID:        SPM-2026-06-05-003
Controller:        createOwnerBookingController
Security Finding:  BW-NEW-002 (past-time), plus general ownership regression gap
Severity:          HIGH
Risk:              The owner booking creation path has no test coverage at all. This is
                   a mutation path that inserts confirmed bookings. No regression protection
                   for ownership verification, input validation, or the missing past-time guard.
Missing tests:
  - [ ] Past startsAt proceeds without error (proves BW-NEW-002 gap exists)
  - [ ] After patch: past startsAt throws "Cannot create a booking for a past time slot."
  - [ ] Non-owner actor is rejected via assertActorOwnsVportActorController
  - [ ] Missing callerActorId throws
  - [ ] startsAt >= endsAt throws
  - [ ] Successful owner booking inserts with status "confirmed" and source "owner"
  - [ ] customer_actor_id is NOT set (walk-in semantics)

Test file to create: __tests__/createOwnerBooking.controller.test.js
Recommended mock targets:
  - getVportResourceByIdDAL
  - getVportActorIdByProfileIdDAL
  - assertActorOwnsVportActorController
  - insertVportBookingDAL
```

---

#### MISSING TEST 4 — checkVportOwnershipController: no tests for self-shortcut behavior

```
SPIDER-MAN MISSING COVERAGE FINDING

Finding ID:        SPM-2026-06-05-004
Controller:        checkVportOwnershipController
Security Finding:  VENOM-WS-002 (root cause gate)
Severity:          HIGH
Risk:              This function is the root cause of 4 mutation bypass paths. No test
                   documents its behavior, making the self-shortcut design invisible to
                   future maintainers.
Missing tests:
  - [ ] VPORT-kind actor self-reference (callerActorId === targetActorId, kind="vport") → returns true
  - [ ] User-kind actor self-reference → falls to assertActorOwns → returns true via user self-shortcut
  - [ ] Voided VPORT actor → returns false
  - [ ] Missing actor → returns false
  - [ ] Valid user-kind owner → calls assertActorOwnsVportActorController → returns true
  - [ ] Non-owner → returns false
  - [ ] Invalid params (null/undefined) → returns false immediately

Test file to create: __tests__/checkVportOwnership.controller.test.js (under booking/controller or vport/controller)
```

---

#### MISSING TEST 5 — VENOM-WS-003: TOCTOU no DB precondition

```
SPIDER-MAN MISSING COVERAGE FINDING

Finding ID:        SPM-2026-06-05-005
DAL:               updateFuelPriceSubmissionStatusDAL
Security Finding:  VENOM-WS-003
Severity:          MEDIUM
Risk:              The DAL UPDATE has no .eq("status","pending") precondition.
                   No test documents or catches this deficiency.
Missing tests:
  - [ ] Test that updateFuelPriceSubmissionStatusDAL builds the correct Supabase chain
  - [ ] After patch: verify .eq("status","pending") is included in the UPDATE call
  - [ ] Test that when data===null is returned (row already reviewed), caller handles gracefully

Test file: add to vportFuelPriceSubmissions.write.dal.test.js
```

---

#### MISSING TEST 6 — VENOM-WS-001: voided actor booking (readActorVportLinkDAL missing is_void)

```
SPIDER-MAN MISSING COVERAGE FINDING

Finding ID:        SPM-2026-06-05-006
Controller:        createVportPublicBookingController
DAL:               readActorVportLinkDAL
Security Finding:  VENOM-WS-001
Severity:          MEDIUM
Risk:              The existing vportPublicBooking.controller.test.js covers BOOK-002 (kind gate)
                   but does NOT include a test case where requestActorId is a voided actor.
                   The fix (adding is_void to select + checking it) needs a regression test.
Missing tests:
  - [ ] Voided actor (kind:"user", is_void:true) passes current kind gate (proves gap exists)
  - [ ] After patch: voided actor throws "Only citizens can book appointments."

Test file: add to vportPublicBooking.controller.test.js
Mock: readActorVportLinkDAL returns { id, kind:"user", vport_id:null, is_void:true }
```

---

## Coverage Summary

### Bookings Module Coverage

| Controller | Coverage | Security Invariants Tested | Priority |
|---|---|---|---|
| createVportPublicBookingController | GOOD | BOOK-002, VPD-V-019, VPD-V-020, BOOK-001 | Add is_void test (SPM-006) |
| createOwnerBookingController | NONE | NONE | P0 — no test at all (SPM-003) |
| updateBookingStatusController | GOOD | VPD-V-021, ownership, terminal gate | Adequate |
| rescheduleBookingController | PARTIAL | terminal gate, ownership | Add conflict detection test |
| assertActorOwnsVportActorController | COMPREHENSIVE | ELEK-004, void, non-user-kind, actor_owners | Complete |
| insertVportBookingDAL | GOOD | BOOK-001, WRITE_COLS | Adequate |
| checkVportOwnershipController | NONE | NONE | P1 — VENOM-WS-002 root cause (SPM-004) |

**Bookings Release Safety: WATCH** — createOwnerBookingController untested (P0 gap)

### Gas Prices Module Coverage

| Controller | Coverage | Security Invariants Tested | Priority |
|---|---|---|---|
| reviewFuelPriceSuggestionController | NONE | NONE | P0 — VENOM-WS-002 path (SPM-001) |
| publishFuelPriceUpdateAsPostController | NONE | NONE | P0 — ELEK-005 bypass (SPM-002) |
| updateStationFuelUnitController | NONE | NONE | P1 |
| submitOwnerFuelPriceUpdateController | NONE | NONE | P1 |
| submitFuelPriceSuggestionController | GOOD | VENOM-GAS-001/002 | Adequate |
| getVportGasPricesController | PARTIAL | Read path | Adequate for read |
| updateFuelPriceSubmissionStatusDAL | PARTIAL | write col structure | Missing: precondition test (SPM-005) |

**Gas Prices Release Safety: UNDERTESTED** — 4 mutation controllers untested; 2 HIGH security gaps (SPM-001, SPM-002)

---

## Regression Risk Analysis

| Risk | Finding | Regression Test Present | Risk Level |
|---|---|---|---|
| VENOM-WS-002 regression (fix reverted) | No test for mutation bypass path | ABSENT | HIGH |
| ELEK-004 regression (kind check removed) | assertActorOwnsVportActor.controller.test.js | PRESENT | LOW |
| VPD-V-021 regression (terminal check removed) | updateVportBooking.controller.test.js | PRESENT | LOW |
| BOOK-002 regression (kind gate removed) | vportPublicBooking.controller.test.js | PRESENT | LOW |
| BW-NEW-002 regression (owner past-time) | No test — gap currently open | ABSENT | MEDIUM |
| ELEK-005 regression (user-kind bypass) | No test | ABSENT | HIGH |
| VENOM-WS-001 regression (voided actor check) | No test | ABSENT | MEDIUM |

---

## Required Test Files to Create

| Priority | File | Covers |
|---|---|---|
| P0 | `__tests__/reviewFuelPriceSuggestion.controller.test.js` | VENOM-WS-002, non-owner rejection, valid approval flow |
| P0 | `__tests__/publishFuelPriceUpdateAsPost.controller.test.js` | ELEK-005, BW-NEW-001, throttle, fuelKey filter |
| P0 | `__tests__/createOwnerBooking.controller.test.js` | BW-NEW-002, ownership, input validation |
| P1 | `__tests__/checkVportOwnership.controller.test.js` | VPORT-kind self-shortcut, user-kind passthrough |
| P1 | Add to `vportFuelPriceSubmissions.write.dal.test.js` | VENOM-WS-003 DB precondition |
| P1 | Add to `vportPublicBooking.controller.test.js` | VENOM-WS-001 voided actor |
| P2 | `__tests__/updateStationFuelUnit.controller.test.js` | Ownership gate, unit allowlist |
| P2 | `__tests__/submitOwnerFuelPriceUpdate.controller.test.js` | Ownership gate, price validation |

---

## CI Gate Assessment

| Gate | Status | Notes |
|---|---|---|
| assertActorOwnsVportActorController | PROTECTED | Comprehensive test suite |
| Public booking creation | PROTECTED | BOOK-002, VPD-V-019 covered |
| Booking mutation (status/reschedule) | PROTECTED | VPD-V-021, ownership covered |
| Gas price review mutation | UNPROTECTED | No regression net for VENOM-WS-002 |
| Feed system post publication | UNPROTECTED | No test for auth bypass (ELEK-005) |
| Owner booking creation | UNPROTECTED | Entire path untested |
| TOCTOU double-approval | UNPROTECTED | No test validates or catches the gap |

---

## Final SPIDER-MAN Status

**UNDERTESTED (gas prices) / WATCH (bookings)**

The booking engine's core security invariants (ELEK-004, VPD-V-021, BOOK-001/002, VPD-V-019) are comprehensively tested. However, `createOwnerBookingController` has zero test coverage — a P0 gap for the mutation path.

Gas price mutation controllers are critically undertested: `reviewFuelPriceSuggestionController` and `publishFuelPriceUpdateAsPostController` have no tests at all. The VENOM-WS-002 and ELEK-005 vulnerabilities have no regression protection. A future fix to these controllers could be accidentally reverted with no CI signal.

**6 missing tests identified. 3 are P0 (HIGH risk regression gaps).**

SPIDER-MAN emits: **CAUTION**
SPIDER-MAN does NOT emit: THOR_RELEASE_ELIGIBLE
Release authority belongs exclusively to THOR.

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| SPM-001 (reviewFuelPriceSuggestion) | Wolverine (write tests), VENOM (fix ownership gate) | Tests needed before and after patch |
| SPM-002 (publishFuelPriceUpdateAsPost) | Wolverine (write tests), ELEKTRA (patch advisory exists) | ELEK-2026-06-05-005 patch first, test after |
| SPM-003 (createOwnerBooking) | Wolverine (write tests) | Simple controller test + BW-NEW-002 regression |
| SPM-004 (checkVportOwnership) | Wolverine (write tests), VENOM (design review) | Documents self-shortcut behavior explicitly |
| SPM-005 (TOCTOU DAL test) | Wolverine (add to write.dal.test), Carnage (DB patch) | DB fix + DAL test |
| SPM-006 (voided actor booking) | Wolverine (add to controller test) | Add is_void mock case to existing test file |
