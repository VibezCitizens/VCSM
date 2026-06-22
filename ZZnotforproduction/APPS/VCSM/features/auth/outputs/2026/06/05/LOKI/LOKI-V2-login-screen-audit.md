# LOKI V2 — STATE DECEPTION & SESSION MANIPULATION AUDIT
# Route: /login
# Date: 2026-06-05
# Mode: Runtime + Source Verification
# Authority: READ_ONLY
# Scope: LoginScreen + AuthProvider + AuthPublicRoute + useLogin

---

## APPLICATION SCOPE

App: VCSM
Feature: auth
Route: /login
Files Observed:
  - apps/VCSM/src/features/auth/screens/LoginScreen.jsx
  - apps/VCSM/src/features/auth/hooks/useLogin.js
  - apps/VCSM/src/app/providers/AuthProvider.jsx
  - apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx
  - apps/VCSM/src/features/auth/controllers/login.controller.js
  - apps/VCSM/src/features/auth/controllers/authSession.controller.js
  - apps/VCSM/src/features/auth/dal/authSession.read.dal.js
  - apps/VCSM/src/features/auth/dal/login.dal.js
  - apps/VCSM/src/state/identity/identityStorage.js
  - apps/VCSM/src/app/routes/public/auth.routes.jsx

Independent reconstruction — no prior VENOM/BLACKWIDOW/ELEKTRA/HAWKEYE reports read.

---

## PHASE 1 — LOGIN_STATE_MAP

| STATE_NAME | SOURCE | OWNER | MUTATORS | CONSUMERS |
|-----------|--------|-------|----------|-----------|
| email | useState | useLogin | setEmail (onChange) | LoginScreen input, handleLogin, canSubmit |
| password | useState | useLogin | setPassword (onChange) | LoginScreen input, handleLogin, canSubmit |
| loading (hook) | useState | useLogin | setLoading(true) on submit; finally setLoading(false) | LoginScreen button label/disabled, canSubmit |
| error | useState | useLogin | setError('') on submit start; setError(msg) on failure | LoginScreen error banner |
| user | useState | AuthProvider | getSession hydration, onAuthStateChange, optimistic logout | AuthPublicRoute redirect, AuthContext consumers |
| session | useState | AuthProvider | getSession hydration, onAuthStateChange, optimistic logout | Internal AuthProvider only (not exposed in context value) |
| loading (provider) | useState (true) | AuthProvider | setLoading(false) post-hydration, catch block, onAuthStateChange | AuthPublicRoute null gate, downstream useAuth() |
| emailConfirmed | location.state | React Router | Prior navigation to /login with state.emailConfirmed=true | LoginScreen success banner |
| accountDeleted | location.state | React Router | Prior navigation to /login with state.accountDeleted=true | LoginScreen info banner |
| navState (from, card) | useMemo(location.state) | LoginScreen | Recomputed on location change | "Create account" Link state forwarding |
| canShowInstall | useState | LoginScreen | useEffect: navigator.userAgent + window.matchMedia check | iOS install prompt conditional render |
| showInstall | useState | LoginScreen | Install button onClick (true); IosInstallPrompt onClose (false) | IosInstallPrompt open prop |
| Supabase session (persisted) | Supabase localStorage | Supabase JS client | signInWithPassword, signOut(local), token refresh | dalHydrateAuthSession, onAuthStateChange |
| actor_kind | localStorage | Identity layer | logout() removes it | Identity resolution (not LoginScreen direct) |
| actor_vport_id | localStorage | Identity layer | logout() removes it | Identity resolution (not LoginScreen direct) |
| actor_touch | localStorage | Identity layer | logout() sets to Date.now() | Cross-tab synchronization signal |
| vc.identity.actorId.* | localStorage | identityStorage.js | saveIdentity(), clearAllIdentityStorage() on logout | loadIdentity() actor selection |
| Recovery flag (vc.auth.recovery) | sessionStorage | AuthProvider | _setRecoveryFlag on PASSWORD_RECOVERY; _clearRecoveryFlag on SIGNED_IN/OUT/USER_UPDATED | setNewPassword.controller.js only |
| Debug sessionStorage keys | sessionStorage | Debug infra | logout() clears all; debug hooks write them | Debug panels (dev only) |
| URL state (route) | React Router location | Router | navigation actions | AuthPublicRoute implicit evaluation |

