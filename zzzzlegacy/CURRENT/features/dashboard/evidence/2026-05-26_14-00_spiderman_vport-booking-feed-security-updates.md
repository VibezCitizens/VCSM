# SPIDER-MAN Test Coverage Report

Date: 2026-05-26
Application Scope: VCSM + ENGINE
Branch: vport-booking-feed-security-updates
Environment: Local / Vitest (Node)
Reviewer: SPIDER-MAN

---

## Coverage Summary

This branch is a security-focused refactor touching booking write paths, vport lead ownership enforcement, auth callback guards, block moderation, and model layer reorganization. The branch contains **zero new tests** for any of its changed controllers, models, or engine code. Only pre-existing auth callback tests remain. Given that this branch explicitly fixes security bugs (VPD-V-016, VPD-V-020, BW-LOGIN-002), the absence of regression locks is a release risk.

**Test files added this branch:** 0  
**Test files modified this branch:** 1 (pre-existing — `authCallback.controller.test.js`)  
**Total unit test files in repo:** 1  
**Total test files (including dev-only):** 2  

---

## CI Test Gate Review

| Area | Current Status | Risk | Recommendation |
|---|---|---|---|
| VCSM unit test execution | ✅ CI runs `test:run` | LOW | Keep gating CI |
| Test coverage threshold | ❌ No threshold configured | HIGH | Add `--coverage --reporter=text --threshold=80` to CI |
| Coverage artifact upload | ❌ Not configured | MEDIUM | Upload coverage report as CI artifact |
| Wentrex test execution | ❌ No test step in CI | LOW (no critical logic) | Add placeholder test step |
| Traffic test execution | ❌ No test step in CI | LOW (static only) | Add placeholder test step |
| Flaky test detection | ❌ No retry/flake guard | MEDIUM | Add `--retry=2` to CI run |
| Test environment isolation | ✅ Node env configured correctly | LOW | — |
| Pre-merge gate | ❌ No branch protection requiring green tests | HIGH | Require `test:run` to pass before merge |

---

## Missing Coverage Review

