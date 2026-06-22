---
title: Privacy Module — Security
status: STUB
feature: social
module: privacy
source: venom+bw-derived
created: 2026-06-05
---

# social / modules / privacy — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — SOCIAL-PRIV-SEC-001**

## Findings

### SOCIAL-PRIV-SEC-001 — DAL Open Patch No Column Allowlist [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | SOCIAL-PRIV-SEC-001 |
| Source Findings | VEN-SOCIAL-003, BW-SOCIAL-005 (HIGH) |
| Severity | HIGH |
| Surface | privacy/dal/dalUpdateActorSocialSettings |
| Description | dalUpdateActorSocialSettings accepts an open patch object with no column allowlist at DAL layer. Controller-layer allowlist in ctrlUpdateVportSocialSettings is not enforced at DAL layer. Arbitrary column updates possible by bypassing controller. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### SOCIAL-PRIV-SEC-002 — vc.actor_social_settings RLS Unverified
| Field | Value |
|---|---|
| ID | SOCIAL-PRIV-SEC-002 |
| Source Findings | BW-SOCIAL-007 (MEDIUM) |
| Severity | MEDIUM |
| Surface | vc.actor_social_settings — RLS policy status |
| Description | RLS relies on undocumented claim (DAL comment only) — not verified from DB schema. Adversarially UNRESOLVED. |
| Status | UNRESOLVED |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