---

## PHASE 2 — STATE_TRUST_MAP

| STATE_NAME | CONTROLLER | STATUS | REASON |
|-----------|-----------|--------|--------|
| email | User-controlled | UNTRUSTED | Direct form input, no pre-sanitization |
| password | User-controlled | UNTRUSTED | Direct form input |
| loading (hook) | Internal React | TRUSTED | No external write path |
| error | Internal React | TRUSTED | Set only by internal error handling |
| user | Server-controlled (Supabase JWT) | PARTIAL | Populated from Supabase session; JWT claims used without server-side re-verification at React layer |
| session | Server-controlled | PARTIAL | access_token deduplication guard uses prev token comparison only |
| loading (provider) | Internal React | TRUSTED | Controlled by hydration lifecycle only |
| emailConfirmed | Router-controlled / User-exploitable | UNTRUSTED | location.state is user-settable via browser history APIs |
| accountDeleted | Router-controlled / User-exploitable | UNTRUSTED | Same as emailConfirmed |
| navState.from | Router-controlled | PARTIAL | Type-checked (string), not sanitized against redirect rules |
| navState.card | Router-controlled | UNTRUSTED | Forwarded without verification |
| canShowInstall | Browser-controlled | TRUSTED | Read-only navigator/matchMedia APIs, try-catch wrapped |
| showInstall | Internal React | TRUSTED | Local UI toggle, no security implication |
| Supabase session (persisted) | Server-controlled | TRUSTED | Server-validated JWT managed by Supabase client |
| actor_kind | Browser-controlled | UNTRUSTED | localStorage, user-writable |
| actor_vport_id | Browser-controlled | UNTRUSTED | localStorage, user-writable |
| actor_touch | Browser-controlled | UNTRUSTED | Timestamp, informational only |
| vc.identity.actorId.* | Browser-controlled | UNTRUSTED | localStorage, user-writable |
| Recovery flag | Session-controlled | PARTIAL | UUID nonce raises bar; client-side only (VENOM-AUTH-001 pre-documented) |
| URL state | Router-controlled | UNTRUSTED | User-controlled navigation |

---

## PHASE 3 — AUTH_DECEPTION_REPORT

### Trace Path
```
supabase.auth.getSession()
→ dalHydrateAuthSession()
→ AuthProvider useState (user, session, loading)
→ AuthContext.Provider value={{ user, loading, logout }}
→ useAuth() in AuthPublicRoute
→ if (user) <Navigate to="/feed" replace />
→ LoginScreen rendered
```

### Findings

**AD-01 — CAUTION: Optimistic Logout Before signOut Completion**
- Location: AuthProvider.jsx:170–199
- AuthProvider sets `setSession(null)`, `setUser(null)`, `setLoading(false)` optimistically before `supabase.auth.signOut()` is awaited.
- If `signOut()` fails (network error, Supabase outage), the UI shows /login but the Supabase session persists in localStorage.
- On next page load, `getSession()` returns the still-valid session → user is silently re-authenticated without any visible error or warning.
- UI truth claim: "You are logged out." Actual truth: "Session is still valid."
- Status: CAUTION

**AD-02 — CAUTION: scope:'local' Does Not Invalidate Server Session**
- Location: AuthProvider.jsx:198 — `supabase.auth.signOut({ scope: 'local' })`
- `scope: 'local'` only clears the session from this browser's localStorage.
- The server-side session (JWT) remains valid until natural expiration.
- Other devices with the same session token remain authenticated.
- UI truth claim: "Logged out." Actual truth: "Logged out on this device only."
- Status: CAUTION

