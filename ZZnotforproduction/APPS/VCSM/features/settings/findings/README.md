---
title: Settings Feature — Scanner Findings Index
status: ACTIVE
feature: settings
created: 2026-06-07
---

# settings — SCANNER FINDINGS INDEX

This file indexes all scanner and adversarial review outputs for the settings feature.
Full reports are in `outputs/`.

---

## Completed Scanner Runs

| Scanner | Date | Report |
|---|---|---|
| Venom | 2026-06-04 | [outputs/2026/06/04/Venom/2026-06-04_19-48_venom_settings-security-review.md](../outputs/2026/06/04/Venom/2026-06-04_19-48_venom_settings-security-review.md) |
| BlackWidow | 2026-06-04 | [outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_settings-adversarial-review.md](../outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_settings-adversarial-review.md) |

## Not Yet Run

| Scanner | Status |
|---|---|
| ELEKTRA | NOT RUN — required before THOR |
| HAWKEYE | NOT RUN |
| SPIDER-MAN | NOT RUN |

---

## Open Finding Summary (as of 2026-06-04)

### THOR Release Blockers

| ID | Severity | Module | Description |
|---|---|---|---|
| BW-SETTINGS-001 | HIGH | vports | ctrlSoftDeleteVport/ctrlRestoreVport no app-layer ownership gate — BYPASSED |
| BW-SETTINGS-006 | HIGH | vports | useVportsController.restoreVport missing callerActorId — BYPASSED |
| BW-SETTINGS-012 | HIGH | root | BEHAVIOR.md PLACEHOLDER — resolved by LOGAN build 2026-06-07 |

### Other Open Findings

| ID | Severity | Module | Status |
|---|---|---|---|
| VEN-001 | HIGH | vports | Soft/restore no ownership gate — OPEN |
| VEN-002 | HIGH | account | Edge Function no session pre-check — OPEN |
| VEN-003 | MEDIUM | account | Account tab hard-delete broken (callerActorId missing) — OPEN |
| VEN-004 | HIGH | privacy | p_blocker_actor_id client-supplied — OPEN |
| VEN-005 | MEDIUM | privacy | Privacy DAL no session bind — OPEN |
| VEN-006 | MEDIUM | profile | Profile write user-mode no session bind — OPEN |
| BW-002 | MEDIUM | privacy | Block/unblock use string-equality — OPEN |
| BW-003 | HIGH | profile | Profile write RLS sole backstop — OPEN |
| BW-004 | MEDIUM | account | Account delete no session pre-check — OPEN |
| BW-005 | MEDIUM | privacy | Privacy DAL no session bind — OPEN |
| BW-007 | HIGH | privacy | Block RPC auth.uid() unverifiable — UNRESOLVED |
| BW-009 | LOW | privacy | Block idempotency conditional — OPEN |
| BW-010 | MEDIUM | profile | Hydration store second-order risk — OPEN |

---

## Finding-to-Module Map

| Module Doc | Linked Findings |
|---|---|
| `modules/account/SECURITY.md` | ACCOUNT-SEC-001, ACCOUNT-SEC-002 |
| `modules/privacy/SECURITY.md` | PRIVACY-SEC-001, PRIVACY-SEC-002, PRIVACY-SEC-003 |
| `modules/profile/SECURITY.md` | PROFILE-SEC-001, PROFILE-SEC-002 |
| `modules/vports/SECURITY.md` | VPORTS-SEC-001, VPORTS-SEC-002 |
| Root `SECURITY.md` | All findings consolidated |
