---
title: Inbox Module — Security
status: STUB
feature: notifications
module: inbox
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / inbox — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — INBOX-SEC-001, INBOX-SEC-002**

## Findings

### INBOX-SEC-001 — Inbox State Mutations Accept Arbitrary recipientId [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | INBOX-SEC-001 |
| Source Findings | VEN-NOTIFICATIONS-001, VEN-NOTIFICATIONS-002, BW-NOTI-001 (CRITICAL) |
| Severity | CRITICAL |
| Surface | engines/notifications markRead/dismiss/archive/markSeen; app-layer controllers |
| Description | All inbox state mutations accept arbitrary recipientId with no ownership assertion at any layer. Actor A can mark Actor B's notifications as read, dismiss them, or archive them. RLS on notification.inbox_items UNVERIFIED. Adversarially confirmed BYPASSED (BW-NOTI-001). |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### INBOX-SEC-002 — RLS on notification.inbox_items Unverified [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | INBOX-SEC-002 |
| Source Findings | BW-NOTI-004 (HIGH) |
| Severity | HIGH |
| Surface | notification.inbox_items table — RLS policy status |
| Description | RLS on notification.inbox_items is UNVERIFIED. If absent, any authenticated actor can read and mutate any inbox item. Application-layer recipient_id filter is the sole guard and is trivially bypassed. |
| Status | UNRESOLVED |
| THOR | BLOCKS RELEASE |

### INBOX-SEC-003 — actorId Used as recipientId in Diagnostics
| Field | Value |
|---|---|
| ID | INBOX-SEC-003 |
| Source Findings | VEN-NOTIFICATIONS-003 (MEDIUM) |
| Severity | MEDIUM |
| Surface | diagnostics panel → markRead({ recipientId: actorId }) |
| Description | Diagnostics panel passes actorId where recipientId is expected. If actorId and recipientId are from different namespaces, mutations silently operate on wrong data. |
| Status | OPEN |
| THOR | Not blocked |

### INBOX-SEC-004 — actorId From Prop in markAllSeen No Session Cross-Check
| Field | Value |
|---|---|
| ID | INBOX-SEC-004 |
| Source Findings | BW-NOTI-002 (MEDIUM) |
| Severity | MEDIUM |
| Surface | useNotificationsHeader → NotificationsHeader.controller.js → actorId prop |
| Description | actorId received as hook prop with no cross-check against authenticated session in controller. Stale or swapped actorId silently operates on wrong actor's inbox. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | Not blocked |

### INBOX-SEC-005 — resolveInboxActor Vport Null Silent Failure
| Field | Value |
|---|---|
| ID | INBOX-SEC-005 |
| Source Findings | BW-NOTI-003 (MEDIUM) |
| Severity | MEDIUM |
| Surface | inbox/lib/resolveInboxActor.js — vport branch |
| Description | Missing ownerActorId in vport branch silently returns myActorId=null, disabling block filter for that session. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | Not blocked |

### INBOX-SEC-006 — dismiss/archive No Idempotency Guard
| Field | Value |
|---|---|
| ID | INBOX-SEC-006 |
| Source Findings | BW-NOTI-007 (LOW) |
| Severity | LOW |
| Surface | engines/notifications dismiss, archive |
| Description | dismiss and archive lack idempotency guards (unlike markSeen). Replay updates timestamps. |
| Status | OPEN |
| THOR | Not blocked |

### INBOX-SEC-007 — Engine No Null Guard on recipientId
| Field | Value |
|---|---|
| ID | INBOX-SEC-007 |
| Source Findings | BW-NOTI-006 (LOW) |
| Severity | LOW |
| Surface | engines/notifications markRead/dismiss/archive controllers |
| Description | Engine controllers have no null guard on recipientId (app-layer DAL has guard; engine does not). Defense-in-depth gap. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
