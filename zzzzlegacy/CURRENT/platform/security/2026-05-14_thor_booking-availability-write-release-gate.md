# THOR RELEASE REPORT — Booking + Availability Write Path

**Date:** 2026-05-14  
**Reviewer:** THOR  
**Trigger:** Cerebro audit pipeline completion — AvengersAssemble report delivered, final release gate evaluation requested  
**Branch:** `vport-booking-feed-security-updates`  
**Application Scope:** VCSM + ENGINE  

---

## THOR RELEASE TARGET

Application Scope: VCSM + ENGINE  
Release reason: Booking system security and governance pass — determine release readiness for booking + availability write path included in `vport-booking-feed-security-updates` branch  
Areas changed: `apps/VCSM/src/features/booking/`, `apps/VCSM/src/features/dashboard/vport/`, `engines/booking/src/`  

---

## RELEASE SIGNAL INVENTORY

| Signal | Status | Latest Report | Notes |
|---|---|---|---|
| VENOM | PRESENT | `2026-05-14_venom_booking-availability-write.md` + `booking-dal.md` | CRITICAL findings — blocking |
| FALCON | N/A | — | No native parity scope for this audit |
| CARNAGE | PRESENT | `2026-05-14_carnage_booking-rls-policies.md` | HIGH RISK — migration plan ready, prerequisites required |
| LOGAN | PRESENT | `vcsm.dal.booking.md` updated 2026-05-14 | ALIGNED post-update |
| KRAVEN | PRESENT | `2026-05-14_kraven_booking-mutation-bottleneck.md` | WATCH — non-blocking |
| LOKI | PRESENT | `2026-05-14_loki_booking-dal-runtime-trace.md` | Runtime chain verified |
| ARCHITECT | STALE | `2026-05-10_architect_*` | Prior session — low impact for this scope |
| IRONMAN | PRESENT | `2026-05-14_ironman_booking-feature-ownership.md` | Ownership CLEAR |
| CONTRACT REVIEW | PRESENT | `2026-05-14_review-contract_booking-availability-write.md` | NON-COMPLIANT — 7 violations |
| SHIELD | PRESENT | `2026-05-14_shield_booking-availability-write.md` | CAUTION — non-blocking |
| AVENGERSASSEMBLE | PRESENT | `avengers-assembly-2026-05-14-booking.md` | BLOCKED status confirmed |

---

## BOUNDARY SCOPE CHECK

| Protected Root | In Scope? | Modified? | Approval Needed? | Status |
|---|:---:|:---:|:---:|---|
| apps/VCSM | YES | YES (branch delta) | No — VCSM scope declared | COMPLIANT |
| apps/wentrex | NO | NO | — | NOT IN SCOPE |
| apps/Traffic | NO | NO | — | NOT IN SCOPE |
| engines/booking | YES | YES (RC-03 fix required) | YES — ENGINE scope requires explicit approval for cross-root | REQUIRES APPROVAL for RC-03 fix |

**Engine scope note:** The booking engine (`engines/booking/`) is within declared scope (VCSM + ENGINE). However, the RC-03 fix (adding ownership assertion to `engines/booking/src/controller/listBookingHistory.controller.js`) is a cross-root change affecting a shared engine. Thor confirms this requires explicit user approval before Wolverine executes — per boundary contract §3.

---

## CRITICAL RELEASE GATES

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| Availability write has ownership gate | FAIL | RC-01: `manageVportAvailabilityRuleController` has no callerActorId, no assertActorOwnsVportActorController call | BLOCKED — any authenticated actor can overwrite any VPORT's availability rules |
| Engine booking read has ownership gate | FAIL | RC-03: `listBookingHistory` accepts only resourceId — no caller identity, no ownership assertion | BLOCKED — customer PII accessible to any actor with a resourceId |
| Services lookup uses canonical identity surface | FAIL | RC-02: `listVportServicesForProfileController` accepts profileId — forbidden Identity Surface Rule §1.3 | BLOCKED — structural passthrough with forbidden identity surface |
| Hook does not suppress security parameters | FAIL | RC-06: `useVportManageAvailability` receives requestActorId but silently drops it before controller call | BLOCKED — hook interferes with authorization chain |
| Adapter exports only safe surfaces | FAIL | RC-05: `booking.adapter.js` exports `useBookingHistory` backed by unprotected engine controller | BLOCKED — adapter trust boundary degraded |
| RLS policies verified for write paths | FAIL | DB-BOOK-02: availability_rules UPDATE RLS unverified / no owner filter. DB-BOOK-01: bookings SELECT RLS unknown | BLOCKED — DB-level enforcement absent or unverified |

