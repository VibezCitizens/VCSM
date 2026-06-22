# Auth Input Validation Security Review
**Ticket:** TICKET-AUTH-INPUT-VALIDATION-001
**Date:** 2026-06-05
**Mode:** RED TEAM — READ ONLY
**Scope:** /apps/VCSM/src/features/auth, /app/providers, /app/routes, /app/guards

---

## Executive Summary

The VCSM auth input layer has a **sound structural foundation** — session guards are
correctly ordered, actor ownership checks are strict, and JSX auto-escaping eliminates
XSS from rendered output. The primary security boundary is Supabase (handles email
format, password strength, code validity at the server), and the codebase treats it
as such.

However, several **client-side validation gaps** exist that allow malformed or
adversarial inputs to reach Supabase without sanitization, and two redirect flows
lack whitelist enforcement. These are real but bounded risks given the React Router
constraint on external redirects.

---

## Overall Risk Rating

```
MEDIUM
```

| Dimension              | Score | Notes                                              |
|------------------------|-------|----------------------------------------------------|
| Input Validation       | 5/10  | Missing length limits, email format, invite_code   |
| Input Normalization    | 6/10  | trim() only — no toLower on email                  |
| XSS Resistance         | 9/10  | JSX auto-escaping throughout; no dangerouslySetInnerHTML |
| Injection Resistance   | 8/10  | Supabase parameterized; no raw SQL                 |
| Error Handling         | 6/10  | Raw err.message surfaces in login; DEV leakage     |
| Auth Flow Hardening    | 8/10  | Strong — user ID checks, nonce, email gate, consent gate |

---

## Findings

---

### FINDING-001 — Open Redirect via `location.state.from` (Blacklist, Not Whitelist)

**Severity:** HIGH
**Files:**
- `features/auth/hooks/useLogin.js` lines 69–84
- `features/auth/hooks/useRegister.js` lines 42–53

**Evidence:**

```js
// useLogin.js
const dest =
  from && !['/login', '/register', '/reset', '/forgot-password'].includes(from)
    ? from
    : '/feed'
navigate(dest, { replace: true })
```

```js
// useRegister.js navState
const fromState = typeof state.from === 'string' ? state.from : null
return {
  from: fromState ?? intentDest,
  card: typeof state.card === 'string' ? state.card : null,
  ...
}
```

**Attack Scenario:**
An attacker crafts a link that pre-sets React Router state with
`state.from = '/admin'` or any sensitive in-app route before redirecting
the user to `/login`. After successful authentication the user is navigated
to the attacker-chosen destination. React Router's `navigate()` cannot leave
the origin, so external open redirect is not possible in this configuration.
However, post-auth redirection to arbitrary internal routes (e.g., a
destructive action route or a privileged settings page) is feasible.

**Impact:** Internal redirect hijack. No external open redirect. Attacker
cannot redirect user out of the app. Low-to-medium practical impact.

**Recommended Fix:**
Replace blacklist with a path whitelist or restrict `from` to known safe
prefixes (e.g., `/feed`, `/explore`, `/profile`, `/vport`). Example:

```js
const ALLOWED_RETURN_PREFIXES = ['/feed', '/explore', '/profile', '/vport', '/dashboard']
const isSafeDest = (p) => ALLOWED_RETURN_PREFIXES.some(prefix => p.startsWith(prefix))
const dest = from && isSafeDest(from) ? from : '/feed'
```

**Refactor Risk:** Low — change is isolated to redirect resolution logic.

---

### FINDING-002 — Invite Code Has Zero Validation

**Severity:** HIGH (deferred — feature is currently inert)
**File:** `features/auth/hooks/useRegister.js` lines 34–40

**Evidence:**

```js
const inviteCode = useMemo(() => {
  const params = new URLSearchParams(location.search)
  return params.get('invite_code') || null
}, [location.search])

// TODO: after signup, look up vc.vibe_invites by invite_code
// and mark it accepted to attribute the new user back to the inviter actor.
```

**Attack Scenario:**
`invite_code` is accepted raw from the URL query string with no validation:
no length limit, no format check (UUID vs. arbitrary string), no encoding
check. It is currently stored in state but not sent to the DB. Once the
TODO is completed and it flows to a Supabase query or RPC, an unsanitized
value could reach the database. Depending on how the lookup is constructed,
this creates a second-order injection or IDOR surface.

A 10,000-character invite_code would silently propagate through the current
system with no rejection.

**Impact:** Currently inert. Upon feature completion, high risk if no
validation is added at call site.

**Recommended Fix:**
Before the TODO is implemented, add a format guard:

