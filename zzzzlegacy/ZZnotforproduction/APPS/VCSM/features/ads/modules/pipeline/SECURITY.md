---
title: Pipeline Module — Security
status: STUB
feature: ads
module: pipeline
source: venom+blackwidow+elektra-derived
created: 2026-06-05
---

# ads / modules / pipeline — SECURITY

## THOR Status

NO CURRENT THOR BLOCKER — persistence is localStorage-only (pre-migration).

**Pre-migration escalation:** All HIGH findings below become CRITICAL when ads migrates to a Supabase backend. A pre-migration security gate must run before that migration.

## Findings

### PIPELINE-SEC-001 — Ownership-Blind Delete
| Field | Value |
|---|---|
| ID | PIPELINE-SEC-001 |
| Source Finding | VEN-ADS-004 |
| Severity | HIGH (pre-migration CRITICAL) |
| Surface | adPipeline.usecase.js → deleteAdUseCase |
| Description | deleteAdUseCase accepts bare ad id with no actorId ownership pre-check. Any caller with the id can delete any ad in localStorage. No identity validation before mutation. |
| Status | OPEN |
| THOR | Not blocked (localStorage) — WILL BLOCK on Supabase migration |

### PIPELINE-SEC-002 — Adapter Boundary Bypass
| Field | Value |
|---|---|
| ID | PIPELINE-SEC-002 |
| Source Finding | VEN-ADS-005 |
| Severity | HIGH |
| Surface | ads.feature.js barrel |
| Description | ads.feature.js exports usecases directly. Callers can invoke usecases without going through adapters/hooks/useVportAds.adapter.js. Bypasses any input normalization or ownership checks in the adapter layer. |
| Status | OPEN |
| THOR | Not blocked |

### PIPELINE-SEC-003 — Cross-Actor Storage Namespace
| Field | Value |
|---|---|
| ID | PIPELINE-SEC-003 |
| Source Finding | VEN-ADS-003 |
| Severity | MEDIUM |
| Surface | ad.storage.dal.js → localStorage key vc.ads.pipeline.v1 |
| Description | localStorage key is global — not namespaced per actorId. In multi-identity sessions, all actors on the same device share the same ad store. A different VPORT's draft ads are visible to another actor's session. |
| Status | OPEN |
| THOR | Not blocked |

### PIPELINE-SEC-004 — Null ActorId Draft Save
| Field | Value |
|---|---|
| ID | PIPELINE-SEC-004 |
| Source Finding | BW-ADS-005 |
| Severity | LOW |
| Surface | adPipeline.usecase.js → saveDraftUseCase |
| Description | Null actorId draft is silently saved to localStorage. deleteAdUseCase(undefined) is a silent no-op. No validation at the use case boundary for null identity. |
| Status | OPEN |
| THOR | Not blocked |

### PIPELINE-SEC-005 — No Ad State Machine Enforcement
| Field | Value |
|---|---|
| ID | PIPELINE-SEC-005 |
| Source Finding | BW-ADS-006 |
| Severity | LOW |
| Surface | adPipeline.usecase.js |
| Description | No state-machine enforcement on ad status transitions. Archived or paused ads can be re-published without restriction. No valid-transition guard. |
| Status | OPEN |
| THOR | Not blocked |

## Pre-Migration Security Gate Requirement

Before migrating ads to Supabase:
1. PIPELINE-SEC-001 must be resolved (ownership check in deleteAdUseCase)
2. PIPELINE-SEC-002 must be resolved (adapter boundary must be enforced)
3. All HIGH findings must re-run through VENOM + ELEKTRA after backend wiring
4. RLS policy on ads table must enforce actor ownership at DB layer

## TODO

- [ ] Confirm scanner finding IDs (VEN-ADS-XXX, BW-ADS-XXX, ELEK-XXX) against actual scanner output files
- [ ] Confirm pre-migration gate is documented in release checklist
- [ ] Re-run VENOM/ELEKTRA/BW after Supabase migration
