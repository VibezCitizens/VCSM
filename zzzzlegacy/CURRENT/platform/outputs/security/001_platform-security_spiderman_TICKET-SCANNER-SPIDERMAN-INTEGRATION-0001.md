# SPIDER-MAN — Scanner V1.3 Integration Validation Run
# Ticket: TICKET-SCANNER-SPIDERMAN-INTEGRATION-0001
# Date: 2026-06-02
# Application Scope: VCSM + ENGINE

---

## 1. Scanner Preflight

```
SCANNER PREFLIGHT
──────────────────────────────────────────────────
test-map:              FRESH — generated: 2026-06-03T00:22:42.771Z
test-traceability-map: FRESH — generated: 2026-06-03T00:22:42.771Z
write-execution-map:   FRESH — generated: 2026-06-03T00:22:42.771Z
rpc-execution-map:     FRESH — generated: 2026-06-03T00:22:42.771Z
security-path-map:     FRESH — generated: 2026-06-03T00:22:42.771Z
callgraph:             FRESH — generated: 2026-06-03T00:22:42.771Z

Overall: PASS — all 6 maps present and FRESH (same-day generation confirmed)
Action: Proceed with full scanner trust
```

Note: Earlier ABSENT reading for metadata.generatedAt was a key-path mismatch (metadata sub-object vs root key). The root-level generatedAt on test-map.json confirmed 2026-06-03T00:22:42.771Z. Scanner state: FRESH / TRUSTED. test-map reports testCount: 86 across all apps.

---

## 2. Scanner Inputs

| Map | Generated At | Freshness | Confidence | Used For |
|---|---|---|---|---|
| test-map | 2026-06-03T00:22:42.771Z | FRESH | HIGH | Test file inventory — 86 test files total across all apps |
| test-traceability-map | 2026-06-03T00:22:42.771Z | FRESH | HIGH | End-to-end traceability from test to source path |
| write-execution-map | 2026-06-03T00:22:42.771Z | FRESH | HIGH | Write surface caller chains for coverage gap detection |
| rpc-execution-map | 2026-06-03T00:22:42.771Z | FRESH | HIGH | RPC execution paths and ownership boundaries |
| security-path-map | 2026-06-03T00:22:42.771Z | FRESH | HIGH | Security-sensitive source-to-sink chains from VENOM/BLACKWIDOW |
| callgraph | 2026-06-03T00:22:42.771Z | FRESH | HIGH | Full call graph for untested path detection |

```
Scanner version: V1.3
Maps root: apps/scanner/maps/
Total test files indexed: 86 (all apps)
VCSM target feature total: 14 test files (actors:0, auth:1, block:0, booking:1, dashboard:12)
```

---

## 3. Scanner Signals

| Signal # | Source Map | Signal Type | Raw Value | Source Verified? | SPIDER-MAN Result |
|---|---|---|---|---|---|
| 1 | test-map | MISSING_RPC_TEST | VCSM:actors — status=missing, 0 test files | YES — scanner confirms 0 files | TESTREQ-ACTORS-001: zero test files in actors feature |
| 2 | test-map | MISSING_RPC_TEST | VCSM:block — status=missing, 0 test files | YES — scanner confirms 0 files | TESTREQ-BLOCK-001: zero test files in block feature |
| 3 | security-path-map | SECURITY_PATH_UNTESTED | BW-SCHED-001 VportDashboardScheduleScreen no Final Screen ownership gate | YES — confirmed in source | INV-UNCOV-007: UNCOVERED |
| 4 | security-path-map | SECURITY_PATH_UNTESTED | BW-SCHED-002 useVportOwnerSchedule stale closure callerActorId dep array | YES — confirmed in source | INV-UNCOV-008: UNCOVERED |
| 5 | security-path-map | SECURITY_PATH_UNTESTED | BW-SCHED-003 loadDayScheduleController boundary export from index.js | YES — confirmed in source | INV-UNCOV-009: UNCOVERED |
| 6 | security-path-map | SECURITY_PATH_UNTESTED | BW-CAL-002 VportDashboardCalendarScreen combined Final+View screen no structural second gate | YES — confirmed in source | INV-UNCOV-010: UNCOVERED |
| 7 | security-path-map | SECURITY_PATH_UNTESTED | BW-SETTINGS-002 flyerEditor.controller.js writes to vport.profile_public_details with RLS-only | YES — confirmed in source | INV-UNCOV-016: UNCOVERED |
| 8 | security-path-map | SECURITY_PATH_UNTESTED | ELEK-001 cancelBooking customer path — no void/kind actor check | YES — confirmed in source | INV-UNCOV-011: UNCOVERED |
| 9 | security-path-map | SECURITY_PATH_UNTESTED | V-BOOK-02 updateBookingStatusDAL PII fields returned (customer_phone/customer_email/internal_note) | YES — confirmed in source | INV-UNCOV-012: UNCOVERED |
| 10 | security-path-map | SECURITY_PATH_UNTESTED | V-BOOK-03 listBookingsByCustomerDAL exposes member_actor_id | YES — confirmed in source | INV-UNCOV-013: UNCOVERED |
| 11 | test-traceability-map | PARTIAL_TRACE | assertActorOwnsVportActor.test.js traces feature-layer only; engine path unresolved | YES — confirmed via source | INV-UNCOV-014: dual implementation drift unprotected |
| 12 | security-path-map | SECURITY_PATH_UNTESTED | SPM-S2-001 listQrLinks auth gate no regression test | YES — in actors SECURITY.md NEEDS_REVIEW | INV-UNCOV-018: UNCOVERED |
| 13 | security-path-map | SECURITY_PATH_UNTESTED | SPM-S2-003 VportActorMenuFlyerScreen useVportOwnership behavioral regression absent | YES — in actors SECURITY.md NEEDS_REVIEW | INV-UNCOV-019: UNCOVERED |
| 14 | security-path-map | SECURITY_PATH_UNTESTED | BW-ACTORS-001 hydration engine path vs shim boundary — 6 consumers, 0 tests | YES — confirmed in source | INV-UNCOV-001: UNCOVERED |
| 15 | security-path-map | SECURITY_PATH_UNTESTED | VENOM-2026-05-14-001/002/003 auth surface — no Thor gate run | YES — confirmed no auth Thor gate | INV-UNCOV-002/003/004: UNCOVERED |
| 16 | security-path-map | SECURITY_PATH_UNTESTED | VF-01 friend_ranks not cleaned up after block | YES — block feature 0 tests | INV-UNCOV-005: UNCOVERED |
| 17 | security-path-map | SECURITY_PATH_UNTESTED | block trust boundary dual-enforcement (app-layer + RPC) | YES — block feature 0 tests | INV-UNCOV-006: UNCOVERED |

