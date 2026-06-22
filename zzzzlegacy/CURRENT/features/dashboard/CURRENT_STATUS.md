---
# dashboard — CURRENT_STATUS.md
# Last Updated: 2026-06-04
# Updated By: TICKET-DASHBOARD-MODULE-PROMOTION-0002
# Status: CURRENT SOURCE OF TRUTH

## Feature Status

Status: ACTIVE
Security Tier: HIGH
Feature Path: apps/VCSM/src/features/dashboard/

## Active Ticket State

| Ticket | Title | Status | Priority |
|---|---|---|---|
| TICKET-0004 | Dashboard Architecture Contract + Schedule P0 | RESOLVED | P0 |
| TICKET-0009 | Settings coordinator + security backfill | RESOLVED | P1 |
| TICKET-BOOKING-RPC-001 | Booking RLS policy hardening | RESOLVED — RLS LIVE VERIFIED | P0 |
| TICKET-DASH-SENTRY-001 | Settings card post-execution compliance review | RESOLVED / PARTIAL | P1 |
| TICKET-DASH-DOC-SYNC-001 | Settings governance doc sync | RESOLVED | P1 |
| TICKET-DASH-VENOM-001 | VENOM full pass — settings card | RESOLVED — PASS WITH DEFERRED ITEMS | P1 |
| TICKET-DASH-VENOM-DOC-SYNC-001 | VENOM results governance sync | RESOLVED | P1 |
| TICKET-DASH-BOOKINGS-RULE9 | bookings/index.js Rule 9 violation fix | RESOLVED | P1 |
| TICKET-DASH-BLACKWIDOW-001 | BLACKWIDOW settings adversarial pass | RESOLVED — CAUTION | P1 |
| TICKET-DASH-BLACKWIDOW-002 | BLACKWIDOW findings governance sync (inline) | RESOLVED | P1 |
| TICKET-DASH-BLACKWIDOW-DOC-SYNC-001 | BLACKWIDOW formal doc sync — TESTS.md + full DEFERRED | RESOLVED | P1 |
| TICKET-DASH-vportOwnerStats-ELEK003-PATCH-001 | vportOwnerStats ownership gate patch | RESOLVED — SOURCE + TEST PASS | P1 |
| TICKET-DASH-flyerBuilder-ELEK001-PATCH-001 | flyerBuilder profile binding patch | RESOLVED — SOURCE + TEST PASS | P1 |
| TICKET-DASH-designStudio-ELEK002-PATCH-001 | designStudio document ownership binding patch | RESOLVED — SOURCE + TEST PASS + RLS VERIFIED | P1 |
| TICKET-DASH-PORTFOLIO-COMPLETE-001 | portfolio architecture/test/sign-off completion | RESOLVED — SOURCE + TEST PASS | P1 |
| TICKET-DASH-GAS-SOURCE-COMPLETE-001 | gas source architecture/test completion | RESOLVED — SOURCE + TEST PASS; DB RLS VERIFY PENDING | P1 |
| TICKET-FLYER-VENOM-001 | FlyerBuilder VENOM pass (BW-SETTINGS-002) | RECOMMENDED NEXT | P2 |
| TICKET-DASHBOARD-MODULE-PROMOTION-0002 | Promote calendar/exchange/locksmith/reviews/services to dashboard modules | COMPLETE | P1 |

## Dashboard Module Count

Updated module count: **17 dashboard modules**.

| Tier | Modules | Count |
|---|---|---:|
| Tier 1 — Security Critical | flyerBuilder, designStudio, vportOwnerStats, bookings, team, settings, leads | 7 |
| Tier 2 — Operational | portfolio, schedule, gas prices | 3 |
| Tier 3 — Newly Promoted Modules | calendar, exchange, locksmith, reviews, services | 5 |
| Tier 4 — Read Only | qrcode, shared | 2 |

Promoted modules are first-class dashboard modules because each has adapter-backed workflow, ownership gating, user workflow, or delegated mutation behavior.

