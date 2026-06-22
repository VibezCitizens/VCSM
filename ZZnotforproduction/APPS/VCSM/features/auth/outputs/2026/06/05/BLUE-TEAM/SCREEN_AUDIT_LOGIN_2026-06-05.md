# SCREEN AUDIT — /login
**Date:** 2026-06-05
**Mode:** Runtime + Source Verification
**Commands:** VENOM + BLACKWIDOW + ELEKTRA (combined)
**Session:** Read-Only
**Application:** VCSM
**Environment:** localhost:5173

---

## PHASE 1 — SCREEN SURFACE MAP

| Field | Value |
|---|---|
| Route | `/login` |
| Screen | `LoginScreen.jsx` |
| Feature | `auth` |
| Module | Authentication |
| Session Required | NO (public route) |
| Actor Required | NO |

### Visible Actions

| Action | Type | Target |
|---|---|---|
| Login form submit | Form POST (email + password) | `signInWithPassword` |
| Forgot password | Link | `/forgot-password` |
| Create account | Link | `/register` (with navState) |
| About | Link | `/about` |
| Contact | Link | `/contact` |
| Privacy | Link | `/legal/privacy-policy` |
| Terms | Link | `/legal/terms-of-service` |
| iOS Install prompt | Conditional button | `IosInstallPrompt` modal |

### Forms

| Form | Fields | Validation |
|---|---|---|
| Login | email (type=email, required), password (type=password, required) | Client: trim + non-empty; Server: Supabase Auth |

### API / DAL Calls (triggered on login submit)

| Call | Layer | Target |
|---|---|---|
| `dalSignInWithPassword` | DAL | `supabase.auth.signInWithPassword` |
| `dalHydrateAuthSession` | DAL | `supabase.auth.getSession` |
| `dalGetAuthSession` | DAL | `supabase.auth.getSession` (profile check) |
| `dalGetProfileDiscoverable` | DAL | `profiles` SELECT `(id, discoverable)` |
| `dalUpdateProfileDiscoverable` | DAL | `profiles` UPDATE `(discoverable, updated_at)` |

### RPC Calls
None directly from login screen.

---

## PHASE 2 — VENOM FINDINGS

### V-01 — Public Route Access Control
**Status:** PASS
**Severity:** —

`/login` is wrapped in `AuthPublicRoute` which checks `useAuth()`. If `user !== null`, the route redirects to `/feed`. Unauthenticated users reach the login form. This is correct pre-auth behavior.

---

### V-02 — Post-Login Redirect (Open Redirect via state)
**Status:** PASS
**Severity:** —

`useLogin.js` extracts `location.state.from` and constructs the post-login destination:
```js
const dest =
  from && !['/login', '/register', '/reset', '/forgot-password'].includes(from)
    ? from
    : '/feed'
```
`location.state` is React Router in-memory state. It **cannot** be set via URL query parameters or hash. External URLs cannot be injected here. The blocklist prevents redirect loops. No open redirect path exists.

---

### V-03 — Profile Discoverability Mutation Ownership
**Status:** CAUTION
**Severity:** LOW

After login, `ensureProfileDiscoverable(data.user.id)` is called. The controller validates:
```js
if (!session?.user?.id || session.user.id !== userId) return
```
This prevents mismatched userId execution. The DAL calls `profiles.update().eq('id', userId)` which correctly scopes the update to the caller's own row. **However**, the enforcement of this scope at the DB level depends on RLS policy on the `profiles` table — which is not verified in this audit. Relying solely on controller-layer validation without confirmed RLS is a trust boundary gap.

**Action Required:** DB/Carnage audit to confirm `profiles` table has enforced RLS `auth.uid() = id` for UPDATE operations.

---

### V-04 — Email Enumeration via Error Differentiation
**Status:** CAUTION
**Severity:** MEDIUM

`useLogin.js` checks `isEmailNotConfirmedError(signInError)` and returns a distinct message:
> "Please verify your email before continuing."

This message is only shown when an account EXISTS but the email is unverified. Supabase returns "Invalid login credentials" for unknown accounts — a different message string. An attacker can systematically determine whether an email address is registered by comparing response messages.