```
Total signals consumed: 17
Signals upgraded to OBSERVED after source verification: 17
Signals rejected as scanner false positives: 0
Scanner discrepancies flagged: 1 (metadata key-path mismatch on generatedAt — resolved, root key is authoritative)
```

---

## 4. Coverage Inventory

| Feature | Test Files | Test Count | BW Findings | ELEK Findings | BEHAVIOR.md | Coverage Tier |
|---|---|---|---|---|---|---|
| actors | 0 | 0 | BW-ACTORS-001 (DRAFT/OPEN) | — | ABSENT | UNCOVERED |
| auth | 1 | 1 | BW-LOGIN-002 (OPEN/COVERED) | VENOM-2026-05-14-001/002/003 OPEN | ABSENT | PARTIALLY_COVERED |
| block | 0 | 0 | — | VF-01 OPEN | ABSENT | UNCOVERED |
| booking | 1 (+ 2 dashboard booking) | ~14 | BW-SCHED-001/002/003, BW-CAL-002 OPEN | ELEK-001 OPEN | ABSENT | PARTIALLY_COVERED |
| dashboard | 12 | ~12 | BW-SETTINGS-001(partial)/002/003/004 | VENOM-SETTINGS-003/005 | ABSENT | PARTIALLY_COVERED |

Platform-wide BEHAVIOR.md status: ABSENT across all 5 scanned features. All recommendations are UNANCHORED — no BEHAVIOR.md.

```
BEHAVIOR_CONTRACT_ABSENT — all 5 features UNANCHORED.
0 of 5 scanned features have BEHAVIOR.md.
MISSING_BEHAVIOR_CONTRACT raised for: actors, auth, block, booking, dashboard.
Required next: BEHAVIOR.md intake run per feature before next SPIDER-MAN anchored pass.
```

---

## 5. Invariant Coverage

### Platform-Wide Security Invariants (§23)

