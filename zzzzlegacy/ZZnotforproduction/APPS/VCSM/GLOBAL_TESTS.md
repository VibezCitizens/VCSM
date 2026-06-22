---
name: vcsm.global-tests
description: Global test coverage status rollup — built from feature TESTS.md sub-documents
metadata:
  type: global-tests
  generated-by: DR. STRANGE
  ticket: TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001
  date: 2026-06-05
  source: Feature TESTS.md files (all 37 features); SPIDER-MAN reports
---

# GLOBAL TESTS — VCSM Platform

**Generated:** 2026-06-05
**Source:** Feature TESTS.md sub-documents. No source code read directly.
**Command:** DR. STRANGE — TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001

---

## Summary

| Metric | Count |
|---|---|
| Features with TESTS.md | 1 / 37 |
| Features without TESTS.md | 36 / 37 |
| Features with SPIDER-MAN run | 1 / 37 |
| Features SPIDER-MAN eligible (BEHAVIOR.md ACTIVE) | 13 / 37 |
| Features with zero test coverage (per ARCHITECT) | 36 / 37 |
| Dashboard module TESTS.md present | 1 / 19 (vportOwnerStats) |

---

## Feature Test Status

### TESTS.md Present (1)

#### dashboard
**TESTS.md:** ACTIVE — Created by SPIDER-MAN (2026-06-05)
**Sub-doc:** [features/dashboard/TESTS.md](features/dashboard/TESTS.md)

| Metric | Value |
|---|---|
| Test files found | 25 |
| Sub-module coverage | 11 / 16 (69%) |
| SPIDER-MAN run | 2026-06-05 |
| P0 gap | VEN-CARD-001 regression test MISSING (must accompany fix patch) |
| Uncovered modules | reviews, services, exchange, locksmith, calendar, shell, checkVportOwnership.controller |
| THOR contribution | No new blockers; VEN-CARD-001 regression gap is P0 advisory |

---

### TESTS.md Missing (36)

| Feature | ARCHITECT Note on Tests | Priority for SPIDER-MAN |
|---|---|---|
| actors | UNKNOWN | P2 |
| ads | UNKNOWN | P2 |
| app | UNKNOWN | P2 |
| auth | 1 file / 56 source files (per ARCHITECT) | P0 |
| block | Zero test coverage | P1 |
| booking | Zero test coverage (CRITICAL security) | P0 |
| chat | UNKNOWN | P2 |
| debug | UNKNOWN | P3 |
| explore | UNKNOWN | P2 |
| feed | UNKNOWN | P2 |
| hydration | UNKNOWN | P2 |
| identity | Zero test coverage (per ARCHITECT) | P0 |
| invite | UNKNOWN | P2 |
| join | UNKNOWN | P3 |
| legal | UNKNOWN | P1 |
| media | UNKNOWN | P2 |
| moderation | Zero test coverage (CRITICAL security) | P0 |
| notifications | Zero test coverage (CRITICAL security) | P0 |
| onboarding | UNKNOWN (CRITICAL security) | P0 |
| portfolio | UNKNOWN | P2 |
| post | UNKNOWN | P2 |
| professional | UNKNOWN | P2 |
| profiles | UNKNOWN (CRITICAL security) | P0 |
| public | Zero test coverage (per ARCHITECT) | P1 |
| reviews | UNKNOWN | P2 |
| services | UNKNOWN (CRITICAL security) | P0 |
| settings | UNKNOWN | P1 |
| shared | UNKNOWN | P2 |
| social | UNKNOWN | P2 |
| state | UNKNOWN | P1 |
| styles | UNKNOWN | P3 |
| ui | UNKNOWN | P3 |
| upload | UNKNOWN | P2 |
| vgrid | UNKNOWN (scaffold only) | BLOCKED |
| void | UNKNOWN | BLOCKED (not releasable) |
| vport | UNKNOWN | P1 |

---

## SPIDER-MAN Eligibility Map

| Feature | BEHAVIOR.md Active | SPIDER-MAN Eligible | Notes |
|---|---|---|---|
| booking | YES | YES | Not yet run — eligible as of 2026-06-05 (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) |
| dashboard | YES | YES | Run 2026-06-05; TESTS.md created |
| identity | YES | YES | Not yet run — eligible as of 2026-06-05 |
| moderation | YES | YES | Not yet run — eligible as of 2026-06-05 |
| notifications | YES | YES | Not yet run — eligible as of 2026-06-05 |
| onboarding | YES | YES | Not yet run — eligible as of 2026-06-05 |
| profiles | YES | YES | Not yet run — eligible as of 2026-06-05 |
| services | YES | YES | Not yet run — eligible as of 2026-06-05 |
| settings | YES | YES | Not yet run — eligible as of 2026-06-05 |
| social | YES | YES | Not yet run — eligible as of 2026-06-05 |
| state | YES | YES | Not yet run — eligible as of 2026-06-05 |
| upload | YES | YES | Not yet run — eligible as of 2026-06-05 |
| vport | YES | YES | Not yet run — eligible as of 2026-06-05 |
| All other 24 | NO | NO | Awaiting BEHAVIOR.md authorship |

---

## TESTREQ Gaps

The following gap categories are sourced from ARCHITECT CURRENT_STATUS.md notes. Direct source code analysis not performed.

### P0 — Must be addressed before THOR gate can clear

| Feature | Gap | Source |
|---|---|---|
| booking | Zero coverage on CRITICAL security paths | ARCHITECT note |
| auth | 1 test file for 56 source files | ARCHITECT note |
| identity | Zero test coverage on auth-critical bootstrap | ARCHITECT note |
| moderation | Zero test coverage on security-critical feature | ARCHITECT note |
| notifications | Zero test coverage on 43-file cross-platform module | ARCHITECT note |
| profiles | Implied zero (374 files, all governance blocked) | ARCHITECT note |
| services | CRITICAL security; coverage unknown | ARCHITECT note |
| onboarding | CRITICAL security; coverage unknown | ARCHITECT note |
| dashboard | VEN-CARD-001 regression test MISSING | SPIDER-MAN report |

### P1 — Required for governance completeness

| Feature | Gap | Source |
|---|---|---|
| block | Zero test coverage | ARCHITECT note |
| legal | Legally sensitive consent flows untested | ARCHITECT note |
| public | Zero test coverage on anonymous lead path | ARCHITECT note |
| settings | Irreversible write surfaces untested | ARCHITECT note |
| social | Follow state machine untested | ARCHITECT note |
| state | Boot-time path untested | ARCHITECT note |
| vport | All governance blocked by behavior gap | ARCHITECT note |

---

## Dashboard Module Tests

| Module | TESTS.md | Notes |
|---|---|---|
| vportOwnerStats | YES | Only module with dedicated TESTS.md |
| All other 18 modules | NO | No module-level TESTS.md authored |

---

## Path to Platform Test Coverage

1. BEHAVIOR.md must be ACTIVE for each feature (prerequisite for SPIDER-MAN)
2. SPIDER-MAN runs per feature and generates TESTS.md
3. TESTREQ items from SPIDER-MAN trigger regression coverage work
4. TESTS.md matures from MISSING → STUB → PARTIAL → ACTIVE as tests are added

Current state: 24/37 features blocked on step 1 (BEHAVIOR.md PLACEHOLDER). 12 additional features became eligible 2026-06-05.