| File | Coverage Type Missing | Severity | Why It Matters |
|---|---|---|---|
| `apps/VCSM/src/features/booking/controller/createBooking.controller.js` | CONTROLLER | CRITICAL | Write path — source enum enforcement, duration ceiling (1440 min), past-slot guard, citizen-only booking enforcement, vport ownership gate. A regression in any of these silently creates invalid bookings or bypasses auth. |
| `apps/VCSM/src/features/booking/controller/cancelBooking.controller.js` | CONTROLLER | CRITICAL | Destructive write — dual ownership path (customer OR owner), VPD-V-020 slug fix (raw UUID non-exposure in notifications). A regression here either blocks legitimate cancellations or allows unauthorized ones. |
| `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` | CONTROLLER | CRITICAL | Shared ownership primitive used across 9+ controllers. Self-ownership shortcut, void check, kind check, DB actor_owners lookup. If this regresses, all downstream ownership enforcement fails silently. |
| `apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js` | CONTROLLER | CRITICAL | Security fix VPD-V-016 — former ownership check was a naive string compare with no DB query. All 4 entry points (list, count, markContacted, delete) now use canonical ownership gate. No regression lock exists. |
| `apps/VCSM/src/features/block/controllers/blockActor.controller.js` | CONTROLLER | HIGH | Self-block prevention, session actor mismatch guard, idempotent block state. Social moderation integrity depends on this. |
| `engines/booking/src/controller/listBookingHistory.controller.js` | CONTROLLER | HIGH | Engine-level ownership gate for booking history. Used server-side. No tests despite calling `assertActorOwnsVportActor`. |
| `apps/VCSM/src/features/booking/controller/listBookingHistory.controller.js` | CONTROLLER | HIGH | App-level booking history listing — ownership check before data exposure. |
| `apps/VCSM/src/features/booking/controller/listMyBookings.controller.js` | CONTROLLER | HIGH | Customer's own booking visibility — caller must be the customer. |
| `apps/VCSM/src/features/dashboard/vport/dal/write/vportLeads.write.dal.js` | CONTROLLER | HIGH | Delete and update DALs use `.eq("vport_profile_id", profileId)` as the ownership scope filter. If profileId resolution is wrong, a different vport's leads are mutated. |
| `apps/VCSM/src/features/booking/model/booking.model.js` | MODEL | MEDIUM | `mapBookingRow` / `mapBookingRows` — pure transforms. `ownerActorId` resolution uses a multi-field fallback chain. Regression here silently produces wrong owner IDs in notification payloads. |
| `apps/VCSM/src/features/dashboard/vport/model/vportBookingHistoryView.model.js` | MODEL | MEDIUM | `filterBookings` / `groupByDate` — pure date-sensitive logic. Moved from screens/model; logic unchanged but untested. `filterBookings("upcoming")` excludes today which is a business rule that can quietly regress. |
| `apps/VCSM/src/features/dashboard/vport/model/vportSettingsValidation.model.js` | MODEL | MEDIUM | Pure validation/normalization functions — `normalizeCity`, `normalizeState`, `normalizeZip`, `normalizePhone`, `getAddressValidationError`. Moved from screens/lib; logic unchanged but untested. |
| `apps/VCSM/src/features/auth/controllers/authOps.controller.js` | CONTROLLER | MEDIUM | Auth operations — sign in, sign out, magic link. No tests despite sensitive session lifecycle handling. |
| `apps/VCSM/src/features/auth/controllers/register.controller.js` | CONTROLLER | MEDIUM | User registration write path. No tests. |
| `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js` | CONTROLLER | MEDIUM | Password reset write path — no tests for token validation or expiry handling. |
| `apps/VCSM/src/features/upload/controller/recordPostMedia.controller.js` | CONTROLLER | MEDIUM | Media upload write path — no tests for auth enforcement. |
| `apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js` | CONTROLLER | MEDIUM | Privacy settings mutation — no ownership tests. |

---

## Regression Protection Review

| Issue | Protected By Test? | Risk | Recommendation |
|---|---|---|---|
| BW-LOGIN-002 — `#type=recovery` hash grants `isRecovery=true` | ✅ YES — `authCallback.controller.test.js` (3 tests) | LOW | Maintain, do not weaken |
| VPD-V-016 — vportLeads ownership was naive string compare (no DB) | ❌ NO | CRITICAL | Write `vportLeads.controller.test.js` locking all 4 entry points reject non-owners |
| VPD-V-020 — raw UUID in notification `linkPath` | ❌ NO | HIGH | Add test asserting `cancelBookingController` notification uses slug path, not UUID, when owner cancels |
| Duration ceiling bypass (>1440 min bookings) | ❌ NO | HIGH | Test `createBookingController` rejects `durationMinutes > 1440` |
| Past-slot booking guard | ❌ NO | HIGH | Test `createBookingController` rejects `startsAt` in the past |
| Unrecognized booking source bypass | ❌ NO | HIGH | Test `createBookingController` rejects unknown source strings |
| Void actor bypasses citizen-only booking guard | ❌ NO | CRITICAL | Test `createBookingController` throws for `is_void=true` requestActor |
| Vport actor (kind≠user) bypasses citizen-only booking guard | ❌ NO | CRITICAL | Test `createBookingController` throws when `requestActor.kind === 'vport'` |
| Self-block prevention in block controller | ❌ NO | MEDIUM | Test `blockActorController` throws when `blockerActorId === blockedActorId` |
| Session actor mismatch in block controller | ❌ NO | HIGH | Test `blockActorController` throws when `assertingActorId !== blockerActorId` |
| assertActorOwnsVportActor void requester bypass | ❌ NO | CRITICAL | Test that `is_void=true` requester is rejected even if kind matches |
| assertActorOwnsVportActor non-user kind bypass | ❌ NO | CRITICAL | Test that `kind !== 'user'` requester is rejected |
| assertActorOwnsVportActor self-ownership shortcut | ❌ NO | MEDIUM | Test `requestActorId === targetActorId` returns `{ ok: true, mode: 'self' }` without DB query |