| Invariant ID | Description | Test Exists | Coverage Status | THOR Impact |
|---|---|---|---|---|
| INV-001 (§23) | Citizen blocks only own actor — ownership gate on blockActor.controller | NO | UNCOVERED | CAUTION |
| INV-002 (§23) | Actor never provisioned under foreign auth.uid() — provision_vcsm_identity assertion | NO | UNCOVERED | BLOCKED |
| INV-003 (§23) | Non-participant cannot cancel another user's booking — cancelBooking void/kind check | NO | UNCOVERED — ELEK-001 OPEN | BLOCKED |
| INV-004 (§23) | VPORT-kind actor never passes ownership gate as user-kind — kind check regression | PARTIAL | PARTIALLY_COVERED — kind check test exists in assertActorOwnsVportActor.controller.test.js | CAUTION |
| INV-005 (§23) | Non-owner never modifies VPORT team roster — team write ownership gate | YES | SECURITY_COVERED — vportTeamInvite.controller.test.js locks ELEK-002 and ELEK-001 stale invite | PASS |
| INV-006 (§23) | Time slot never double-booked — slot race condition | YES | SECURITY_COVERED — insertVportBooking.write.dal.test.js locks 23505 unique_violation | PASS |
| INV-007 (§23) | Post never attributed to unowned actor — vc.posts INSERT ownership | PARTIAL | PARTIALLY_COVERED — BW-PROFILES-001 VERIFIED at controller level; DAL-layer column projection not tested | CAUTION |
| INV-008 (§23) | Identity provisioning never writes platform objects for foreign user | NO | UNCOVERED — BW-IDENTITY-001 CRITICAL | BLOCKED |
| INV-009 (§23) | Portfolio write controllers never proceed when isActorOwner() not configured | PARTIAL | PARTIALLY_COVERED — BW-PORTFOLIO-001 VERIFIED via controller test; safe-failure regression absent | CAUTION |
| INV-010 (§23) | /void route never renders real content without age gate and feature flag | PARTIAL | PARTIALLY_COVERED — BW-VOID-001 VERIFIED; no dedicated route guard regression test | CAUTION |

### Validation Run — Feature-Specific Covered Invariants

| Invariant ID | Invariant | Test Exists | Coverage | THOR Impact |
|---|---|---|---|---|
| INV-001 (run) | assertActorOwnsVportActorController rejects void requester (is_void: true) | YES | SECURITY_COVERED — assertActorOwnsVportActor.controller.test.js | PASS |
| INV-002 (run) | assertActorOwnsVportActorController rejects non-user kind (ELEK-004 fix included) | YES | SECURITY_COVERED — includes ELEK-004 self-match bypass fix | PASS |
| INV-003 (run) | assertActorOwnsVportActorController rejects null/void ownerLink from actor_owners DB | YES | SECURITY_COVERED | PASS |
| INV-004 (run) | BW-LOGIN-002 — #type=recovery hash cannot grant isRecovery=true or reset-password redirect | YES | SECURITY_COVERED — authCallback.controller.test.js (3 cases) | PASS |
| INV-005 (run) | insertVportBookingDAL translates 23505 unique_violation to clean user-facing error (slot collision) | YES | SECURITY_COVERED — insertVportBooking.write.dal.test.js | PASS |
| INV-006 (run) | createVportPublicBookingController kind-gate rejects vport actors before any DB write (BOOK-002) | YES | SECURITY_COVERED — vportPublicBooking.controller.test.js | PASS |
| INV-007 (run) | createVportPublicBookingController forces customer_actor_id from server-side requestActorId (VPD-V-019) | YES | SECURITY_COVERED | PASS |
| INV-008 (run) | vportLeads all 4 entry points pass assertActorOwnsVportActorController before any DAL call | YES | SECURITY_COVERED — vportLeads.controller.test.js | PASS |
| INV-009 (run) | acceptTeamRequestController uses assertActorOwnsVportActorController not String equality (ELEK-002) | YES | SECURITY_COVERED — vportTeamInvite.controller.test.js | PASS |
| INV-010 (run) | acceptBarbershopInviteController resource state guard fires before ownership assertion (ELEK-001) | YES | SECURITY_COVERED — vportTeamInvite.controller.test.js | PASS |
| INV-011 (run) | settingsSaveCoordinator validation — partial/invalid address and phone rejected before DB write | YES | SECURITY_COVERED — settingsCoordinator.controller.test.js | PASS |
| INV-012 (run) | settingsSaveCoordinator idempotency — same payload produces same result (BW-SETTINGS-001 partial) | YES | PARTIALLY_COVERED — settingsSavingGuard.regression.test.js; hook-level double-submit NOT YET WRITTEN | CAUTION |

### Uncovered Invariants (19 total)

