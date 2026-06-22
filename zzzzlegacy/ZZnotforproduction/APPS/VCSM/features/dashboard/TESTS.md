---
name: vcsm.dashboard.tests
description: Test coverage record for the VCSM dashboard feature. Produced by SPIDER-MAN (WOLVERINE Phase 3).
metadata:
  type: tests
  command: SPIDER-MAN
  phase: WOLVERINE Phase 3
  ticket: TICKET-DASH-WOLVERINE-001
  date: 2026-06-05
  source-verified: YES
---

# Tests — dashboard feature
**Application:** VCSM
**Test count:** 25 test files discovered
**Sub-module coverage:** 11 of 16 sub-modules have at least 1 test (69%)
**Security path coverage:** PARTIAL — VEN-CARD-001 gap (uploadFlyerImageCtrl) is UNTESTED

---

## Existing Test Inventory

### bookings (3 tests)

| File | Layer | Coverage |
|---|---|---|
| `cards/bookings/__tests__/insertVportBooking.write.dal.test.js` | DAL | INSERT booking write path |
| `cards/bookings/__tests__/updateVportBooking.controller.test.js` | Controller | Update booking state, terminal state guard |
| `cards/bookings/__tests__/vportPublicBooking.controller.test.js` | Controller | Public booking creation |

**Coverage level:** MEDIUM — write path and terminal state guard tested; ownership enforcement at controller boundary not in test names.

### gasprices (6 tests) — most comprehensive coverage

| File | Layer | Coverage |
|---|---|---|
| `cards/gasprices/__tests__/gasErrorMessages.model.test.js` | Model | Error message formatting |
| `cards/gasprices/__tests__/gasprices.index.rule9.test.js` | Contract | SPIDER-MAN rule 9 contract |
| `cards/gasprices/__tests__/gasprices.spiderman.test.js` | SPIDER-MAN | Feature coverage regression |
| `cards/gasprices/__tests__/getVportGasPrices.controller.test.js` | Controller | Read path |
| `cards/gasprices/__tests__/submitFuelPriceSuggestion.controller.test.js` | Controller | Submission flow |
| `cards/gasprices/__tests__/vportFuelPriceSubmissions.read.dal.test.js` | DAL | Read submissions |
| `cards/gasprices/__tests__/vportFuelPriceSubmissions.write.dal.test.js` | DAL | Write submissions |

**Coverage level:** HIGH — model, controller, and DAL tested; submission flow coverage.

### leads (2 tests)

| File | Layer | Coverage |
|---|---|---|
| `cards/leads/__tests__/leads.index.rule9.test.js` | Contract | SPIDER-MAN rule 9 contract |
| `cards/leads/__tests__/vportLeads.controller.test.js` | Controller | Leads controller operations |

**Coverage level:** MEDIUM — controller operations tested; DAL not directly tested.

### portfolio (2 tests)

| File | Layer | Coverage |
|---|---|---|
| `cards/portfolio/__tests__/portfolio.index.rule9.test.js` | Contract | SPIDER-MAN rule 9 contract |
| `cards/portfolio/__tests__/portfolio.spiderman.test.js` | SPIDER-MAN | Feature coverage regression |

**Coverage level:** LOW — regression and contract tests only; no direct controller or DAL test.

### schedule (1 test)

| File | Layer | Coverage |
|---|---|---|
| `cards/schedule/__tests__/scheduleBookingCoordinator.controller.test.js` | Controller | Schedule booking coordinator |

**Coverage level:** LOW — single controller test; availability rule DAL not covered.

### settings (2 tests)

| File | Layer | Coverage |
|---|---|---|
| `cards/settings/__tests__/settingsCoordinator.controller.test.js` | Controller | Settings coordinator save flow |
| `cards/settings/__tests__/settingsSavingGuard.regression.test.js` | Regression | Guard regression coverage |

**Coverage level:** MEDIUM — coordinator and regression tested; ownership chain not verified in test surface visible from filename.

### team (2 tests)

| File | Layer | Coverage |
|---|---|---|
| `cards/team/__tests__/vportTeamAccess.controller.test.js` | Controller | Team access controller |
| `cards/team/__tests__/vportTeamInvite.controller.test.js` | Controller | Team invite controller |

