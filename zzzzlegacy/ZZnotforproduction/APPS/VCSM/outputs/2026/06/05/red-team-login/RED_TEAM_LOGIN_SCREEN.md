# RED TEAM AUDIT — LOGIN SCREEN
**Date:** 2026-06-05  
**Screen:** `http://localhost:5173/login`  
**Mode:** WANDA + HULK + MAGNETO  
**Session:** Read-Only, Independent Verification  
**Source Verified:** YES — all findings from direct source reads  
**Blue Team Reports Consulted:** NO (blind re-verify)

---

## WANDA_FINDINGS — Independent Exploit Discovery

### Status: NEW_FINDING_CREATED | EXPLOIT_REACHABLE (conditional)

---

### WANDA-RED-001 — Supabase Client Exposed on `globalThis.__SB_CLIENT__`
**Severity:** MEDIUM  
**Status:** NEW_FINDING — not present in prior reports

**Entry point:** `apps/VCSM/src/services/supabase/supabaseClient.js:16-36`

```js
const g = globalThis;
if (g.__SB_CLIENT__ && g.__SB_CLIENT__.__isSingleton) {
  return g.__SB_CLIENT__;
}
// ...
g.__SB_CLIENT__ = client;
```

**Exploit path:**  
Any JavaScript executing in the page context (browser console, XSS, malicious extension) can call:
```js
window.__SB_CLIENT__.auth.getSession()
// → { access_token, refresh_token, user: { id, email } }
```

**Preconditions:**  
- Code execution in page context (XSS on any route, or browser console access)
- User must be authenticated

**Impact:**  
Full session token theft — access_token + refresh_token. Attacker can impersonate the user indefinitely (until password change or server-side revoke).

**Blast radius:**  
Entire platform. Every authenticated user visiting a page with an XSS vector.

**Verification evidence:**  
`supabaseClient.js:36` — `g.__SB_CLIENT__ = client` confirmed. `__isSingleton` only prevents recreation, does not restrict access.

---

### WANDA-RED-002 — `scope: 'local'` Logout Leaves Refresh Token Active Server-Side
**Severity:** MEDIUM  
**Status:** NEW_FINDING — not in prior reports

**Entry point:** `apps/VCSM/src/app/providers/AuthProvider.jsx:198`

```js
await supabase.auth.signOut({ scope: 'local' })
```

**Exploit path:**  
1. Attacker exfiltrates `localStorage['sb-auth-main']` (contains `access_token` + `refresh_token`)
2. User clicks Logout — `scope: 'local'` only clears in-memory and localStorage on the current device
3. Server-side session is NOT invalidated; refresh token is NOT revoked
4. Attacker uses stolen `refresh_token` to obtain new `access_tokens` indefinitely
5. User believes they are logged out; attacker has persistent access

**Preconditions:**  
- Attacker has obtained the `refresh_token` from localStorage (requires prior device access or XSS)
- User logs out but does not change password

**Impact:**  
Persistent account access after user-initiated logout. Session remains valid server-side until: password change, manual Supabase admin revoke, or refresh token natural expiry.

**Blast radius:**  
Any user whose localStorage was exfiltrated before logout. No self-healing — logout does not protect against stolen tokens.

**Verification evidence:**  
`AuthProvider.jsx:198` — `{ scope: 'local' }` confirmed. Supabase docs: `scope: 'local'` only removes the local session, does not call the server revoke endpoint.

---

### WANDA-RED-003 — Logout Signout Failure Restores Session on Next Load
**Severity:** LOW  
**Status:** NEW_FINDING

**Entry point:** `apps/VCSM/src/app/providers/AuthProvider.jsx:165-210`

```js
// Optimistic local transition
setSession(null)
setUser(null)
// ...
navigate('/login', { replace: true, state: navState })

try {
  await supabase.auth.signOut({ scope: 'local' })
} catch (e) {
  console.error('[Auth] signOut error:', e)
}
```

