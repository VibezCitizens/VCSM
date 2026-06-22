# Governance: THOR — Release Gate

**Command:** `/Thor`  
**Authority:** Final release gate — only THOR can declare RELEASE APPROVED  
**Mode:** Read-only verification  
**Scope in VPORT governance:** All modules before production deployment

---

## Responsibility

THOR is the final release gate. No VPORT dashboard module may be deployed with new features or structural changes without THOR approval.

THOR confirms:
- All required commands are APPROVED or CAUTION (not BLOCKED or PENDING)
- No CRITICAL or HIGH findings remain unresolved
- SENTRY compliance verified on changed files
- SPIDER-MAN coverage is adequate for changed paths
- LOGAN documentation is current
- Deferred items are explicitly logged in `deferred-open-items.md`

## THOR Cannot Run Until

| Prerequisite | Minimum Status |
|---|---|
| VENOM | VERIFIED or COMPLETE |
| ARCHITECT | VERIFIED or COMPLETE |
| KRAVEN | VERIFIED or COMPLETE |
| SENTRY | VERIFIED or COMPLETE |
| SPIDER-MAN | VERIFIED or COMPLETE |
| LOGAN | VERIFIED or COMPLETE |

## THOR Status Values

| Status | Meaning |
|---|---|
| COMPLETE | Full release approval — no blocking items |
| DEFERRED | Approved with known non-blocking deferred items logged |
| BLOCKED | One or more commands returned BLOCKED — release not approved |

## Current THOR Status by Module

| Module | THOR Status | Notes |
|---|---|---|
| dashboard | COMPLETE | — |
| dashboard-cards | COMPLETE | — |
| leads | COMPLETE | — |
| exchange | COMPLETE | — |
| menu | COMPLETE | — |
| services | COMPLETE | — |
| booking | DEFERRED | DEFER-001 (bookings_insert_owner) |
| gas | DEFERRED | DEFER-004 (S2 screen split, non-blocking) |
| reviews | DEFERRED | DEFER-002 (service_id FK, non-blocking) |
| All others | NOT_STARTED | — |

## Output Location

`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_thor_[module].md`