---

## Test Ownership Review

| Area | Test Owner | Status |
|---|---|---|
| Auth callback controller | Wolverine / Security | ASSIGNED — exists |
| createBookingController | Wolverine | UNASSIGNED |
| cancelBookingController | Wolverine | UNASSIGNED |
| assertActorOwnsVportActorController | Wolverine | UNASSIGNED |
| vportLeadsController (all 4) | Wolverine | UNASSIGNED |
| blockActorController | Wolverine | UNASSIGNED |
| booking.model (mapBookingRow) | Wolverine | UNASSIGNED |
| vportBookingHistoryView.model | Wolverine | UNASSIGNED |
| vportSettingsValidation.model | Wolverine | UNASSIGNED |
| Engine booking listBookingHistory | Wolverine | UNASSIGNED |
| Auth register/setPassword/ops controllers | Wolverine | UNASSIGNED |

---

## Critical Untested Flows

### 1. `createBookingController` — 8 untested branches

```
- ✗ rejects missing resourceId
- ✗ rejects missing startsAt / endsAt / timezone / serviceLabelSnapshot / durationMinutes  
- ✗ rejects unrecognized source string
- ✗ rejects durationMinutes > 1440
- ✗ rejects durationMinutes <= 0 or non-numeric
- ✗ rejects inactive/missing resource
- ✗ rejects management source without ownership (assertActorOwnsVportActor)
- ✗ rejects void requestActor for citizen-only source
- ✗ rejects vport-kind requestActor for citizen-only source
- ✗ rejects past startsAt
- ✗ sends notification when source=public and actors differ
- ✗ does NOT send notification when requester === resource owner
```

### 2. `cancelBookingController` — 6 untested branches

```
- ✗ rejects missing bookingId
- ✗ rejects missing requestActorId
- ✗ rejects non-existent booking
- ✗ allows customer to cancel their own booking (no ownership check)
- ✗ rejects non-customer, non-owner from cancelling
- ✗ notification linkPath uses slug (not UUID) when owner cancels (VPD-V-020)
- ✗ notification omits linkPath when slug unavailable (graceful degradation)
```

### 3. `assertActorOwnsVportActorController` — 5 untested branches

```
- ✗ self-ownership shortcut (no DB call)
- ✗ rejects void requester actor
- ✗ rejects non-user kind
- ✗ rejects actor with no profile_id
- ✗ rejects when actor_owners link is_void=true
- ✗ accepts valid owner link
```

### 4. `vportLeadsController` — 4 entry points, all untested

```
- ✗ listVportLeadsController rejects non-owner
- ✗ markVportLeadContactedController rejects non-owner
- ✗ countNewVportLeadsController rejects non-owner
- ✗ deleteVportLeadController rejects non-owner
- ✗ all entry points accept legitimate owner
- ✗ profileId resolution failure propagates correctly
```

### 5. `blockActorController` — 3 untested functions

```
- ✗ blockActorController: rejects self-block
- ✗ blockActorController: rejects session mismatch
- ✗ blockActorController: idempotent (already blocked)
- ✗ unblockActorController: rejects session mismatch
- ✗ unblockActorController: idempotent (not blocked)
- ✗ toggleBlockActorController: correct toggle direction both ways
```

---