| ID | Feature | Finding Reference | Description | Severity |
|---|---|---|---|---|
| INV-UNCOV-001 | actors | BW-ACTORS-001 | No test locks hydration engine path vs stale shim boundary (6 consumers) | HIGH |
| INV-UNCOV-002 | auth | BW-LOGIN-001/003 | BW-LOGIN-001 and BW-LOGIN-003 no dedicated regression tests | HIGH |
| INV-UNCOV-003 | auth | VENOM-2026-05-14-002 | Dev diagnostics screen accessible to all authenticated users — real DB writes — no regression test | HIGH |
| INV-UNCOV-004 | auth | VENOM-2026-05-14-005 | assertActorOwnsVportActor self-check short-circuit bypass — no auth-scoped test | MEDIUM |
| INV-UNCOV-005 | block | VF-01 | friend_ranks not cleaned up after block — no test for block side effects or social graph integrity | HIGH |
| INV-UNCOV-006 | block | — | trust boundary dual-enforcement pattern (app-layer + RPC guard) has no behavioral regression test | HIGH |
| INV-UNCOV-007 | booking | BW-SCHED-001 | VportDashboardScheduleScreen no Final Screen ownership gate regression test | MEDIUM |
| INV-UNCOV-008 | booking | BW-SCHED-002 | useVportOwnerSchedule stale closure — no hook-layer regression test | MEDIUM |
| INV-UNCOV-009 | booking | BW-SCHED-003 | loadDayScheduleController boundary export violation — no test | MEDIUM |
| INV-UNCOV-010 | booking | BW-CAL-002 | VportDashboardCalendarScreen combined screen — no structural gate regression test | MEDIUM |
| INV-UNCOV-011 | booking | ELEK-001 | cancelBooking customer path — is_void actor check missing — no regression test | HIGH |
| INV-UNCOV-012 | booking | V-BOOK-02 | updateBookingStatusDAL PII leakage (customer_phone/customer_email/internal_note) — no test | HIGH |
| INV-UNCOV-013 | booking | V-BOOK-03 | listBookingsByCustomerDAL exposes member_actor_id to customer-facing reads — no test | HIGH |
| INV-UNCOV-014 | booking | IRON-BOOK-WARN3 | dual assertActorOwnsVportActor implementations (feature vs engine) — no parity test | MEDIUM |
| INV-UNCOV-015 | dashboard | BW-SETTINGS-001 | hook-level double-submit prevention requires @testing-library/react — not yet written | MEDIUM |
| INV-UNCOV-016 | dashboard | BW-SETTINGS-002 | flyerBuilder ownership gap — flyerEditor.controller.js writes with RLS-only, no controller gate regression test | MEDIUM |
| INV-UNCOV-017 | actors | SENTRY-BARBER-2026-06-01 | locksmith delete/update service area controllers no ownership assertion — no test | HIGH |
| INV-UNCOV-018 | actors | SPM-S2-001 | listQrLinks auth gate (VENOM V-002 added) — no regression test | HIGH |
| INV-UNCOV-019 | actors | SPM-S2-003 | VportActorMenuFlyerScreen useVportOwnership — behavioral regression test absent | MEDIUM |

---

## 6. Security Coverage (BW / ELEK Finding Linkage)

### BW Coverage Checks

```
BW COVERAGE CHECK
Finding ID:    BW-ACTORS-001
Attack path:   state/actors/ shim layer conceals engines/hydration boundary; 6 consumers use indirection
Test exists:   NO
Test file:     NONE
Coverage tier: UNCOVERED
TESTREQ:       TESTREQ-ACTORS-001 [UNANCHORED — no BEHAVIOR.md]
Risk:          Hydration engine drift undetected; phantom file paths can enter production silently
```

```
BW COVERAGE CHECK
Finding ID:    BW-LOGIN-002
Attack path:   authCallback.controller — hash #type=recovery used as authority for isRecovery=true
Test exists:   YES
Test file:     authCallback.controller.test.js
Coverage tier: SECURITY_COVERED
TESTREQ:       TESTREQ-AUTH-001 [UNANCHORED — no BEHAVIOR.md]
Risk:          COVERED — 3 test cases; does not call dalExchangeCodeForSession on hash-only flow confirmed
```

```
BW COVERAGE CHECK
Finding ID:    BW-SCHED-001
Attack path:   VportDashboardScheduleScreen — no screen-level Final Screen ownership gate; controller-only gate creates regression risk
Test exists:   NO
Test file:     NONE
Coverage tier: UNCOVERED
TESTREQ:       TESTREQ-BOOKING-001 [UNANCHORED — no BEHAVIOR.md]
Risk:          If controller gate is removed in refactor, no test catches regression
```

```
BW COVERAGE CHECK
Finding ID:    BW-SCHED-002
Attack path:   useVportOwnerSchedule — callerActorId missing from useCallback dep array; stale closure identity inversion on actor switch
Test exists:   NO
Test file:     NONE
Coverage tier: UNCOVERED
TESTREQ:       TESTREQ-BOOKING-002 [UNANCHORED — no BEHAVIOR.md]
Risk:          One-line fix known; no hook-level test prevents regression after any hook refactor
```

```
BW COVERAGE CHECK
Finding ID:    BW-SCHED-003
Attack path:   loadDayScheduleController exported from module boundary index.js — architecture boundary violation
Test exists:   NO
Test file:     NONE
Coverage tier: UNCOVERED
TESTREQ:       [UNANCHORED — no BEHAVIOR.md] — no TESTREQ assigned
Risk:          Architecture boundary violation propagates silently; static analysis cannot catch if import pattern spreads
```

