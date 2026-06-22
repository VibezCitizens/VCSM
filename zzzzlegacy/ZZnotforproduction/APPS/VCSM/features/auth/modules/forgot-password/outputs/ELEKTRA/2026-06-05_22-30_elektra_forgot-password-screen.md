# ELEKTRA Security Report

**Date:** 2026-06-05
**Scope:** VCSM — `/forgot-password` screen + `/reset-password` recovery chain
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — user-requested, following VENOM + BLACKWIDOW passes on same scope
**Findings Summary:** 0 HIGH | 1 MEDIUM | 3 LOW | 1 INFO
**False Positives Rejected:** 5
**Suggested Patches:** 4
**BLIND_REVERIFY_MODE:** ACTIVE — chains reconstructed from source; historical reports consumed for ID mapping only

---

## ELEKTRA PREFLIGHT PASS

Upstream Reports:
- VENOM: `ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/Venom/2026-06-05_21-30_venom_forgot-password-screen.md`
  Status: SUCCESS | Age: 0 days | Scope: VCSM auth forgot-password
- BLACKWIDOW: `ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/BlackWidow/2026-06-05_22-00_blackwidow_forgot-password-screen.md`
  Status: SUCCESS | Age: 0 days | Scope: VCSM auth forgot-password

All gate checks passed. Proceeding with ELEKTRA verification.

---

## ELEKTRA SCAN TARGET

```
Feature / Route:   /forgot-password + /reset-password recovery chain
Application Scope: VCSM
Reason for scan:   Precision code-level vulnerability chain tracing after VENOM + BLACKWIDOW
Scan trigger:      MANUAL
Upstream VENOM:    ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/Venom/2026-06-05_21-30_venom_forgot-password-screen.md
Upstream BW:       ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/BlackWidow/2026-06-05_22-00_blackwidow_forgot-password-screen.md
```

---

## ENTRY POINT MAP

```
ENTRY POINT MAP

Route:                  /forgot-password, /reset (alias)
Route guard:            AuthPublicRoute — redirects logged-in users to /feed; PRESENT
Input sources:
  [1] email field       — ForgotPasswordScreen.jsx controlled input
  [2] form submit       — handleReset via useResetPassword.js
  [3] canSubmit gate    — isValidEmailFormat(email) && !loading && !successMessage

Route:                  /reset-password
Route guard:            NONE — intentional (see auth.routes.jsx:47 comment)
Input sources:
  [4] ?code=            — URL query param from Supabase recovery email
  [5] ?error=           — URL query param (attacker-injectable)
  [6] ?error_description= — URL query param (attacker-injectable)
  [7] #error=           — URL hash param (attacker-injectable)
  [8] #error_description= — URL hash param (attacker-injectable)
  [9] sessionStorage['vc.auth.recovery'] — client-writable recovery nonce
  [10] password field   — ResetPasswordScreen.jsx controlled input
  [11] confirmPassword  — ResetPasswordScreen.jsx controlled input

Trusted input boundary:
  /forgot-password:   ctrlSendResetPasswordEmail — email normalization only
  /reset-password:    resolveRecoverySessionController — nonce + session check (client-side)
                      updatePasswordController — password rules validation

Validation present at boundary:
  Email format: UI-only (hook canSubmit) — NOT in controller
  Recovery gate: sessionStorage nonce + TTL — CLIENT-SIDE ONLY
  Password rules: evaluateRegisterPasswordRules — controller-level — PRESENT
```

---

## Executive Summary

The `/forgot-password` screen itself is a thin, low-risk surface. Email submission reaches Supabase with minimal validation beyond empty-check; Supabase handles the rest. The screen has no auth context, no actor ownership, no writable sinks beyond the Supabase API call.

The full recovery chain (`/reset-password`) carries one persistent MEDIUM finding — the recovery session gate is enforced client-side via a sessionStorage nonce. An authenticated user who reads the source can forge a conforming nonce and bypass the gate to call `supabase.auth.updateUser` with their own valid JWT. Impact is strictly self-scoped; no cross-user path exists. Server-side provenance enforcement via an Edge Function is the only path to full closure.

