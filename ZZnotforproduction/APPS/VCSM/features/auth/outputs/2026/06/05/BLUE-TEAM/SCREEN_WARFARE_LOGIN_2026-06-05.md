# VCSM SCREEN WARFARE AUDIT — /login
**Date:** 2026-06-05
**Mode:** Runtime + Source Verification
**Commands:** VENOM + BLACKWIDOW + ELEKTRA
**Session:** Read-Only
**Prior findings inherited:** NONE
**Scope:** Current screen and directly reachable execution paths only

---

## PHASE 1 — SCREEN SURFACE MAP

| Field | Value |
|---|---|
| Route | `/login` |
| Screen Name | `LoginScreen` |
| Source | `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` |
| Feature | `auth` |
| Module | Authentication |
| Session Requirement | NONE (public route) |
| Actor Requirement | NONE |

### Visible UI Elements

| Element | Type | Value / Target |
|---|---|---|
| Title | Text | "Vibez Citizens" |
| Tagline | Text | "Where your vibez belongs." |
| Email | Input (type=email, required, autocomplete=email) | Controlled — `setEmail` |
| Password | Input (type=password, required, autocomplete=current-password) | Controlled — `setPassword` |
| Login | Button (type=submit) | Triggers `handleLogin` |
| Beta badge | Decorative span | None |
| Forgot password | Link | `/forgot-password` |
| Create account | Link | `/register` + navState |
| About | Link | `/about` |
| Contact | Link | `/contact` |
| Privacy | Link | `/legal/privacy-policy` |
| Terms | Link | `/legal/terms-of-service` |
| emailConfirmed banner | Conditional div | Shown when `location.state.emailConfirmed === true` |
| accountDeleted banner | Conditional div | Shown when `location.state.accountDeleted === true` |
| Error banner | Conditional div | Shown when `error` state is non-empty |
| iOS Install button | Conditional button | Shown on iOS Safari non-standalone only — opens `IosInstallPrompt` modal |
| Seasonal decorations | Visual only | Fog divs, Xmas hat image |

### Forms

| Form | Fields | Client Validation |
|---|---|---|
| Login | email, password | `email.trim()` + `password.trim()` non-empty; HTML `required` |

### API Calls (triggered by login submit)

| Call | DAL | Sink |
|---|---|---|
| Sign in | `dalSignInWithPassword` | `supabase.auth.signInWithPassword` |
| Session hydration | `dalHydrateAuthSession` | `supabase.auth.getSession` |
| Profile read | `dalGetProfileDiscoverable` | `profiles SELECT (id, discoverable)` |
| Profile write (conditional) | `dalUpdateProfileDiscoverable` | `profiles UPDATE (discoverable, updated_at)` |

### Automatic Lifecycle Actions

| Action | Trigger | Source |
|---|---|---|
| Session hydration | App mount (AuthProvider) | `supabase.auth.getSession()` |
| Auth state subscription | App mount (AuthProvider) | `supabase.auth.onAuthStateChange` |
| Route guard check | Route render (AuthPublicRoute) | `useAuth().user` |
| iOS UA check | `useEffect` on LoginScreen mount | `navigator.userAgent`, `window.matchMedia` |

### RPC Calls
None directly reachable from this screen.

---

## PHASE 2 — VENOM FINDINGS

---

### V-01 — Route Guard Enforcement
**Status:** PASS
**Severity:** —

`/login` is wrapped in `AuthPublicRoute`:

```js
// AuthPublicRoute.jsx
if (loading) return null
if (user) return <Navigate to="/feed" replace />
return children
```

Source: `apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx`
Route config: `apps/VCSM/src/app/routes/public/auth.routes.jsx` line 13–18

Authenticated users are redirected to `/feed`. Unauthenticated users see the form. Loading state renders nothing — no interactive surface is exposed during hydration.

---

### V-02 — Authentication Requirement
**Status:** PASS
**Severity:** —

`/login` is a pre-auth surface by design. No session is required. No protected data is accessible from this screen. Route is correctly classified as public.

---

### V-03 — Post-Login Redirect Destination
**Status:** PASS
**Severity:** —

Source: `apps/VCSM/src/features/auth/hooks/useLogin.js` lines 56–67