```js
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const inviteCode = useMemo(() => {
  const raw = new URLSearchParams(location.search).get('invite_code') || null
  if (!raw) return null
  return UUID_REGEX.test(raw) ? raw : null
}, [location.search])
```

**Refactor Risk:** Minimal — single guard at extraction point.

---

### FINDING-003 — DEV Mode Leaks Attacker-Controlled `error_description`

**Severity:** MEDIUM (production is guarded; DEV-only risk)
**File:** `features/auth/controllers/authCallback.controller.js` lines 38–47

**Evidence:**

```js
if (error) {
  return {
    ok: false,
    error: import.meta.env.DEV
      ? (errorDescription || 'Verification failed.')  // ← attacker-controlled
      : 'Verification failed. Please try again or request a new link.',
  }
}
```

```js
// errorDescription extracted from URL hash:
errorDescription: search.get('error_description') || hash.get('error_description'),
```

**Attack Scenario:**
In DEV mode, an attacker can craft a callback URL with an arbitrary
`error_description` value and it will be rendered in the UI. This enables
reflected text injection in DEV environments. CI preview deployments that
run in DEV mode would be vulnerable. Production is correctly guarded with a
fixed message.

**Impact:** DEV/staging only. Reflected text injection; no script execution
(JSX escapes). Could be used for phishing-style text on preview deployments.

**Recommended Fix:**
Strip `errorDescription` from the DEV branch entirely. The status code or
a sanitized error type is enough for developer debugging:

```js
error: import.meta.env.DEV
  ? `Verification failed [code: ${error}]`  // use error code, not description
  : 'Verification failed. Please try again or request a new link.',
```

**Refactor Risk:** Zero — one-line change.

---

### FINDING-004 — No Client-Side Email Length Limit

**Severity:** MEDIUM
**Files:**
- `features/auth/controllers/sendResetPassword.controller.js` line 2
- `features/auth/dal/login.dal.js`
- `features/auth/dal/register.dal.js`

**Evidence:**

```js
// sendResetPassword.controller.js
const normalizedEmail = String(email || '').trim()
if (!normalizedEmail) throw new Error('Email is required.')
// → passes directly to supabase.auth.resetPasswordForEmail
```

```js
// login.dal.js
export async function dalSignInWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password })
}
```

**Attack Scenario:**
No length check exists before the Supabase call. A 100,000-character email
string would be sent to the Supabase auth endpoint. Supabase enforces server-
side limits, but the unchecked payload reaches the network. At volume this
is a minor resource amplifier (each oversized payload consumes network and
processing). Combined with absent rate-limiting at the client layer, a
script can flood the auth endpoint with large payloads.

**Impact:** Amplified load on Supabase auth endpoint. Not a vulnerability
in isolation but contributes to abuse surface.

**Recommended Fix:**
Add a length guard at input validation layer:

```js
const MAX_EMAIL_LENGTH = 254  // RFC 5321 limit
if (email.length > MAX_EMAIL_LENGTH) throw new Error('Email address is too long.')
```

**Refactor Risk:** Zero.

---

### FINDING-005 — No Client-Side Password Maximum Length

**Severity:** MEDIUM
**File:** `features/auth/model/registerPasswordRules.model.js`

**Evidence:**

```js
const PASSWORD_RULES = Object.freeze([
  { key: 'minLength', label: 'Minimum 8 characters', test: (v) => v.length >= 8 },
  { key: 'lowercase', ...},
  { key: 'uppercase', ...},
  { key: 'number', ...},
])
```

No maximum length rule exists.

**Attack Scenario:**
bcrypt (used by Supabase internally) silently truncates passwords at 72 bytes.
A 10,000-character password is accepted and registered, but only the first
72 bytes are actually stored and compared. A user who registers with a very
long password can later log in with only the first 72 characters. This is a
bcrypt-level behavior, not a bug in this code — but without a max length
check, users can set passwords they believe are longer than what is actually
validated.

Additionally, a very long password sent on every login attempt amplifies
hashing cost on the server.

**Impact:** UX confusion + minor server resource amplification. Not an
account takeover vector but a correctness issue.

**Recommended Fix:**
Add a max length rule:

```js
{ key: 'maxLength', label: 'Maximum 72 characters', test: (v) => v.length <= 72 },
```

**Refactor Risk:** Zero.

---

### FINDING-006 — Email Not Lowercased Before Supabase Calls

**Severity:** LOW
**Files:** All auth DAL and controller files

**Evidence:**

```js
// sendResetPassword.controller.js
const normalizedEmail = String(email || '').trim()
// trim() only — no toLowerCase()
```