## SPIDER-MAN TEST FINDINGS

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-001
- **File / Flow:** `apps/VCSM/src/features/booking/controller/createBooking.controller.js`
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER
- **Coverage Status:** MISSING
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Source enum enforcement, duration ceiling, void/kind citizen guard, past-slot guard, resource ownership gate, notification trigger exclusion
- **Regression Risk:** Any regression in the citizen guard allows VPORTs or void actors to create public bookings; any regression in the past-slot guard allows back-dated bookings; duration bypass allows database pollution
- **Recommended Tests:** Mock all DALs; test each validation gate independently; test notification path inclusion/exclusion
- **Recommended Owner:** Wolverine
- **Release Impact:** BLOCKED — write path with no regression protection is unsafe to ship
- **Recommended Handoff:** THOR (release classification), VENOM (void actor bypass risk)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-002
- **File / Flow:** `apps/VCSM/src/features/booking/controller/cancelBooking.controller.js` + VPD-V-020
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER + REGRESSION
- **Coverage Status:** MISSING
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** VPD-V-020 slug-based linkPath regression lock, unauthorized cancellation rejection, dual ownership path correctness
- **Regression Risk:** VPD-V-020 fix (slug in notification, not UUID) has no lock — any future change could reintroduce UUID exposure in notification rows. Unauthorized cancellation if ownership check is removed.
- **Recommended Tests:** Assert `linkPath` does not contain raw UUID when owner cancels; assert `linkPath` is null when slug unavailable; assert non-customer/non-owner is rejected.
- **Recommended Owner:** Wolverine
- **Release Impact:** BLOCKED — security fix with no regression test
- **Recommended Handoff:** VENOM (UUID exposure), BLACKWIDOW (exploit replay)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-003
- **File / Flow:** `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js`
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER
- **Coverage Status:** MISSING
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Self-ownership shortcut correctness, void requester rejection, non-user kind rejection, profile_id absence, is_void owner link rejection
- **Regression Risk:** This is the shared ownership primitive used at 9+ call sites (booking create, cancel, listHistory, all 4 vportLeads, vport settings). A regression silently bypasses all downstream ownership enforcement.
- **Recommended Tests:** Unit tests with mocked DALs for each branch; verify self-ownership skips DB; verify void/kind/profile_id rejections; verify is_void ownerLink rejection.
- **Recommended Owner:** Wolverine
- **Release Impact:** BLOCKED — foundation of all ownership enforcement has no regression lock
- **Recommended Handoff:** VENOM (ownership bypass risk)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-004
- **File / Flow:** `apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js` (VPD-V-016)
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER + REGRESSION
- **Coverage Status:** MISSING
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Regression lock for VPD-V-016 (former ownership check was naive string compare — zero DB query). All 4 mutating entry points need ownership rejection tests.
- **Regression Risk:** If `assertActorOwnsVportActorController` is removed or weakened, any actor can list, mutate, or delete another vport's leads. The fix has been deployed but not locked.
- **Recommended Tests:** For each of the 4 controllers, mock `assertActorOwnsVportActorController` to reject; assert the controller throws without proceeding to the DAL. Also test legitimate owner path succeeds.
- **Recommended Owner:** Wolverine
- **Release Impact:** BLOCKED — fixed security bug with no regression test
- **Recommended Handoff:** BLACKWIDOW (exploit replay for pre-fix behavior)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-005
- **File / Flow:** `apps/VCSM/src/features/block/controllers/blockActor.controller.js`
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER
- **Coverage Status:** MISSING
- **Severity:** HIGH
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Self-block prevention, session actor identity assertion, idempotent block behavior, toggle correctness
- **Regression Risk:** Self-block allowed → broken moderation state. Session mismatch not caught → any logged-in actor can block as another actor.
- **Recommended Tests:** Unit tests mocking `checkBlockStatus` and DAL calls; test self-block throws; test asserting actor mismatch throws; test idempotency.
- **Recommended Owner:** Wolverine
- **Release Impact:** WATCH
- **Recommended Handoff:** VENOM (session identity enforcement)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-006
- **File / Flow:** `engines/booking/src/controller/listBookingHistory.controller.js`
- **Application Scope:** ENGINE
- **Coverage Type:** CONTROLLER
- **Coverage Status:** MISSING
- **Severity:** HIGH
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Ownership gate enforcement, required param validation
- **Regression Risk:** If ownership gate is bypassed, any actor can read any vport's booking history via the engine controller.
- **Recommended Tests:** Mock `assertActorOwnsVportActor` to throw; assert history listing is blocked. Test required param rejections.
- **Recommended Owner:** Wolverine
- **Release Impact:** WATCH
- **Recommended Handoff:** HAWKEYE (API/engine endpoint regression)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-007
- **File / Flow:** `apps/VCSM/src/features/booking/model/booking.model.js` + `vportBookingHistoryView.model.js` + `vportSettingsValidation.model.js`
- **Application Scope:** VCSM
- **Coverage Type:** MODEL
- **Coverage Status:** MISSING
- **Severity:** MEDIUM
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:**
  - `mapBookingRow`: `ownerActorId` multi-fallback chain, null/missing row handling
  - `filterBookings("upcoming")`: today-exclusion business rule
  - `filterBookings("past")`: before-todayStart threshold
  - `normalizeCity/State/Zip/Country/Phone`: edge cases (empty, special chars, country codes)
  - `getAddressValidationError`: regex gates for city/state/zip/country
