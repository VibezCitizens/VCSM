---
title: Input Validation Module — Security
status: STUB
feature: auth
module: input-validation
source: red-team-derived
created: 2026-06-06
ticket: TICKET-AUTH-INPUT-VALIDATION-001
---

# auth / modules / input-validation — SECURITY

## THOR Status

NO THOR BLOCKERS in this module.
(HIGH finding IV-SEC-001 shares surface with LOGIN-SEC-001 — not independently THOR-blocking.)

## Highest Open Severity

HIGH

---

## Findings

### IV-SEC-001 — Open Redirect via `location.state.from` (Blacklist, Not Allowlist)
| Field | Value |
|---|---|
| ID | IV-SEC-001 |
| Source Finding | TICKET-AUTH-INPUT-VALIDATION-001 FINDING-001 |
| Severity | HIGH |
| Surface | hooks/useLogin.js (lines 69–84), hooks/useRegister.js (lines 42–53) |
| Description | Post-login and post-register redirects read `state.from` from React Router location state. A blocklist of auth routes is checked, but any unlisted path (including external URLs) passes through and triggers navigation. Correct mitigation is a same-origin allowlist — not a blocklist. |
| Status | OPEN — shared with LOGIN-SEC-001 |
| THOR | Not blocked |

### IV-SEC-002 — Missing Email `toLowerCase()` Normalization
| Field | Value |
|---|---|
| ID | IV-SEC-002 |
| Source Finding | TICKET-AUTH-INPUT-VALIDATION-001 |
| Severity | MEDIUM |
| Surface | All auth hooks that handle email input |
| Description | Emails are `trim()`-ed but not converted to lowercase before submission. Supabase may treat `User@example.com` and `user@example.com` as different accounts depending on configuration. Creates user confusion and potential account duplication. |
| Status | OPEN |
| THOR | Not blocked |

### IV-SEC-003 — Raw `err.message` Surfaced in Login Error
| Field | Value |
|---|---|
| ID | IV-SEC-003 |
| Source Finding | TICKET-AUTH-INPUT-VALIDATION-001 |
| Severity | MEDIUM |
| Surface | hooks/useLogin.js → `setError(err.message)` |
| Description | Raw Supabase error messages are shown directly to the user. These may leak internal error codes, schema details, or enumeration signals (e.g., "Invalid login credentials" vs. "Email not confirmed" — different messages reveal account existence). Should be normalized to a safe generic message. |
| Status | OPEN |
| THOR | Not blocked |

### IV-SEC-004 — Missing Input Length Limits on Auth Forms
| Field | Value |
|---|---|
| ID | IV-SEC-004 |
| Source Finding | TICKET-AUTH-INPUT-VALIDATION-001 |
| Severity | MEDIUM |
| Surface | All auth form inputs |
| Description | No `maxLength` attributes on email or password fields. Very long inputs reach Supabase without client-side truncation. Supabase handles this server-side but client-side limits reduce DoS surface and improve UX. |
| Status | OPEN |
| THOR | Not blocked |

### IV-SEC-005 — useAuthOnboarding Post-Redirect Has No Blocklist
| Field | Value |
|---|---|
| ID | IV-SEC-005 |
| Source Finding | TICKET-AUTH-INPUT-VALIDATION-001, ONBOARDING-SEC-003 |
| Severity | MEDIUM |
| Surface | hooks/useAuthOnboarding.js — post-onboarding redirect |
| Description | Unlike useLogin.js (which has a blocklist), useAuthOnboarding.js has no redirect validation at all. state.from is used directly. Worse than the login case — no protection. |
| Status | OPEN — shared with ONBOARDING-SEC-003 |
| THOR | Not blocked |

## Full Report

`outputs/2026/06/05/INPUT-VALIDATION/TICKET-AUTH-INPUT-VALIDATION-001.md`
