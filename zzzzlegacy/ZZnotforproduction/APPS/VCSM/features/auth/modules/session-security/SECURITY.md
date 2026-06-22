---
title: Session Security Module — Security
status: STUB
feature: auth
module: session-security
source: architect-derived
created: 2026-06-06
---

# auth / modules / session-security — SECURITY

## THOR Status

NO THOR BLOCKERS in this module.

## Highest Open Severity

LOW

---

## Findings

### SS-SEC-001 — Supabase Client on `globalThis` [CLOSED]
| Field | Value |
|---|---|
| ID | SS-SEC-001 |
| Source Finding | ARCHITECT-AUTH-DEEP-001 (2026-06-05) |
| Severity | CRITICAL — **CLOSED** |
| Surface | services/supabase/supabaseClient.js |
| Description | `getOrCreateClient()` previously assigned the Supabase client to `globalThis.__SB_CLIENT__`, making it accessible as `window.__SB_CLIENT__` in the browser. Any XSS payload could extract the authenticated Supabase client and call arbitrary auth/data APIs as the current user. |
| Fix | Replaced `globalThis.__SB_CLIENT__` with module-scoped `let _client = null` |
| Implementation Return | `outputs/2026/06/05/ARCHITECT/IMPLEMENTATION-AUTH-ARCH-001.md` |
| Status | **CLOSED — fixed 2026-06-05** |
| THOR | Not blocked |

### SS-SEC-002 — AuthProvider signOut localStorage Fallback Missing [CLOSED]
| Field | Value |
|---|---|
| ID | SS-SEC-002 |
| Source Finding | ARCHITECT-AUTH-DEEP-001 (2026-06-05) |
| Severity | HIGH — **CLOSED** |
| Surface | app/providers/AuthProvider.jsx — signOut catch block |
| Description | If `supabase.auth.signOut()` threw an exception, the `sb-auth-main` localStorage token was NOT cleared. This left a valid session token in localStorage even after a logout attempt, allowing session resurrection on next page load. |
| Fix | Added `localStorage.removeItem('sb-auth-main')` in the catch block as a fallback wipe |
| Implementation Return | `outputs/2026/06/05/ARCHITECT/IMPLEMENTATION-AUTH-ARCH-001.md` |
| Status | **CLOSED — fixed 2026-06-05** |
| THOR | Not blocked |

### SS-SEC-003 — Dead `globalThis?.__WANDERS_SB__` Fallback Branch [CLOSED]
| Field | Value |
|---|---|
| ID | SS-SEC-003 |
| Source Finding | ARCHITECT-AUTH-DEEP-001 (2026-06-05) |
| Severity | MEDIUM — **CLOSED** |
| Surface | services/cloudflare/uploadToCloudflare.js |
| Description | Dead code branch referencing `globalThis?.__WANDERS_SB__` — a stale artifact from a previous pattern. Dead branch removed. |
| Fix | Removed dead fallback branch |
| Implementation Return | `outputs/2026/06/05/ARCHITECT/IMPLEMENTATION-AUTH-ARCH-001.md` |
| Status | **CLOSED — fixed 2026-06-05** |
| THOR | Not blocked |

### SS-SEC-004 — getSession() Cached JWT for Ownership Checks
| Field | Value |
|---|---|
| ID | SS-SEC-004 |
| Source Finding | ELEK-2026-06-04-005, LOGIN-SEC-003 |
| Severity | LOW |
| Surface | dal/authSession.read.dal.js → supabase.auth.getSession() |
| Description | `getSession()` returns a cached JWT — not server-verified. Ownership checks relying on this may use a revoked or tampered token that hasn't yet been detected. The correct server-verified call is `supabase.auth.getUser()`. Low risk in practice because Supabase token refresh is automatic and short-lived. |
| Status | OPEN — accepted low risk |
| THOR | Not blocked |

---

## Regression Guards

After any change to `supabaseClient.js`:
- Verify `globalThis.__SB_CLIENT__` does NOT exist (open devtools console, type `window.__SB_CLIENT__`)
- Verify `_client` is NOT exported from the module

After any change to `AuthProvider.jsx` logout flow:
- Verify `clearAllIdentityStorage()` still fires BEFORE `supabase.auth.signOut()`
- Verify catch block still contains `localStorage.removeItem('sb-auth-main')`