**Exploit path:**  
1. User initiates logout
2. Local state is cleared, user is navigated to `/login`
3. `supabase.auth.signOut({ scope: 'local' })` throws (network error)
4. Error is caught and swallowed — no retry, no localStorage clear in the catch block
5. `localStorage['sb-auth-main']` still contains the session
6. User refreshes the page
7. `dalHydrateAuthSession()` restores the session from localStorage
8. User is silently re-authenticated

**Preconditions:**  
- Network error during `signOut` call

**Impact:**  
User believes they are logged out but is re-logged in on page refresh. If on a shared/public device, the next person to reload the page inherits the session.

**Blast radius:**  
Any user logging out on a flaky network connection.

**Verification evidence:**  
`AuthProvider.jsx:197-204` — `signOut` failure only logs to console, does not clear `localStorage`. `supabaseClient.js:27` — `persistSession: true` confirmed. Session will be restored by Supabase client on next init.

---

### WANDA-RED-004 — Recovery Nonce Bypass (Independent Verification of VENOM-AUTH-001)
**Severity:** LOW (self-exploitation only)  
**Status:** CONFIRMED INDEPENDENTLY

**Entry point:** `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:47-75`

**Bypass:**  
```js
sessionStorage.setItem('vc.auth.recovery', JSON.stringify({
  nonce: crypto.randomUUID(),
  issuedAt: Date.now()
}))
```

**Preconditions:**  
- Must hold a valid authenticated session (any login)
- Must be able to execute JavaScript in page context

**Impact:**  
Authenticated user can reach the password update form and update their own password without a recovery email. Self-exploitation only — no cross-user path. `dalUpdateUserPassword` is scoped to the current JWT.

**Blast radius:**  
Single user only. No elevation of privilege beyond current session.

**Verification evidence:**  
`setNewPassword.controller.js:47` — key is `'vc.auth.recovery'`. Format: `{ nonce: string, issuedAt: number }`. TTL check: `Date.now() - parsed.issuedAt > 1800000`. No UUID validation, any UUID string passes. `supabase.auth.updateUser({ password })` does not require recovery session origin — confirmed in controller comment at line 37-43.

---

### WANDA-RED-005 — `/reset-password` Route Unguarded by AuthPublicRoute
**Severity:** LOW (design decision, mitigated by controller)  
**Status:** CONFIRMED INDEPENDENTLY

**Entry point:** `apps/VCSM/src/app/routes/public/auth.routes.jsx:46-64`

Any user (authenticated or not) can navigate to `/reset-password`. Without a recovery nonce, the controller returns `{ ok: false, error: null }` and the screen shows a 15-second spinner then "Link expired." This is intentional per VENOM-AUTH-002 comments.

**Confirmed behavior:** No security bypass possible without a valid recovery session or nonce bypass (WANDA-RED-004).

---

### WANDA-RED-006 — `errorDescription` URL Parameter Reflected in DEV Mode
**Severity:** INFO (dev-only)  
**Status:** NEW OBSERVATION

**Entry point:** `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:104-107`

```js
error: import.meta.env.DEV
  ? (errorDescription || 'Reset link is invalid.')
  : 'Reset link is invalid or has expired.',
```

In DEV mode, attacker-controlled URL parameter `?error_description=...` is rendered directly in the UI. Not a production risk. No XSS risk (React escapes strings). DEV observation only.

---

### WANDA-RED-007 — Wanders→Primary Session Token Injection Boundary
**Severity:** MEDIUM (architectural)  
**Status:** NEW FINDING — architectural trust concern

**Entry point:** `apps/VCSM/src/features/auth/controllers/register.controller.js:20-41`

```js
await dalMirrorWandersSessionToPrimary({ accessToken, refreshToken })
```

**Exploit path:**  
1. Wanders registration flow completes with a Wanders session
2. `maybeMirrorWandersSession` reads Wanders session tokens
3. User ID guard checks `session.user?.id === expectedUserId`
4. If guard passes: Wanders tokens are `setSession`-injected into primary Supabase client

**Concern:**  
If the Wanders Supabase project is the same as the primary project, valid tokens from Wanders can be injected into the primary auth client. The guard only prevents cross-user injection, not cross-feature injection. If a Wanders account has different RLS claims or roles than a primary account, token injection could cross privilege boundaries.