**AD-03 — CAUTION: getSession Error Silently Swallowed**
- Location: AuthProvider.jsx:84–85 — `if (error) console.warn('[Auth] getSession error:', error)`
- If `getSession()` returns an error (Supabase error, malformed response), execution continues with `data?.session ?? null`.
- If `data` is null due to error, user is set to null, loading to false.
- A valid server-side session that errored at read time would result in the UI showing the login screen while the session is actually valid.
- No retry, no user notification, no fallback.
- Status: CAUTION

**AD-04 — INFO: session Not Exposed in AuthContext**
- Location: AuthProvider.jsx:215 — `value={{ user, loading, logout }}`
- `session` (which contains `access_token`, `refresh_token`, `expires_at`) is kept internal to AuthProvider.
- Downstream consumers via `useAuth()` cannot directly inspect token validity.
- This is a correct design decision but means consumers rely entirely on `user` truthfulness.
- Status: INFO (observed, no deception risk)

**AD-05 — CAUTION: Fake JWT Populates AuthContext User**
- Location: AuthProvider.jsx:86–88, 137–139
- Supabase JS client parses JWT claims client-side without server verification at the React state layer.
- A user who manually sets Supabase's localStorage session key with a crafted JWT (valid structure, forged claims) will cause `getSession()` to return the forged session.
- `setUser(nextSession?.user ?? null)` populates `user` with forged identity.
- `AuthPublicRoute` checks `if (user)` and redirects to /feed.
- At /feed, forged identity would fail on actual Supabase API calls (invalid JWT signature → 401/403).
- No data access is gained. No auth bypass. Impact: self-redirect to /feed, immediate API failure.
- Status: CAUTION (bounded impact, no escalation path)

---

## PHASE 4 — STALE_STATE_REPORT

### location.state Keys Analyzed: from, card, emailConfirmed, accountDeleted

**SS-01 — CAUTION: emailConfirmed Survives Browser Refresh (Firefox)**
- Location: LoginScreen.jsx:37 — `const emailConfirmed = location?.state?.emailConfirmed === true`
- In Firefox, browser history state (including location.state) is preserved across page refresh.
- A user who navigated to /login after email confirmation would see the "Email verified" success banner persist after refreshing the page.
- Chrome behavior varies by version but Firefox consistently preserves it.
- Can survive: refresh (Firefox) — YES. Logout — PARTIAL (depends on navigation flow). Back navigation — YES. Route replacement — NO (if navigate used replace:true). Tab duplication — NO.
- Status: CAUTION

**SS-02 — CAUTION: accountDeleted Survives Browser Refresh (Firefox)**
- Same mechanism as SS-01.
- "Account deleted / not found" amber banner persists after page refresh.
- Status: CAUTION

**SS-03 — CAUTION: emailConfirmed + Error Banner Coexistence**
- Location: LoginScreen.jsx:151–181
- `emailConfirmed` banner and `error` banner have independent render conditions.
- If user arrives with emailConfirmed state and then fails to log in, both banners render simultaneously.
- User sees "Email confirmed" success message AND "Login failed" error together.
- No logic clears the location.state banner on form error.
- Status: CAUTION (UI truthfulness conflict)

**SS-04 — INFO: navState.from Open Redirect Check**
- Location: useLogin.js:65 — `!['/login', '/register', '/reset', '/forgot-password'].includes(from)`
- Blacklist does not block absolute URLs (e.g., `from = 'https://evil.com'`).
- React Router v6 `navigate()` does not resolve external URLs — provides implicit protection.
- `/reset-password` is absent from the blacklist. A user with `from = '/reset-password'` would be redirected there post-login. Not exploitable beyond self-navigation.
- Status: INFO (React Router provides implicit protection; no active exploit path)

---

## PHASE 5 — SESSION_RESTORATION_REPORT

### Trace: Page Refresh → AuthProvider → Hydration → Supabase Session → UI

```
Component mount
→ useState: user=null, session=null, loading=true
→ AuthPublicRoute: loading=true → return null (blank screen)
→ async IIFE starts
→ dalHydrateAuthSession() → supabase.auth.getSession()
  ├── Session found + valid → returns session
  ├── Session found + expired + refresh token valid → Supabase auto-refreshes → returns new session
  ├── Session expired + no refresh token → returns null session
  ├── Error → returns { data: null, error } → swallowed to console.warn
  └── Hung request → no resolution (no timeout)
→ if (!cancelled): setSession, setUser, setLoading(false)
→ AuthPublicRoute: loading=false
  ├── user !== null → <Navigate to="/feed" replace />
  └── user === null → render children (LoginScreen)
```