```
BW COVERAGE CHECK
Finding ID:    BW-CAL-002
Attack path:   VportDashboardCalendarScreen combined Final+View screen — no structural second gate if individual enabled conditions regress
Test exists:   NO
Test file:     NONE
Coverage tier: UNCOVERED
TESTREQ:       TESTREQ-BOOKING-003 [UNANCHORED — no BEHAVIOR.md]
Risk:          Gate regression on screen split undetectable without behavioral test
```

```
BW COVERAGE CHECK
Finding ID:    BW-SETTINGS-001
Attack path:   useSaveVportSettings onSave — double-tap concurrent controller calls
Test exists:   PARTIAL
Test file:     settingsSavingGuard.regression.test.js (coordinator idempotency only)
Coverage tier: PARTIALLY_COVERED
TESTREQ:       TESTREQ-DASHBOARD-001 [UNANCHORED — no BEHAVIOR.md]
Risk:          Hook-level concurrency guard confirmed in source; @testing-library/react test not yet written — noted as TODO in test file comments
```

```
BW COVERAGE CHECK
Finding ID:    BW-SETTINGS-002
Attack path:   flyerEditor.controller.js — saveFlyerPublicDetails writes to vport.profile_public_details with NO controller ownership gate; RLS-only
Test exists:   NO
Test file:     NONE
Coverage tier: UNCOVERED
TESTREQ:       TESTREQ-DASHBOARD-002 [UNANCHORED — no BEHAVIOR.md]
Risk:          RLS-only posture undocumented and unverified by any contract test; overlapping columns with settings card unprotected
```

```
BW COVERAGE CHECK
Finding ID:    BW-SETTINGS-003
Attack path:   orphaned write DAL settings/profile/dal/vportPublicDetails.write.dal.js — no callers; if activated bypasses coordinator with legacy owner_user_id only
Test exists:   NO
Test file:     NONE
Coverage tier: UNCOVERED
TESTREQ:       [UNANCHORED — no BEHAVIOR.md] — recommend deletion; no test needed if deleted
Risk:          LOW — no callers currently; activation risk only if inadvertently imported
```

```
BW COVERAGE CHECK
Finding ID:    BW-SETTINGS-004
Attack path:   three settings write DALs use legacy owner_user_id as secondary check (restatement of VENOM-SETTINGS-003)
Test exists:   PARTIAL
Test file:     settingsCoordinator.controller.test.js (coordinator path), settingsSavingGuard.regression.test.js
Coverage tier: PARTIALLY_COVERED
TESTREQ:       [UNANCHORED — no BEHAVIOR.md] — INFO only; confirmed non-exploitable
Risk:          INFO — non-exploitable; secondary check restatement pattern documented
```

### ELEK Coverage Checks

```
ELEK COVERAGE CHECK
Finding ID:      ELEK-001 (cancelBooking — no void/kind check on customer cancel path)
Patch status:    OPEN
Source file:     booking/cancel path controller
Regression test: NO
Coverage status: OPEN_FINDING
Risk:            HIGH — customer cancel path can proceed with is_void actor; no regression lock before or after patch
```

```
ELEK COVERAGE CHECK
Finding ID:      ELEK-002 (acceptTeamRequestController — String equality vs controller gate)
Patch status:    APPLIED
Source file:     vport team invite controller
Regression test: YES — vportTeamInvite.controller.test.js
Coverage status: PROTECTED
Risk:            NONE — regression locked
```

```
ELEK COVERAGE CHECK
Finding ID:      ELEK-004 (assertActorOwnsVportActor — self-match bypass)
Patch status:    APPLIED
Source file:     assertActorOwnsVportActor controller
Regression test: YES — assertActorOwnsVportActor.controller.test.js includes ELEK-004 self-match bypass fix
Coverage status: PROTECTED
Risk:            NONE — regression locked
```

---

## 7. Behavior Coverage

```
BEHAVIOR_CONTRACT_ABSENT — all 5 scanned features are UNANCHORED.

Features scanned: actors, auth, block, booking, dashboard
BEHAVIOR.md status for each: MISSING

Per S7 (§BEHAVIOR CONTRACT INTEGRATION):
- actors, auth, block, booking, dashboard are assessed as P1/P2 features
- SPIDER-MAN produces findings with BEHAVIOR_CONTRACT_ABSENT warning header
- All recommendations prefixed: [UNANCHORED — no BEHAVIOR.md]
- MISSING_BEHAVIOR_CONTRACT raised at P1 for all 5 features

Required action: BEHAVIOR.md intake run for each feature before next anchored SPIDER-MAN pass.
```