**Preconditions:**  
- User is in `isWandersFlow` registration
- Wanders and primary use same Supabase project
- Wanders session has different RLS claims than expected

**Blast radius:**  
Registration flow only. A user completing a Wanders join flow.

**Verification evidence:**  
`register.controller.js:20-41` — user ID guard confirmed but no claim-level validation. `dalMirrorWandersSessionToPrimary` calls `setSession()` which fully replaces the primary client's session tokens.

---

## HULK_FINDINGS — Catastrophic Failure Review

### Status: SIGNIFICANT | SEVERE

---

### HULK-001 — XSS → Supabase Singleton Hijack → Platform-Wide Credential Theft
**Status:** SEVERE  
**Tag:** CHAINED_EXPLOIT_FOUND | TRUST_BOUNDARY_COLLAPSE_FOUND

```
Entry:
  XSS on any VCSM page (any feature with user-controlled rendered content)

→ Escalation:
  window.__SB_CLIENT__ accessible → read all session tokens
  OR replace the singleton with a malicious client

→ Boundary Failure:
  AuthProvider, IdentityProvider, all DAL files route through the singleton
  All auth flows captured

→ Reachable Data:
  access_token, refresh_token, user.id, user.email for all active sessions in the compromised browser
  All Supabase queries visible through the performance proxy (DEV) or client interception

→ Persistence:
  refresh_token extraction allows persistent access beyond the browser session
  Attacker can use stolen tokens from a separate device indefinitely

→ Lateral Movement:
  All features that use supabase.from() or supabase.auth — entire platform
  Actor switching, booking, feed, chat, VPORT data

→ Maximum Impact:
  Full account takeover for any user that visits the XSS-carrying page while logged in
  Affects all users simultaneously if XSS is in a shared/public-facing page
```

**Prerequisite:** XSS vulnerability anywhere in the platform. Without XSS, this chain is inert.

---

### HULK-002 — Indefinite Loading State — Authentication Blank Screen
**Status:** SIGNIFICANT  
**Tag:** BLAST_RADIUS_FOUND

```
Entry:
  Network failure or Supabase outage during app load

→ Escalation:
  dalHydrateAuthSession() never resolves
  AuthProvider: setLoading(false) is never called

→ Boundary Failure:
  AuthPublicRoute: if (loading) return null → permanent blank screen
  ProtectedRoute: if (loading) return null → permanent blank screen
  User cannot access login page OR any protected page

→ Reachable Data:
  N/A — DoS condition

→ Persistence:
  Until user forces a hard refresh or clears the app

→ Maximum Impact:
  Platform inaccessible during Supabase disruption
  No error message, no retry mechanism, no fallback — complete UI blackout
```

---

### HULK-003 — Local Logout + Stolen Refresh Token = Permanent Persistent Access
**Status:** SEVERE  
**Tag:** PERSISTENCE_PATH_FOUND

```
Entry:
  Attacker obtains localStorage (device access, XSS, storage API exfiltration)

→ Escalation:
  Extracts sb-auth-main key → access_token + refresh_token

→ Boundary Failure:
  User logs out (scope: 'local') → clears their own local state
  Server-side session remains active → refresh_token NOT revoked

→ Reachable Data:
  All user data accessible via Supabase as that user
  VPORT bookings, feed content, chat messages, profile data

→ Persistence:
  Until: user changes password, OR Supabase admin manually revokes session
  Refresh token lifespan: Supabase default is persistent until revoked
  User has no mechanism to force revocation from within VCSM

→ Lateral Movement:
  All features accessible with valid JWT
  Actor switching: attacker can switch to VPORT actor if owned

→ Maximum Impact:
  Permanent account takeover with no user-side remedy after device compromise
  User logging out provides false sense of security — does not protect them
```

---

## MAGNETO_FINDINGS — Architecture Collapse Review

### Status: SINGLE_POINT_OF_FAILURE_FOUND | SECURITY_CONTROL_CONCENTRATION_FOUND | TRUST_BOUNDARY_PROPAGATION_FOUND

