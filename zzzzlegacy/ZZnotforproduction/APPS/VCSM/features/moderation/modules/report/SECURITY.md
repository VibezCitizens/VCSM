---
title: Report Module — Security
status: STUB
feature: moderation
module: report
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / report — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — REPORT-SEC-001, REPORT-SEC-002**

## Findings

### REPORT-SEC-001 — Reporter Identity Not Session-Bound [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | REPORT-SEC-001 |
| Source Findings | VEN-MODERATION-001, BW-MOD-001 (CRITICAL), BW-MOD-002 (HIGH) |
| Severity | CRITICAL |
| Surface | report.controller.js → reporter_actor_id; useReportFlow.js reporterActorId prop |
| Description | reporter_actor_id is fully caller-supplied. The hook accepts reporterActorId as a component prop; no layer binds it to the authenticated session. Any authenticated user can submit a report attributed to any actor. RLS on moderation.reports INSERT UNVERIFIED. Adversarially confirmed BYPASSED (BW-MOD-001). |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### REPORT-SEC-002 — Reason Code Not Validated Against Allowlist
| Field | Value |
|---|---|
| ID | REPORT-SEC-002 |
| Source Findings | BW-MOD-004 (MEDIUM) |
| Severity | MEDIUM |
| Surface | report.controller.js → reasonCode |
| Description | reasonCode is not validated against REPORT_REASONS allowlist at controller or DAL layer. Arbitrary strings can be written to moderation.reports. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked |

### REPORT-SEC-003 — No Server-Side Deduplication
| Field | Value |
|---|---|
| ID | REPORT-SEC-003 |
| Source Findings | BW-MOD-008 (LOW) |
| Severity | LOW |
| Surface | report.controller.js → dedupeKey |
| Description | Report deduplication is opt-in — callers must supply dedupeKey. No server-side rate limit or DB unique constraint enforces deduplication. Partial mitigation only. |
| Status | OPEN |
| THOR | Not blocked |

### REPORT-SEC-004 — console.warn Internal State Leak
| Field | Value |
|---|---|
| ID | REPORT-SEC-004 |
| Source Findings | VEN-MODERATION-006 (LOW) |
| Severity | LOW |
| Surface | report.controller.js:113 |
| Description | Ungated console.warn leaks internal report state to browser console in production. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