Behavior Coverage Summary (ABSENT state):
```
Behavior Coverage Summary
=========================
BEHAVIOR.md status: MISSING (all 5 features)
Total BEH IDs in §3 (Happy Paths): 0 — tested: 0
Total BEH IDs in §4 (Failure Paths): 0 — tested: 0
Total BEH IDs in §5 (Security Rules): 0 — tested: 0
Total BEH IDs in §9 (Must Never Happen): 0 — tested: 0
Total AC IDs in §10: 0 — with TESTREQ: 0
Total TESTREQ IDs in §11: 0 — with passing test: 0

UNVERIFIED_INVARIANT (§9): N/A — no BEHAVIOR.md
UNPROTECTED_HAPPY_PATH (§3): N/A — no BEHAVIOR.md
MISSING_BEHAVIOR_CONTRACT: YES — actors, auth, block, booking, dashboard
```

---

## 8. Missing Tests

[UNANCHORED — no BEHAVIOR.md]

| TESTREQ | Feature | BW/ELEK Reference | Invariant | Type | Severity |
|---|---|---|---|---|---|
| TESTREQ-ACTORS-001 | actors | BW-ACTORS-001 | INV-UNCOV-001 | REGRESSION | HIGH |
| TESTREQ-ACTORS-002 | actors | SPM-S2-001 | INV-UNCOV-018 | REGRESSION | HIGH |
| TESTREQ-ACTORS-003 | actors | SPM-S2-003 | INV-UNCOV-019 | HOOK/COMPONENT | MEDIUM |
| TESTREQ-AUTH-001 | auth | BW-LOGIN-001/003 | INV-UNCOV-002 | REGRESSION | HIGH |
| TESTREQ-AUTH-002 | auth | VENOM-2026-05-14-002 | INV-UNCOV-003 | REGRESSION | HIGH |
| TESTREQ-BLOCK-001 | block | VF-01 | INV-UNCOV-005 | REGRESSION | HIGH |
| TESTREQ-BLOCK-002 | block | — | INV-UNCOV-006 | INTEGRATION | HIGH |
| TESTREQ-BOOKING-001 | booking | BW-SCHED-001 | INV-UNCOV-007 | REGRESSION | MEDIUM |
| TESTREQ-BOOKING-002 | booking | BW-SCHED-002 | INV-UNCOV-008 | HOOK | MEDIUM |
| TESTREQ-BOOKING-003 | booking | BW-CAL-002 | INV-UNCOV-010 | REGRESSION | MEDIUM |
| TESTREQ-BOOKING-004 | booking | ELEK-001 | INV-UNCOV-011 | CONTROLLER | HIGH |
| TESTREQ-BOOKING-005 | booking | V-BOOK-02 | INV-UNCOV-012 | DAL | HIGH |
| TESTREQ-BOOKING-006 | booking | V-BOOK-03 | INV-UNCOV-013 | DAL | HIGH |
| TESTREQ-DASHBOARD-001 | dashboard | BW-SETTINGS-001 | INV-UNCOV-015 | HOOK | MEDIUM |
| TESTREQ-DASHBOARD-002 | dashboard | BW-SETTINGS-002 | INV-UNCOV-016 | CONTROLLER | MEDIUM |
| TESTREQ-DASHBOARD-003 | dashboard | SENTRY-BARBER-2026-06-01 | INV-UNCOV-017 | CONTROLLER | HIGH |

Total TESTREQ items: 16

### Detailed TESTREQ Descriptions

**TESTREQ-ACTORS-001** — actors feature has 0 test files; scanner confirms VCSM:actors status=missing; minimum requirement: test for assertActorOwnsVportActor engine import path vs feature shim and hydration boundary through engines/hydration.

**TESTREQ-ACTORS-002** — SPM-S2-001: engines/booking/listQrLinks.controller.js auth gate (all 3 list functions) needs dedicated regression test locking authenticated-only access.

**TESTREQ-ACTORS-003** — SPM-S2-003: VportActorMenuFlyerScreen useVportOwnership hook behavioral test — non-owner and unauthenticated paths must be rejected at screen level.

**TESTREQ-AUTH-001** — auth feature has 1 test file covering only BW-LOGIN-002; BW-LOGIN-001 (raw session tokens in AuthContext) and BW-LOGIN-003 need regression tests.

**TESTREQ-AUTH-002** — VENOM-2026-05-14-002: dev diagnostics write paths (block/unblock, actor_follows UPSERT, friend_ranks) — no regression test guarding dev-only restriction.

**TESTREQ-BLOCK-001** — block feature has 0 test files; scanner confirms VCSM:block status=missing; VF-01 (friend_ranks orphan after block) needs regression test covering block side-effects pipeline.

**TESTREQ-BLOCK-002** — block trust boundary dual-enforcement (app-layer assertingActorId + RPC is_current_vc_actor) needs regression test; no coverage of the RPC path at all.

