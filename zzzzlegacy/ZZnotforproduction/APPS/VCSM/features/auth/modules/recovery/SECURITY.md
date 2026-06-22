---
title: Recovery Module — Security
status: STUB
feature: auth
module: recovery
source: venom+elektra+bw-derived
created: 2026-06-05
---

# auth / modules / recovery — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — RECOVERY-SEC-001**

This module has an active THOR blocker. No release may proceed without resolving RECOVERY-SEC-001.

## Findings

### RECOVERY-SEC-001 — Client-Side-Only Recovery Provenance Gate [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | RECOVERY-SEC-001 |
| Source Findings | VEN-AUTH-001, ELEK-2026-06-04-001, BW-AUTH-004 |
| Severity | HIGH — THOR BLOCKER |
| Surface | setNewPassword.controller.js → sessionStorage nonce check → supabase.auth.updateUser |
| Description | The gate preventing arbitrary password updates relies on a sessionStorage nonce (vc.auth.recovery flag). This is a client-side check only. supabase.auth.updateUser does not enforce that the session originated from a password recovery flow server-side. BW-AUTH-004 adversarially verified: any authenticated user can manually set the conforming sessionStorage nonce and reach updatePasswordController, bypassing the gate. Self-exploit only — no cross-user path. |
| Adversarial Verification | BYPASSED (BW-AUTH-004 — self-exploit confirmed) |
| ELEKTRA Patch | Edge Function gate proposed — see ELEKTRA scan output |
| Status | OPEN — THOR BLOCKER |
| THOR | **BLOCKS RELEASE** |

ELEKTRA advisory: `ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/04/ELEKTRA/2026-06-04_23-10_elektra_auth-security-scan.md`

### RECOVERY-SEC-002 — Silent Recovery Session Sign-Out Failure
| Field | Value |
|---|---|
| ID | RECOVERY-SEC-002 |
| Source Findings | BW-AUTH-003 |
| Severity | MEDIUM |
| Surface | setNewPassword.controller.js → dalSignOutRecoverySession() |
| Description | dalSignOutRecoverySession failure is silently swallowed in updatePasswordController. If the recovery session sign-out fails transiently, the recovery session remains valid. An attacker who intercepts the recovery session could continue using it post-password-change. |
| Status | OPEN — PARTIAL |
| THOR | Not blocked independently |

### RECOVERY-SEC-003 — getSession() Cached JWT in Recovery Flow
| Field | Value |
|---|---|
| ID | RECOVERY-SEC-003 |
| Source Findings | ELEK-2026-06-04-005 |
| Severity | LOW |
| Surface | Any authSession.read.dal call in recovery flow |
| Description | Session verification in recovery flow uses getSession() (cached JWT) not getUser() (server-verified). For a security-sensitive mutation like password change, server-verified identity is the stronger pattern. |
| Status | OPEN |
| THOR | Not blocked |

## Remediation Priority

1. **RECOVERY-SEC-001** — implement ELEKTRA Edge Function patch before any release
2. **RECOVERY-SEC-002** — surface dalSignOutRecoverySession errors; add retry or alert on failure
3. **RECOVERY-SEC-003** — upgrade to getUser() for password change flow

## TODO

- [ ] Read ELEKTRA advisory — implement Edge Function recovery session enforcement
- [ ] Add error handling to dalSignOutRecoverySession — log + alert on failure
- [ ] Confirm PKCE enabled (partially mitigates RECOVERY-SEC-001)