## Schedule Card — Compliance

- DEFER-013: schedule imported booking internal controllers — **RESOLVED 2026-06-02**
- Coordinator pattern: scheduleBookingCoordinator.controller.js — ACTIVE
- Grep verification: cards/bookings/controller imports in schedule = 0 matches
- Delegation tests: 3 passing

## Remaining P1 Debt

### Hook Split (deferred from TICKET-0004)
Split useVportOwnerSchedule.js into:
- useScheduleData.js
- useScheduleModals.js
- useScheduleBookingOps.js

Reason deferred: coordinator fix was the P0 boundary violation. Hook split carries refactor risk.
Blocked by: none — safe to open as next P1 ticket after SETTINGS-ARCH-001.

## Release Gate State

| Gate | Status | Command |
|---|---|---|
| ARCHITECT contract | CREATED | TICKET-0004 |
| Schedule boundary | COMPLIANT | Coordinator verified (TICKET-0004) |
| Settings boundary | VENOM PASS WITH DEFERRED ITEMS / BLACKWIDOW CAUTION | TICKET-DASH-VENOM-001 + TICKET-DASH-BLACKWIDOW-001 |
| Booking RLS policy hardening | RESOLVED — LIVE VERIFIED | TICKET-BOOKING-RPC-001 |
| Bookings public index Rule 9 | COMPLIANT | TICKET-DASH-BOOKINGS-RULE9 |
| **FULL DASHBOARD AUDIT** | **THOR BLOCKED** | **TICKET-DASHBOARD-CONTINUATION-0001** |
| ELEK-2026-06-04-001 (flyer profileId) | PATCHED — focused regression test passing | TICKET-DASH-flyerBuilder-ELEK001-PATCH-001 |
| ELEK-2026-06-04-002 (design documentId) | PATCHED — live RLS verified; focused regression tests passing | TICKET-DASH-designStudio-ELEK002-PATCH-001 |
| ELEK-2026-06-04-003 (quickStats ownership) | PATCHED — focused regression test passing | TICKET-DASH-vportOwnerStats-ELEK003-PATCH-001 |
| BEHAVIOR.md | PARTIAL — qrcode/shared/vportOwnerStats/portfolio APPROVED; remaining module contracts DRAFT/REVIEWED | TICKET-BEHAVIOR-APPROVAL required |
| Module promotion | COMPLETE | TICKET-DASHBOARD-MODULE-PROMOTION-0002 — 5 adapter-backed cards promoted |
| Tier 4 qrcode/shared | COMPLETE — THOR CLEAR, BEHAVIOR APPROVED, SPIDER-MAN PASS | TICKET-DASHBOARD-TIER4-SPIDERMAN-COMPLETE-001 |
| vportOwnerStats | COMPLETE — THOR CLEAR, BEHAVIOR APPROVED, SPIDER-MAN PASS | TICKET-DASH-vportOwnerStats-COMPLETE-001 |
| portfolio | COMPLETE — THOR CLEAR, BEHAVIOR APPROVED, SPIDER-MAN PASS | TICKET-DASH-PORTFOLIO-COMPLETE-001 |