**Coverage level:** MEDIUM — access and invite paths covered; addTeamMemberController and removeTeamMemberController may not be directly tested.

### flyerBuilder (3 tests)

| File | Layer | Coverage |
|---|---|---|
| `flyerBuilder/controller/__tests__/flyerEditor.controller.test.js` | Controller | Flyer editor controller |
| `flyerBuilder/designStudio/controller/__tests__/designStudio.documentOwner.controller.test.js` | Controller | Document owner access |
| `flyerBuilder/designStudio/controller/__tests__/designStudio.shared.controller.test.js` | Controller | Shared controller (`requireOwnerActorAccess`) |

**Coverage level:** MEDIUM — shared ownership gate tested; `uploadFlyerImageCtrl` may be in scope of flyerEditor.controller.test but UNTESTED ownership gap not confirmed covered.

### qrcode (1 test)

| File | Layer | Coverage |
|---|---|---|
| `qrcode/__tests__/qrcode.spiderman.test.js` | SPIDER-MAN | Feature coverage regression |

**Coverage level:** LOW — regression only.

### shared (1 test)

| File | Layer | Coverage |
|---|---|---|
| `shared/__tests__/shared.spiderman.test.js` | SPIDER-MAN | Shared utilities regression |

**Coverage level:** LOW — regression only.

### vportOwnerStats (1 test)

| File | Layer | Coverage |
|---|---|---|
| `vport/controller/__tests__/vportOwnerStats.controller.test.js` | Controller | Owner stats controller |

**Coverage level:** LOW — single controller test.

---

## Coverage Gaps — Sub-Modules with No Tests

| Sub-Module | Security Tier | Risk |
|---|---|---|
| reviews | MEDIUM | Read-only; LOW risk |
| services | MEDIUM | Read-only; LOW risk |
| exchange | HIGH | Write surface; MEDIUM risk |
| locksmith | HIGH | Write surface; MEDIUM risk |
| calendar | HIGH | Write surface (availability rules); MEDIUM risk |
| shell (VportDashboardScreen) | HIGH | Entry point; guard chain not integration-tested; MEDIUM risk |
| checkVportOwnership.controller | HIGH | Core ownership check; MEDIUM risk |

---

## Priority Test Gaps

### P0 — Security regression required (VEN-CARD-001)

| Gap | Finding | Required Test |
|---|---|---|
| `uploadFlyerImageCtrl` no ownership check | VEN-CARD-001 (HIGH THOR BLOCKER) | Regression test: calling `uploadFlyerImageCtrl` without being the VPORT owner must be rejected after the fix is applied |

This test must be written alongside the VEN-CARD-001 fix, not after.

### P1 — Ownership enforcement regressions

| Gap | Finding | Required Test |
|---|---|---|
| Shell guard chain (OwnerOnlyDashboardGuard) | VEN-SHELL-002 | Test that non-owner cannot mount dashboard |
| `checkVportOwnership.controller.js` | Core ownership | Ownership check returns false for non-owner |

### P2 — Write-path coverage for untested cards

| Card | Priority | Required Test Coverage |
|---|---|---|
| exchange | P2 | Write controller + ownership assertion |
| locksmith | P2 | Write controller + ownership assertion |
| calendar | P2 | Availability rule write + ownership assertion |

### P3 — Integration test gaps

| Gap | Priority | Notes |
|---|---|---|
| Full guard chain integration | P3 | ProtectedRoute → ProfileGatedOutlet → BlockedVportGuard → OwnerOnlyDashboardGuard |
| Booking terminal state guard | P3 | Can't move cancelled → confirmed |

---

## Summary

| Metric | Value |
|---|---|
| Total test files | 25 |
| Sub-modules with ≥1 test | 11 of 16 (69%) |
| Sub-modules with no tests | 5 (reviews, services, exchange, locksmith, calendar) + shell + ownership controller |
| P0 missing test | 1 — VEN-CARD-001 regression |
| P1 missing tests | 2 |
| P2 missing tests | 3 (exchange, locksmith, calendar) |
| TESTS.md status | CREATED (this file) |