Three LOW findings are confirmed: error URL param injection that can abort a legitimate recovery link, DEV-mode reflected error text, and a defense-in-depth gap in `redirectTo` construction.

The THOR blocker (VEN-AUTH-001 / ELEK-2026-06-04-001) remains open.

---

## High Findings

None.

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-001
- Title:              Recovery Session Gate is Client-Side Only — sessionStorage Nonce Forgeable
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open — STILL_OPEN_SOURCE_VERIFIED
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:55-71, 138-149
- Source:             sessionStorage.getItem('vc.auth.recovery') — client-writable storage
- Sink:               dalUpdateUserPassword(password) → supabase.auth.updateUser({ password }) — resetPassword.dal.js:17
- Trust Boundary:     readRecoveryNonce() at setNewPassword.controller.js:55 — validates JSON schema + 30-minute TTL
- Impact:             Authenticated user can change their own password without receiving or clicking a recovery email; requires only an active session on the device
- Evidence:
    setNewPassword.controller.js:56-71 — readRecoveryNonce() reads sessionStorage; validates
      typeof parsed?.nonce === 'string' && typeof parsed?.issuedAt === 'number'
      Date.now() - parsed.issuedAt <= 30 * 60 * 1000
    Both constraints are reproducible by any user who reads this source file:
      sessionStorage.setItem('vc.auth.recovery', JSON.stringify({
        nonce: crypto.randomUUID(),
        issuedAt: Date.now()
      }))
    setNewPassword.controller.js:145 — dalGetAuthSession() returns any valid authenticated session
    resetPassword.dal.js:17 — supabase.auth.updateUser({ password: newPassword }) accepts any valid JWT
    No server-side check that the session originated from a PASSWORD_RECOVERY event
    Code comment at setNewPassword.controller.js:27-45 explicitly acknowledges this limitation
- Reproduction Steps:
    1. Log into VCSM on any device — obtain authenticated session
    2. Open browser devtools → Console
    3. Run: sessionStorage.setItem('vc.auth.recovery', JSON.stringify({nonce: crypto.randomUUID(), issuedAt: Date.now()}))
    4. Navigate to /reset-password — no ?code= param in URL
    5. readRecoveryNonce() finds valid-format nonce, dalGetAuthSession() returns session → form renders 'ready'
    6. Submit a new password meeting complexity rules
    7. updatePasswordController() validates rules → dalUpdateUserPassword() → supabase.auth.updateUser() → succeeds
    8. Password changed; no recovery email was sent or required
- Existing Defense:   sessionStorage nonce (UUID + issuedAt timestamp); canSubmit gated on status === 'ready'
- Why Defense Is Insufficient: sessionStorage is readable and writable by any JavaScript on the page. A source-code-aware user can reproduce both the key name and JSON schema from this file. The 30-minute TTL is reproducible via Date.now(). The nonce UUID is random but can be generated by the same crypto.randomUUID() available in the browser.
- Recommended Fix:    Server-side Edge Function that validates recovery session provenance before forwarding to updateUser. Two viable patterns:
    Pattern A — Server-issued signed recovery token on PASSWORD_RECOVERY event (see Suggested Patch below)
    Pattern B — Edge Function that verifies JWT is from a recovery session via auth.admin API (if Supabase exposes session type)
    Note: Supabase JWT AMR does not include method:'recovery' (uses 'otp'/'email') — Pattern A is recommended.
- Suggested Patch:    See Patch #1 in Suggested Patch Queue
- Follow-up Command:  DB (confirm Supabase admin API surface), Thor (release gate)
- Cross-References:   VEN-AUTH-001 (2026-06-04), ELEK-2026-06-04-001, BW-AUTH-004, BW-FP-001
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-002
- Title:              ?error= URL Parameter Aborts Recovery Link Without Consuming Code
- Category:           Auth Bypass (Denial of Recovery / Link Hijack)
- Severity:           LOW
- Status:             Open — NEW_FINDING_CREATED
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:78-108
- Source:             window.location.search → URLSearchParams.get('error') — attacker-injectable URL param
- Sink:               Early return { ok: false, error: '...' } before PKCE code exchange — code is never consumed
- Trust Boundary:     parseRecoveryParams() at setNewPassword.controller.js:78 — no origin validation on error param
- Impact:             Attacker who can modify a recovery link before the victim clicks it can abort the recovery flow
                      without consuming the PKCE code; code remains valid for attacker's own use; victim must request
                      a new link. Combined with email/link access: account takeover via code theft after link abort.
