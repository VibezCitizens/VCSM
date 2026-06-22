---
title: Account Module — Index
status: STUB
feature: settings
module: account
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / account

Account management — delete citizen account (Edge Function), hard delete VPORT. Highest-risk write surface in settings.

## Source Directories

| Directory | Content |
|---|---|
| account/controller/ | deleteAccount, hardDeleteVport controllers |
| account/dal/ | dalDeleteCitizenAccountFull (edge function call) |
| account/hooks/ | useAccountController |
| account/ui/ | Account settings UI |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

ACCOUNT-SEC-001 (HIGH) — Edge Function no app-layer session pre-check.