---

### MAGNETO-001 — AuthProvider: Universal Authentication SPOF
**Origin:** `apps/VCSM/src/app/providers/AuthProvider.jsx`

```
→ Dependency Chain:
  AuthProvider
  ├── AuthPublicRoute (login, register, forgot-password, auth-callback)
  ├── ProtectedRoute (all authenticated pages)
  │   ├── ConsentGateScreen
  │   └── VerifyEmailRequiredScreen
  └── IdentityProvider
      └── useIdentity() — every actor-scoped feature

→ Propagation Path:
  AuthProvider failure → user/loading state broken →
  AuthPublicRoute: renders null or loops →
  ProtectedRoute: renders null or redirects all users to /login →
  IdentityProvider: actor never resolves →
  All features: identity-null state, data loading fails

→ Blast Radius:
  ENTIRE PLATFORM — every screen, every feature, every user

→ Surviving Controls:
  None — all auth gates depend on AuthProvider
  Supabase server-side RLS still enforces at database level (last line of defense)
```

---

### MAGNETO-002 — Supabase Client Singleton: Universal Data + Auth SPOF
**Origin:** `apps/VCSM/src/services/supabase/supabaseClient.js`

```
→ Dependency Chain:
  supabase singleton
  ├── login.dal.js (auth)
  ├── register.dal.js (auth)
  ├── resetPassword.dal.js (auth)
  ├── authSession.read.dal.js (session hydration)
  └── Every feature DAL file (all data access)

→ Propagation Path:
  Client corruption/misconfiguration → all queries fail →
  Auth impossible → login fails globally →
  Data fetch impossible → all content fails to load

→ Blast Radius:
  All users, all features, all data simultaneously

→ Surviving Controls:
  Supabase server-side RLS (not defeated by client failure)
  Static UI shells still render
  No circuit breaker, no fallback client
```

---

### MAGNETO-003 — Recovery Nonce Key: Synchronized Constant with No Compile-Time Enforcement
**Origin:** `AuthProvider.jsx:44` ↔ `setNewPassword.controller.js:47`

```
→ Dependency Chain:
  AuthProvider._setRecoveryFlag() writes to 'vc.auth.recovery'
  setNewPassword.controller.readRecoveryNonce() reads from 'vc.auth.recovery'

→ Propagation Path:
  Either file is refactored with key renamed →
  One file writes, other reads wrong key →
  readRecoveryNonce() always returns null →
  ALL password reset flows silently fail (show "Link expired")

→ Blast Radius:
  Entire password reset feature — affects all users who need to reset password

→ Surviving Controls:
  None — no test validates key sync, no constant export enforces it
  Manual code review only
```

---

### MAGNETO-004 — `@debuggers` Vite Alias: Build Misconfiguration = Session Data in Production
**Origin:** `apps/VCSM/vite.config.js` → `@debuggers` alias

```
→ Dependency Chain:
  @debuggers alias resolves to:
    DEV  → real debuggers (write to sessionStorage, render UI)
    PROD → debuggers-stub (no-ops)
  
  App.jsx: if (import.meta.env.DEV) → render IdentityDebugPanel
  useLogin.js: debugLoginSessionSnapshot(data) → unconditional call
  
→ Propagation Path:
  @debuggers alias misconfigured in production build →
  debugLoginSessionSnapshot writes access_token, user.id to sessionStorage →
  Any script on page reads sessionStorage →
  Session tokens exposed

→ Blast Radius:
  Every user who logs in during a misconfigured production build

→ Surviving Controls:
  import.meta.env.DEV guard in App.jsx prevents UI render
  BUT debugLoginSessionSnapshot() is called unconditionally in useLogin.js
  Stub is a no-op, but if real debugger is imported: data is written regardless
  of the DEV guard in App.jsx
```

---

## RED_TEAM_SCORE

