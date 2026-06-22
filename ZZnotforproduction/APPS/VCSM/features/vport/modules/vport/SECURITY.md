---
title: Vport Module — Security
status: STUB
feature: vport
module: vport
source: venom+bw-derived
created: 2026-06-05
---

# vport / modules / vport — SECURITY

## THOR Status

**CONDITIONAL THOR RELEASE BLOCKER — VPORT-SEC-001, VPORT-SEC-002**
Hard blockers if DB confirms vport.profiles RLS UPDATE policy is absent.

## Findings

### VPORT-SEC-001 — updateVport No app-layer owner_user_id Guard (Conditional THOR)
| Field | Value |
|---|---|
| ID | VPORT-SEC-001 |
| Source Findings | VEN-VPORT-002, BW-VPORT-001 (HIGH) |
| Severity | HIGH |
| Surface | dal/vport.core.dal.js → updateVport |
| Description | UPDATE filters only by vportId (.eq 'id', vportId) — no owner_user_id guard. RLS is sole ownership barrier. Adversarially BYPASSED at app layer (RLS may still block at DB). CONDITIONAL BLOCKER pending DB RLS confirmation. |
| Status | OPEN |
| THOR | CONDITIONAL — hard blocker if vport.profiles RLS UPDATE absent |

### VPORT-SEC-002 — Media Asset Updates No Session Auth Guard (Conditional THOR)
| Field | Value |
|---|---|
| ID | VPORT-SEC-002 |
| Source Findings | VEN-VPORT-004, BW-VPORT-002 (HIGH) |
| Severity | HIGH |
| Surface | dal/updateVportAvatarMediaAssetIdDAL, dal/updateVportBannerMediaAssetIdDAL |
| Description | No session auth guard at DAL layer. RLS sole barrier. Adversarially BYPASSED at app layer. CONDITIONAL BLOCKER pending DB RLS confirmation. |
| Status | OPEN |
| THOR | CONDITIONAL |

### VPORT-SEC-003 — Soft Delete/Restore No App-Layer Ownership Gate
| Field | Value |
|---|---|
| ID | VPORT-SEC-003 |
| Source Findings | VEN-VPORT-003 (HIGH) |
| Severity | HIGH |
| Surface | controller/ctrlSoftDeleteVport.js, ctrlRestoreVport.js |
| Description | No app-layer ownership check on soft delete or restore. Inconsistent with ctrlHardDeleteVport which has ownership check. RPC ownership enforcement UNVERIFIED. |
| Status | OPEN |
| THOR | Investigation required |

### VPORT-SEC-004 — owner_user_id Auth UUID in Public Read Columns
| Field | Value |
|---|---|
| ID | VPORT-SEC-004 |
| Source Findings | VEN-VPORT-006 (MEDIUM) |
| Severity | MEDIUM |
| Surface | dal/getVportById.dal.js, getVportBySlug.dal.js |
| Description | owner_user_id (Supabase auth.users UUID) included in SELECT columns. Sensitive identity identifier exposed in VPORT read responses. |
| Status | OPEN |
| THOR | Not blocked |

### VPORT-SEC-005 — Client-Side Slug Generation (Squatting Risk)
| Field | Value |
|---|---|
| ID | VPORT-SEC-005 |
| Source Findings | VEN-VPORT-001 (LOW) |
| Severity | LOW |
| Surface | VPORT creation flow — slug generation |
| Description | Slug generated client-side — slug squatting risk and collision UX failure if slug is already taken. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