**TESTREQ-BOOKING-001** — BW-SCHED-001: regression test for VportDashboardScheduleScreen requiring a Final Screen ownership gate (useVportOwnership) to prevent regression if controller gate is removed.

**TESTREQ-BOOKING-002** — BW-SCHED-002: hook-level test for useVportOwnerSchedule confirming callerActorId in useCallback dep array; prevent stale closure identity inversion on actor switch.

**TESTREQ-BOOKING-003** — BW-CAL-002: regression test for VportDashboardCalendarScreen ownership gate not being bypassable via screen-split regression.

**TESTREQ-BOOKING-004** — ELEK-001: cancelBooking customer path must reject is_void actors; no regression test for this cancel path void-check.

**TESTREQ-BOOKING-005** — V-BOOK-02: updateBookingStatusDAL must not return PII fields (customer_phone/customer_email/internal_note) to client; add column projection test.

**TESTREQ-BOOKING-006** — V-BOOK-03: listBookingsByCustomerDAL must not expose member_actor_id to customer-facing reads; add column exclusion test.

**TESTREQ-DASHBOARD-001** — BW-SETTINGS-001 hook-level: useSaveVportSettings must not dispatch second coordinator call while saving=true; requires @testing-library/react; currently noted as TODO in settingsSavingGuard.regression.test.js.

**TESTREQ-DASHBOARD-002** — BW-SETTINGS-002: flyerEditor.controller.js write to vport.profile_public_details must be covered by at least a contract test confirming RLS-only posture is documented and intentional.

**TESTREQ-DASHBOARD-003** — SENTRY-BARBER-2026-06-01: locksmith update/delete service area and delete service detail controllers need ownership gate regression tests (assertActorOwnsVportActorController required).

---

## 9. Regression Risks

| Fix / Finding | Current Protection | Risk | Recommendation |
|---|---|---|---|
| BW-SCHED-001 — Schedule screen no Final Screen gate | Controller-only gate | If controller refactored out, no safety net | TESTREQ-BOOKING-001 |
| BW-SCHED-002 — stale closure dep array | None | Identity inversion on actor switch; one-line fix not locked | TESTREQ-BOOKING-002 |
| BW-SCHED-003 — boundary export in index.js | None | Architecture violation spreads silently | None assigned — architectural finding |
| BW-CAL-002 — combined screen no structural gate | Single combined gate | Screen-split regression undetectable | TESTREQ-BOOKING-003 |
| BW-SETTINGS-001 — hook double-submit | Coordinator idempotency only (settingsSavingGuard) | Hook concurrency gap if coordinator removed | TESTREQ-DASHBOARD-001 |
| BW-SETTINGS-002 — flyerBuilder RLS-only write | None — RLS only | Controller ownership gap undocumented and untested | TESTREQ-DASHBOARD-002 |
| ELEK-001 — cancelBooking void/kind check | None | Customer void actor can cancel any booking | TESTREQ-BOOKING-004 |
| ELEK-002 — team invite String equality | vportTeamInvite.controller.test.js | PROTECTED | No action needed |
| ELEK-004 — self-match bypass | assertActorOwnsVportActor.controller.test.js | PROTECTED | No action needed |
| BW-LOGIN-002 — hash recovery control | authCallback.controller.test.js | PROTECTED — 3 cases locked | No action needed |
| V-BOOK-02 — PII fields in DAL response | None | PII (customer_phone/email/internal_note) returned to client | TESTREQ-BOOKING-005 |
| V-BOOK-03 — member_actor_id in customer reads | None | Internal actor ID exposed to customer-facing API | TESTREQ-BOOKING-006 |
| VF-01 — friend_ranks orphan after block | None (batch4 migration pending) | Social graph integrity broken until migration ships | TESTREQ-BLOCK-001 |
| SENTRY-BARBER-2026-06-01 — locksmith controllers no ownership | None | Any authenticated user can call locksmith update/delete service area | TESTREQ-DASHBOARD-003 |
| SPM-S2-001 — listQrLinks auth gate | None confirmed | Auth gate regression undetected | TESTREQ-ACTORS-002 |
| BW-ACTORS-001 — hydration shim drift | None | 6 consumers on stale shim; engine drift undetectable | TESTREQ-ACTORS-001 |

---

## 10. THOR Impact