- Evidence:
    setNewPassword.controller.js:78-86 — parseRecoveryParams():
      const error = search.get('error') || hash.get('error')
      // No validation that 'error' originates from Supabase
    setNewPassword.controller.js:98-107 — if (error) check fires BEFORE if (code):
      if (error) {
        return { ok: false, session: null, error: import.meta.env.DEV ? ... : 'fixed message' }
      }
      if (code) { await dalExchangeRecoveryCode(code) ... }  // NEVER REACHED if error is set
    Supabase recovery email sends: /reset-password?code=REAL_CODE
    Attacker-modified version: /reset-password?code=REAL_CODE&error=foo
    → error branch fires → code never exchanged → code still valid on Supabase
- Reproduction Steps:
    1. Request a password reset — Supabase sends link: /reset-password?code=REAL_CODE
    2. Attacker with link access appends: &error=any → /reset-password?code=REAL_CODE&error=any
    3. Victim clicks modified link → "Link expired or invalid" shown
    4. Code was never consumed — still valid on Supabase until natural expiry
    5. Attacker can still exchange REAL_CODE on their own device (code path bypasses nonce gate)
    Note: Requires attacker to already have access to the recovery link URL.
- Existing Defense:   None — any string in ?error= param triggers early return
- Why Defense Is Insufficient: The error parameter is not validated against a Supabase-issued value set. Any truthy string aborts the flow before the code exchange branch is reached.
- Recommended Fix:    Validate the error parameter against known Supabase error codes before treating it as authoritative. Unknown error values should be ignored (allow code exchange to proceed).
- Suggested Patch:    See Patch #2 in Suggested Patch Queue
- Follow-up Command:  None required immediately; LOW severity
- Cross-References:   BW-FP-003 (partial coverage), VEN-FP-002 (adjacent — URL leakage)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-003
- Title:              DEV Mode Renders Attacker-Controlled error_description URL Param in Error Card
- Category:           XSS (text injection only — not script execution)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM — development environment only
- Location:           apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:104
                      apps/VCSM/src/features/auth/screens/ResetPasswordScreen.jsx:52-55
- Source:             window.location.search → search.get('error_description') — attacker-controlled URL param
- Sink:               {errorMessage} in React JSX — ResetPasswordScreen.jsx:52-55
- Trust Boundary:     import.meta.env.DEV gate at setNewPassword.controller.js:104
- Impact:             Attacker can craft a URL with arbitrary text in the error card — visible to developers on localhost.
                      No XSS (React escapes JSX expressions). Social engineering / phishing vector in DEV.
                      ZERO production impact.
- Evidence:
    setNewPassword.controller.js:104:
      error: import.meta.env.DEV
        ? (errorDescription || 'Reset link is invalid.')
        : 'Reset link is invalid or has expired. Please request a new one.'
    errorDescription = search.get('error_description') — user-supplied, no sanitization
    ResetPasswordScreen.jsx:52: <p className="...">{errorMessage || 'This reset link is invalid...'}</p>
    React JSX escapes text: <script>alert(1)</script> → rendered as visible text, not executed
    Confirmed: text injection present; script injection absent
- Reproduction Steps (DEV only):
    1. Navigate to http://localhost:5173/reset-password?error=x&error_description=Your+account+was+compromised
    2. "Link expired" card renders with: "Your account was compromised"
    3. Any text string accepted — HTML tags rendered as escaped text