```js
const rawFrom = location?.state?.from
const from =
  typeof rawFrom === 'string'
    ? rawFrom
    : (rawFrom && typeof rawFrom === 'object' && typeof rawFrom.pathname === 'string'
        ? rawFrom.pathname + (rawFrom.search || '')
        : null)

const dest =
  from && !['/login', '/register', '/reset', '/forgot-password'].includes(from)
    ? from
    : '/feed'
```

`location.state` is React Router v6 in-memory state. It cannot be set via URL query parameters or hash fragments. No open redirect path via URL crafting. The blocklist prevents redirect loops.

---

### V-04 — navState Propagation
**Status:** PASS
**Severity:** —

Source: `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` lines 40–46

```js
const navState = useMemo(() => {
  const s = location?.state || {}
  return {
    from: typeof s.from === 'string' ? s.from : null,
    card: typeof s.card === 'string' ? s.card : null,
  }
}, [location])
```

Type-validated. Only strings pass. Passed as Link `state` prop to `/register` — in-memory only, not reflected in URL.

---

### V-05 — State Banners (emailConfirmed / accountDeleted)
**Status:** PASS
**Severity:** —

Source: `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` lines 37–38

Both values are read from `location.state`. React Router state — cannot be injected via URL. Both gate display of informational banners only. No access decisions, no mutations, no routing changes depend on these values.

---

### V-06 — Email Enumeration via Error Differentiation
**Status:** CAUTION
**Severity:** MEDIUM

Source: `apps/VCSM/src/features/auth/hooks/useLogin.js` lines 30–36

```js
if (signInError) {
  if (isEmailNotConfirmedError(signInError)) {
    setError('Please verify your email before continuing.')
    return false
  }
  throw signInError
}
```

```js
function isEmailNotConfirmedError(error) {
  return String(error?.message ?? '').toLowerCase().includes('email not confirmed')
}
```

**Verified behavior:**
- Registered account + unverified email → message: "Please verify your email before continuing."
- Unknown email → Supabase throws "Invalid login credentials" (generic)

These are distinct messages. An attacker can determine whether an email address exists in the system by observing the error response.

**No application-layer rate limiting is present in the controller or DAL.** Supabase project-level rate limiting is outside source-code scope and was not verified.

**Evidence chain:** `LoginScreen → useLogin.handleLogin → signInWithPassword → dalSignInWithPassword → supabase.auth.signInWithPassword → error → isEmailNotConfirmedError → distinct UI message`

---

### V-07 — Profile Discoverability Write — Ownership Boundary
**Status:** CAUTION
**Severity:** LOW

Source: `apps/VCSM/src/features/auth/controllers/profile.controller.js` lines 10–26

```js
export async function ensureProfileDiscoverable(userId) {
  const session = await dalGetAuthSession()
  if (!session?.user?.id || session.user.id !== userId) return
  ...
  await dalUpdateProfileDiscoverable({ userId, discoverable: true, updatedAt: ... })
}
```

Source: `apps/VCSM/src/features/auth/dal/profile.dal.js`

```js
await supabase.from('profiles').update({...}).eq('id', userId)
```

Controller enforces `session.user.id === userId` before writing. The `.eq('id', userId)` scopes the UPDATE to the caller's own row. **However**, the database-level RLS policy on the `profiles` table cannot be confirmed from source code alone. If RLS is absent or misconfigured, the `.eq()` filter is the only enforcement layer.

**This write is triggered automatically on every successful login.**

---

### V-08 — Debug Event Logging
**Status:** PASS
**Severity:** —

Source: `ZZnotforproduction/_ACTIVE/debuggers/identity/helpers.js`

Every debug function is gated:
```js
export function debugLoginEvent(...) {
  if (!import.meta.env.DEV) return
  ...
}
```

Source: `ZZnotforproduction/_ACTIVE/debuggers/identity/store.js`

`addIdentityDebugEvent`, `persistToStorage`, `hydrateFromStorage` all gate on `import.meta.env.DEV`. In production builds these are all no-ops. No email or userId leaks to sessionStorage in production.

---

## PHASE 3 — BLACKWIDOW FINDINGS

