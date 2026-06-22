---
title: Runtime Module — Security
status: STUB
feature: notifications
module: runtime
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / runtime — SECURITY

## THOR Status

No THOR blockers scoped to runtime module. All findings require fix before release.

## Findings

### RUNTIME-SEC-001 — sourceActorId Not Session-Bound in publishEvent
| Field | Value |
|---|---|
| ID | RUNTIME-SEC-001 |
| Source Findings | VEN-NOTIFICATIONS-004, BW-NOTI-005 (HIGH) |
| Severity | HIGH |
| Surface | publish.js → engines/notifications publishEvent → sourceActorId |
| Description | publishEvent accepts caller-supplied sourceActorId with no session verification. Any feature can publish a notification attributed to any actor. Actor impersonation in notification source. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked (no dedicated THOR gate for runtime) |

### RUNTIME-SEC-002 — window Event Listener Accepts Unvalidated Payload
| Field | Value |
|---|---|
| ID | RUNTIME-SEC-002 |
| Source Findings | VEN-NOTIFICATIONS-005 (MEDIUM) |
| Severity | MEDIUM |
| Surface | runtime/index.js → window 'noti:optimistic:replace' listener |
| Description | Optimistic replace event listener accepts unvalidated payload from window event. XSS injection vector — malicious script can fire event with forged notification content. |
| Status | OPEN |
| THOR | Not blocked |

### RUNTIME-SEC-003 — linkPath Accepts Raw UUID (No-Raw-IDs-in-URLs Violation)
| Field | Value |
|---|---|
| ID | RUNTIME-SEC-003 |
| Source Findings | BW-NOTI-009 (LOW) |
| Severity | LOW |
| Surface | publish.js → publishVcsmNotification → linkPath |
| Description | publishVcsmNotification accepts linkPath without validation. Diagnostics panel passes raw actorId UUID in linkPath, violating platform no-raw-IDs-in-URLs policy. Adversarially confirmed BYPASSED (dev context). |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
