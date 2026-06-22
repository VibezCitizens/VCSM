---
title: designStudio Module — Security
status: ACTIVE
feature: dashboard
module: designStudio
source: SOURCE_VERIFIED
owner: VENOM + ELEKTRA + BLACKWIDOW
last-run: 2026-06-05
---

# Security Posture — dashboard / modules / designStudio

Last Updated: 2026-06-05
Highest Open Severity: MEDIUM
THOR Release Blocker: CAUTION — ELEK-2026-06-05-001 (MEDIUM, revoked owner bypass — DB verification required)

---

## VENOM STATUS

VENOM Last Run: 2026-06-05
VENOM Status: COMPLETE

3 findings: 0 CRITICAL | 0 HIGH | 2 MEDIUM | 1 LOW

| Finding ID | Severity | THOR Blocker | Description |
|---|---|---|---|
| VEN-DS-001 | MEDIUM | CAUTION | `dalReadActorOwnerRow` does not filter `is_void` — revoked owner retains design studio access |
| VEN-DS-002 | MEDIUM | CAUTION | Asset storage bucket RLS unknown — design-studio-assets bucket access policy unverified |
| VEN-DS-003 | LOW | NO | `dalTouchDesignDocument` bare documentId UPDATE — no ownership scope at DAL layer (defense-in-depth gap only) |

Previously patched:
| Finding ID | Severity | Status |
|---|---|---|
| VEN-DASH-003 | HIGH | PATCHED / SOURCE VERIFIED — document ownership binding present in all controller paths |
| ELEK-002 | HIGH | PATCHED / SOURCE VERIFIED — requireDesignDocumentOwnerAccess verified at every mutation entry |
| BLOCK-DASH-004 | CRITICAL | RESOLVED / RLS LIVE VERIFIED 2026-06-04 |

Full report: `outputs/2026/06/05/Venom/2026-06-05_venom_dashboard-modules-designStudio-vportOwnerStats.md`

Required follow-up: DB (is_void + storage bucket), Wolverine (VEN-DS-001 patch), SPIDER-MAN (regression)

---

## ELEKTRA STATUS

ELEKTRA Last Run: 2026-06-05
ELEKTRA Status: COMPLETE

1 MEDIUM | 1 LOW | 3 False Positives Rejected | 2 Suggested Patches

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-2026-06-05-001 | MEDIUM | Open | Revoked owner bypass — dalReadActorOwnerRow missing is_void filter — source chain confirmed |
| ELEK-2026-06-05-002 | LOW | Open | Asset storage bucket policy unverified — URL access not controlled by table RLS |

Previously patched:
| Finding ID | Severity | Status |
|---|---|---|
| ELEK-002 / ELEK-2026-06-04-002 | HIGH | PATCHED / SOURCE VERIFIED |
| ELEK-2026-06-02-003 | LOW | OPEN → CONFIRMED by ELEK-2026-06-05-001 (same root cause, same fix required) |

VENOM Cross-Reference:
- VEN-DS-001 (MEDIUM): CONFIRMED — source chain traced to dalReadActorOwnerRow query
- VEN-DS-002 (MEDIUM): Downgraded to LOW in ELEKTRA — bucket may be intentionally accessible for flyer distribution
- VEN-DS-003 (LOW): FALSE POSITIVE REJECTED — controller protection verified at all call sites

3 False Positives Rejected:
1. dalTouchDesignDocument — controller protection chain verified at all call sites
2. Delete DALs bare pageId — page-to-document binding chain verified in ctrlDeleteDesignPage
3. IDOR via actorId route param — viewerActorId (session) used for ownership, not route param

Output: `outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_dashboard-modules-designStudio-vportOwnerStats.md`

---

## BLACKWIDOW STATUS

BLACKWIDOW Last Run: 2026-06-05
BLACKWIDOW Status: COMPLETE

0 CRITICAL | 0 HIGH | 1 MEDIUM | 0 LOW | 10 BLOCKED | 2 PARTIAL | 0 BYPASSED

| Finding ID | Severity | Result | Description |
|---|---|---|---|
| BW-DS-001 | MEDIUM | PARTIAL | Revoked owner bypass — is_void DAL gap confirmed; DB soft-delete behavior unverified |

All 11 MNH invariants from BEHAVIOR.md §7 attacked:
- MNH-001 through MNH-007: BLOCKED
- MNH-008 (revoked owner): PARTIAL — DAL gap confirmed, DB state unverified
- MNH-009 through MNH-011: BLOCKED

VENOM cross-reference:
- VEN-DS-001 (MEDIUM): BW-DS-001 PARTIAL — confirms code gap, DB behavior unresolved
- VEN-DS-002 (MEDIUM): No adversarial attack path from app layer — DB investigation required
- VEN-DS-003 (LOW): BLOCKED — controller-layer protection verified at every call site

Full report: `outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_dashboard-modules-designStudio-vportOwnerStats.md`
