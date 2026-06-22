---
name: vcsm.global-index
description: Global index of all VCSM features and modules — built from sub-document consumption by DR. STRANGE
metadata:
  type: global-index
  generated-by: DR. STRANGE
  ticket: TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001
  date: 2026-06-05
  source-root: ZZnotforproduction/APPS/VCSM/features/
---

# GLOBAL INDEX — VCSM Platform

**Generated:** 2026-06-05
**Source:** Feature and module sub-documents only. No source code read directly.
**Command:** DR. STRANGE — TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001

---

## Summary Counts

| Metric | Count |
|---|---|
| Total features | 37 |
| Total modules | 98 |
| Features with ACTIVE feature-level BEHAVIOR.md | 13 / 37 |
| Features with PLACEHOLDER feature-level BEHAVIOR.md | 24 / 37 |
| Active modules (dashboard module-level BEHAVIOR ACTIVE) | 5 (dashboard sub-modules only) |
| Partial modules (dashboard module-level BEHAVIOR PARTIAL/DRAFT) | 13 / 19 |
| Placeholder / no behavior contract (non-dashboard modules) | 76 |
| Truly missing BEHAVIOR.md (module-level) | 3 |
| Features with TESTS.md | 1 (dashboard) |
| Features THOR-blocked | 32 |
| Features THOR-clear | 5 (ads, app, join, shared, ui) |

---

## Feature Index

| Feature | Modules | Arch State | Behavior Status | Security Highest | TESTS.md | Docs Coverage | THOR |
|---|---|---|---|---|---|---|---|
| actors | 1 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| ads | 3 | EVOLVING | PLACEHOLDER | HIGH | NO | PARTIAL | CLEAR (conditional) |
| app | 4 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | CLEAR (conditional) |
| auth | 5 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| block | 2 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| booking | 6 | EVOLVING | ACTIVE | CRITICAL | NO | PARTIAL | BLOCKED |
| chat | 5 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| dashboard | 19 | EVOLVING | ACTIVE | HIGH | YES | PARTIAL | BLOCKED |
| debug | 1 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| explore | 2 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| feed | 2 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| hydration | 1 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| identity | 2 | STABLE | ACTIVE | HIGH | NO | PARTIAL | BLOCKED |
| invite | 1 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| join | 1 | STABLE | PLACEHOLDER | MEDIUM | NO | PARTIAL | CLEAR |
| legal | 4 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| media | 1 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| moderation | 3 | STABLE | ACTIVE | CRITICAL | NO | PARTIAL | BLOCKED |
| notifications | 3 | EVOLVING | ACTIVE | CRITICAL | NO | PARTIAL | BLOCKED |
| onboarding | 1 | STABLE | ACTIVE | CRITICAL | NO | PARTIAL | BLOCKED |
| portfolio | 1 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| post | 2 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| professional | 2 | EVOLVING | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| profiles | 5 | EVOLVING | ACTIVE | CRITICAL | NO | PARTIAL | BLOCKED |
| public | 2 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| reviews | 2 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| services | 2 | STABLE | ACTIVE | CRITICAL | NO | PARTIAL | BLOCKED |
| settings | 4 | STABLE | ACTIVE | HIGH | NO | PARTIAL | BLOCKED |
| shared | 1 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | CLEAR |
| social | 2 | STABLE | ACTIVE | HIGH | NO | PARTIAL | BLOCKED |
| state | 1 | STABLE | ACTIVE | HIGH | NO | PARTIAL | BLOCKED |
| styles | 2 | STABLE | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| ui | 2 | FLAGGED | PLACEHOLDER | LOW | NO | PARTIAL | CLEAR |
| upload | 1 | EVOLVING | ACTIVE | HIGH | NO | PARTIAL | BLOCKED |
| vgrid | 0 | FLAGGED | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| void | 1 | FLAGGED | PLACEHOLDER | HIGH | NO | PARTIAL | BLOCKED |
| vport | 1 | EVOLVING | ACTIVE | HIGH | NO | PARTIAL | BLOCKED |

---

## Module-Level Coverage — Dashboard

Dashboard is the only feature with authored module-level behavior contracts.

| Module | Behavior Status | Security | TESTS.md |
|---|---|---|---|
| bookings | PARTIAL (DRAFT) | SECURITY.md present | NO |
| calendar | PARTIAL (DRAFT) | SECURITY.md present | NO |
| dashboard (module) | UNKNOWN | SECURITY.md present | NO |
| designStudio | ACTIVE (REVIEWED) | SECURITY.md present | NO |
| exchange | PARTIAL (DRAFT) | SECURITY.md present | NO |
| flyerBuilder | PARTIAL (DRAFT) | SECURITY.md present | NO |
| gasprices | PARTIAL (DRAFT) | SECURITY.md present | NO |
| leads | PARTIAL (DRAFT) | SECURITY.md present | NO |
| locksmith | PARTIAL (DRAFT) | SECURITY.md present | NO |
| portfolio | ACTIVE (APPROVED) | SECURITY.md present | NO |
| qrcode | ACTIVE (APPROVED) | SECURITY.md present | NO |
| reviews | PARTIAL (DRAFT) | SECURITY.md present | NO |
| schedule | PARTIAL (DRAFT) | SECURITY.md present | NO |
| services | PARTIAL (DRAFT) | SECURITY.md present | NO |
| settings | PARTIAL (DRAFT) | SECURITY.md present | NO |
| shared | ACTIVE (APPROVED) | SECURITY.md present | NO |
| team | PARTIAL (DRAFT) | SECURITY.md present | NO |
| vport | PARTIAL (DRAFT) | SECURITY.md present | NO |
| vportOwnerStats | ACTIVE (APPROVED) | SECURITY.md + TESTS.md | YES |

---

## Module-Level Coverage — All Other Features

All 79 modules across the remaining 36 features:
- BEHAVIOR.md truly missing: services/service, styles/style, ui/ui (3 modules)
- BEHAVIOR.md present but PLACEHOLDER (no Status field): 76 modules

> No other feature has module-level security, tests, or architecture docs beyond INDEX.md and README.md.

---

## Doc Coverage Classification

| Coverage | Count | Criteria |
|---|---|---|
| FULL | 0 | All docs present and ACTIVE |
| PARTIAL | 37 | ARCHITECT run complete; BEHAVIOR PLACEHOLDER; SECURITY present |
| STUB | 0 | No ARCHITECT run |
| MISSING | 0 | No docs at all |

> All 37 features have ARCHITECT (2026-06-04), SECURITY.md, CURRENT_STATUS.md, and INDEX.md. 13/37 features now have ACTIVE BEHAVIOR.md. Coverage is blocked by BEHAVIOR.md being PLACEHOLDER across 24/37 features.

---

## Last Updated

| Scope | Last ARCHITECT Run | Latest Activity |
|---|---|---|
| All 37 features | 2026-06-04 | — |
| dashboard | 2026-06-04 | 2026-06-05 (WOLVERINE sprint) |
| booking | 2026-06-04 | 2026-06-04 (VENOM + ELEKTRA) |
| auth | 2026-06-04 | 2026-06-04 (VENOM + ELEKTRA) |
