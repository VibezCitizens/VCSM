---
name: spiderman-phase3
description: WOLVERINE Phase 3 — SPIDER-MAN test coverage audit for dashboard feature.
metadata:
  type: test-audit
  command: SPIDER-MAN
  phase: WOLVERINE Phase 3
  ticket: TICKET-DASH-WOLVERINE-001
  date: 2026-06-05
---

# SPIDER-MAN — Test Coverage Audit
## WOLVERINE Phase 3 | TICKET-DASH-WOLVERINE-001 | 2026-06-05

**Scope:** Dashboard feature — `apps/VCSM/src/features/dashboard/`
**Method:** Source discovery (`find` for *.test.* and *.spec.*), cross-referenced against sub-module inventory.

---

## Discovery Results

**Files found:** 25 test files
**Sub-module coverage:** 11 of 16 sub-modules have ≥1 test

### Covered sub-modules (11)
bookings (3), gasprices (6), leads (2), portfolio (2), schedule (1), settings (2), team (2), flyerBuilder (3), qrcode (1), shared (1), vportOwnerStats (1)

### Uncovered sub-modules (5 + shell + ownership controller)
reviews, services, exchange, locksmith, calendar, shell (VportDashboardScreen), checkVportOwnership.controller

---

## Critical Gap: VEN-CARD-001 is untested

`uploadFlyerImageCtrl` has no ownership check (VEN-CARD-001 HIGH THOR BLOCKER).
There is no regression test that verifies: "upload is rejected if caller does not own the VPORT."

The fix for VEN-CARD-001 must be accompanied by a regression test at time of patch.
See TESTS.md §Priority Test Gaps.

---

## TESTS.md Created

Full test inventory, coverage gaps, and priority test queue written to:
`ZZnotforproduction/APPS/VCSM/features/dashboard/TESTS.md`

---

## Summary Counts

Total tests: 25
Sub-module coverage: 69% (11/16)
P0 gaps: 1 (VEN-CARD-001 regression)
P1 gaps: 2 (ownership enforcement regressions)
P2 gaps: 3 (exchange, locksmith, calendar)
P3 gaps: 2 (guard chain integration, booking terminal state)