## THOR Gate — 2026-06-04
FINAL DECISION: BLOCKED
Blocking reasons:
1. SPIDER-MAN regression coverage missing for module behavior contracts
2. BEHAVIOR.md contracts still require approval/sign-off before THOR
Caution items: TESTS.md stale; OWNERSHIP.md partial
Additional caution items: calendar, exchange, locksmith, reviews, and services are now governed dashboard modules with DRAFT BEHAVIOR.md contracts but still lack SPIDER-MAN coverage.
Tier 4 update: qrcode/shared triad rerun complete; qrcode profile-header raw actorId QR fallback patched; qrcode/shared BEHAVIOR contracts APPROVED; focused SPIDER-MAN tests pass (13 tests).
vportOwnerStats update: ELEK-2026-06-04-003 / VEN-DASH-001 / BLOCK-DASH-005 patched; controller now requires callerActorId and asserts actor_owners before quick-stat reads. BEHAVIOR is APPROVED, THOR is CLEAR, and 8 focused SPIDER-MAN/controller tests pass.
portfolio update: RULE9-DASH-PORTFOLIO-001, PORTFOLIO-ARCH-001/002, PORTFOLIO-ADAPTER-001, and DEFER-010/011 are patched; `portfolio/index.js` no longer exports DAL/controller files, submit/upload hooks now live at card-level `hooks/`, dashboard trace diagnostics use `features/portfolio/adapters/portfolioTrace.adapter.js`, and media asset backfill is profile-scoped. BEHAVIOR is APPROVED, THOR is CLEAR, and 8 focused SPIDER-MAN/Rule 9 tests pass.
flyerBuilder update: ELEK-2026-06-04-001 / VEN-DASH-002 patched; controller now derives profileId from verified ownerActorId before saving public details.
bookings update: ELEK-2026-06-04-004 patched; `updateVportBookingDAL` now requires `profileId` and scopes updates by both booking id and profile id. `BOOKING-RPC-001` RLS hardening is live-verified: broad authenticated table-level UPDATE is gone, authenticated UPDATE is column-limited, and narrowed booking insert/update policies are present. The applied design uses RLS policies and column-level grants only; no SECURITY DEFINER functions or RPCs.
leads update: LEADS-FASTCOUNT-001 and RULE9-DASH-LEADS-001 patched; `fastCountNewVportLeadsController` now requires `actorId`, `callerActorId`, and cached `profileId`, then asserts VPORT ownership before count DAL access. `leads/index.js` no longer exports DAL or controller files and `leads.index.rule9.test.js` covers the public barrel boundary. Leads remains CAUTION for public lead RPC/Edge governance and broader screen/hook SPIDER-MAN coverage.
team update: TEAM-DAL-SCOPE-001 patched; team member role/status/delete DAL calls now receive `profileId`, invite accept/decline paths scope by `memberActorId` or `profileId`, and focused team access/invite tests pass. Team remains CAUTION for `vport.resources` RLS verification and broader SPIDER-MAN coverage.
gas update: RULE9-DASH-GAS-001, DEFER-004, DEFER-006, GAS-CACHE-001, and GAS-ARCH-001 source gaps are patched. `gasprices/index.js` no longer exports DAL files, owner screen is split into `VportDashboardGasScreen.jsx` + `VportDashboardGasView.jsx`, submit owner/citizen paths are split into focused controllers, and cache invalidation is centralized in `FuelPriceCacheService`. The gas test folder passes with 57 tests. Gas remains CAUTION only for live DB RLS/check-constraint verification (`GAS-RLS-001`).
designStudio update: ELEK-2026-06-04-002 / VEN-DASH-003 patched; designStudio page and export controllers now require `requireDesignDocumentOwnerAccess({ ownerActorId, documentId })` before document-scoped reads/writes. Live SQL verified RLS enabled and owner-scoped on all `vc.design_*` tables, with zero rows, zero orphans, and no SQL functions touching design tables. Focused designStudio regression tests pass.
Next THOR: after BEHAVIOR.md contracts are approved/sign-off complete and SPIDER-MAN regression tests are added

## Last Command Runs