**Attack Scenario:**
Supabase normalizes email addresses internally (case-insensitive matching),
but the client sends raw mixed-case values. A user registered as
`User@Example.com` who attempts to log in as `user@example.com` will succeed
(Supabase handles it), but inconsistent casing in client-side analytics,
logs, and any future client-side email lookups creates confusion and potential
lookup mismatches if caching is ever introduced.

**Impact:** Primarily a data consistency and normalization issue. Low security
impact today; medium risk if client-side email lookups are added.

**Recommended Fix:**
```js
const normalizedEmail = String(email || '').trim().toLowerCase()
```

**Refactor Risk:** Zero. Apply at every controller entry point before Supabase calls.

---

### FINDING-007 — Recovery Nonce Is Client-Side Only (Self-Exploitation Known)

**Severity:** LOW (documented; self-exploitation only)
**Files:**
- `app/providers/AuthProvider.jsx` lines 46–58
- `features/auth/controllers/setNewPassword.controller.js` lines 31–75

**Evidence:**

```js
// AuthProvider.jsx — nonce written on PASSWORD_RECOVERY event only
function _setRecoveryFlag() {
  sessionStorage.setItem(RECOVERY_FLAG_KEY, JSON.stringify({
    nonce: crypto.randomUUID() /* or Math.random() fallback */,
    issuedAt: Date.now(),
  }))
}
```

```js
// setNewPassword.controller.js — gate reads nonce from sessionStorage
function readRecoveryNonce() {
  const raw = sessionStorage.getItem(RECOVERY_FLAG_KEY)
  // ... parses and validates TTL ...
}
```

**Attack Scenario:**
The nonce is a client-side control only. A user with JavaScript console access
(same origin) can:
1. Inspect the nonce format (JSON, `{nonce: string, issuedAt: number}`)
2. Write a conforming nonce to `sessionStorage` manually
3. Navigate to `/reset-password` while holding any valid authenticated session
4. Submit a new password via `supabase.auth.updateUser`

This is self-exploitation only — the attacker must already have a valid
authenticated session on the same origin. No cross-user path exists.

The recovery nonce is documented internally (VENOM-AUTH-001 comment in source)
as a client-side control with known limitations.

**Impact:** Self-exploitation only. Prevents casual access; does not prevent
determined technical bypass by the authenticated user themselves.

**Recommended Fix:**
The correct fix is server-side — Supabase should enforce that `updateUser`
is called within a `PASSWORD_RECOVERY` session context. This requires either:
- A Supabase Edge Function wrapper that checks `session.aal` and `amr` claims
- Or accepting the limitation as documented

Client-side nonce provides UX-layer protection adequate for the current threat model.

**Refactor Risk:** High if server-side enforcement is added (requires Edge Function).

---

### FINDING-008 — Raw Supabase Error Messages Surface in Login UI

**Severity:** LOW
**File:** `features/auth/hooks/useLogin.js` lines 90–94

**Evidence:**

```js
if (isEmailNotConfirmedError(err)) {
  setError('Please verify your email before continuing.')
} else {
  setError(err?.message || 'Login failed')
}
```

**Attack Scenario:**
If Supabase returns a non-standard error (e.g., during outages, misconfiguration,
or rate limiting), the raw `err.message` string is surfaced directly to the UI
with no sanitization or mapping. This could expose:
- Internal service names
- Database identifiers
- Rate limiting thresholds
- API version strings

Supabase auth errors are typically generic (`Invalid login credentials`) but
this assumption is fragile if error structure changes.

**Impact:** Low. Supabase auth errors are generally safe to display, but the
pattern is risky if error messages become more verbose.

**Recommended Fix:**

```js
const SAFE_AUTH_MESSAGES = new Set([
  'Invalid login credentials',
  'Email not confirmed',
  'User already registered',
])
const safeMessage = SAFE_AUTH_MESSAGES.has(err?.message)
  ? err.message
  : 'Login failed. Please try again.'
setError(safeMessage)
```

**Refactor Risk:** Low.

---

### FINDING-009 — `state.card` Passes Through Without Validation

**Severity:** LOW
**File:** `features/auth/hooks/useRegister.js` lines 42–53

**Evidence:**

```js
card: typeof state.card === 'string' ? state.card : null,
```

**Attack Scenario:**
`state.card` is accepted if it passes `typeof === 'string'`. It is passed
into navState and eventually into component props. If any component renders
`state.card` in a URL, CSS class string, or component selector, an arbitrary
string could cause unintended behavior. No current XSS risk (JSX escaping),
but the lack of format validation is inconsistent with other guarded fields.

**Impact:** Low. Not currently exploitable but represents a lint-level gap.

**Recommended Fix:**
Apply the same whitelist pattern used for `intent`:

