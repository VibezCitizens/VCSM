---
title: Cover Module — Security
status: STUB
feature: moderation
module: cover
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / cover — SECURITY

## THOR Status

No THOR blockers scoped to this module.

## Findings

### COVER-SEC-001 — Undo Cover Delete Missing Ownership Re-Check (TOCTOU)
| Field | Value |
|---|---|
| ID | COVER-SEC-001 |
| Source Findings | VEN-MODERATION-008 (LOW) |
| Severity | LOW |
| Surface | dal/conversationCover.write.dal.js → dalDeleteConversationHideAction |
| Description | Final DELETE query missing .eq('actor_id', actorId) ownership re-check. TOCTOU hardening gap — between fetch and delete, cover record ownership is not re-asserted at the DB query level. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