| Feature | Gate State | Release Safety | Blockers | SPIDER-MAN Status |
|---|---|---|---|---|
| actors | CONDITIONAL PASS (2026-05-27 partial) | BLOCKED | INV-UNCOV-018 (SPM-S2-001), INV-UNCOV-019 (SPM-S2-003), IRON-BOOK-WARN3 dual impl drift | SPIDER-MAN BLOCK |
| auth | NOT GATED BY THOR | CAUTION | VENOM-2026-05-14-001/002/003 OPEN HIGH, no Thor gate run, 1 test file only | SPIDER-MAN CAUTION |
| block | CONDITIONAL PASS (2026-05-14) | BLOCKED | VF-01 OPEN (batch4 migration pending), 0 test files, dual-enforcement untested | SPIDER-MAN BLOCK |
| booking | CAUTION CLEARED (Thor Gate 3 — 2026-05-27) | CAUTION | ELEK-001 OPEN (cancel path void check), BW-SCHED/CAL unprotected, V-BOOK-02/03 PII P1 | SPIDER-MAN CAUTION |
| dashboard | PASS WITH DEFERRED ITEMS (TICKET-DASH-VENOM-001/BLACKWIDOW-001 2026-06-02) | WATCH | BW-SETTINGS-002 MEDIUM OPEN, hook concurrency test outstanding | SPIDER-MAN WATCH |

### Thor Impact Details

**actors — SPIDER-MAN BLOCK**
Hold on actors-specific release until SPM-S2-001 (TESTREQ-ACTORS-002) and SPM-S2-003 (TESTREQ-ACTORS-003) regression tests are written. BW-ACTORS-001 governance drift is non-blocking but must be tracked. IRON-BOOK-WARN3 dual implementation drift is deferred but unresolved.

**auth — SPIDER-MAN CAUTION**
Multiple HIGH OPEN findings (VENOM-2026-05-14-001/002/003). No Thor gate has been run on auth feature directly. BW-LOGIN-002 is covered; BW-LOGIN-001 and BW-LOGIN-003 are not. Recommend Thor gate before any auth-adjacent release. Dev diagnostics write exposure (TESTREQ-AUTH-002) is unprotected.

**block — SPIDER-MAN BLOCK**
VF-01 requires batch4 migration to deploy. Zero test coverage is a release risk for all block-feature changes. Trust boundary dual-enforcement (TESTREQ-BLOCK-002) has no behavioral test at all.

**booking — SPIDER-MAN CAUTION**
Critical write paths (ownership gate, slot collision, kind-gate, customer_actor_id injection) are secured and locked. ELEK-001 remains open — required before customer cancel path sees production volume. BW-SCHED/CAL findings (TESTREQ-BOOKING-001/002/003) are deferred but have no regression locks. V-BOOK-02/03 PII leakage remains open P1 HIGH.

**dashboard — SPIDER-MAN WATCH**
Settings triple-gate confirmed secure. BW-SETTINGS-002 (flyerBuilder ownership gap) tracked separately. Hook-level double-submit test (TESTREQ-DASHBOARD-001) still needed via @testing-library/react. SENTRY-BARBER-2026-06-01 locksmith controller ownership tests (TESTREQ-DASHBOARD-003) outstanding.

---

## 11. Final SPIDER-MAN Status

```
OVERALL: CAUTION

Per-feature:
  actors   — BLOCKED (0 tests, 2 NEEDS_REVIEW findings with no regression locks)
  auth     — CAUTION (1 test only, multiple HIGH OPEN findings, no Thor gate)
  block    — BLOCKED (0 tests, VF-01 open migration pending, dual-enforcement untested)
  booking  — CAUTION (critical paths secured; ELEK-001 open; BW-SCHED/CAL unprotected; V-BOOK-02/03 PII P1)
  dashboard — WATCH (settings triple-gate confirmed; BW-SETTINGS-002 tracked; hook concurrency test outstanding)

Covered invariants: 12 of 31 assessed (INV-001 through INV-012 from validation run)
Uncovered invariants: 19 (INV-UNCOV-001 through INV-UNCOV-019)
Missing TESTREQ items: 16
BEHAVIOR.md: ABSENT for all 5 features — all recommendations UNANCHORED

Immediate required actions:
  1. TESTREQ-BOOKING-004 — ELEK-001 cancelBooking void/kind check (conditional on booking release)
  2. TESTREQ-BOOKING-005/006 — V-BOOK-02/03 DAL PII leakage (P1 HIGH — open)
  3. TESTREQ-ACTORS-002/003 — SPM-S2-001/003 regression tests (actors release blocker)
  4. TESTREQ-BLOCK-001/002 — block feature minimum coverage before any block changes ship
  5. TESTREQ-DASHBOARD-003 — SENTRY-BARBER-2026-06-01 locksmith controller ownership tests
  6. BEHAVIOR.md intake run for all 5 features — enables anchored SPIDER-MAN re-pass
```

---

*SPIDER-MAN: 2026-06-02 | Ticket: TICKET-SCANNER-SPIDERMAN-INTEGRATION-0001*
*Scanner V1.3 integration validation run — PASS preflight — all 6 maps FRESH (2026-06-03T00:22:42.771Z)*
*Scope: VCSM + ENGINE | Boundary contract: ENFORCED*