- Existing Defense:   PROD: fixed message — PRESENT and correct; DEV: none
- Why Defense Is Insufficient: DEV branch passes raw URL param directly to error state variable with no wrapping or labeling. A shared devtools link could deliver misleading security messaging to another developer.
- Recommended Fix:    Wrap DEV error_description in a debug label: `[DEV: ${errorDescription}]` to make origin explicit. Low priority.
- Suggested Patch:    See Patch #3 in Suggested Patch Queue
- Follow-up Command:  None
- Cross-References:   BW-FP-003, BW-LOGIN-003 (code comment)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-004
- Title:              redirectTo Built from window.location.origin — No Hardcoded Production Domain
- Category:           URL and Redirect (defense-in-depth gap)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js:9
- Source:             window.location.origin — browser-derived, not user-controlled
- Sink:               supabase.auth.resetPasswordForEmail(email, { redirectTo }) — resetPassword.dal.js:4
- Trust Boundary:     Supabase dashboard redirect URL allowlist (external to this codebase)
- Impact:             In a development or misconfigured environment, recovery emails point to window.location.origin
                      (e.g., http://localhost:5173). If the Supabase allowlist is not properly maintained, a recovery
                      email sent from a non-production context could deliver a link to the wrong host.
                      No impact when Supabase allowlist is correctly configured.
- Evidence:
    sendResetPassword.controller.js:9:
      redirectTo: `${window.location.origin}/reset-password`
    window.location.origin returns the current page's origin — varies by environment
    No VITE_APP_URL or equivalent hardcoded origin in this controller
    Supabase validates redirectTo against configured allowed URLs list (server-side gate)
- Reproduction Steps:
    1. App running at http://localhost:5173
    2. User submits forgot-password form
    3. redirectTo = 'http://localhost:5173/reset-password'
    4. If 'http://localhost:5173' is in Supabase allowlist: recovery email links to localhost
    5. If not in allowlist: Supabase rejects the resetPasswordForEmail call
- Existing Defense:   Supabase dashboard allowlist — present at infrastructure level; not in this code
- Why Defense Is Insufficient: Defense is entirely external to the codebase. A misconfigured Supabase allowlist (e.g., wildcard *) would allow any origin to receive recovery links.
- Recommended Fix:    Use VITE_APP_URL env var with window.location.origin fallback. Ensures production builds always use the configured domain.
- Suggested Patch:    See Patch #4 in Suggested Patch Queue
- Follow-up Command:  None
- Cross-References:   VEN-FP-003
```

---

## Info Findings

```
INFO

- Finding ID:         ELEK-2026-06-05-005
- Title:              dalSignOutRecoverySession Failure Silently Swallowed
- Severity:           INFO
- Location:           apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:172-176
- Description:        After successful password update, dalSignOutRecoverySession() is called in a try/catch
                      with an empty catch block. If sign-out fails transiently, the recovery session JWT remains
                      valid until Supabase's natural expiry. No cross-user impact; the user's new password is already
                      set. Sign-out failure does not re-enable the old password.
- Risk:               The session persists briefly beyond intent — mitigated by Supabase's own JWT expiry.
- Recommendation:     Optional: log the failure to observability (non-throwing) so transient sign-out failures are
                      visible in monitoring. Not a required fix.
- Cross-References:   BW-AUTH-003
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       Email format validation missing from sendResetPassword.controller.js
- Location:        apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js:4-5
- Rejection reason: Sink (supabase.auth.resetPasswordForEmail) validates email format server-side;
                    invalid format returns a Supabase error that bubbles up as generic "Unable to send" message.
                    No data exposure, no auth bypass.
- Chain gap:        Impact — no meaningful impact beyond generic error display
- Notes:           Defense-in-depth recommendation only: add email regex to controller for defense-in-depth.
```

```
FALSE POSITIVE REJECTED

- Candidate:       redirectTo open redirect via window.location.origin spoofing
- Location:        apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js:9
- Rejection reason: window.location.origin is a read-only browser property; cannot be set by page JavaScript.
                    Browser security model prevents any page from writing to window.location.origin to redirect to
                    an attacker domain.
- Chain gap:        Source — window.location.origin is not user-controlled input
```

```
FALSE POSITIVE REJECTED

- Candidate:       Back-to-login link open redirect
- Location:        apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx:114-119
- Rejection reason: <Link to="/login"> uses hardcoded path. navigate('/login', { replace: true }) uses
                    hardcoded path. No external input accepted at either call site.
- Chain gap:        Source — no user-controlled input reaches redirect destination
```

```
FALSE POSITIVE REJECTED

- Candidate:       Password max length DoS via oversized input
- Location:        apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:166-169
- Rejection reason: evaluateRegisterPasswordRules applies complexity checks. Oversized strings rejected or
                    handled by Supabase's own updateUser endpoint limits. No VCSM-layer crash or data exposure.
- Chain gap:        Impact — no meaningful attacker gain beyond Supabase returning a validation error
```

```
FALSE POSITIVE REJECTED

- Candidate:       Multiple PASSWORD_RECOVERY event subscribers causing recovery state race
- Location:        apps/VCSM/src/features/auth/hooks/useSetNewPassword.js:46-49 (Path A)
                   apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js (Path B)
- Rejection reason: Race condition results in legitimate recovery flow failing (UX issue), not in security
                    bypass. The dual-path architecture (Path A watcher + Path B nonce fallback) is intentional
                    and documented in the code. No attacker-exploitable condition.
- Chain gap:        Impact — no security consequence; flow degrades gracefully to "invalid link" state
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-05-001 | Recovery session — server-side provenance enforcement | MEDIUM | Edge Function / Auth | COMPLEX | NO |
| 2 | ELEK-2026-06-05-002 | ?error= param — validate against Supabase error code allowlist | LOW | Controller | SIMPLE | NO |
| 3 | ELEK-2026-06-05-003 | DEV mode errorDescription — wrap in debug label | LOW | Controller | SIMPLE | NO |
| 4 | ELEK-2026-06-05-004 | redirectTo — use VITE_APP_URL with origin fallback | LOW | Controller | SIMPLE | NO |

---

### Patch #1 — ELEK-2026-06-05-001: Server-Side Recovery Provenance

**Pattern A — Server-issued short-lived signed recovery token (Recommended)**

The codebase already documents that Supabase JWT AMR does not include `method:'recovery'` — it uses `'otp'` or `'email'`. AMR-based detection is unreliable. The recommended approach is a server-issued signed token on PASSWORD_RECOVERY, exchanged alongside the JWT at update time.

```js
// AuthProvider.jsx — on PASSWORD_RECOVERY event
// (AFTER existing _setRecoveryFlag() call)
if (_evt === 'PASSWORD_RECOVERY') {
  _setRecoveryFlag()
  // Request a short-lived signed recovery token from the Edge Function
  // Token is bound to session.user.id, expires in 10 minutes
  try {
    const resp = await fetch('/functions/v1/issue-recovery-token', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${nextSession.access_token}` }
    })
    const { token } = await resp.json()
    sessionStorage.setItem('vc.auth.recovery.token', token)
  } catch { /* non-fatal; existing nonce path remains as fallback */ }
  navigate('/reset-password', { replace: true })
}
```

```js
// Edge Function: supabase/functions/issue-recovery-token/index.ts
// Issues a short-lived HMAC-signed token bound to userId
// Only callable with a valid JWT (Supabase enforces)
import { createClient } from '@supabase/supabase-js'
const RECOVERY_TOKEN_SECRET = Deno.env.get('RECOVERY_TOKEN_SECRET')

