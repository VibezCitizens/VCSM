---
name: vcsm.dashboard.current-status
description: VCSM dashboard current feature status — updated by ARCHITECT V2
metadata:
  type: status
---

# CURRENT STATUS — VCSM / features / dashboard

## ARCHITECT

**Last run:** 2026-06-04
**Scanner version:** 1.1.0
**Architecture state:** EVOLVING
**Independence status:** MOSTLY INDEPENDENT
**Final module status:** MOSTLY COMPLETE
**Spaghetti score:** WATCH
**Top gap (at run time):** BEHAVIOR.md is a placeholder stub — a 258-file module with 37 write surfaces and 12 engine dependencies has no behavior contract, which is the single largest governance gap
**Updated:** BEHAVIOR.md stub CLOSED — ACTIVE as of 2026-06-05 (WOLVERINE Phase 2)
**Recommended handoffs:** LOGAN, IRONMAN, HAWKEYE, SENTRY, KRAVEN

---

## VENOM (Phase 1b — WOLVERINE targeted re-run)

**Last run:** 2026-06-05
**New findings:** 1 HIGH (VEN-CARD-001 — uploadFlyerImageCtrl no ownership check), 1 INFO
**Reclassifications:** VEN-SHELL-001 MEDIUM→LOW; VEN-SHELL-005 MEDIUM(THOR)→LOW
**VEN-SHELL-002 status:** PARTIALLY MITIGATED — scope narrowed to uploadFlyerImageCtrl only
**THOR Gate Contribution:** BLOCKED — VEN-CARD-001 (HIGH) is new THOR blocker
**SECURITY.md:** Updated

---

## IRONMAN

**Last run:** 2026-06-05
**Ownership Clarity:** PARTIAL
**Findings:** 0 CRITICAL, 2 HIGH, 3 MEDIUM, 2 LOW

| Finding | Severity | Description |
|---|---|---|
| OWN-DSH-001 | HIGH | No declared engineering owner for the dashboard feature |
| OWN-DSH-002 | HIGH | Actor Ownership Contract — 3 enforcement layers, no declared authority |
| OWN-DSH-003 | MEDIUM | getActorByIdDAL cross-domain DAL export — booking feature; migration unowned |
| OWN-DSH-004 | MEDIUM | vport.profile_public_details split write ownership (flyer + settings) |
| OWN-DSH-005 | MEDIUM | ~~Feature-level BEHAVIOR.md is a STUB~~ CLOSED — BEHAVIOR.md written ACTIVE (WOLVERINE Phase 2, 2026-06-05) |
| OWN-DSH-006 | LOW | ~~Scanner route-map has 0 dashboard routes~~ CLOSED — HAWKEYE confirmed: factory function pattern, all 14 routes registered (2026-06-05) |
| OWN-DSH-007 | LOW | Duplicate model files in screens/model/ vs vport/model/ — cleanup unowned |

**THOR Gate Contribution:** BLOCKED (OWN-DSH-001 + OWN-DSH-002 reinforce VEN-SHELL-002 blocker)
**OWNERSHIP.md:** CREATED — ZZnotforproduction/APPS/VCSM/features/dashboard/OWNERSHIP.md
**Full report:** ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/IRONMAN/2026-06-05_ironman_dashboard.md

---

## HAWKEYE

**Last run:** 2026-06-05
**Routes mapped:** 33 total (14 protected dashboard + 1 release-flagged editor + 8 public + 10 legacy redirects)
**Scanner gap:** Explained — factory function pattern; all 14 dashboard routes confirmed registered
**OWN-DSH-006:** CLOSED
**Findings:** 0 CRITICAL, 0 HIGH, 1 MEDIUM, 0 LOW, 2 INFO
- HAWKEYE-FINDING-002 (MEDIUM): Flyer editor route outside guard chain; reinforces VEN-CARD-001
**THOR Gate Contribution:** No new blockers. MEDIUM finding compounds existing VEN-CARD-001.
**Full report:** ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/WOLVERINE/hawkeye-route-audit.md

---

## LOGAN

**Last run:** 2026-06-05
**Scope:** Feature-level BEHAVIOR.md
**OWN-DSH-005:** CLOSED — feature BEHAVIOR.md ACTIVE (§1–§14 full contract)
**BEHAVIOR.md:** ACTIVE — ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md
**THOR Gate Contribution:** Governance gap CLOSED (BEHAVIOR.md stub resolved)

---

## SPIDER-MAN

**Last run:** 2026-06-05
**Test files found:** 25
**Sub-module coverage:** 11 of 16 (69%)
**TESTS.md:** CREATED — ZZnotforproduction/APPS/VCSM/features/dashboard/TESTS.md
**P0 gap:** VEN-CARD-001 regression test missing (must accompany fix patch)
**Uncovered sub-modules:** reviews, services, exchange, locksmith, calendar, shell, checkVportOwnership.controller
**THOR Gate Contribution:** No new blockers. VEN-CARD-001 regression gap flags as P0 advisory.

## ARCHITECT
Last Run: 2026-06-05
Scope: dashboard modules 7–16 (flyerBuilder, bookings, gasprices, exchange, vport, settings, calendar, reviews, schedule, services)
Mode: V2 (scanner-assisted)
Scanner Version: 1.1.0
Overall Status: CAUTION

Module Status:
- flyerBuilder: MOSTLY COMPLETE / MOSTLY INDEPENDENT
- bookings: MOSTLY COMPLETE / MOSTLY INDEPENDENT
- gasprices: COMPLETE / INDEPENDENT
- exchange: INCOMPLETE / DEPENDENT — controller-layer violation (AF-001)
- vport (root): MOSTLY COMPLETE / MOSTLY INDEPENDENT
- settings: MOSTLY COMPLETE / MOSTLY INDEPENDENT
- calendar: INCOMPLETE / FRAGMENTED — stub (no implementation)
- reviews: INCOMPLETE / FRAGMENTED — stub (no implementation)
- schedule: MOSTLY COMPLETE / MOSTLY INDEPENDENT
- services: INCOMPLETE / FRAGMENTED — stub (no implementation)

Write Surfaces: 38 (0 RPCs, 0 edge functions)
Source Files Validated: 10
Architecture Findings: 7 (1 HIGH layer violation, 2 HIGH stub modules, 3 INFO)
Security Surfaces Flagged: 4 (HIGH: insertVportBooking actor injection, settings DAL partial auth, exchange mutation unresolved, design DAL schema unknown)
Recommended Next: VENOM → ELEKTRA → BLACKWIDOW

Report: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/ARCHITECT/vcsm.dashboard-modules.architecture.md
Evidence Bundle: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/ARCHITECT/evidence-bundle.json
Security Surface: ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/architect-security-surface-dashboard-modules.json