| Command | Feature Area | Date | Result |
|---|---|---|---|
| WOLVERINE | dashboard/schedule | 2026-06-02 | TICKET-0004 RESOLVED |
| ARCHITECT | dashboard | 2026-06-02 | Contract created |
| WOLVERINE | dashboard/settings | 2026-06-02 | TICKET-0009 RESOLVED — settingsCoordinator created |
| DR.STRANGE | dashboard | 2026-06-02 | Full reality review — 65% readiness — bookings Rule 9 surfaced |
| SENTRY | dashboard/settings | 2026-06-02 | TICKET-DASH-SENTRY-001 PARTIAL — source compliant, docs stale |
| WOLVERINE | dashboard/governance | 2026-06-02 | TICKET-DASH-DOC-SYNC-001 — 7 files synced |
| VENOM | dashboard/settings | 2026-06-02 | TICKET-DASH-VENOM-001 — PASS WITH DEFERRED ITEMS; zero exploitable paths; VENOM-SETTINGS-004 resolved in source |
| WOLVERINE | dashboard/governance | 2026-06-02 | TICKET-DASH-VENOM-DOC-SYNC-001 — VENOM results synced to 5 governance files |
| BLACKWIDOW | dashboard/settings | 2026-06-02 | TICKET-DASH-BLACKWIDOW-001 — CAUTION; zero exploitable paths; BW-SETTINGS-002 cross-feature concern identified |
| WOLVERINE | dashboard/governance | 2026-06-02 | TICKET-DASH-BLACKWIDOW-002 — BLACKWIDOW findings synced to governance docs |
| WOLVERINE | dashboard/governance | 2026-06-02 | TICKET-DASH-BLACKWIDOW-DOC-SYNC-001 — TESTS.md BLACKWIDOW section added; DEFER-DASH-008/009 added; full formal sync |
| SENTRY | dashboard/bookings | 2026-06-02 | TICKET-DASH-BOOKINGS-RULE9 — PASS; no write DAL exported from bookings public index; production DAL callers are controller-scoped |
| ARCHITECT/VENOM/ELEKTRA/BLACKWIDOW | dashboard/promoted modules | 2026-06-04 | TICKET-DASHBOARD-MODULE-PROMOTION-0002 — calendar/exchange/locksmith/reviews/services promoted; all CAUTION pending BEHAVIOR.md + SPIDER-MAN |
| SPIDER-MAN | dashboard/qrcode + dashboard/shared | 2026-06-04 | TICKET-DASHBOARD-TIER4-SPIDERMAN-COMPLETE-001 — 13 focused Tier 4 tests passing; qrcode/shared fully complete |
| SPIDER-MAN | dashboard/vportOwnerStats | 2026-06-04 | TICKET-DASH-vportOwnerStats-COMPLETE-001 — 8 focused controller/static tests passing; vportOwnerStats fully complete |
| SPIDER-MAN | dashboard/portfolio | 2026-06-04 | TICKET-DASH-PORTFOLIO-COMPLETE-001 — 8 focused Rule 9/architecture/owner-scope tests passing; portfolio fully complete |
| SPIDER-MAN | dashboard/gas prices | 2026-06-04 | TICKET-DASH-GAS-SOURCE-COMPLETE-001 — 57 focused gas tests passing; source blockers complete; DB RLS verification still pending |

## TICKET-0009 — SETTINGS-ARCH-001 + Security Backfill (2026-06-02)

| Item | Status |
|---|---|
| settingsCoordinator.controller.js created | ✓ DONE |
| useSaveVportSettings.js validation moved to coordinator | ✓ DONE |
| Controller export removed from settings public index | ✓ DONE |
| VENOM-SETTINGS-001 resolved | ✓ DONE |
| ELEK-001 verified resolved | ✓ DONE |
| SECURITY.md created from evidence | ✓ DONE |
| SETTINGS-RISK-001 (was already resolved pre-ticket) | ✓ CONFIRMED |
| Full VENOM post-implementation pass | ✓ DONE — TICKET-DASH-VENOM-001 (PASS WITH DEFERRED ITEMS) |
| SENTRY post-execution review | ✓ DONE — TICKET-DASH-SENTRY-001 (PARTIAL) |

## TICKET-DASH-SENTRY-001 — Settings Card Post-Execution Compliance Review (2026-06-02)