---

### BW-01 — Open Redirect via URL
**Status:** EXPLOIT_BLOCKED

**Attack path:**
```
Attacker crafts: /login?from=https://evil.com
→ location.state.from is undefined (URL params ≠ Router state)
→ from resolves to null
→ dest = '/feed'
```

React Router v6 `location.state` is populated only by in-app `navigate()` calls or `<Link state={...}>` props. URL query parameters do not populate `location.state`. Attack blocked at the framework level.

---

### BW-02 — Email Enumeration
**Status:** EXPLOIT_REACHABLE
**Severity:** MEDIUM

**Attack path:**
```
Attacker → submits email via /login form
→ dalSignInWithPassword({ email, password })
→ supabase.auth.signInWithPassword
→ signInError received
→ isEmailNotConfirmedError(signInError) → true (registered + unverified)
→ UI renders: "Please verify your email before continuing."

vs.

Unknown email → Supabase returns generic error
→ UI renders: Supabase error message (different string)
```

SOURCE: Login form submit
BOUNDARY: None — error string difference is observable without rate limiting
SINK: Distinct UI message reveals account existence
VERDICT: EXPLOIT_REACHABLE — no app-layer throttle observed in source

---

### BW-03 — navState Injection via URL
**Status:** EXPLOIT_BLOCKED

**Attack path:**
```
Attacker crafts URL with query params attempting to set navState
→ location.state is in-memory only
→ navState useMemo reads location.state — undefined from URL
→ navState = { from: null, card: null }
→ /register link carries no injected state
```

VERDICT: EXPLOIT_BLOCKED

---

### BW-04 — State Banner Spoofing
**Status:** EXPLOIT_BLOCKED

**Attack path:**
```
Attacker attempts to set location.state.accountDeleted or emailConfirmed via URL
→ React Router state not settable from URL
→ Banners never render
→ Even if rendered: banners are informational display only, no code path exploitable
```

VERDICT: EXPLOIT_BLOCKED — no attack surface even if spoofed in-app

---

### BW-05 — AuthPublicRoute Loading Window
**Status:** EXPLOIT_BLOCKED

**Attack path:**
```
Race window: loading === true → renders null
→ No form rendered
→ No interactive surface
→ No inputs to manipulate
→ No API calls triggered
```

VERDICT: EXPLOIT_BLOCKED — null render during hydration presents no exploitable surface

---

### BW-06 — Redirect Loop via Blocklist Bypass
**Status:** EXPLOIT_BLOCKED

**Attack path:**
```
Attacker sets state.from = '/login'
→ Blocklist check: ['/login', '/register', '/reset', '/forgot-password'].includes('/login')
→ true → dest = '/feed'
```

VERDICT: EXPLOIT_BLOCKED — loop prevention is enforced

---

### BW-07 — canSubmit Button Bypass
**Status:** EXPLOIT_BLOCKED

**Attack path:**
```
canSubmit = !loading && email.trim() && password.trim()
→ Button is disabled when false
→ Attacker removes `disabled` attribute via DevTools
→ Form submits with empty/whitespace-only fields
→ dalSignInWithPassword({ email: '', password: '' })
→ Supabase Auth rejects invalid credentials server-side
```

Client-side `disabled` is UI-only. Server-side Supabase Auth validates credentials independently.

VERDICT: EXPLOIT_BLOCKED — no server-side bypass; Supabase rejects the call

---

## PHASE 4 — ELEKTRA CHAIN MAP

---

### Chain 1 — Login Form Submission (Primary)

```
SOURCE:  LoginScreen.jsx :: <form onSubmit={onSubmit}>
→ HOOK:  useLogin.js :: handleLogin(e)
         e.preventDefault()
         setError(''), setLoading(true)
→ CTRL:  login.controller.js :: signInWithPassword({ email, password })
→ DAL:   login.dal.js :: dalSignInWithPassword({ email, password })
→ SINK:  supabase.auth.signInWithPassword({ email, password })

BOUNDARY: Supabase Auth service (server-managed)
          JWT issued on success; bcrypt verification server-side
VALIDATION: None at controller — credentials passed through as-is
AUTHORIZATION: None required (pre-auth operation)
OWNERSHIP: N/A (login establishes identity, does not access owned data)
VERDICT: CLEAN
```

