---
title: Vports Module — Security
status: STUB
feature: settings
module: vports
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / vports — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — VPORTS-SEC-001, VPORTS-SEC-002**

## Findings

### VPORTS-SEC-001 — ctrlSoftDeleteVport/ctrlRestoreVport No Ownership Gate [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VPORTS-SEC-001 |
| Source Findings | VEN-SETTINGS-001, BW-SETTINGS-001 (HIGH) |
| Severity | HIGH |
| Surface | vports/controller/ctrlSoftDeleteVport.js, ctrlRestoreVport.js |
| Description | ctrlSoftDeleteVport and ctrlRestoreVport have no app-layer ownership gate. DAL RPCs reached without ownership verification. Any authenticated actor can trigger these operations for any VPORT they know the ID of. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### VPORTS-SEC-002 — restoreVport Path Missing callerActorId [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | VPORTS-SEC-002 |
| Source Findings | BW-SETTINGS-006 (HIGH) |
| Severity | HIGH |
| Surface | vports/hooks/useVportsController.js → restoreVport |
| Description | useVportsController.restoreVport calls ctrlRestoreVport with no callerActorId. Ownership gate is not even attempted on the Vports tab path. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
