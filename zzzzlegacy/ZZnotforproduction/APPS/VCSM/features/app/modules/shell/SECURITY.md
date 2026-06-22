---
title: Shell Module — Security
status: STUB
feature: app
module: shell
source: venom-derived
created: 2026-06-05
---

# app / modules / shell — SECURITY

## THOR Status

NO THOR BLOCKERS identified in static scan.

## Findings

### SHELL-SEC-001 — Auth Recovery Nonce in sessionStorage
| Field | Value |
|---|---|
| ID | SHELL-SEC-001 |
| Source Finding | VENOM-AUTH-001 |
| Severity | MEDIUM |
| Surface | AuthProvider.jsx → sessionStorage.setItem('vc.auth.recovery', ...) |
| Description | Password recovery flag stored in sessionStorage is readable and writable by any JavaScript on the page. Self-exploitation only (attacker already has JS execution), but violates defense-in-depth. A compromised third-party script could set the recovery flag to interfere with auth flow. |
| Status | OPEN |
| THOR | Not blocked |

### SHELL-SEC-002 — Identity Storage Clear Race
| Field | Value |
|---|---|
| ID | SHELL-SEC-002 |
| Source Finding | ARCHITECT observation |
| Severity | MEDIUM |
| Surface | AuthProvider.jsx → SIGNED_OUT handler |
| Description | clearAllIdentityStorage() must fire synchronously before Supabase signOut. If inverted, signOut may trigger a page reload or auth state change that interrupts the wipe, leaving actor_kind/actor_vport_id/actor_touch stale in localStorage. |
| Status | OPEN — UNVERIFIED (call order must be confirmed in source) |
| THOR | Not blocked |

### SHELL-SEC-003 — Identity Hint Cache in localStorage
| Field | Value |
|---|---|
| ID | SHELL-SEC-003 |
| Source Finding | ARCHITECT observation |
| Severity | LOW |
| Surface | AuthProvider.jsx → localStorage.setItem (actor_kind, actor_vport_id, actor_touch) |
| Description | Actor identity hints cached in localStorage. localStorage persists across browser sessions and tabs. If clearAllIdentityStorage() fails silently (SHELL-SEC-002), stale identity could be read by next session. |
| Status | OPEN |
| THOR | Not blocked |

## TODO

- [ ] Confirm clearAllIdentityStorage() call order in SIGNED_OUT handler
- [ ] Confirm recovery flag format — is it a boolean or a token/nonce?
- [ ] Confirm whether stale localStorage identity causes auth bypass or only UI display error