---

## VCSM ACTOR TRUST GATE

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| Actor ownership enforced on availability write | FAIL | `manageVportAvailabilityRuleController` — zero ownership verification. V-AVAIL-01 CRITICAL | BLOCKED |
| Actor ownership enforced on booking read | FAIL | `listBookingHistory` engine controller — no actor ownership check. V-BOOK-01 CRITICAL | BLOCKED |
| Public identity surface clean | FAIL | `useQuickBookingModal` accepts profileId (RC-04). `listVportServicesForProfileController` uses profileId (RC-02) | BLOCKED |
| VPORT lifecycle respected | PASS | No lifecycle bypass detected in reviewed paths | COMPLIANT |
| Feed attribution protected | N/A | Feed not in booking path scope | N/A |
| Booking trust protected | PARTIAL | Customer cancel path correctly validates customer identity (isCustomer check). Owner paths fail ownership gate | PARTIAL — owner paths BLOCKED |
| External API surface safe | PASS | No external API surfaces exposed in reviewed booking path | COMPLIANT |
| SEO indexing safe | N/A | Booking paths are authenticated — no SEO surface | N/A |

---

## NATIVE PARITY RELEASE GATE

Not applicable for this audit scope. No native booking admin screens reviewed.

---

## MIGRATION RELEASE GATE

| Migration Area | Status | Rollback | RLS Reviewed | Release Impact |
|---|---|---|---|---|
| DB-BOOK-01: bookings SELECT RLS | PENDING — not yet deployed | YES — full rollback SQL in Carnage report | NO — RLS content unverified (DB-BOOK-01) | CONDITIONAL BLOCKER — requires RC-03 fix deployed first |
| DB-BOOK-02: availability_rules UPDATE RLS | PENDING — not yet deployed | YES — full rollback SQL in Carnage report | PARTIAL — policy designed, not yet verified in staging | CONDITIONAL BLOCKER — requires RC-01 fix deployed first |
| Index migrations (CONCURRENTLY) | PENDING | YES — DROP INDEX | N/A | NON-BLOCKING — can run independently |

**Migration gate ruling:** Migrations are not yet deployed — this is correct. They must not be deployed until:
1. RC-01 and RC-06 are fixed (app-layer, then deploy availability_rules RLS)
2. RC-03 is fixed (engine-layer, then deploy bookings SELECT RLS)
3. Pre-migration verification SQL is run to confirm current RLS state

Migration plan is HIGH RISK but has correct sequencing and full rollback. No migration blocker — CONDITIONAL approval pending app-layer fixes.

---

## ARCHITECTURE FINDINGS

**3 CRITICAL violations (release-blocking):**

- **RC-01** — `manageVportAvailabilityRuleController`: Controller Contract §2.3 violated. No actor rules, no ownership, no permissions enforced on write path. This is a fundamental contract violation on a production write operation.

- **RC-02** — `listVportServicesForProfileController`: Controller Contract §2.3 + Identity Surface Rule §1.3 violated. Zero-logic passthrough accepting `profileId` — a forbidden identity surface. Not a controller — an anti-pattern that bypasses the authorization layer while appearing to use it.

- **RC-03** — `engines/booking/listBookingHistory`: Engine Controller Contract violated. Booking history with customer PII returned without ownership verification. The engine contract states engines must be "authorization-capable — application-agnostic but not authorization-agnostic." This controller delegates authorization to the calling app, which violates the engine isolation model.

**3 HIGH violations (release-blocking as part of RC-01/02/03 fix):**

- **RC-04** — `useQuickBookingModal` accepts `profileId` parameter — Identity Surface Rule violation.
- **RC-05** — `booking.adapter.js` exports `useBookingHistory` backed by RC-03 unprotected surface — Adapter Contract §5.3 violated.
- **RC-06** — `useVportManageAvailability` silently drops `requestActorId` — Hook Contract §2.4 violated.

**1 MEDIUM violation (non-blocking):**

- **RC-07** — `VportDashboardCalendarScreen.jsx:26`: UI string comparison ownership check does not satisfy Owner Meaning Rule §1.4. Acceptable as UI rendering optimization after RC-01 is fixed. Non-blocking.

---

## PERFORMANCE FINDINGS

**WATCH status — non-blocking:**

