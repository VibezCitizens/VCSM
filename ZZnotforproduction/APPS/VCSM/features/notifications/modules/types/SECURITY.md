---
title: Types Module — Security
status: STUB
feature: notifications
module: types
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / types — SECURITY

## THOR Status

No THOR blockers scoped to this module.

## Findings

### TYPES-SEC-001 — Stored XSS via Payload-Embedded Sender Name Fallback
| Field | Value |
|---|---|
| ID | TYPES-SEC-001 |
| Source Findings | BW-NOTI-008 (MEDIUM) |
| Severity | MEDIUM |
| Surface | notification type views → sender display fallback → payload.context.senderName |
| Description | When hydration fails, sender display name falls back to payload-embedded context fields (senderName from notification payload). If UI does not escape this field, it is a stored XSS vector — malicious content in the notification payload renders as HTML. Adversarially PARTIAL — conditional on UI escaping. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