| Category | Status | Evidence |
|---|---|---|
| Exploit Discovery | FAIL | 2 new findings: WANDA-RED-001 (globalThis client), WANDA-RED-002 (local-scope logout) |
| Patch Bypass Resistance | PASS | VENOM-AUTH-001 confirmed self-exploitation only — no cross-user path |
| Ownership Survivability | PASS | Actor creation guard (profileId === userId) verified |
| Authorization Survivability | PASS | RLS is server-side; client failures don't bypass RLS |
| Trust Boundary Survivability | CONDITIONAL | Wanders→Primary token injection (WANDA-RED-007) is architectural concern |
| Dependency Survivability | FAIL | AuthProvider and supabase client are both SPOFs with no fallback |
| Architecture Survivability | FAIL | Two-constant sync fragility (MAGNETO-003), @debuggers alias risk (MAGNETO-004) |
| Catastrophic Failure Resistance | FAIL | Local-logout + stolen refresh token = permanent persistence (HULK-003) |

---

## THOR_RED_TEAM_SUMMARY

**Total findings:** 13  
**Critical:** 0  
**Severe:** 2 (HULK-001 — requires XSS precondition; HULK-003 — requires prior token theft)  
**Significant:** 2 (HULK-002, MAGNETO-001)  
**Medium:** 4 (WANDA-RED-001, WANDA-RED-002, WANDA-RED-007, MAGNETO-002)  
**Low:** 4 (WANDA-RED-003, WANDA-RED-004, WANDA-RED-005, MAGNETO-003)  
**Info/Arch:** 2 (WANDA-RED-006, MAGNETO-004)

**New findings not in prior Blue Team reports:**
- WANDA-RED-001: `globalThis.__SB_CLIENT__` XSS amplification
- WANDA-RED-002: `scope: 'local'` logout — refresh token persists server-side
- WANDA-RED-003: Logout signout failure restores session on reload
- WANDA-RED-007: Wanders→Primary token injection architectural trust boundary
- MAGNETO-003: Recovery nonce key constant sync fragility
- MAGNETO-004: @debuggers alias misconfiguration risk

**Exploit paths confirmed:**
- Token theft via globalThis (requires XSS precondition) — WANDA-RED-001
- Persistent access after logout via refresh token (requires prior theft) — WANDA-RED-002, HULK-003

**Boundary collapses:**
- AuthProvider failure → entire platform loses auth (MAGNETO-001)
- Supabase singleton failure → entire platform loses data access (MAGNETO-002)

**Privilege escalation paths:**
- None confirmed without precondition (XSS or device access)
- WANDA-RED-004 (self-escalation only — user updates own password)

**Dependency collapse paths:**
- MAGNETO-003: Recovery nonce key rename → silent password reset failure
- MAGNETO-004: @debuggers misconfiguration → session data in production

**Persistence paths:**
- HULK-003: Refresh token survives local logout — permanent access post-theft

**Maximum impact scenarios:**
1. **XSS + globalThis + refresh_token**: Any stored XSS → `window.__SB_CLIENT__.auth.getSession()` → steal tokens → use refresh_token for permanent account access even after victim logs out
2. **Network failure during logout**: `signOut` throws → localStorage session survives → session restored on next page load
3. **AuthProvider uncaught exception**: Loading state never clears → platform-wide blank screen for all users

---

## FINAL VERDICT

> **RED_TEAM_CAUTION**

Rationale:  
- No standalone critical exploits from the login screen itself
- Two significant SPOFs (AuthProvider, Supabase singleton) with full platform blast radius
- Persistent access path exists after token theft — `scope: 'local'` logout provides false security
- `globalThis.__SB_CLIENT__` is an XSS amplification vector: any XSS anywhere yields full token exfiltration
- All severe paths require preconditions (XSS or prior device access) — no unauthenticated escalation confirmed
- Login screen itself has no direct critical injection surface

**THOR blocker items:**
1. `scope: 'local'` logout — if server-side session revocation is not addressed, user-facing security posture is misleading
2. `globalThis.__SB_CLIENT__` — defensible but should be documented as accepted risk
3. MAGNETO-003 (constant sync) — low severity but high fragility; enforce with a shared constant

---
*Generated: 2026-06-05 | Session: Read-Only | Red Team Mode: BLIND_REVERIFY*
