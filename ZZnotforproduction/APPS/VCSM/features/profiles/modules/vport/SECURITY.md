---
title: Vport Module — Security
status: STUB
feature: profiles
module: vport
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / vport — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — VPORT-SEC-001, VPORT-SEC-002, VPORT-SEC-003, VPORT-SEC-004**

## Findings

### VPORT-SEC-001 — menu_categories CREATE/DELETE No Ownership Gate [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VPORT-SEC-001 |
| Source Findings | VEN-PROFILES-003, BW-PROF-002 (HIGH) |
| Severity | HIGH |
| Surface | vport menu_categories controller + DAL |
| Description | menu_categories CREATE has no assertActorOwnsVportActorController call. actorId taken from argument, not session-verified. DELETE has no ownership filter at DAL layer (no actor_id or profile_id scope). Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### VPORT-SEC-002 — menu_items CREATE/DELETE No Ownership Gate [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VPORT-SEC-002 |
| Source Findings | VEN-PROFILES-004, BW-PROF-003 (HIGH) |
| Severity | HIGH |
| Surface | vport menu_items controller + DAL |
| Description | menu_items CREATE has no assertActorOwnsVportActorController call. actorId taken from argument, not session-verified. DELETE has no ownership filter at DAL layer. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### VPORT-SEC-003 — locksmith_portfolio_details UPSERT No Actor Scope [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VPORT-SEC-003 |
| Source Findings | VEN-PROFILES-005 (HIGH) |
| Severity | HIGH |
| Surface | dal/locksmith_portfolio_details UPSERT |
| Description | UPSERT uses portfolio_item_id only as DB filter — no actor_id scope. Cross-actor portfolio detail overwrite possible. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### VPORT-SEC-004 — locksmith_service_details UPSERT Conflict Key Missing actor_id [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VPORT-SEC-004 |
| Source Findings | VEN-PROFILES-008 (MEDIUM) |
| Severity | MEDIUM |
| Surface | dal/locksmith_service_details UPSERT onConflict |
| Description | onConflict key is 'service_id' only — actor_id not included in conflict key. Cross-actor service detail collision possible. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### VPORT-SEC-005 — menu_item_media INSERT itemId Ownership Unverified
| Field | Value |
|---|---|
| ID | VPORT-SEC-005 |
| Source Findings | VEN-PROFILES-006 (MEDIUM) |
| Severity | MEDIUM |
| Surface | dal/menu_item_media INSERT |
| Description | INSERT does not verify that itemId is owned by the resolving actor. Any actor with a known itemId can attach media to foreign menu items. |
| Status | OPEN |
| THOR | Not blocked |

### VPORT-SEC-006 — Subscriber List Privacy Gate Controller-Only
| Field | Value |
|---|---|
| ID | VPORT-SEC-006 |
| Source Findings | VEN-PROFILES-007 (MEDIUM) |
| Severity | MEDIUM |
| Surface | dal/list_vport_subscribers |
| Description | list_vport_subscribers DAL callable without privacy gate — privacy is enforced only in controller. DAL exposes subscriber list to any direct caller. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
