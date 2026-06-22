# SECURITY — VCSM / dashboard / modules / calendar

**Feature:** dashboard/modules/calendar
**Last Updated:** 2026-06-05
**Highest Open Severity (across all sections):** MEDIUM
**THOR Release Blocker:** NO

---

## VENOM STATUS

Last Run: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX
Reviewer: VENOM
Date: 2026-06-04 (dashboard matrix level; module row NOT_RUN)

Findings: None recorded at module level. Dashboard matrix findings apply.

Status: MODULE_LEVEL_NOT_RUN

---

## ELEKTRA STATUS

Last Run: 2026-06-05
Reviewer: ELEKTRA
Date: 2026-06-05
Trigger: MANUAL — module-level first run; CALENDAR-RLS-001 verification
Findings: 0 HIGH | 1 MEDIUM | 3 LOW | 1 INFO
False Positives Rejected: 5
THOR Release Blocker: NO

Report:
ZZnotforproduction/APPS/VCSM/features/dashboard/modules/calendar/outputs/2026/06/05/ELEKTRA/2026-06-05_ELEKTRA_calendar-availability.md

Open Findings:

| ID | Severity | Status | Title |
|---|---|---|---|
| ELEK-2026-06-05-001 | MEDIUM | Open | setAvailabilityRuleController — ruleId cross-resource injection; no controller-layer resourceId bind |
| ELEK-2026-06-05-002 | LOW | Open | ruleType enum accepted without allowlist validation |
| ELEK-2026-06-05-003 | LOW | Open | weekday integer not range-validated [0–6] |
| ELEK-2026-06-05-004 | LOW | Open | startTime/endTime not format-validated |
| ELEK-2026-06-05-005 | INFO | Open | Post-save availability refresh reads from stale TTL cache (CALENDAR-CACHE-001) |

RLS Verification:
CALENDAR-RLS-001 — VERIFIED. vport.availability_rules RLS is enabled.
Active policy families: _actor_owner (vc.actor_owners join) and _manager (SECURITY DEFINER).
Pre-existing CARNAGE ticket for legacy owner_user_id branch in current_actor_can_manage_resource remains open.

---

## BLACKWIDOW STATUS

Last Run: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX
Reviewer: BLACKWIDOW
Date: 2026-06-04 (dashboard matrix level; module row NOT_RUN)

Findings: None recorded at module level. Dashboard matrix findings apply.

Status: MODULE_LEVEL_NOT_RUN

Pending:
- BLACKWIDOW runtime replay of ELEK-2026-06-05-001 ruleId injection attack to confirm
  upsert+RLS interaction edge case behavior in live DB.
