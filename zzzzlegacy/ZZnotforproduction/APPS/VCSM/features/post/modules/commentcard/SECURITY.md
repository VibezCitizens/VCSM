---
title: Commentcard Module — Security
status: STUB
feature: post
module: commentcard
source: venom+bw-derived
created: 2026-06-05
---

# post / modules / commentcard — SECURITY

## THOR Status

No THOR blockers scoped to commentcard. COMMENT-SEC-001 HIGH — investigation pending.

## Findings

### COMMENT-SEC-001 — Orphaned Comment INSERT Export in Read DAL
| Field | Value |
|---|---|
| ID | COMMENT-SEC-001 |
| Source Findings | VEN-POST-001 (HIGH) |
| Severity | HIGH |
| Surface | commentcard/dal/postComments.read.dal.js → insertPostComment (exported) |
| Description | insertPostComment is an orphaned INSERT export in a .read.dal file with no owning controller. Potential comment spoofing vector — any importer can directly INSERT comments without going through the controller layer. |
| Status | OPEN |
| THOR | Investigation required — may block on confirmation |

### COMMENT-SEC-002 — Self-Like Not Guarded
| Field | Value |
|---|---|
| ID | COMMENT-SEC-002 |
| Source Findings | BW-POST-006 (MEDIUM) |
| Severity | MEDIUM |
| Surface | commentcard/controller/commentReactions.controller.js → toggleCommentLike |
| Description | No self-like guard. Actor can like own comment, inflate like count, and receive self-notification. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked |

### COMMENT-SEC-003 — No Content Length Limit
| Field | Value |
|---|---|
| ID | COMMENT-SEC-003 |
| Source Findings | VEN-POST-006 (MEDIUM) |
| Severity | MEDIUM |
| Surface | commentcard/controller/postComments.controller.js → createRootComment |
| Description | No comment content length limit at controller or DAL layer. Storage amplification risk. |
| Status | OPEN |
| THOR | Not blocked |

### COMMENT-SEC-004 — Null actorId No Guard in createRootComment
| Field | Value |
|---|---|
| ID | COMMENT-SEC-004 |
| Source Findings | BW-POST-008 (LOW) |
| Severity | LOW |
| Surface | commentcard/controller/postComments.controller.js → createRootComment |
| Description | No null guard on actorId at controller level. Null actorId reaches DAL. DB NOT NULL constraint provides backstop only. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
