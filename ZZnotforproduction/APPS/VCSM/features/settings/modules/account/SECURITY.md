---
title: Account Module — Security
status: STUB
feature: settings
module: account
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / account — SECURITY

## THOR Status

ACCOUNT-SEC-001 HIGH — requires investigation before release.

## Findings

### ACCOUNT-SEC-001 — Account Delete Edge Function No Session Pre-Check
| Field | Value |
|---|---|
| ID | ACCOUNT-SEC-001 |
| Source Findings | VEN-SETTINGS-002, BW-SETTINGS-004 (HIGH) |
| Severity | HIGH |
| Surface | account/dal/dalDeleteCitizenAccountFull → Edge Function |
| Description | dalDeleteCitizenAccountFull invokes Edge Function without app-layer session pre-check. Adversarially PARTIAL (RLS may provide partial backstop). |
| Status | OPEN |
| THOR | Investigation required |

### ACCOUNT-SEC-002 — ctrlHardDeleteVport Missing callerActorId (Broken)
| Field | Value |
|---|---|
| ID | ACCOUNT-SEC-002 |
| Source Findings | VEN-SETTINGS-003 (MEDIUM) |
| Severity | MEDIUM |
| Surface | account/hooks/useAccountController → ctrlHardDeleteVport |
| Description | useAccountController calls ctrlHardDeleteVport without callerActorId. Hard delete is functionally broken from Account tab. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
