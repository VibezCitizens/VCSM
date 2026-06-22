---
title: Menu Module — Security
status: STUB
feature: public
module: menu
source: venom+bw-derived
created: 2026-06-05
---

# public / modules / menu — SECURITY

## THOR Status

No THOR blockers scoped to menu module.

## Findings

### MENU-SEC-001 — Actor UUIDs in Public Review Model Output
| Field | Value |
|---|---|
| ID | MENU-SEC-001 |
| Source Findings | VEN-PUBLIC-005, BW-PUBLIC-011 (MEDIUM) |
| Severity | MEDIUM |
| Surface | vportMenu/dal/readPublicVportReviews.dal.js → model output |
| Description | author_actor_id and target_actor_id returned verbatim in public review model output. Actor UUID enumeration possible by any anonymous visitor. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked |

### MENU-SEC-002 — Precise Lat/Lng in Public directionsUrl
| Field | Value |
|---|---|
| ID | MENU-SEC-002 |
| Source Findings | VEN-PUBLIC-004, BW-PUBLIC-012 (MEDIUM) |
| Severity | MEDIUM |
| Surface | vportMenu/dal/readVportPublicDetails.rpc.dal.js → directionsUrl |
| Description | lat/lng fetched from public_menu_read_model_v and embedded in returned directionsUrl. Precise VPORT location coordinates exposed to all anonymous viewers. Model comment misleadingly claims coordinates are not returned. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked |

### MENU-SEC-003 — TTL Cache Null-Guard Bug
| Field | Value |
|---|---|
| ID | MENU-SEC-003 |
| Source Findings | BW-PUBLIC-009 (LOW) |
| Severity | LOW |
| Surface | useVportPublicDetails.js — TTL cache |
| Description | Cache null-guard uses `cached !== undefined` — null data is treated as valid cache. Stale null served for 60s after first fetch failure. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