- **K-BOOK-01** (HIGH ROI): 5-operation serial chain in owner mutation path (~310ms). Step 3a (getActorByIdDAL to resolve profile_id) is cacheable. Recommended alongside P0 fixes in same Wolverine pass.
- **K-BOOK-02** (MODERATE ROI): `getBookingByIdDAL` fetches 22 columns including PII; slim projection to ~7 columns recommended. Security benefit (data minimization) justifies this as part of P0 pass.
- **K-BOOK-03** (LOW ROI): Combined booking+resource JOIN opportunity. Optional.

No CRITICAL performance findings. No release-blocking performance risk.

---

## SECURITY FINDINGS

**V-AVAIL-01 (CRITICAL):** Availability write path has no ownership gate. Any authenticated Citizen can overwrite any VPORT's availability_rules by supplying a known `resourceId`. Exploitability: HIGH. Attack preconditions: authenticated account only + target resourceId (enumerable from public VPORT profiles).

**V-BOOK-01 (CRITICAL):** Engine `listBookingHistory` returns customer bookings + PII to any caller with a `resourceId`. No ownership assertion. Exploitability: HIGH.

**S-BOOK-02 (HIGH):** `useQuickBookingModal` + `listVportServicesForProfileController` accept `profileId` — Identity Surface Rule §1.3 violated. Allows profile-based enumeration.

**S-BOOK-04 (HIGH):** `booking.adapter.js` exports `useBookingHistory` backed by unprotected engine controller — adapter trust boundary degraded for all callers.

**V-AVAIL-04 (HIGH, corroborating):** `upsertVportAvailabilityRuleDAL` UPDATE has no owner column filter. Even if controller-level check is added, DAL lacks defense-in-depth. Acceptable once RLS migration DB-BOOK-02 is deployed.

---

## MIGRATION FINDINGS

- Carnage assessed 2 RLS migrations as HIGH RISK (bookings SELECT) and CAUTION (availability_rules UPDATE).
- Both migrations have full rollback SQL.
- Both are CONDITIONAL — app-layer fixes are prerequisites.
- Index migrations are non-blocking (CONCURRENTLY) and can deploy independently.
- Current RLS state on both tables is unverified — pre-migration DB verification SQL is required before deployment.

---

## DOCUMENTATION FINDINGS

- `vcsm.dal.booking.md` updated this session — ALIGNED.
- No missing critical documentation.
- Engine booking audit doc (`engines/booking/docs/`) does not exist — LOW priority gap, not release-blocking.

---

## OWNERSHIP FINDINGS

- Feature and engine ownership: CLEAR.
- Ownership rules defined correctly (actor_owners → ownership chain).
- Enforcement missing from 3 controllers — ownership is architecturally defined but not implemented.
- Dead code (`listBookingHistory.controller.js` feature layer) should be removed as part of P0 cleanup (S-BOOK-05).

---

## RISK ACCEPTANCE REGISTER

| Risk | Severity | Accepted By | Reason | Expiration / Follow-up |
|---|---|---|---|---|
| RC-07: UI string ownership comparison | MEDIUM | Accepted | UI rendering gate only — not a security gate. Acceptable after RC-01 is implemented. | Expires when RC-01 is deployed |
| K-BOOK-01: Serial read bottleneck | HIGH (performance) | Accepted pending | Performance risk — non-security. Recommended to fix alongside P0. | Fix in same Wolverine pass |
| K-BOOK-02: PII overfetch in mutation DAL | MEDIUM | Accepted pending | Data minimization concern — not an authorization failure. Fix alongside P0 strongly recommended. | Fix in same Wolverine pass |
| SHIELD SI-TM-01: Marvel naming | MEDIUM | Accepted | Internal tooling only — zero production exposure. Revisit only if command system is ever published. | Revisit if command system published |
| Engine audit doc missing | LOW | Accepted | Low priority documentation gap — no runtime or security impact. | Create after P0 fixes |

Note: CRITICAL risks (RC-01, RC-02, RC-03) and HIGH release-blocking risks (RC-04, RC-05, RC-06) cannot be accepted and are not listed here.

---

## DOCUMENTATION RELEASE GATE

| Documentation Area | Status | Drift | Release Impact |
|---|---|---|---|
| Logan docs (`vcsm.dal.booking.md`) | ALIGNED (updated) | Corrected this session | No blocking impact |
| Architecture contracts | ALIGNED | No contract changes | No |
| Security audits | PRESENT | 3 new Venom reports written | No |
| Native transfer docs | N/A | — | N/A |
| Engine docs | PARTIAL | No engine-specific audit doc | LOW — non-blocking |

