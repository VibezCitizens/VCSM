---
title: ForgotPassword Module — Security
status: STUB
feature: auth
module: forgot-password
source: venom+bw+elektra-derived
created: 2026-06-06
---

# auth / modules / forgot-password — SECURITY

## THOR Status

NO THOR BLOCKERS in this module.
(THOR blocker is in the `recovery` module — RECOVERY-SEC-001.)

## Highest Open Severity

MEDIUM

## Findings

### FP-SEC-001 — Dead Export `dalUpdateUserPassword` Bypass Risk
| Field | Value |
|---|---|
| ID | FP-SEC-001 |
| Source Findings | VENOM-FP-001, ELEK-FP-001, BW-FP-004 |
| Severity | MEDIUM |
| Surface | resetPassword.dal.js — exported `dalUpdateUserPassword` |
| Description | `dalUpdateUserPassword` is exported from resetPassword.dal but has zero callers (BW-verified). If a caller were added bypassing the server-side permit model in setNewPassword.controller.js, password updates could occur without recovery session verification. Latent risk — not currently exploitable. |
| BW Verification | BLOCKED — zero callers verified |
| ELEKTRA Patch | ELEK-FP-001: remove the dead export |
| Status | OPEN |
| THOR | Not blocked |

### FP-SEC-002 — Duplicate `isValidEmailFormat` — Regex Drift Risk
| Field | Value |
|---|---|
| ID | FP-SEC-002 |
| Source Findings | VENOM-FP-002, ELEK-FP-004 |
| Severity | LOW |
| Surface | resetPassword.model.js and authInputValidation.model.js |
| Description | `isValidEmailFormat` is duplicated across two model files. If regex patterns diverge, validation behavior will differ between code paths. |
| ELEKTRA Patch | ELEK-FP-004: consolidate to one location |
| Status | OPEN |
| THOR | Not blocked |

### FP-SEC-003 — Client-Side Cooldown Bypassable via Page Reload
| Field | Value |
|---|---|
| ID | FP-SEC-003 |
| Source Findings | VENOM-FP-003, BW-FP-002 |
| Severity | LOW |
| Surface | useResetPassword.js — in-memory cooldown state |
| Description | The submit cooldown is stored in React state. A page reload clears it. Supabase's server-side rate limiting is the true protection. |
| BW Verification | CONFIRMED BYPASSED (page reload) |
| Status | OPEN — accepted; Supabase rate-limit is backstop |
| THOR | Not blocked |

### FP-SEC-004 — DEV-Mode `errorDescription` URL Param Trust
| Field | Value |
|---|---|
| ID | FP-SEC-004 |
| Source Findings | VENOM-FP-004, BW-FP-003, ELEK-FP-003 |
| Severity | LOW |
| Surface | ForgotPasswordScreen.jsx — DEV mode only |
| Description | In DEV mode, `errorDescription` from URL params is included in the error object. XSS is BLOCKED by JSX auto-escaping, but text is partially attacker-controllable in DEV. Not exploitable in production. |
| BW Verification | PARTIAL — XSS BLOCKED; text injection PARTIAL in DEV only |
| ELEKTRA Patch | ELEK-FP-003: strip/sanitize errorDescription in DEV |
| Status | OPEN — DEV only |
| THOR | Not blocked |

### FP-SEC-005 — No App-Level Observability for Reset Attempts
| Field | Value |
|---|---|
| ID | FP-SEC-005 |
| Source Findings | VENOM-FP-005 |
| Severity | LOW |
| Surface | sendResetPassword.controller.js — no monitoring emit |
| Description | Password reset request attempts are not emitted to the app-level monitoring system. Rate abuse detection relies entirely on Supabase. |
| Status | OPEN |
| THOR | Not blocked |

### FP-SEC-006 — /reset-password Unguarded by AuthPublicRoute (Intentional)
| Field | Value |
|---|---|
| ID | FP-SEC-006 |
| Source Findings | VENOM-FP-007 |
| Severity | INFO |
| Surface | auth.routes.jsx — /reset-password route guard |
| Description | /reset-password is intentionally not guarded by AuthPublicRoute. Recovery sessions are a special Supabase auth state — blocking authenticated access would break the flow. Accepted design. |
| Status | CLOSED — intentional |
| THOR | Not blocked |

## ELEKTRA Patch Application Order

ELEK-FP-004 → ELEK-FP-001 → ELEK-FP-003 → ELEK-FP-002

Full ELEKTRA advisory:
`outputs/2026/06/05/ELEKTRA/2026-06-05_00-00_elektra_auth-forgotpassword.md`

Full VENOM report:
`outputs/2026/06/05/Venom/2026-06-05_00-00_venom_auth-forgotpassword.md`

Full BLACKWIDOW report:
`outputs/2026/06/05/BlackWidow/2026-06-05_00-00_blackwidow_auth-forgotpassword.md`