- **Regression Risk:** `filterBookings` uses wall-clock `new Date()` making it time-sensitive; a logic error silently misfils the booking dashboard. `ownerActorId` fallback chain regressions produce wrong actor in notification routing.
- **Recommended Tests:** Pure unit tests — no mocks needed for model functions. Cover null inputs, boundary dates, special characters, invalid formats.
- **Recommended Owner:** Wolverine
- **Release Impact:** WATCH
- **Recommended Handoff:** LOKI (runtime filter behavior)

---

## Recommended Test Priorities

Priority order for Wolverine execution:

| Priority | Finding | File | Est. Effort |
|---|---|---|---|
| 1 | SPM-003 | `assertActorOwnsVportActor.controller.js` | 1 test file, 6-8 tests — foundation for all others |
| 2 | SPM-004 | `vportLeads.controller.js` | 1 test file, 8 tests — locks VPD-V-016 regression |
| 3 | SPM-001 | `createBooking.controller.js` | 1 test file, 12 tests — critical write path |
| 4 | SPM-002 | `cancelBooking.controller.js` | 1 test file, 8 tests — locks VPD-V-020, destructive path |
| 5 | SPM-007 | All 3 model files | 3 test files, ~20 tests — pure functions, fast to write |
| 6 | SPM-005 | `blockActor.controller.js` | 1 test file, 8 tests |
| 7 | SPM-006 | Engine `listBookingHistory.controller.js` | 1 test file, 4 tests |

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| SPM-001 | THOR | Release classification — write path unprotected |
| SPM-001 | VENOM | Void actor / vport-kind citizen bypass is a trust boundary violation |
| SPM-002 | VENOM | UUID exposure in notification linkPath (VPD-V-020 regression risk) |
| SPM-002 | BLACKWIDOW | Exploit replay for unauthorized cancellation path |
| SPM-003 | VENOM | Shared ownership primitive has no regression lock — high blast radius |
| SPM-004 | BLACKWIDOW | Exploit replay for pre-VPD-V-016 naive string compare behavior |
| SPM-005 | VENOM | Session actor identity assertion regression |
| SPM-006 | HAWKEYE | Engine-level endpoint ownership regression |
| SPM-007 | LOKI | Runtime observability for `filterBookings` time-sensitive logic |

---

## Final SPIDER-MAN Status

```
██████████████████████████████████████████████████████████
  SPIDER-MAN STATUS: UNDERTESTED → BLOCKED
  
  4 CRITICAL findings with no regression lock
  3 HIGH findings with no coverage
  
  This branch fixes real security bugs (VPD-V-016, VPD-V-020,
  void actor bypass) but ships no regression tests to lock them.
  
  Recommend: Wolverine writes Priority 1-4 tests before merge.
  Minimum safe bar: SPM-003 + SPM-004 + SPM-002 tested before ship.
██████████████████████████████████████████████████████████
```

**BLOCKED** — 4 critical security-sensitive controllers changed on this branch have zero test coverage and no regression locks for the security fixes they implement.