**Observed behavior:** Registered+unverified → "Please verify your email" / Unknown → generic Supabase error.
**Impact:** Account enumeration at login endpoint.

---

### V-05 — `/reset-password` Not Behind AuthPublicRoute
**Status:** CAUTION
**Severity:** LOW (Known / Documented)

`auth.routes.jsx` line 47 explicitly excludes `/reset-password` from `AuthPublicRoute`. The comment documents the reason: wrapping it would redirect valid PASSWORD_RECOVERY sessions (which set `user`) away from the form, breaking PKCE recovery.

The actual access control is the controller-layer recovery nonce. This design is intentional and documented.

---

### V-06 — Recovery Nonce — Client-Side Only
**Status:** CAUTION
**Severity:** MEDIUM (Self-Exploitation Only, Known / Documented)

The recovery gate (`vc.auth.recovery` in sessionStorage) is a client-side UUID nonce. `setNewPassword.controller.js` and `AuthProvider.jsx` both document explicitly:

> "A source-code-aware user who holds any valid authenticated session and sets a structurally conforming nonce CAN reach and successfully submit the password update form. Impact is self-exploitation only — no cross-user path exists."

This is a **self-exploitation** vector only. A user can change their own password via their own valid session. No cross-user exploitation path exists. Supabase `updateUser({ password })` requires an authenticated JWT — the update only applies to the caller's own account.

Full provenance closure would require a server-side Edge Function that validates recovery session origin before forwarding to `updateUser`. This is documented as a deferred architectural enhancement.

**Ticket:** VENOM-AUTH-001 (already documented in source)

---

## PHASE 3 — BLACKWIDOW FINDINGS

### BW-01 — React Router State Injection
**Status:** EXPLOIT_BLOCKED

`navState` is derived from `location.state.from` and `location.state.card`. Both are typed and validated in `LoginScreen.jsx`:
```js
const navState = useMemo(() => {
  const s = location?.state || {}
  return {
    from: typeof s.from === 'string' ? s.from : null,
    card: typeof s.card === 'string' ? s.card : null,
  }
}, [location])
```
React Router state cannot be set via URL params. A crafted URL cannot inject `from` or `card` values. Type-checking enforces string-only values.

---

### BW-02 — `accountDeleted` / `emailConfirmed` State Spoofing
**Status:** EXPLOIT_BLOCKED

These values control UI banners only:
```js
const accountDeleted = location?.state?.accountDeleted === true
const emailConfirmed = location?.state?.emailConfirmed === true
```
They gate `<div>` rendering only — no access decisions, no mutations, no routing. Spoofing them via in-app navigation would only cause a cosmetic banner to appear. No exploitable path.

---

### BW-03 — Email Enumeration Attack Chain
**Status:** EXPLOIT_REACHABLE
**Severity:** MEDIUM

Attack chain:
1. Attacker submits email address via the login form
2. If account exists + unverified: response contains "Please verify your email before continuing."
3. If account does not exist: Supabase returns generic "Invalid login credentials" error
4. Repeat at scale to enumerate registered emails

No rate limiting is visible at the controller or DAL layer. Supabase may apply its own auth rate limiting (project-level setting) — but this is not enforced in application code.

---

### BW-04 — Recovery Nonce Forgery
**Status:** EXPLOIT_REACHABLE (Self only)
**Severity:** MEDIUM (Self-Exploitation)

Attack chain:
1. Attacker is logged in to their own account (valid session)
2. Navigates to `/reset-password` directly
3. Opens DevTools → Application → Session Storage
4. Sets `vc.auth.recovery` = `{"nonce":"<any-uuid>","issuedAt":<recent-ms>}`
5. Page resolves the form to `ready` state
6. Submits a new password via `supabase.auth.updateUser({ password })`
7. Own account's password is changed

Impact: self-only. Cannot affect other accounts. Documented and acknowledged in source.

---

### BW-05 — `errorDescription` URL Parameter (DEV)
**Status:** EXPLOIT_BLOCKED (Production)

