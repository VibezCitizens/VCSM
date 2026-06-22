---
title: Availability Module — Security
status: STUB
feature: booking
module: availability
source: venom+elektra+bw-derived
created: 2026-06-05
---

# booking / modules / availability — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — AVAIL-SEC-001, AVAIL-SEC-002**

## Findings

### AVAIL-SEC-001 — Availability Rule Cross-Actor Hijack [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | AVAIL-SEC-001 |
| Source Findings | ELEK-2026-06-04-001, BW-BOOK-009 |
| Severity | HIGH — THOR BLOCKER |
| Surface | upsertAvailabilityRule.dal.js — onConflict:'id' |
| Description | upsertAvailabilityRuleDAL uses onConflict:'id'. The controller verifies resourceId ownership but NOT ruleId ownership. An attacker who knows a foreign ruleId can pass their own resourceId (which they own) and overwrite the victim's availability rule. BW-BOOK-009 adversarially verified: BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### AVAIL-SEC-002 — Availability Exception Cross-Actor Hijack [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | AVAIL-SEC-002 |
| Source Findings | ELEK-2026-06-04-002, BW-BOOK-010 |
| Severity | HIGH — THOR BLOCKER |
| Surface | upsertAvailabilityException.dal.js — onConflict:'id' |
| Description | Same hijack vector as AVAIL-SEC-001 for availability exceptions. BW-BOOK-010 adversarially verified: BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

## Remediation

Both findings require the same fix:
1. Add ruleId/exceptionId ownership verification to the controller before upsert
2. OR change onConflict to scope to (resource_id, ruleId/exceptionId) compound key
3. Confirm DB has unique constraint on (resource_id, id) for both tables before changing onConflict clause
