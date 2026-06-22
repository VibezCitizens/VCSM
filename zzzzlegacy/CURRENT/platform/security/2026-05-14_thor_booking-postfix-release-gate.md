# THOR RE-EVALUATION — Booking + Availability Write Path

**Date:** 2026-05-14  
**Reviewer:** THOR  
**Trigger:** P0 fix pass complete — VENOM + review-contract post-fix verification delivered  
**Branch:** `vport-booking-feed-security-updates`  
**Application Scope:** VCSM + ENGINE  
**Prior Gate:** `2026-05-14_thor_booking-availability-write-release-gate.md` — BLOCKED  

---

## RE-EVALUATION CONTEXT

The prior Thor report issued a BLOCKED decision citing 6 P0 release blockers (3 CRITICAL, 3 HIGH contract violations) and 2 unverified RLS policies.

Since that report:

1. All 6 P0 code fixes (RC-01 through RC-06) have been implemented by Wolverine.
2. S-BOOK-05 (dead code removal) and DB-BOOK-06 (DAL field cleanup) completed.
3. User provided DB RLS policy dump — both DB-BOOK-01 and DB-BOOK-02 confirmed as already deployed and correct.
4. Targeted post-fix VENOM review completed → **CLEARED**.
5. Targeted post-fix review-contract completed → **COMPLIANT**.

---

## BLOCKER RESOLUTION TABLE

| Original Blocker | Severity | Resolution | Verification | Status |
|---|---|---|---|---|
| RC-01: `manageVportAvailabilityRuleController` — no ownership gate | CRITICAL | Added `callerActorId` + `ownerActorId` guards + `assertActorOwnsVportActorController` call | VENOM CLEARED · review-contract COMPLIANT | **RESOLVED** |
| RC-02: `listVportServicesForProfileController` — `profileId` surface | CRITICAL | Accepts `ownerActorId`, resolves `profileId` internally via DAL, never exposes externally | VENOM CLEARED · review-contract COMPLIANT | **RESOLVED** |
| RC-03: Engine `listBookingHistory` — no ownership assertion | CRITICAL | Requires `callerActorId` + `ownerActorId`, calls engine-internal `assertActorOwnsVportActor` | VENOM CLEARED · review-contract COMPLIANT | **RESOLVED** |
| RC-04: `useQuickBookingModal` — `profileId` hook surface | HIGH | Replaced `profileId` with `ownerActorId`. `callerActorId` from `useIdentity()` | VENOM CLEARED · review-contract COMPLIANT | **RESOLVED** |
| RC-05: Adapter exports unprotected `useBookingHistory` | HIGH | `useBookingHistory` removed from `booking.adapter.js` | VENOM CLEARED · review-contract COMPLIANT | **RESOLVED** |
| RC-06: `useVportManageAvailability` silently drops `requestActorId` | HIGH | Now forwards `callerActorId` + `ownerActorId` to controller | VENOM CLEARED · review-contract COMPLIANT | **RESOLVED** |
| DB-BOOK-01: `bookings` SELECT RLS unverified | CONDITIONAL | User DB dump confirms `bookings_select_vport_owner` + `bookings_select_resource_neutral` + `bookings_select_customer` all deployed | DB dump verified | **RESOLVED — already live** |
| DB-BOOK-02: `availability_rules` UPDATE RLS unverified | CONDITIONAL | User DB dump confirms `availability_rules_update` + `availability_rules_manage_neutral` both deployed | DB dump verified | **RESOLVED — already live** |

---

## VCSM ACTOR TRUST GATE — RE-EVALUATION

| Gate | Prior Status | Current Status | Evidence |
|---|---|---|---|
| Actor ownership enforced on availability write | FAIL | **PASS** | RC-01: `assertActorOwnsVportActorController` called before every DAL write |
| Actor ownership enforced on booking read | FAIL | **PASS** | RC-03: engine `assertActorOwnsVportActor` called before any row returned |
| Public identity surface clean | FAIL | **PASS** | RC-02 + RC-04: `profileId` removed from all public hook/controller surfaces |
| VPORT lifecycle respected | PASS | PASS | Unchanged |
| Booking trust protected | PARTIAL | **PASS** | Owner paths now gated; customer path was already correct |
| External API surface safe | PASS | PASS | Unchanged |
| DB-layer defense in depth | FAIL | **PASS** | Both RLS sets confirmed deployed via DB dump |