---

### Chain 2 — Post-Login Session Hydration

```
SOURCE:  useLogin.js :: hydrateAuthSession() [called after signIn success]
→ CTRL:  authSession.controller.js :: hydrateAuthSession()
→ DAL:   authSession.read.dal.js :: dalHydrateAuthSession()
→ SINK:  supabase.auth.getSession()

BOUNDARY: Supabase session store
NOTE:    AuthProvider.onAuthStateChange SIGNED_IN event also fires concurrently.
         This is a redundant read — no additional data is fetched beyond what
         onAuthStateChange provides.
VERDICT: CLEAN — redundant call, no security gap
```

---

### Chain 3 — Profile Discoverability (Auto-triggered on login success)

```
SOURCE:  useLogin.js :: ensureProfileDiscoverable(data.user.id)
→ CTRL:  profile.controller.js :: ensureProfileDiscoverable(userId)
         GATE: dalGetAuthSession() → session.user.id === userId
               if mismatch → return (no write)
→ DAL:   profile.dal.js :: dalGetProfileDiscoverable(userId)
→ SINK:  supabase.from('profiles')
           .select('id, discoverable')
           .eq('id', userId)
           .maybeSingle()

BOUNDARY: .eq('id', userId) — row scoped to caller's ID
          session.user.id === userId check in controller

→ CONDITIONAL WRITE:
  profile.model.js :: ProfileModel(row) → if !profile.isDiscoverable
→ DAL:   profile.dal.js :: dalUpdateProfileDiscoverable({ userId, discoverable: true, updatedAt })
→ SINK:  supabase.from('profiles')
           .update({ discoverable: true, updated_at: updatedAt })
           .eq('id', userId)

BOUNDARY: Controller ID match guard (source-verified)
          DB RLS on profiles UPDATE (UNVERIFIED — cannot confirm from source)
MISSING:  RLS policy not readable from application source
VERDICT:  CAUTION — controller-layer guard present; DB-layer RLS unconfirmed
```

---

### Chain 4 — Post-Login Navigation

```
SOURCE:  useLogin.js :: location.state.from extraction (lines 56–67)
         TYPE GATES:
           typeof rawFrom === 'string' → use as-is
           typeof rawFrom === 'object' && typeof rawFrom.pathname === 'string'
             → rawFrom.pathname + (rawFrom.search || '')
           else → null
         BLOCKLIST: ['/login', '/register', '/reset', '/forgot-password']
         DEFAULT: '/feed'
→ SINK:  navigate(dest, { replace: true })

BOUNDARY: React Router (in-memory state — cannot be injected via URL)
VERDICT:  CLEAN
```

---

### Chain 5 — Route Guard (Lifecycle — not triggered by user action)

```
SOURCE:  Route render → AuthPublicRoute.jsx
→ HOOK:  useAuth() → AuthContext
         loading === true → return null
         user !== null → return <Navigate to="/feed" replace />
         user === null → return children

BOUNDARY: AuthContext populated by AuthProvider (supabase.auth.getSession)
VERDICT:  CLEAN
```

---

### Chain 6 — AuthProvider Session Subscription (Lifecycle)

```
SOURCE:  AuthProvider.jsx :: useEffect on mount
→ DAL:   dalHydrateAuthSession() → supabase.auth.getSession()
→ DAL:   dalSubscribeAuthStateChange() → supabase.auth.onAuthStateChange

EVENTS HANDLED:
  SIGNED_IN       → setUser, setSession, _clearRecoveryFlag
  SIGNED_OUT      → setUser(null), setSession(null)
  TOKEN_REFRESHED → setUser only if userId changed
  USER_UPDATED    → _clearRecoveryFlag
  PASSWORD_RECOVERY → _setRecoveryFlag() + navigate('/reset-password')
                     [ADJACENT FLOW — not triggered from /login screen]

BOUNDARY: Supabase Auth subscription (server-emitted events)
VERDICT:  CLEAN for /login screen lifecycle
          PASSWORD_RECOVERY branch: ADJACENT FLOW — not reachable from /login
```