| Item | Status |
|---|---|
| Rule 6 — useSaveVportSettings no longer owns business logic | ✓ PASS |
| Rule 9 — settings/index.js exports no controller or DAL | ✓ PASS |
| Rule 4/14 — Final/View screen split implemented | ✓ PASS |
| settingsCoordinator receives callerActorId | ✓ PASS |
| saveVportPublicDetailsByActorIdController enforces ownership gate | ✓ PASS |
| ctrlSetVportBusinessCardPublishState ownership gate (ELEK-001) | ✓ CONFIRMED RESOLVED |
| ctrlSetVportDirectoryVisible ownership gate (VENOM-SETTINGS-003 check) | ✓ CONTROLLER GATE STRONG |
| VENOM-SETTINGS-003 legacy DAL secondary check | OPEN / LOW risk — CARNAGE target |
| Full VENOM post-implementation pass | ✓ DONE — TICKET-DASH-VENOM-001 (PASS WITH DEFERRED ITEMS) |
| BLACKWIDOW adversarial pass | ✓ DONE — TICKET-DASH-BLACKWIDOW-001 (CAUTION) |
| settingsCoordinator.controller.js tests | EXISTS / FAILING — 3 validation assertions currently fail; SPIDER-MAN required |
| Documentation drift identified | 7 files — resolved by TICKET-DASH-DOC-SYNC-001 |
| bookings/index.js Rule 9 violation | ✓ RESOLVED — TICKET-DASH-BOOKINGS-RULE9; `index.js` exports no DAL |

---

## TICKET-DASH-VENOM-001 — VENOM Settings Card Post-Implementation Audit (2026-06-02)

| Item | Status |
|---|---|
| Triple-gate on profile_public_details write | ✓ CONFIRMED — controller + DAL legacy + DB RLS |
| Double-gate on directory visibility write | ✓ CONFIRMED — controller + DAL legacy |
| Double-gate on business card settings write | ✓ CONFIRMED — controller + DAL legacy |
| SECURITY DEFINER RPC on publish state write | ✓ CONFIRMED — strongest gate |
| assertActorOwnsVportActorController kind check before self-shortcut | ✓ CONFIRMED (ELEK-004 fix verified) |
| settings/index.js exposes no DALs or controllers | ✓ CONFIRMED |
| All attack paths blocked (10 tested) | ✓ ALL BLOCKED |
| VENOM-SETTINGS-003 — legacy DAL secondary check | OPEN / LOW / CARNAGE target |
| VENOM-SETTINGS-004 — listMyVportsDAL legacy pattern | RESOLVED IN SOURCE — canonical actor_owners confirmed |
| VENOM-SETTINGS-005 — import path inconsistency (INFO) | RESOLVED — controller imports use booking adapter boundary |
| BLACKWIDOW settings adversarial pass | ✓ DONE — TICKET-DASH-BLACKWIDOW-001 (CAUTION — see BW findings) |
| settingsCoordinator.controller.js tests | EXISTS / FAILING — 3 validation assertions currently fail; SPIDER-MAN required |

## TICKET-DASH-BLACKWIDOW-001 — Settings Card Adversarial Runtime Verification (2026-06-02)

| Item | Status |
|---|---|
| Session edge cases (8 tested: JWT, stale cache, actor switch, TOCTOU, null races) | ✓ ALL BLOCKED |
| Concurrent request attacks (5 tested: double-submit, toggle spam, simultaneous ops) | ✓ ALL SAFE — double-submit UX-only (BW-SETTINGS-001) |
| UI gate circumvention — can controller block without React state? | ✓ PASS — trust model is server-side |
| Controller chain attacks (7 tested: forged IDs, direct invocation, adapter misuse) | ✓ ALL BLOCKED |
| Cross-feature attacks — can other features write settings surfaces? | CAUTION — see BW-SETTINGS-002 |
| BW-SETTINGS-001 — double-submit no saving guard | OPEN / INFO — UX only |
| BW-SETTINGS-002 — flyerBuilder writes to profile_public_details, no controller gate | OPEN / MEDIUM — flyer builder scope |
| BW-SETTINGS-003 — dead-code write DAL in settings/profile/dal/ | RESOLVED — dead DAL deleted; dev diagnostics write probe removed |
| BW-SETTINGS-004 — legacy secondary checks (restatement of VENOM-SETTINGS-003) | OPEN / INFO — non-exploitable |
| Overall verdict | CAUTION — settings trust chain secure; cross-feature concern tracked |