**SR-01 — CAUTION: No Hydration Timeout**
- AuthProvider has no maximum wait time for `getSession()`.
- A hung Supabase connection (firewall, CORS issue, DNS failure) → `loading` stays `true` indefinitely.
- `AuthPublicRoute` renders `null` indefinitely — perpetual blank screen.
- No retry, no timeout fallback, no user-facing error.
- Status: CAUTION

**SR-02 — SAFE: Cancelled Flag Prevents Stale Hydration**
- Location: AuthProvider.jsx:76-78, 159-162
- `let cancelled = false` + cleanup `cancelled = true` correctly prevents state updates if component unmounts during hydration.
- No stale state injection from unmounted component.
- Status: SAFE

**SR-03 — SAFE: Corrupt/Missing Session Handled**
- `data?.session ?? null` safely handles null, undefined, missing session object.
- Supabase client handles JSON parse errors internally.
- Status: SAFE

**SR-04 — INFO: Two-Phase Hydration Subscription Gap**
- Subscription (`onAuthStateChange`) is set up AFTER `getSession()` resolves.
- Brief window where a cross-tab SIGNED_IN event could fire before subscription is registered.
- If this occurs, initial `user=null` is set correctly from getSession, then the subscription fires and corrects the state.
- User experiences a brief logged-out flash before auto-correcting. Unlikely in practice.
- Status: INFO

---

## PHASE 6 — MULTITAB_REPORT

### Scenarios Tested

**MT-01 — LOGIN from Tab B while Tab A is on /login**
- Supabase onAuthStateChange fires cross-tab via localStorage storage events.
- Tab A's subscription receives SIGNED_IN → setUser → AuthPublicRoute redirects to /feed.
- Status: CONSISTENT

**MT-02 — LOGOUT from Tab A**
- Tab A: optimistic setUser(null) → navigate('/login') → then signOut({ scope: 'local' })
- Tab B: Supabase storage event from localStorage key removal → onAuthStateChange SIGNED_OUT → setUser(null)
- Brief window: Tab A shows /login (optimistic) while Tab B still shows app before storage event propagates.
- Duration: typically <100ms but unbounded on slow systems.
- Status: PARTIAL (brief split-brain window)

**MT-03 — TOKEN_REFRESH in Tab A**
- Supabase writes new tokens to localStorage → Tab B storage event → onAuthStateChange TOKEN_REFRESHED
- AuthProvider TOKEN_REFRESHED guard: `if (prev?.id === nextUserId && nextUserId != null) return prev` → no unnecessary re-render
- Status: CONSISTENT

**MT-04 — PASSWORD_CHANGE in Tab A**
- Tab A: USER_UPDATED event fires, _clearRecoveryFlag called, user state updated.
- Tab B: USER_UPDATED may or may not propagate depending on Supabase implementation for password change specifically.
- Old tokens in Tab B remain valid until expiration (JWT is stateless, password change does not immediately invalidate tokens in Supabase v2 unless explicitly revoked).
- Status: PARTIAL (Tab B stale session after password change; bounded by token TTL)

**MT-05 — EMAIL_CONFIRMATION from external link**
- User opens confirmation link in new tab. Supabase sets SIGNED_IN session.
- Original /login tab: if open, receives SIGNED_IN via storage event → redirected to /feed.
- Original tab had location.state.emailConfirmed=false (not set yet). The confirmation flow navigates back to /login — that navigation happens in the new tab, not the original.
- Status: CONSISTENT

---

## PHASE 7 — ERROR_DECEPTION_REPORT