---

## PHASE 5 — FINDING CLASSIFICATION

### A. SCREEN FINDINGS
*Directly reachable from /login*

| ID | Finding | Severity |
|---|---|---|
| V-06 | Email enumeration via error message differentiation | MEDIUM |
| V-07 | `profiles` UPDATE boundary relies on unconfirmed DB-level RLS | LOW |

---

### B. ADJACENT FLOW FINDINGS
*Reachable only through another screen — not from /login*

| Finding | Route | Reason |
|---|---|---|
| Recovery nonce client-side bypass | `/reset-password` | `/reset-password` is a separate route not reachable from login submit. AuthProvider fires `_setRecoveryFlag` only on `PASSWORD_RECOVERY` event — emitted by Supabase on recovery link click, not on /login interaction. |
| `/reset-password` not behind AuthPublicRoute | `/reset-password` | Adjacent route design decision — not reachable from /login screen. |

---

### C. FEATURE-WIDE FINDINGS
*Outside /login screen scope*

| Finding | Scope |
|---|---|
| AuthProvider `_setRecoveryFlag` / `_clearRecoveryFlag` mechanism | Platform auth lifecycle — applies to all routes |
| `VENOM-AUTH-001` recovery provenance gap | `/reset-password` + `setNewPassword.controller` — not reachable from /login |

---

## PHASE 6 — SCREEN SECURITY SCORE

| Category | Status | Notes |
|---|---|---|
| Authentication | PASS | AuthPublicRoute correctly gates the route |
| Authorization | PASS | No protected resources accessible from this screen |
| Ownership | CAUTION | profiles UPDATE controller-gated; RLS unconfirmed |
| Route Security | PASS | React Router state prevents URL-based injection |
| API Security | PASS | Supabase Auth handles credential verification server-side |
| RPC Security | N/A | No RPC calls on this screen |
| Data Exposure | CAUTION | Email enumeration via error differentiation |
| Exploit Resistance | CAUTION | BW-02 exploit reachable (email enumeration) |
| Chain Verification | PASS | All chains traced to sink; no broken auth boundaries |

---

## PHASE 7 — THOR INPUT PACKAGE

### THOR_SCREEN_SUMMARY — /login

| Metric | Value |
|---|---|
| Verified Screen Findings | 2 |
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 1 |
| Adjacent Flow (not screen findings) | 2 |
| Feature-Wide (not screen findings) | 2 |

### Verified Screen Findings

| ID | Finding | Severity | Chain |
|---|---|---|---|
| V-06 / BW-02 | Email enumeration via error message differentiation | MEDIUM | `useLogin → isEmailNotConfirmedError → distinct UI message` |
| V-07 | `profiles` UPDATE depends on unconfirmed DB RLS | LOW | `ensureProfileDiscoverable → dalUpdateProfileDiscoverable → profiles.update` |

### Runtime Risks
- Email enumeration exploitable via login form without application-layer rate limiting (source-verified)

### Authorization Risks
- `profiles` UPDATE at DB layer: controller guard confirmed; RLS not confirmable from source

### Exploit Paths
- BW-02: Submit registered+unverified email → observe "Please verify your email" vs generic error → account existence confirmed

### Source-to-Sink Risks
- Chain 3 (profiles UPDATE): `.eq('id', userId)` is client-supplied filter — DB must enforce `auth.uid() = id` via RLS

### Items Excluded from Screen Verdict
- Recovery nonce bypass: ADJACENT FLOW (`/reset-password`)
- `/reset-password` route guard design: ADJACENT FLOW
- AuthProvider `_setRecoveryFlag`: FEATURE-WIDE

---

## FINAL VERDICT

```
SCREEN_CAUTION
```

**Basis:** One MEDIUM finding (email enumeration — verified from source and confirmed exploit path). One LOW finding (profiles RLS unconfirmed — requires DB audit to close). No CRITICAL or HIGH. No broken auth boundaries. No protected data accessible from this screen. All chains trace cleanly to Supabase Auth.

**THOR blockers from this screen:** None.

---

*Report generated 2026-06-05 | VENOM + BLACKWIDOW + ELEKTRA | No prior findings inherited*