```js
const VALID_CARDS = ['profile', 'vport', 'booking']
card: VALID_CARDS.includes(state.card) ? state.card : null,
```

**Refactor Risk:** Zero.

---

### FINDING-010 — No Client-Side Rate Limiting on Auth Forms

**Severity:** INFO
**Files:** All auth form hooks (useLogin, useRegister, useResetPassword)

**Evidence:**
No debounce, cooldown, or retry counter exists on any auth form submit handler.
The Login, Register, and Forgot Password forms submit on every button press
with no delay or lockout.

**Attack Scenario:**
A user (or script) can click Submit repeatedly in rapid succession, generating
multiple identical Supabase auth calls per second. Supabase applies server-side
rate limiting, but the client amplifies load by sending every click without
throttle.

**Impact:** Minor. Supabase rate limiting is the real control. No credential
stuffing acceleration (Supabase's rate limiter stops this). Primarily a UX
and cost concern.

**Recommended Fix:**
Disable the submit button during in-flight requests (already done via `loading`
state in most forms, but verify Forgot Password flow). Add a 2-second cooldown
after each submission attempt.

**Refactor Risk:** Zero.

---

## Q&A Summary

**1. Are login inputs safe?**
Partially. Email is trimmed but not lowercased or length-limited before
reaching Supabase. Password has no maximum length. The redirect destination
(`from`) uses a blacklist rather than a whitelist. Raw Supabase error messages
surface in the UI. Supabase handles format and credential validation
server-side, making these gaps low-impact but not zero-risk.

**2. Are registration inputs safe?**
Mostly. Password rules are enforced client-side with proper evaluation.
`display_name` and `username_base` have no client-side length limits (server
enforces via DB constraint). `invite_code` has zero validation and will be
dangerous when the feature is completed. Intent URL param is correctly whitelisted.

**3. Are reset flows safe?**
The forgot-password flow is safe (email trimmed, redirectTo uses
`window.location.origin`). The reset-password recovery nonce is a client-only
control with known bypass (self-exploitation, documented). Server-side
enforcement is absent but consistent with how Supabase manages recovery
sessions.

**4. Are redirects safe?**
No — both `useLogin` and `useRegister` accept `location.state.from` with
blacklist validation only. While React Router prevents external redirects,
arbitrary in-app destinations are accepted. This should be changed to whitelist.

**5. Are storage values trusted too much?**
Mostly no. The recovery nonce in `sessionStorage` is parsed with TTL
validation and type checking. `localStorage` values (`actor_kind`,
`actor_vport_id`) are read on logout for cleanup only, not for auth decisions.
Session tokens are managed by the Supabase SDK. The one weakness is the
recoverable nonce bypass described in FINDING-007.

**6. Is there any XSS risk?**
No. JSX auto-escaping prevents HTML injection from any user-controlled value.
No `dangerouslySetInnerHTML` usage was found across any auth file. DEV mode
leaks attacker-controlled text (FINDING-003) but without script execution.

**7. What should be fixed first?**
Priority order:
1. **FINDING-001** — whitelist the `from` redirect (5 minutes, zero risk)
2. **FINDING-002** — add UUID format guard to `invite_code` before feature ships
3. **FINDING-003** — remove `errorDescription` from DEV branch rendering
4. **FINDING-004/005** — add email max length (254) and password max length (72)
5. **FINDING-006** — add `.toLowerCase()` to all email normalization paths
6. **FINDING-008** — map raw Supabase error messages to safe user strings

---

## Files Reviewed

| Category | Files |
|---|---|
| Controllers | login, register, authCallback, authSession, sendResetPassword, setNewPassword, onboarding, completeProfileGate, createUserActor, profileOnboarding, profile, authOps, resendVerification |
| DALs | login, register, authCallback, authSession.read, onboarding, profile, resetPassword, emailVerification |
| Models | registerPasswordRules, onboarding, profile, actor, emailVerification |
| Hooks | useLogin, useRegister, useAuthCallback, useSetNewPassword, useResetPassword, useResendVerification, useAuthOnboarding, useAuthOps, useJoinOnboarding |
| Screens | LoginScreen, RegisterScreen, ResetPasswordScreen, ForgotPasswordScreen, AuthCallbackScreen, VerifyEmailRequiredScreen, Onboarding, WelcomeScreen |
| Providers | AuthProvider |
| Routes | index, auth.routes, AuthPublicRoute |
| Guards | ProtectedRoute |
| Tests | authCallback.controller.test |

---

*Report generated: 2026-06-05 | Ticket: TICKET-AUTH-INPUT-VALIDATION-001 | Mode: READ ONLY*