`resolveRecoverySessionController` reads `error_description` from URL:
```js
error: import.meta.env.DEV
  ? (errorDescription || 'Reset link is invalid.')
  : 'Reset link is invalid or has expired. Please request a new one.',
```
In production, the URL-supplied value is discarded and a fixed string is shown. No user-reflected output. EXPLOIT_BLOCKED in production.

---

### BW-06 — Stale Loading Gate Race (AuthPublicRoute)
**Status:** EXPLOIT_BLOCKED

`AuthPublicRoute` renders `null` while `loading === true`. An attacker cannot exploit the loading window because:
1. `loading` is only `true` during initial session hydration (async Supabase call)
2. The component renders nothing — no form, no links, no interactive surface
3. No race window allows bypassing the `user` check

---

## PHASE 4 — ELEKTRA CHAIN MAP

### Chain 1 — Login Form Submission

```
SOURCE:     LoginScreen.jsx :: <form onSubmit={onSubmit}>
→ HOOK:     useLogin.js :: handleLogin(e)
→ CTRL:     login.controller.js :: signInWithPassword({ email, password })
→ DAL:      login.dal.js :: dalSignInWithPassword({ email, password })
→ SINK:     supabase.auth.signInWithPassword({ email, password })
→ BOUNDARY: Supabase Auth (server-managed JWT, bcrypt password hash)
→ VERDICT:  CLEAN — no application-layer credential handling
```

---

### Chain 2 — Post-Login Session Hydration

```
SOURCE:     useLogin.js :: hydrateAuthSession() [called after signIn]
→ CTRL:     authSession.controller.js :: hydrateAuthSession()
→ DAL:      authSession.read.dal.js :: dalHydrateAuthSession()
→ SINK:     supabase.auth.getSession()
→ NOTE:     Redundant — AuthProvider.onAuthStateChange also fires SIGNED_IN
→ VERDICT:  CLEAN (redundant call, no security impact)
```

---

### Chain 3 — Profile Discoverability Update

```
SOURCE:     useLogin.js :: ensureProfileDiscoverable(data.user.id)
→ CTRL:     profile.controller.js :: ensureProfileDiscoverable(userId)
  BOUNDARY: session.user.id === userId check [controller layer]
→ DAL:      profile.dal.js :: dalGetProfileDiscoverable(userId)
→ SINK:     supabase.from('profiles').select('id, discoverable').eq('id', userId)
→ DAL:      profile.dal.js :: dalUpdateProfileDiscoverable({ userId, discoverable, updatedAt })
→ SINK:     supabase.from('profiles').update({...}).eq('id', userId)
→ BOUNDARY: RLS on profiles table (unconfirmed in this audit)
→ VERDICT:  CAUTION — controller-layer ID guard is present; RLS enforcement unconfirmed
```

**Missing verification:** No evidence from source that `profiles` table has `auth.uid() = id` enforced for UPDATE at DB level. Requires DB review.

---

### Chain 4 — Post-Login Navigation Redirect

```
SOURCE:     useLogin.js :: location.state.from extraction
  GATE 1:  typeof rawFrom === 'string' check
  GATE 2:  blocklist ['/login', '/register', '/reset', '/forgot-password']
→ SINK:    navigate(dest, { replace: true })
→ BOUNDARY: React Router (in-memory state — no URL injection)
→ VERDICT:  CLEAN
```

---

### Chain 5 — Route Guard (AuthPublicRoute)

```
SOURCE:     Route render → AuthPublicRoute
→ HOOK:     useAuth() → AuthContext.user
  BRANCH:   loading === true → render null
  BRANCH:   user !== null → Navigate to /feed
  BRANCH:   user === null → render children (login form)
→ VERDICT:  CLEAN
```

---

### Chain 6 — AuthProvider Recovery Flag (Password Recovery)

```
SOURCE:     AuthProvider :: onAuthStateChange callback
  EVENT:    PASSWORD_RECOVERY → _setRecoveryFlag() + navigate('/reset-password')
→ SINK:     sessionStorage.setItem('vc.auth.recovery', JSON.stringify({nonce, issuedAt}))
→ BOUNDARY: sessionStorage (client-side, readable/writable by page JS)
  NOTE:     Nonce requires UUID format; issuedAt TTL is 30min; self-exploitation only
→ VERDICT:  CAUTION (acknowledged, documented, self-exploitation only)
```