export default async (req) => {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(
    req.headers.get('Authorization')?.replace('Bearer ', '')
  )
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const token = await sign({ userId: user.id, exp: Date.now() + 10 * 60 * 1000 }, RECOVERY_TOKEN_SECRET)
  return new Response(JSON.stringify({ token }), { headers: { 'Content-Type': 'application/json' } })
}
```

```js
// Edge Function: supabase/functions/update-recovery-password/index.ts
// Validates JWT + signed recovery token before calling admin updateUser
export default async (req) => {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  const recoveryToken = req.headers.get('X-Recovery-Token')

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt)
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const payload = await verify(recoveryToken, RECOVERY_TOKEN_SECRET).catch(() => null)
  if (!payload || payload.userId !== user.id || payload.exp < Date.now()) {
    return new Response('Recovery token invalid or expired', { status: 403 })
  }

  const { password } = await req.json()
  // Server-side password validation here too
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
  if (updateError) return new Response('Failed', { status: 500 })

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
```

```js
// resetPassword.dal.js — replace dalUpdateUserPassword
export async function dalUpdateUserPassword(newPassword) {
  const { data: { session } } = await supabase.auth.getSession()
  const recoveryToken = sessionStorage.getItem('vc.auth.recovery.token')

  const response = await fetch('/functions/v1/update-recovery-password', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'X-Recovery-Token': recoveryToken ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  })
  if (!response.ok) {
    const msg = await response.text().catch(() => 'Unknown error')
    throw new Error(msg)
  }
}
```

---

### Patch #2 — ELEK-2026-06-05-002: ?error= Param Validation

```js
// setNewPassword.controller.js — replace parseRecoveryParams()