**ED-01 — CAUTION: Email Enumeration via Error Differentiation**
- Location: useLogin.js:31–35
- `isEmailNotConfirmedError(signInError)` produces: "Please verify your email before continuing."
- Invalid credentials (wrong password or unknown email) produce: generic Supabase error message (typically "Invalid login credentials").
- An attacker can distinguish: email exists but unconfirmed (specific message) vs email doesn't exist or wrong password (generic message).
- This allows email enumeration of accounts that have been registered but not confirmed.
- Status: CAUTION

**ED-02 — CAUTION: Error State Coexists with Location.State Banners**
- Location: LoginScreen.jsx:151–181
- Three banner types render independently: emailConfirmed (green), accountDeleted (amber), error (red).
- All three can render simultaneously if all conditions are truthy.
- Stale location.state banners are not cleared by form submission or error state.
- Status: CAUTION (UI truthfulness)

**ED-03 — INFO: No Request Timeout → Loading Lock on Hung Network**
- Location: useLogin.js:28 — `await signInWithPassword({ email, password })`
- No timeout around the signInWithPassword call.
- On hung connection (firewall, timeout, Supabase outage): `loading` stays true, button disabled, no user feedback.
- `finally { setLoading(false) }` only executes when the promise settles — never on hang.
- Status: CAUTION (classified here as cross-cutting with Phase 8)

**ED-04 — SAFE: Error Cleared on Re-Submit**
- Location: useLogin.js:19 — `setError('')` at handleLogin start
- Previous errors are cleared before each attempt.
- Status: SAFE

**ED-05 — SAFE: Error State Does Not Persist Across Unmount**
- `error` is `useState('')` in useLogin — resets on component remount.
- Navigation away from /login and back → fresh error state.
- Status: SAFE

---

## PHASE 8 — LOADING_STATE_REPORT

**LS-01 — CAUTION: No AuthProvider Hydration Timeout**
- Location: AuthProvider.jsx:79–100
- `getSession()` has no timeout configured.
- If Supabase connection hangs, `loading` stays `true` indefinitely.
- `AuthPublicRoute` renders `null` → perpetual blank screen.
- No recovery path, no retry, no fallback render.
- Status: CAUTION

**LS-02 — CAUTION: hideLaunchSplash Races Auth Hydration**
- Location: AuthPublicRoute.jsx:9–11
- `useEffect(() => { hideLaunchSplash() }, [])` fires on component mount.
- AuthPublicRoute mounts immediately when the router renders it.
- At mount time, `loading` may still be `true` (hydration in progress).
- Launch splash is hidden before auth state is known → reveals blank screen during hydration.
- Status: CAUTION

**LS-03 — SAFE: useLogin Loading Always Resolves**
- Location: useLogin.js:77–79 — `finally { setLoading(false) }`
- Hook-local loading resets in `finally` block — cannot deadlock.
- Exception: hung network prevents finally from executing. This is ED-03/LS-04.
- Status: SAFE (for normal promise resolution)

**LS-04 — CAUTION: Infinite Loading on Hung signInWithPassword**
- No timeout on `signInWithPassword` call.
- Hung connection → `loading` stays `true`, submit button disabled indefinitely.
- No user-facing error, no recovery path, no timeout fallback.
- Status: CAUTION

**LS-05 — SAFE: cancelled Flag Prevents Loading Deadlock on Unmount**
- Location: AuthProvider.jsx:159–162
- Cleanup correctly prevents stale setLoading calls.
- Status: SAFE

---

## PHASE 9 — SESSION_SPOOF_REPORT

**SP-01 — CAUTION: Crafted JWT Sets AuthContext User (No Server Verify at React Layer)**
- A user who sets Supabase's localStorage session key with a crafted JWT (valid base64 structure, forged claims) will cause `getSession()` to return forged session data.
- AuthProvider: `setUser(nextSession?.user ?? null)` populates user with forged identity (forged id, email).
- AuthPublicRoute checks `if (user)` → redirects to /feed.
- At /feed, forged JWT fails on actual Supabase API calls (invalid signature → 401/403).
- Impact: self-redirect to /feed where no data is accessible. No privilege escalation.
- Status: CAUTION (bounded — no data access, no escalation)