---

### Chain 7 — Password Reset Controller

```
SOURCE:     ResetPasswordScreen → useSetNewPassword → updatePasswordController
  GATE 1:  resolveRecoverySessionController()
    PATH A: PKCE code exchange (dalExchangeRecoveryCode) — single-use server-issued code
    PATH B: Recovery nonce check (readRecoveryNonce()) + getSession() check
  GATE 2:  evaluateRegisterPasswordRules(password)
→ CTRL:    updatePasswordController({ password })
→ DAL:     dalUpdateUserPassword(password)
→ SINK:    supabase.auth.updateUser({ password })
→ BOUNDARY: Supabase JWT required (own account only)
→ VERDICT:  CAUTION (nonce bypassable by source-code-aware actor, self-exploitation only)
```

---

## PHASE 5 — SCREEN SECURITY SCORE

| Category | Status | Notes |
|---|---|---|
| Authentication | PASS | AuthPublicRoute correctly gates login screen |
| Authorization | PASS | No protected data accessible pre-auth |
| Ownership | CAUTION | Profile update controller-gated; RLS unconfirmed |
| Route Security | PASS | React Router state prevents URL injection |
| API Security | PASS | Supabase Auth handles credential verification |
| RPC Security | N/A | No direct RPCs on this screen |
| Data Exposure | CAUTION | Email enumeration via error message differentiation |
| Exploit Resistance | CAUTION | Recovery nonce forging (self-exploitation); email enumeration |
| Chain Verification | PASS | All chains traced; no broken auth boundaries |

---

## PHASE 6 — THOR INPUT PACKAGE

### THOR_SCREEN_SUMMARY — /login

| Metric | Count |
|---|---|
| Total Findings | 6 |
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 2 |
| CAUTION (Known/Documented) | 2 |

### Medium Findings

| ID | Finding | Chain |
|---|---|---|
| V-04 / BW-03 | Email enumeration via error differentiation | signInWithPassword → isEmailNotConfirmedError → distinct UX message |
| V-06 / BW-04 | Recovery nonce client-side forgery (self-exploitation) | sessionStorage nonce → setNewPassword.controller → updateUser |

### Low Findings

| ID | Finding | Chain |
|---|---|---|
| V-03 | profiles UPDATE relies on unconfirmed RLS | ensureProfileDiscoverable → profiles.update |
| V-05 | /reset-password not behind AuthPublicRoute (documented as intentional) | auth.routes.jsx |

### Known / Documented (Pre-Tagged in Source)

- VENOM-AUTH-001: Recovery nonce limitation — self-exploitation only
- BW-LOGIN-001: AMR claims unavailable in Supabase v2 for recovery sessions
- BW-LOGIN-003: errorDescription URL param gated to DEV only in production

### Runtime Risks
- Email enumeration exploitable without rate limiting at application layer
- Supabase project-level rate limiting unverified (must confirm in Supabase dashboard)

### Authorization Risks
- Recovery nonce bypassable (self-exploitation only, no cross-user path)

### Exploit Paths
- BW-03: Email enumeration — requires no authentication, no rate limiting
- BW-04: Recovery nonce forgery — requires own valid session, self only

### Source-to-Sink Risks
- Chain 3: `profiles` UPDATE boundary relies on RLS (not confirmed in audit)

---

## FINAL VERDICT

```
SCREEN_CAUTION
```

**Reason:** Two MEDIUM findings present (email enumeration, recovery nonce self-exploitation). No CRITICAL or HIGH findings. All critical chains are correctly gated. Screen is pre-auth and has no data exposure beyond its authentication surface. Suitable for continued operation with the two MEDIUM items tracked.

**Blocker for THOR release:** No blockers from this screen specifically.
**Follow-up required:**
1. DB review to confirm `profiles` RLS enforces `auth.uid() = id` for UPDATE
2. Consider Supabase project-level rate limiting for auth endpoints
3. Consider normalizing email-not-confirmed error to match generic Supabase error (reduces enumeration surface)

---

*Report generated 2026-06-05 by VENOM + BLACKWIDOW + ELEKTRA combined screen audit*