// Known Supabase-issued error codes for recovery flows
const SUPABASE_RECOVERY_ERRORS = new Set([
  'access_denied',
  'otp_expired',
  'invalid_grant',
  'email_not_confirmed',
])

function parseRecoveryParams() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))

  const rawError = search.get('error') || hash.get('error')
  // Only treat as error if it's a known Supabase error value.
  // Unknown values are ignored — allows code exchange to proceed.
  const error = SUPABASE_RECOVERY_ERRORS.has(rawError) ? rawError : null

  return {
    code: search.get('code'),
    error,
    errorDescription: search.get('error_description') || hash.get('error_description'),
  }
}
```

This prevents an attacker-injected `?error=foo` from aborting a valid recovery link. Only known Supabase error strings trigger the early abort path.

---

### Patch #3 — ELEK-2026-06-05-003: DEV Mode Debug Labeling

```js
// setNewPassword.controller.js:104 — replace the DEV branch
error: import.meta.env.DEV
  ? (errorDescription ? `[DEV: ${errorDescription}]` : 'Reset link is invalid.')
  : 'Reset link is invalid or has expired. Please request a new one.',
```

The `[DEV: ...]` wrapper makes it immediately visible to a developer that the text came from the URL, not from the application. Prevents misleading error text from appearing without context.

---

### Patch #4 — ELEK-2026-06-05-004: Hardcoded Production Domain

```js
// sendResetPassword.controller.js — replace line 9
// Use VITE_APP_URL if configured; fall back to window.location.origin for local dev.
// Ensures production builds always use the configured domain regardless of browser origin.
const appOrigin = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin

export async function ctrlSendResetPasswordEmail(email) {
  const normalizedEmail = String(email || '').trim()
  if (!normalizedEmail) throw new Error('Email is required.')

  await dalSendResetPasswordEmail({
    email: normalizedEmail,
    redirectTo: `${appOrigin}/reset-password`,
  })
}
```

Add `VITE_APP_URL=https://vibezcitizens.com` to the production `.env` file.

---

## THOR Release Gate Assessment

| Finding ID | Severity | Status | THOR Blocker |
|---|---|---|---|
| ELEK-2026-06-05-001 | MEDIUM | Open | YES — self-exploit auth bypass without recovery email; matches prior ELEK-2026-06-04-001 |
| ELEK-2026-06-05-002 | LOW | Open | NO — requires prior link access; DoS of recovery link only |
| ELEK-2026-06-05-003 | LOW | Open | NO — DEV environment only; PROD fully guarded |
| ELEK-2026-06-05-004 | LOW | Open | NO — defense-in-depth; Supabase allowlist is the real gate |
| ELEK-2026-06-05-005 | INFO | Open | NO |

ELEK-2026-06-05-001 is a THOR blocker — it confirms the same chain as ELEK-2026-06-04-001 is still open on current source. This is a scope re-verification finding, not a regression.

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Confirm Supabase admin API exposes session origin check; validate Edge Function deployment feasibility | PENDING |
| Thor | ELEK-2026-06-05-001 (MEDIUM) is a release blocker — evaluate gate status | PENDING |
| VENOM | VEN-AUTH-001 still open — ELEK confirms STILL_OPEN_SOURCE_VERIFIED on current code | CONFIRMED OPEN |