**SP-02 — SAFE: Null Session**
- `data?.session ?? null` → user null → LoginScreen. Handled.
- Status: SAFE

**SP-03 — SAFE: Expired Session**
- Supabase client attempts refresh internally. Failure → null session → user null → LoginScreen.
- Status: SAFE

**SP-04 — SAFE: Partial Session (Missing User Object)**
- `nextSession?.user ?? null` → user null even with session object.
- Status: SAFE

**SP-05 — SAFE: Corrupt sessionStorage Recovery Flag**
- Acknowledged at AuthProvider.jsx:27–41 (VENOM-AUTH-001).
- A forged nonce in sessionStorage enables self-exploitation of password reset flow.
- Pre-documented. Impact boundary: self only.
- Status: SAFE (pre-documented, bounded)

**SP-06 — SAFE: Missing Token Object**
- `setSession((prev) => { if (prev?.access_token === nextSession?.access_token) return prev; return nextSession ?? null })`
- Session without access_token is still set. Not a security issue — session not exposed in context.
- Status: SAFE

---

## PHASE 10 — LOKI_TRUTH_CHAIN_MAP

### Chain 1: Session → UI Redirect
```
Supabase localStorage (sb-* keys)
→ supabase.auth.getSession() [dalHydrateAuthSession → authSession.read.dal.js]
→ AuthProvider: setUser(session?.user ?? null), setLoading(false)
→ AuthContext.Provider { user, loading }
→ useAuth() in AuthPublicRoute
→ if (user) → <Navigate to="/feed" replace />
→ if (!user && !loading) → render LoginScreen
```

### Chain 2: Email Not Confirmed → Error Banner
```
User submits form → useLogin.handleLogin
→ signInWithPassword (login.controller.js)
→ dalSignInWithPassword (login.dal.js)
→ supabase.auth.signInWithPassword
→ signInError returned
→ isEmailNotConfirmedError(signInError) === true
→ setError('Please verify your email before continuing.')
→ LoginScreen: {error && <div role="alert">{error}</div>}
```

### Chain 3: location.state.emailConfirmed → Success Banner
```
Prior navigation: navigate('/login', { state: { emailConfirmed: true } })
→ React Router location.state.emailConfirmed = true
→ LoginScreen: const emailConfirmed = location?.state?.emailConfirmed === true
→ {emailConfirmed && <div role="status">Email confirmed banner</div>}
[STALE RISK: survives browser refresh in Firefox]
```

### Chain 4: Optimistic Logout → /login
```
logout() called
→ setSession(null), setUser(null), setLoading(false) [optimistic — immediate]
→ localStorage: actor_kind removed, actor_vport_id removed, actor_touch set
→ clearAllIdentityStorage() — all vc.identity.actorId.* removed
→ sessionStorage debug keys removed, recovery flag removed
→ actor:changed CustomEvent dispatched
→ navigate('/login', { replace: true, state: navState })
→ [async, AFTER navigation]: supabase.auth.signOut({ scope: 'local' })
[RISK: signOut failure → session persists, user silently re-authenticated on reload]
```

### Chain 5: Open Redirect via location.state.from
```
Prior navigation: navigate('/login', { state: { from: '/some/path' } })
→ useLogin: rawFrom = location?.state?.from
→ typeof rawFrom === 'string' → from = rawFrom
→ dest = from if !includes(['/login', '/register', '/reset', '/forgot-password'])
→ navigate(dest, { replace: true })
[PROTECTION: React Router v6 navigate() does not resolve external URLs]
[GAP: /reset-password absent from blacklist; absolute URL blacklist absent but implicitly safe]
```

### Chain 6: PASSWORD_RECOVERY → /reset-password
```
Supabase magic link clicked
→ supabase.auth.onAuthStateChange fires: event = 'PASSWORD_RECOVERY'
→ AuthProvider: _setRecoveryFlag() [sessionStorage UUID nonce]
→ navigate('/reset-password', { replace: true })
→ ResetPasswordScreen (NOT wrapped in AuthPublicRoute — intentional, documented in auth.routes.jsx:46-63)
```

---

