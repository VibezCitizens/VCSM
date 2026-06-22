---
title: Profile Module — Security
status: STUB
feature: settings
module: profile
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / profile — SECURITY

## THOR Status

PROFILE-SEC-001 HIGH — investigation required.

## Findings

### PROFILE-SEC-001 — Profile Write No Session Bind at DAL
| Field | Value |
|---|---|
| ID | PROFILE-SEC-001 |
| Source Findings | VEN-SETTINGS-006, BW-SETTINGS-003 (HIGH) |
| Severity | HIGH |
| Surface | profile/dal/profile.write.dal.js — user-mode UPDATE |
| Description | profile.write.dal.js user-mode update has no session bind — subjectId is caller-supplied. RLS is the sole ownership backstop. Adversarially PARTIAL (RLS likely enforces, but unverified). |
| Status | OPEN |
| THOR | Investigation required |

### PROFILE-SEC-002 — Hydration Store Mutation Risk if RLS Fails
| Field | Value |
|---|---|
| ID | PROFILE-SEC-002 |
| Source Findings | BW-SETTINGS-010 (MEDIUM) |
| Severity | MEDIUM |
| Surface | saveProfileCore downstream → hydration store |
| Description | Hydration store force-mutated in saveProfileCore downstream of profile write. Second-order risk if RLS fails — stale/forged actor identity could persist in store. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
