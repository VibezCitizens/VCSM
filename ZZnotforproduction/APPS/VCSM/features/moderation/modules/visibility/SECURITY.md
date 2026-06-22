---
title: Visibility Module — Security
status: STUB
feature: moderation
module: visibility
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / visibility — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — VIS-SEC-001, VIS-SEC-002, VIS-SEC-003**

## Findings

### VIS-SEC-001 — actor_id Not Session-Bound in Personal Hide Path [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VIS-SEC-001 |
| Source Findings | VEN-MODERATION-002, BW-MOD-001 (CRITICAL) |
| Severity | HIGH |
| Surface | postVisibility.controller / commentVisibility.controller → moderationActions.dal actor_id |
| Description | actor_id for personal hide/unhide is caller-supplied with no session binding. Any authenticated user can write hide actions attributed to any actor. RLS on moderation.actions INSERT UNVERIFIED. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### VIS-SEC-002 — Exported DAL Functions With No Auth Guard [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VIS-SEC-002 |
| Source Findings | VEN-MODERATION-003, BW-MOD-010 (HIGH) |
| Severity | HIGH |
| Surface | moderationActions.dal.js → hidePostRow, hideMessageRow (exported) |
| Description | hidePostRow and hideMessageRow are exported DAL functions with no own authorization guard. Any internal caller can invoke them directly, bypassing the assertModerationAccess controller gate. Defense-in-depth is absent. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### VIS-SEC-003 — updateReportRowStatus No Ownership Filter [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VIS-SEC-003 |
| Source Findings | VEN-MODERATION-004, BW-MOD-003 (HIGH) |
| Severity | HIGH |
| Surface | reports.dal.js → updateReportRowStatus |
| Description | updateReportRowStatus filters only by reportId (.eq('id', reportId)) with no ownership or role filter. No status allowlist. Any moderator with RLS access can update any report. Adversarially PARTIAL — RLS may enforce some scoping but is unverified. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### VIS-SEC-004 — Vport Actors Can Write Personal Hide Actions
| Field | Value |
|---|---|
| ID | VIS-SEC-004 |
| Source Findings | BW-MOD-005 (MEDIUM) |
| Severity | MEDIUM |
| Surface | postVisibility.controller → moderation.actions INSERT |
| Description | No actor kind check before personal hide. Vport actors (business identities) can write hide actions to moderation.actions, which is semantically incorrect. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked |

### VIS-SEC-005 — Dismissed Terminal State Not Guarded
| Field | Value |
|---|---|
| ID | VIS-SEC-005 |
| Source Findings | BW-MOD-006 (MEDIUM) |
| Severity | MEDIUM |
| Surface | moderationActions.controller → hideReportedObjectController |
| Description | No guard against re-actioning a dismissed report. Dismissed terminal state can be overridden by any moderator. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked |

### VIS-SEC-006 — assertModerationAccess actorId Parameter Ignored by DAL
| Field | Value |
|---|---|
| ID | VIS-SEC-006 |
| Source Findings | BW-MOD-007 (LOW) |
| Severity | LOW / INFO |
| Surface | assertModerationAccess.dal.js → isModerationAuthorizedDAL |
| Description | Controller accepts actorId but DAL ignores it — role check is actor-agnostic. Creates misleading API — callers assume the check is actor-scoped. |
| Status | OPEN |
| THOR | Not blocked |

### VIS-SEC-007 — Personal Hide Actor Delete Missing Re-Check (TOCTOU)
| Field | Value |
|---|---|
| ID | VIS-SEC-007 |
| Source Findings | VEN-MODERATION-008 (LOW) |
| Severity | LOW |
| Surface | moderationActions.dal.js → dalDeleteConversationHideAction |
| Description | Final DELETE query missing .eq('actor_id', actorId) ownership re-check. TOCTOU hardening gap. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
