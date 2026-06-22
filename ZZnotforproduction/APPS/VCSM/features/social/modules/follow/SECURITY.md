---
title: Follow Module — Security
status: STUB
feature: social
module: follow
source: venom+bw-derived
created: 2026-06-05
---

# social / modules / follow — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — FOLLOW-SEC-001, FOLLOW-SEC-002**

## Findings

### FOLLOW-SEC-001 — ctrlSendFollowRequest No assertingActorId Gate [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | FOLLOW-SEC-001 |
| Source Findings | VEN-SOCIAL-002, BW-SOCIAL-001 (HIGH) |
| Severity | HIGH |
| Surface | friend/request/ctrlSendFollowRequest.js |
| Description | ctrlSendFollowRequest has no assertingActorId ownership gate. Any authenticated actor can send follow requests impersonating another actor by supplying a foreign requesterActorId. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### FOLLOW-SEC-002 — vc.actor_follows RLS Unverified [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | FOLLOW-SEC-002 |
| Source Findings | BW-SOCIAL-006 (HIGH) |
| Severity | HIGH |
| Surface | vc.actor_follows table — RLS policy status |
| Description | RLS on vc.actor_follows is UNVERIFIED. If misconfigured, controller ownership gates are the only barrier for dalInsertFollow and dalDeactivateFollow. Adversarially UNRESOLVED. |
| Status | UNRESOLVED |
| THOR | BLOCKS RELEASE |

### FOLLOW-SEC-003 — Follow Request Inbox RLS Unverified / Regression
| Field | Value |
|---|---|
| ID | FOLLOW-SEC-003 |
| Source Findings | VEN-SOCIAL-001 (HIGH) |
| Severity | HIGH |
| Surface | ctrlListIncomingRequests — vc.social_follow_requests |
| Description | V-SUB-003 test status unclear — regression tests marked WILL FAIL. RLS on vc.social_follow_requests unverified. |
| Status | UNRESOLVED |
| THOR | Not blocked |

### FOLLOW-SEC-004 — Production Console PII Logging
| Field | Value |
|---|---|
| ID | FOLLOW-SEC-004 |
| Source Findings | VEN-SOCIAL-005 (LOW) |
| Severity | LOW |
| Surface | dalInsertFollow:56, useSubscribeAction:172 |
| Description | Unguarded console.error logs actor IDs in production browser console. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