## PHASE 11 — LOKI_SCREEN_SCORE

| Category | Status | Key Evidence |
|----------|--------|-------------|
| State Integrity | CAUTION | SS-01, SS-02, SS-03: stale location.state banners survive refresh; coexistence conflict |
| Auth Integrity | CAUTION | AD-01 (optimistic logout), AD-02 (scope:local), AD-05 (fake JWT populates context) |
| Session Integrity | CAUTION | SR-01 (no hydration timeout), AD-03 (getSession error swallowed) |
| Multi-Tab Consistency | PARTIAL | MT-02 brief split-brain on logout; MT-04 stale session after password change |
| Error Truthfulness | CAUTION | ED-01 (email enumeration), ED-02 (banner coexistence) |
| Loading Stability | CAUTION | LS-01 (no hydration timeout), LS-02 (splash races hydration), LS-04 (hung request) |
| State Persistence | CAUTION | SS-01, SS-02 (location.state persists across refresh in Firefox) |
| Session Recovery | SAFE | SR-02 (cancelled flag), SR-03 (null/corrupt safe), SP-02–SP-04 |

---

## PHASE 12 — THOR_LOKI_SUMMARY

**LOKI V2 — /login Screen — 2026-06-05**

Findings Count: 10 classified findings

| ID | Category | Severity | Description |
|----|----------|----------|-------------|
| AD-01 | Auth Integrity | CAUTION | Optimistic logout before signOut — UI shows logged out while session may persist |
| AD-02 | Auth Integrity | CAUTION | signOut scope:'local' — server session not invalidated, other devices unaffected |
| AD-03 | Session Integrity | CAUTION | getSession() error silently swallowed — valid session shows as logged out |
| AD-05 | Auth Integrity | CAUTION | Crafted JWT populates AuthContext user (bounded: no data access) |
| SS-01 | Stale State | CAUTION | emailConfirmed banner survives browser refresh in Firefox |
| SS-02 | Stale State | CAUTION | accountDeleted banner survives browser refresh in Firefox |
| SS-03 | Truthfulness | CAUTION | emailConfirmed + error banner coexist simultaneously |
| SR-01 | Loading Stability | CAUTION | No AuthProvider hydration timeout — perpetual blank screen on hung getSession |
| LS-02 | Loading Stability | CAUTION | hideLaunchSplash races auth hydration — splash removed before state is known |
| ED-01 | Truthfulness | CAUTION | Email enumeration: unconfirmed email returns distinct error message |

State Risks: SS-01, SS-02, SS-03
Session Risks: AD-01, AD-02, AD-03, AD-05
Stale State Risks: SS-01, SS-02
Multi-Tab Risks: MT-02 (brief split-brain on logout), MT-04 (stale token after password change)
Loading Risks: SR-01, LS-02, LS-04
Truthfulness Risks: ED-01, SS-03

Pre-Documented / Out of Scope:
- VENOM-AUTH-001 (recovery nonce client-side only) — acknowledged in source, self-exploitation boundary
- VENOM-AUTH-002 (/reset-password not in AuthPublicRoute) — intentional, documented in auth.routes.jsx

**Final Verdict: SCREEN_CAUTION**

No auth bypass. No privilege escalation. No hard session spoofing with data access.
Architectural auth chain is structurally sound. All findings are runtime behavior gaps:
stale state persistence, UI truthfulness conflicts, a loading deadlock path, and session
scope limitation (scope:local — deliberate design choice).

No SCREEN_BLOCKED conditions present.
SCREEN_CAUTION — 10 findings, 0 critical blockers.

---

## ROUTING

Findings eligible for downstream review:
- SR-01, LS-02, LS-04 → KRAVEN (loading/performance)
- ED-01 → ELEKTRA (email enumeration — security patch advisory)
- AD-01, AD-02 → VENOM (auth trust boundary review)
- SS-01, SS-02, SS-03 → HAWKEYE (UI contract verification)

THOR eligibility: SCREEN_CAUTION — THOR may proceed with awareness of open CAUTION items.
Release authority belongs exclusively to THOR.