---

## MIGRATION GATE — RE-EVALUATION

| Migration | Prior Status | Current Status | Notes |
|---|---|---|---|
| DB-BOOK-01: bookings SELECT RLS | PENDING — unverified | **ALREADY DEPLOYED** | `bookings_select_vport_owner`, `bookings_select_resource_neutral`, `bookings_select_customer` confirmed live |
| DB-BOOK-02: availability_rules UPDATE RLS | PENDING — unverified | **ALREADY DEPLOYED** | `availability_rules_update` + `availability_rules_manage_neutral` confirmed live |
| Index migrations (CONCURRENTLY) | PENDING — non-blocking | NON-BLOCKING | Can run any time, independent of code changes |

**Migration gate ruling: CLEARED.** No schema migrations are required for this release. DB-layer enforcement was already present before the audit. The app-layer P0 fixes add defense-in-depth and restore Controller Contract compliance — both are necessary regardless of DB coverage.

**Residual concern (non-blocking):** `bookings_insert_owner` policy uses `profiles.owner_user_id = auth.uid()` — legacy auth pattern that predates the actor_owners ownership model. Does not affect the current release (no regression introduced). Filed for a future Carnage migration to align with actor identity contract.

---

## REMAINING OPEN ITEMS

All of the following are **non-blocking** — they do not prevent merge.

| Item | Severity | Type | Status | Recommended Follow-up |
|---|---|---|---|---|
| RC-07: UI string comparison in `VportDashboardCalendarScreen` | MEDIUM | Architecture | ACCEPTED — UI render gate only, RC-01 is the real security gate | P2 — clarify ownership check pattern in calendar screen |
| K-BOOK-01: 5-operation serial chain in owner mutation path | HIGH (perf) | Performance | OPEN — non-blocking | P2 — session-scoped profileId cache, K-BOOK-01 |
| `bookings_insert_owner` legacy auth pattern | MEDIUM | Schema | OPEN — pre-existing, not a regression | P1 — Carnage migration to actor_owners model |
| Engine booking audit doc missing | LOW | Documentation | OPEN | P2 — create `engines/booking/docs/engine-audit.md` |
| Adapter exports controller (`assertActorOwnsVportActorController`) | LOW | Architecture | ACCEPTED — necessary cross-feature auth primitive; documented in post-fix review-contract | P2 — consider moving to `shared/` auth utilities |

---

## SIGNAL INVENTORY — UPDATED

| Signal | Status | Latest Report | Notes |
|---|---|---|---|
| VENOM | **CLEARED** | `2026-05-14_venom_booking-postfix-verification.md` | All P0 findings RESOLVED |
| review-contract | **COMPLIANT** | `2026-05-14_review-contract_booking-postfix-verification.md` | 6/7 violations resolved; RC-07 accepted |
| CARNAGE | SUPERSEDED | `2026-05-14_carnage_booking-rls-policies.md` | Both planned migrations confirmed already deployed — no migration needed |
| LOGAN | ALIGNED | `vcsm.dal.booking.md` updated 2026-05-14 | No new drift |
| KRAVEN | WATCH | `2026-05-14_kraven_booking-mutation-bottleneck.md` | K-BOOK-01 still open — non-blocking |
| LOKI | PRESENT | `2026-05-14_loki_booking-dal-runtime-trace.md` | Runtime chain verified and now enforced |
| SHIELD | CAUTION (non-blocking) | `2026-05-14_shield_booking-availability-write.md` | No change — non-blocking |
| AVENGERSASSEMBLE | RESOLVED | `avengers-assembly-2026-05-14-booking.md` | Original BLOCKED status — P0 fixes now applied |
| IRONMAN | ALIGNED | `2026-05-14_ironman_booking-feature-ownership.md` | Ownership CLEAR — enforcement now matches ownership map |

---

## BOUNDARY SCOPE — FINAL CHECK

