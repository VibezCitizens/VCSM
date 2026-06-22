---
title: Privacy Module — Security
status: STUB
feature: settings
module: privacy
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / privacy — SECURITY

## THOR Status

PRIVACY-SEC-001 HIGH — investigation required before release.

## Findings

### PRIVACY-SEC-001 — p_blocker_actor_id Client-Supplied; RPC Auth Unverifiable
| Field | Value |
|---|---|
| ID | PRIVACY-SEC-001 |
| Source Findings | VEN-SETTINGS-004, BW-SETTINGS-007 (HIGH) |
| Severity | HIGH |
| Surface | privacy/dal/blocks.dal.js → moderation RPC p_blocker_actor_id |
| Description | blocks.dal.js passes client-supplied actorId as p_blocker_actor_id to moderation RPC. RPC auth.uid() binding cannot be verified from source. Adversarially UNRESOLVED. |
| Status | UNRESOLVED |
| THOR | Investigation required |

### PRIVACY-SEC-002 — dalSetActorPrivacy No Session Bind at DAL
| Field | Value |
|---|---|
| ID | PRIVACY-SEC-002 |
| Source Findings | VEN-SETTINGS-005, BW-SETTINGS-005 (MEDIUM) |
| Severity | MEDIUM |
| Surface | privacy/dal/ → dalSetActorPrivacy |
| Description | No session bind at DAL layer — upsert with caller-supplied actor_id. RLS is sole ownership backstop. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | Not blocked |

### PRIVACY-SEC-003 — Block/Unblock Uses String-Equality Not assertActorOwns
| Field | Value |
|---|---|
| ID | PRIVACY-SEC-003 |
| Source Findings | BW-SETTINGS-002 (MEDIUM) |
| Severity | MEDIUM |
| Surface | privacy/controller/ → ctrlBlockActor, ctrlUnblockActor |
| Description | callerActorId check uses string equality, not assertActorOwnsVportActorController. Weaker ownership verification pattern. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