---

## DR. STRANGE Summary

DR. STRANGE should report:
- Feature: ACTIVE
- TICKET-0004: RESOLVED
- TICKET-0009: RESOLVED
- TICKET-DASH-SENTRY-001: RESOLVED / PARTIAL
- TICKET-DASH-DOC-SYNC-001: RESOLVED
- TICKET-DASH-VENOM-001: RESOLVED — PASS WITH DEFERRED ITEMS
- TICKET-DASH-VENOM-DOC-SYNC-001: RESOLVED
- TICKET-DASH-BLACKWIDOW-001: RESOLVED — CAUTION
- TICKET-DASH-BLACKWIDOW-002: RESOLVED
- TICKET-DASHBOARD-ARCHITECT-0001: COMPLETE / PROPAGATED
- Security posture: THOR_BLOCKED — dashboard triad is present, qrcode/shared/vportOwnerStats/portfolio are fully complete, and flyerBuilder parent saves, designStudio document ownership, bookings update scope/RLS hardening, leads fast count, and team DAL write scope are patched; broader SPIDER-MAN and governance sign-off still block release.
- Settings card security: CAUTION — trust chain confirmed secure; adapter import cleanup and orphaned DAL removal are patched; legacy owner_user_id debt remains tracked, with flyerBuilder cross-feature concern still separate scope.
- Architecture: PARTIAL — settings + schedule compliant; bookings, gasprices, portfolio, and leads Rule 9 RESOLVED; portfolio hook placement/trace adapter boundary RESOLVED; gas Final/View split, submit path split, and cache service RESOLVED.
- Next recommended: SPIDER-MAN regression coverage for bookings/schedule behavior after RLS hardening, with explicit coverage for the direct reschedule limitation.
- CARNAGE note: `vc.design_*` RLS was live-verified 2026-06-04; no design RLS migration is needed from current evidence.
- Remaining debt: hook split (DEFER-DASH-001), VENOM-SETTINGS-003/BW-SETTINGS-004 legacy `owner_user_id` CARNAGE cleanup, booking reschedule source/product follow-up under the RLS-only design, public lead RPC/Edge governance, and SPIDER-MAN coverage.
- Promoted module debt: calendar/exchange/locksmith/reviews/services have DRAFT BEHAVIOR.md contracts but still need SPIDER-MAN coverage; adapter-backed authorization must remain delegated and source-verified on future changes.

## ARCHITECT Propagation Sync — 2026-06-02

Completed audit: `TICKET-DASHBOARD-ARCHITECT-0001`
Final verdict: `ARCHITECT_DASHBOARD_COMPLETE`

Propagated findings:
- Latest source inventory: 242 files, 26 controllers, 34 DALs, 27 hooks, 23 models, 79 components, 14 screens, 2 adapters, 12 tests.
- `gasprices/index.js`, `portfolio/index.js`, and `leads/index.js` Rule 9 are resolved in current source; the tracked dashboard public index export lane is now closed for these modules.
- Portfolio card-level hook placement and trace adapter boundary are resolved in current source; `portfolio.spiderman.test.js` covers the boundaries.
- Gas source-side architecture gaps are resolved in current source; `gasprices.spiderman.test.js` covers Final/View split and cache service ownership.
- `useVportOwnerSchedule.js` still mixes data, modal, and booking operations; `DEFER-DASH-001` remains open.
- Flyer builder profile binding claim is resolved in current source because `saveFlyerPublicDetailsCtrl` now derives profileId from verified `ownerActorId`.
- Runtime feature index must be refreshed because it still reports older source counts.
---