| Protected Root | Modified | Scope Declared | Engine Approval | Status |
|---|:---:|:---:|:---:|---|
| apps/VCSM | YES | YES | N/A | COMPLIANT |
| engines/booking | YES | YES (VCSM + ENGINE) | YES — user approved RC-03 engine fix | COMPLIANT |
| apps/wentrex | NO | — | — | NOT IN SCOPE |
| apps/Traffic | NO | — | — | NOT IN SCOPE |

---

## FINAL DECISION: READY

**Rationale:**

All three CRITICAL violations and all three HIGH violations that blocked the prior release gate have been resolved with verified fixes:

- **Availability write path** now enforces actor ownership (`assertActorOwnsVportActorController`) in the controller layer before every DAL write. DB-layer enforcement (`availability_rules_update` RLS) is already deployed as defense-in-depth.

- **Engine booking history** now enforces actor ownership (`assertActorOwnsVportActor`) inside the engine controller before any row is returned. DB-layer enforcement (`bookings_select_*` RLS policies) is already deployed as defense-in-depth.

- **Identity surfaces** are clean. `profileId` has been removed from all public hook and controller signatures. `ownerActorId` (canonical actorId surface) is used throughout. Internal `profileId` resolution happens behind the controller boundary.

- **Adapter trust boundary** is restored. `useBookingHistory` removed from `booking.adapter.js`. The unprotected engine surface is no longer reachable via the feature adapter.

- **Hook authorization chain** is intact. `useVportManageAvailability` forwards both `callerActorId` and `ownerActorId` to the controller — no security parameters suppressed.

- **DB-layer verification complete.** Both RLS policy sets were confirmed deployed before this release — no migrations required. Defense-in-depth is in place at both app and DB layers.

The booking and availability write path now satisfies:
- Controller Contract §2.3 (ownership enforcement)
- Identity Surface Rule §1.3 (actorId canonical, profileId hidden)
- Hook Contract §2.4 (no parameter suppression)
- Adapter Contract §5.3 (trust boundary maintained)
- Engine Controller Contract (engine self-enforces authorization)
- Owner Meaning Rule §1.4 (actor_owners chain enforced at controller level)

**The branch is approved for merge.**

---

**FINAL DECISION: READY**  
Prior decision: BLOCKED (2026-05-14, earlier in session)  
Decision updated: 2026-05-14  
Blocker count: 0  
Non-blocking follow-up: 6 items (RC-07/UI string comparison, K-BOOK-01, bookings_insert_owner, engine audit doc, adapter controller export note, SF-02-FIXED)  
Recommended next: standard code review → merge → P1 follow-up items post-merge

---

## ADDENDUM — 2026-05-14 (Post-SENTRY scan)

**Trigger:** SENTRY boundary review (`2026-05-14_sentry_booking-availability-boundary-review.md`) identified SF-02 — `ensureVportOwnerResourceController` write path had no ownership assertion before `insertVportResourceDAL`.

**SF-02 Fix Applied (RC-07-RESOURCE):**
- `ensureVportOwnerResourceController` now calls `assertActorOwnsVportActorController({ requestActorId: actorId, targetActorId: ownerActorId })` as first statement after null guards.
- Import added from `@/features/booking/adapters/booking.adapter`.
- Pattern mirrors RC-01 exactly.
- This was a pre-existing gap not covered by the original P0 sweep (different write path — resource bootstrap, not availability rule).

**Impact on READY decision:** NONE. READY status stands. The fix was applied before any release attempt and restores the same pattern enforced across all other write controllers in scope.

**Remaining SENTRY non-blocking findings (post SF-02 fix):**
| Finding | Severity | Disposition |
|---|---|---|
| SF-01 — controller exported from booking adapter | MEDIUM | Accepted — needs inline comment rationale |
| SF-03 — CalendarScreen direct profiles import | MEDIUM | P2 cleanup |
| SF-04 — Final screen contains domain logic | MEDIUM | P3 cleanup |
| SF-05 — WeeklyAvailabilityGrid 356 lines | LOW | P3 cleanup |
| SF-06 — BookingHistoryScreen 309 lines | LOW | P3 cleanup (resolves with SF-04) |
| SF-07 — actorId naming drift in history path | LOW | P4 naming cleanup |
| SF-08 — String comparison isOwner across 9 screens | MEDIUM | P2 — propagate useVportOwnership |