---

## RECOMMENDED ACTIONS BEFORE RELEASE

### P0 — Release Blockers (Wolverine required, in order):

**1. RC-05 (immediate, 1 line):** Remove `useBookingHistory` from `booking.adapter.js`. Isolation fix — zero risk, one-line delete. Deploy this first to immediately reduce adapter trust surface.

**2. RC-06 (immediate, ~2 lines):** Forward `callerActorId` from `useVportManageAvailability` to `manageVportAvailabilityRuleController`. Hook contract fix — does not break anything until RC-01 adds the controller-level check.

**3. RC-01 (controller gate, ~10 lines):** Add `callerActorId` parameter + `assertActorOwnsVportActorController` call to `manageVportAvailabilityRuleController`. This is the primary security fix for availability write.

**4. RC-04 (hook signature, ~5 lines):** Remove `profileId` from `useQuickBookingModal` hook signature. Accept `ownerActorId` derived from `resourceId` instead.

**5. RC-02 (controller, ~10 lines):** Replace `profileId` surface in `listVportServicesForProfileController`. If services are public → rename to `listPublicVportServicesController` and document explicitly. If owner-only → add `callerActorId` + ownership assertion.

**6. RC-03 (ENGINE — requires explicit approval):** Add `callerActorId` + `ownerActorId` + ownership assertion to `engines/booking/src/controller/listBookingHistory.controller.js`. Cross-root change — user must explicitly approve engine scope before Wolverine executes.

**7. K-BOOK-02 (alongside P0):** Slim `getBookingByIdDAL` projection from 22 columns to ~7. Security benefit (data minimization) + performance benefit.

**8. S-BOOK-05 (housekeeping):** Delete dead feature `listBookingHistory.controller.js` from `apps/VCSM/src/features/booking/controller/`.

**9. DB-BOOK-06 (housekeeping):** Remove `member_actor_id` from `listBookingsByCustomerDAL` join clause.

### P1 — After P0 fixes are deployed:

**10. DB verification:** Run pre-migration SQL to confirm current RLS state on `vport.bookings` and `vport.availability_rules`.

**11. Index migrations (CONCURRENTLY):** Non-blocking — can deploy any time.

**12. DB-BOOK-02 RLS:** Deploy `availability_rules` UPDATE RLS policy after RC-01 is verified in staging.

**13. DB-BOOK-01 RLS:** Deploy `bookings` SELECT RLS policy after RC-03 is verified in staging. Bookings policy last — highest blast radius.

### P2 — Non-blocking follow-up:

**14. K-BOOK-01:** Session-scoped actor profile_id cache to reduce serial chain from 5 to 4 operations.

**15. Engine booking audit doc:** Create `engines/booking/docs/engine-audit.md` for long-term governance.

---

## FINAL DECISION: BLOCKED

**Rationale:**

The booking and availability write path contains **three CRITICAL release-blocking contract violations**:

1. **Availability write path has no ownership gate** (RC-01 / V-AVAIL-01). Any authenticated Citizen can overwrite any VPORT's availability rules. The UI-level string comparison (RC-07) is the only guard — and it does not satisfy the Owner Meaning Rule. This is not a hypothetical risk: an authenticated user who knows any VPORT's resourceId (discoverable from network inspection of any VPORT public page) can submit availability changes.

2. **Engine booking history exposes customer PII without ownership gate** (RC-03 / V-BOOK-01). `listBookingHistory` returns booking records containing customer contact information to any caller supplying a `resourceId`. No identity, no ownership — caller-supplied resource ID is the only gate.

3. **Services controller uses forbidden profileId identity surface with zero authorization logic** (RC-02 / RC-04). The Identity Surface Rule exists because `profileId` is enumerable and does not map to actor ownership. This is both an architecture violation and an authorization surface weakness.

These are not edge cases or hardening improvements. They are gaps in the primary security model of the booking system.

**Release cannot proceed** until RC-01, RC-02, RC-03, RC-04, RC-05, and RC-06 are resolved.

When Wolverine resolves the P0 fixes, re-run VENOM + review-contract on the modified files before re-evaluating release readiness. A full Cerebro re-run is not required — targeted specialist re-review is sufficient.

---

**FINAL DECISION: BLOCKED**  
Blocker count: 6 violations (3 CRITICAL, 3 HIGH) + 2 unverified RLS policies  
Recommended next: Wolverine — P0 implementation (RC-05 → RC-06 → RC-01 → RC-04 → RC-02 → RC-03 with explicit engine approval)
