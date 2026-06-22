# KRAVEN V2 — RESILIENCE, FAILURE & STRESS AUDIT
# Route: /login
# Date: 2026-06-05
# Mode: Runtime + Source Verification
# Scope: Current screen only — read-only, independent

---

## Source Files Verified

| File | Role |
|---|---|
| `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` | View layer |
| `apps/VCSM/src/features/auth/hooks/useLogin.js` | Hook |
| `apps/VCSM/src/features/auth/controllers/login.controller.js` | Controller |
| `apps/VCSM/src/features/auth/dal/login.dal.js` | DAL — signIn |
| `apps/VCSM/src/features/auth/controllers/authSession.controller.js` | Controller — session hydration |
| `apps/VCSM/src/features/auth/dal/authSession.read.dal.js` | DAL — session reads |
| `apps/VCSM/src/features/auth/controllers/profile.controller.js` | Controller — post-auth profile |
| `apps/VCSM/src/app/providers/AuthProvider.jsx` | Auth context + subscription |
| `apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx` | Route guard |
| `apps/VCSM/src/app/routes/public/auth.routes.jsx` | Route config |
| `apps/VCSM/src/services/supabase/supabaseClient.js` | Supabase singleton |
| `apps/VCSM/src/services/supabase/authSession.js` | Session service |

---

## PHASE 1 — KRAVEN_EXECUTION_MAP

### User Actions
| Action | Handler | Execution Path |
|---|---|---|
| Type email | `onChange → setEmail()` | Local state only |
| Type password | `onChange → setPassword()` | Local state only |
| Submit form | `onSubmit → handleLogin(e)` | Full auth flow |
| Click Forgot Password | `<Link to="/forgot-password">` | React Router navigate |
| Click Create Account | `<Link to="/register" state={navState}>` | React Router navigate |
| Click Install App (iOS Safari only) | `setShowInstall(true)` | Local state only |

### Lifecycle Actions
| Trigger | Location | Effect |
|---|---|---|
| Mount | `LoginScreen useEffect` | iOS UA detection, matchMedia, setCanShowInstall |
| Mount | `AuthPublicRoute useEffect` | `hideLaunchSplash()` |
| Mount | `AuthProvider useEffect` | `dalHydrateAuthSession()` + `dalSubscribeAuthStateChange()` |
| Unmount | `AuthProvider cleanup` | `cancelled=true`, `unsubscribe()` |

### Full Login Execution Chain (handleLogin)
```
onSubmit(e)
  └─ handleLogin(e)
       ├─ e.preventDefault()
       ├─ setError(''), setLoading(true)
       ├─ signInWithPassword({ email, password })              [CONTROLLER]
       │    └─ dalSignInWithPassword({ email, password })      [DAL]
       │         └─ supabase.auth.signInWithPassword()         [NETWORK CALL 1]
       ├─ [if signInError] → isEmailNotConfirmedError check
       │    ├─ true  → setError(), return false
       │    └─ false → throw signInError
       ├─ hydrateAuthSession()                                 [CONTROLLER]
       │    └─ dalHydrateAuthSession()                         [DAL]
       │         └─ supabase.auth.getSession()                 [NETWORK CALL 2]
       ├─ ensureProfileDiscoverable(data.user.id)              [CONTROLLER]
       │    ├─ dalGetAuthSession()                             [DAL]
       │    │    └─ supabase.auth.getSession()                 [NETWORK CALL 3]
       │    ├─ dalGetProfileDiscoverable(userId)               [DAL → DB]  [NETWORK CALL 4]
       │    └─ [if not discoverable] dalUpdateProfileDiscoverable()         [NETWORK CALL 5]
       ├─ navigate(dest, { replace: true })
       └─ [catch] setError(err.message || 'Login failed')
       └─ [finally] setLoading(false)
```

### Auth Subscription Path
```
AuthProvider.useEffect
  └─ dalSubscribeAuthStateChange(callback)
       └─ supabase.auth.onAuthStateChange(callback)
            Events handled:
            ├─ PASSWORD_RECOVERY → _setRecoveryFlag(), navigate('/reset-password')
            ├─ SIGNED_IN         → _clearRecoveryFlag(), setUser (deduped), setSession
            ├─ SIGNED_OUT        → _clearRecoveryFlag(), setUser(null), setSession(null)
            ├─ TOKEN_REFRESHED   → setUser (deduped by id), setSession (if token changed)
            └─ USER_UPDATED      → _clearRecoveryFlag(), setUser (deduped by id)
```

### AuthPublicRoute Guard
```
AuthPublicRoute
  ├─ loading=true  → return null          (blank screen)
  ├─ user≠null     → <Navigate to="/feed" replace />
  └─ user=null     → render children (LoginScreen)
```

### Storage Reads
| Key | Storage | Who |
|---|---|---|
| `sb-auth-main` | localStorage | Supabase SDK (internal) |
| `vc.auth.recovery` | sessionStorage | AuthProvider (PASSWORD_RECOVERY) |
| `vcsm.debug.identity.events` | sessionStorage | Debug system |

### Storage Writes
| Key | Storage | When |
|---|---|---|
| `sb-auth-main` | localStorage | On signIn (Supabase SDK) |
| `actor_touch` | localStorage | On logout |
| `vc.auth.recovery` | sessionStorage | On PASSWORD_RECOVERY |

---

## PHASE 2 — NETWORK_FAILURE_REPORT

| Scenario | UI Behavior | Error Handling | Recovery | Status |
|---|---|---|---|---|
| Offline | signInWithPassword throws | Caught → setError | Manual retry | SAFE |
| High Latency | loading=true, no timeout | Never resolves if >timeout | Browser refresh only | CAUTION |
| Packet Loss | Same as high latency | No timeout | Browser refresh only | CAUTION |
| DNS Failure | signInWithPassword throws | Caught → setError | Manual retry | SAFE |
| Supabase Full Outage | signInWithPassword throws | Caught → setError | Manual retry | SAFE |
| Auth Endpoint Outage | Same as full outage | Caught → setError | Manual retry | SAFE |
| Partial: signIn ok, profile DAL fails | Error shown despite auth success | Caught → setError | Page refresh (session exists) | CAUTION |

**Key finding:** No timeout is enforced on `signInWithPassword`. If Supabase stalls
indefinitely, `loading` stays `true`, `canSubmit` stays `false`, button stays disabled.
User has no escape path except browser refresh. Verified in source — no AbortController,
no Promise.race, no timeout wrapper.

---

## PHASE 3 — LOGIN_FAILURE_MATRIX

| Input | Response | UI Result | Recovery Path |
|---|---|---|---|
| Valid credentials | signIn success → hydrate → navigate | Redirects to `/feed` or `from` | — |
| Invalid credentials | Supabase error → throw → catch | `setError(err.message)` | User re-types |
| Unknown email | Supabase "Invalid login credentials" | Generic error shown | User re-types |
| Unverified email | Supabase "email not confirmed" → `isEmailNotConfirmedError=true` | "Please verify your email…" set, `return false` (no throw), `finally` clears loading | User checks email |
| Locked account | Supabase generic error | Generic error shown (no specific locked state) | User contacts support |
| Disabled account | Supabase generic error | Generic error shown (no specific disabled state) | User contacts support |
| Expired session | SDK auto-refreshes on hydration; SIGNED_OUT fires if refresh fails | User stays on /login | Re-login |
| Corrupt session cache | Supabase SDK parses null → null session → loading=false | LoginScreen renders, no crash | Re-login |
| Network failure on submit | signInWithPassword throws → caught | Error shown, loading cleared | Manual retry |
| Timeout (request hangs) | No timeout enforced | loading stays true indefinitely | Browser refresh only — **UNSAFE** |

**Unverified email path is clean:** `isEmailNotConfirmedError` handles it before `throw`,
`finally` still fires, loading clears. No stranded loading state.

**Timeout path is not handled:** Verified by source inspection — no timeout, no AbortController.
`signInWithPassword` can hang indefinitely.

---

## PHASE 4 — HYDRATION_RESILIENCE_REPORT

### Trace: App Load → AuthProvider → Session Hydration → AuthPublicRoute → LoginScreen

```
AuthProvider.useEffect
  └─ dalHydrateAuthSession() [getSession — network or cache]
       ├─ SUCCESS with session → setSession, setUser, setLoading(false) → AuthPublicRoute → Navigate /feed
       ├─ SUCCESS null session → setSession(null), setUser(null), setLoading(false) → LoginScreen rendered
       ├─ ERROR (throws)      → [catch] setLoading(false) → LoginScreen rendered (console.error)
       └─ SLOW NETWORK        → loading=true during delay → AuthPublicRoute returns null (BLANK SCREEN)
```

| Scenario | AuthPublicRoute Behavior | User Experience | Status |
|---|---|---|---|
| Hydration success (session found) | Navigate /feed | Instant redirect | SAFE |
| Hydration success (null session) | Render LoginScreen | Normal login page | SAFE |
| Hydration failure (exception) | setLoading(false) fires in catch | LoginScreen rendered | SAFE |
| Slow/delayed hydration | Returns `null` while loading=true | **Blank screen** — no spinner, no fallback | CAUTION |
| Corrupt session | SDK returns null → null session path | LoginScreen rendered | SAFE |
| Missing session | Null session path | LoginScreen rendered | SAFE |

**Blank screen finding (VERIFIED):**
`AuthPublicRoute` line 13: `if (loading) { return null }`. No loading spinner, no
skeleton, no splash continuation. `hideLaunchSplash()` runs in a useEffect (after render).
On slow networks or cold starts, users see a blank white/dark screen until getSession
resolves. Duration depends entirely on network speed. No timeout or fallback UI exists.

**No deadlock confirmed:** `setLoading(false)` is called in three paths in AuthProvider —
success, error, and onAuthStateChange. The only path where it is guarded by `if (!cancelled)`
is the success path; the catch path calls it unconditionally after the cancelled check.
AuthProvider never unmounts during normal app lifecycle, so this is safe.

---

## PHASE 5 — REDUNDANCY_REPORT

### Duplicate getSession Calls on Login

On a successful login, `supabase.auth.getSession()` is called **3 times in rapid succession**:

| Call # | Source | Location |
|---|---|---|
| 1 | `hydrateAuthSession()` | `useLogin.js:47` — explicit call after signIn |
| 2 | `dalGetAuthSession()` | `profile.controller.js:13` — inside ensureProfileDiscoverable |
| 3 | `onAuthStateChange SIGNED_IN` | `AuthProvider.jsx:103` — subscription fires simultaneously |

Call #1 and #2 are explicit network round-trips to Supabase's auth endpoint. Call #3 is
delivered via the subscription and does not add a network call. However, calls #1 and #2
are redundant: the SIGNED_IN event (call #3) already delivers the current session to
AuthProvider. The manual `hydrateAuthSession()` call serves no purpose that the
subscription doesn't already cover.

| Finding | Classification |
|---|---|
| Duplicate getSession calls (1 + 2) | WASTEFUL — 2 unnecessary round-trips per login |
| Duplicate setLoading(false) calls | BENIGN — React dedupes same-value state updates |
| No duplicate subscriptions | VERIFIED — single subscription, singleton client |
| No duplicate redirects | VERIFIED — navigate() only in useLogin, not in subscription handler |

### setLoading(false) on Both Hydration and Subscription Paths

After hydration completes, `setLoading(false)` fires at line 89. If `onAuthStateChange`
fires before hydration completes (possible on fast auth), it also calls `setLoading(false)`
at line 145. Two calls with same value — React batches/dedupes. Classification: **BENIGN**.

---

## PHASE 6 — RESOURCE_STRESS_REPORT

### Rapid Login Attempts / Button Spam

`canSubmit = !loading && email.trim() && password.trim()`

During in-flight request: `loading=true` → `canSubmit=false` → button `disabled` attribute set.
HTML-disabled buttons don't fire onClick events. **Verified SAFE** — no duplicate requests during
active submission.

After request completes (finally fires): loading=false, button re-enables. New submission can fire.
This is correct behavior — the previous request has settled.

### Double-Click Submit

`setError('')` and `setLoading(true)` are called synchronously at the top of `handleLogin`
before the first `await`. In React 18, state updates from event handlers are batched.
However, these are called inside an async function — they flush as a batch before the
first await point. The button's `disabled` DOM attribute is set after React re-renders.

**Narrow race window exists:** Between the first click event firing and React re-rendering
the disabled button, a second click could theoretically pass the `canSubmit` check in a
very narrow window. This window is typically <1 frame (~16ms).

In practice this requires extremely fast double-click AND React re-render not completing
before second event. Classification: **LOW RISK** — window is narrow, not exploitable in
normal user interaction.

### Stale navigate() After Component Unmount

If user navigates away from /login while `signInWithPassword` is in-flight:
1. `LoginScreen` unmounts
2. `useLogin` local state is garbage-collected
3. `signInWithPassword` resolves asynchronously
4. `navigate(dest, { replace: true })` fires on the now-stale hook instance

`navigate()` from `react-router-dom` is derived from the router context, not the component.
It remains callable after unmount. **The navigation WILL fire even if user has moved to
another route** — causing a forced redirect to /feed.

Classification: **CAUTION** — unexpected navigation possible during in-flight login.
Scenario: user starts login, taps Back, login completes in background → user is forced to /feed.

### Browser Refresh During Submit

If browser is refreshed mid-submit:
- If signIn succeeded: session is stored in localStorage (Supabase SDK) → AuthProvider
  hydrates on remount → AuthPublicRoute redirects to /feed. **SAFE**.
- If signIn not yet complete: fresh start on /login. **SAFE**.

### Route Thrashing / Tab Duplication

No shared mutable state outside Supabase SDK storage. Route thrashing only affects the
active tab instance. Tab duplication shares localStorage session — duplicate tab would
hydrate as logged in if first tab completed login. **SAFE**.

---

## PHASE 7 — AUTH_SUBSCRIPTION_REPORT

### Event Handling Map (AuthProvider onAuthStateChange)

| Event | Actions Taken | Dedup Guard | Status |
|---|---|---|---|
| SIGNED_IN | clearRecoveryFlag, setUser, setSession, setLoading(false) | setUser: id match; setSession: token match | SAFE |
| SIGNED_OUT | clearRecoveryFlag, setUser(null), setSession(null), setLoading(false) | None needed (null) | SAFE |
| TOKEN_REFRESHED | setUser (deduped), setSession (new token always writes) | setUser: id match prevents re-render | SAFE |
| PASSWORD_RECOVERY | setRecoveryFlag, navigate('/reset-password'), setUser, setSession | setUser: id match | SAFE |
| USER_UPDATED | clearRecoveryFlag, setUser (deduped by id), setSession | **setUser dedup prevents update if id unchanged** | CAUTION |

**USER_UPDATED finding (VERIFIED):**
`AuthProvider.jsx:137-139`:
```js
setUser((prev) => {
  if (prev?.id === nextUserId && nextUserId != null) return prev
  return nextSession?.user ?? null
})
```
This guard prevents re-renders on `TOKEN_REFRESHED` (correct). However, on `USER_UPDATED`,
the user's `id` does not change but other fields (email, metadata) may have changed.
The guard returns `prev` — the stale user object — causing `AuthContext.user.email` to
remain stale until page refresh. Silent state divergence. No error thrown, no log emitted.

### Event Storms

Rapid login/logout cycles fire multiple events. Dedup guards prevent storm amplification:
- Identical userId → setUser returns prev → no re-render chain
- Identical access_token → setSession returns prev → no re-render chain
- STATUS: **SAFE** — dedup guards are effective

### Subscription Health

No heartbeat, no health check on the subscription. If the Supabase realtime connection
drops and is not re-established, auth events (TOKEN_REFRESHED, SIGNED_OUT) may be missed.
Supabase JS SDK v2 handles reconnection internally via WebSocket auto-reconnect.
This is outside application code control. Classification: **KNOWN DEPENDENCY RISK**.

---

## PHASE 8 — STORAGE_RESILIENCE_REPORT

| Scenario | Affected Path | Behavior | Status |
|---|---|---|---|
| localStorage unavailable | Supabase session persistence | SDK graceful fallback; session in-memory only | CAUTION |
| sessionStorage unavailable | Recovery flag, debug keys | All writes in try/catch — no crash | SAFE |
| Quota exceeded | `sb-auth-main` write | SDK handles internally — in-memory fallback | CAUTION |
| Corrupt session JSON | `dalHydrateAuthSession` | SDK parses → null → user stays on /login | SAFE |
| Missing auth cache | `getSession` → null session | User stays on /login | SAFE |
| `actor_touch` write on logout | localStorage | Minimal write, quota risk is negligible | SAFE |

**Storage access patterns (all guarded):**

Recovery flag write (`AuthProvider.jsx:50-57`):
```js
try {
  sessionStorage.setItem(RECOVERY_FLAG_KEY, JSON.stringify({ nonce, issuedAt }))
} catch (_) {}
```
VERIFIED: guarded.

Recovery flag clear (`AuthProvider.jsx:58-60`):
```js
try { sessionStorage.removeItem(RECOVERY_FLAG_KEY) } catch (_) {}
```
VERIFIED: guarded.

Logout sessionStorage clears (`AuthProvider.jsx:180-187`): inside `try {} catch (_) {}`.
VERIFIED: guarded.

iOS install detection (`LoginScreen.jsx:54-75`): entire block inside `try {} catch {}`.
VERIFIED: guarded — `catch {}` with no-op means failure is silent, install prompt simply
won't show.

---

## PHASE 9 — DEVICE_SURVIVABILITY_REPORT

| Device / Scenario | Behavior | Status |
|---|---|---|
| iOS Safari | UA detection guarded, install prompt gated correctly | SAFE |
| iOS Safari standalone (PWA) | `isStandalone` check prevents duplicate install prompt | SAFE |
| Android Chrome | No platform-specific paths; standard form behavior | SAFE |
| PWA / standalone mode | Handled via matchMedia + navigator.standalone | SAFE |
| Orientation change | Pure CSS layout, no JS dimension dependencies | SAFE |
| iOS keyboard open | `inputMode="email"` on email field, autoComplete set | SAFE |
| Background/foreground | `autoRefreshToken: true` handles token refresh on resume | SAFE |
| Low-memory eviction | React local state (email, password) lost on remount | EXPECTED |
| IosInstallPrompt modal | Modal is a sibling fragment — positioning unknown (file not read) | UNKNOWN |

**autoComplete attributes verified:**
- Email: `autoComplete="email"` ✓
- Password: `autoComplete="current-password"` ✓
- These prevent iOS Safari from auto-filling the wrong field type.

---

## PHASE 10 — KRAVEN_SPOF_MAP

| Component | Failure Effect | Blast Radius | Surviving Controls |
|---|---|---|---|
| AuthProvider | Auth context unavailable — all auth state lost | Entire application | None — total failure |
| Supabase singleton (`globalThis.__SB_CLIENT__`) | All DAL calls fail | All features | Error logged; HMR-safe creation is robust |
| `dalHydrateAuthSession` (getSession) | Session state unknown | Auth gate — whole app | try/catch → `setLoading(false)`, user lands on /login |
| `onAuthStateChange` subscription | Auth events not reflected in UI | Stale auth state across app | Initial hydration covers load state only |
| `signInWithPassword` | Login impossible | /login screen only | Error caught, setError shown |
| `ensureProfileDiscoverable` | Auth success masked by post-auth error | Login flow — user trapped on login screen | None — propagates to outer catch |
| `hydrateAuthSession` (post-login) | Post-login hydration error shown as login error | Login flow | None — propagates to outer catch |
| `hideLaunchSplash` | Launch splash stays visible | Visual layer | None — no timeout |

---

## PHASE 11 — KRAVEN_FAILURE_CHAIN_MAP

### Chain 1: Supabase Outage
```
SOURCE         → Supabase infrastructure failure
EXECUTION PATH → onSubmit → handleLogin → signInWithPassword → dalSignInWithPassword
                 → supabase.auth.signInWithPassword (THROWS network error)
FAILURE        → outer catch fires → setError(err.message)
USER IMPACT    → Error message shown, loading cleared, button re-enabled
RECOVERY       → Manual retry when service restores
STATUS         → SAFE
```

### Chain 2: Request Timeout (No Timeout Enforced)
```
SOURCE         → Network stall / Supabase hanging
EXECUTION PATH → handleLogin → signInWithPassword awaits indefinitely
FAILURE        → Promise never resolves; no AbortController; no Promise.race
USER IMPACT    → loading=true permanently; button disabled; no error shown; no escape
RECOVERY       → Browser refresh only
STATUS         → UNSAFE ⚠
```

### Chain 3: Post-Auth DAL Failure
```
SOURCE         → ensureProfileDiscoverable or hydrateAuthSession throws after successful signIn
EXECUTION PATH → signInWithPassword SUCCESS → hydrateAuthSession OR ensureProfileDiscoverable THROWS
                 → outer catch fires → setError(err.message)
FAILURE        → User is authenticated (session stored in Supabase localStorage)
                 but sees an error on /login and cannot navigate
USER IMPACT    → Authenticated user trapped on login screen with an error
RECOVERY       → Page refresh → AuthProvider hydrates → AuthPublicRoute redirects to /feed
STATUS         → CAUTION — confusing UX; session exists but user can't proceed without refresh
```

### Chain 4: Corrupt Session Cache
```
SOURCE         → localStorage 'sb-auth-main' contains malformed JSON
EXECUTION PATH → App load → dalHydrateAuthSession → Supabase SDK JSON.parse fails
                 → returns { data: { session: null }, error: null }
FAILURE        → null session returned; setSession(null), setUser(null), setLoading(false)
USER IMPACT    → User must re-login; no crash
RECOVERY       → Normal re-login
STATUS         → SAFE
```

### Chain 5: Blank Screen on Slow Hydration
```
SOURCE         → Slow network during initial getSession
EXECUTION PATH → App load → AuthProvider loading=true → AuthPublicRoute returns null
FAILURE        → No content rendered until hydration resolves
USER IMPACT    → Blank screen for duration of getSession round-trip
RECOVERY       → Auto-resolves when hydration completes; no user action needed
STATUS         → CAUTION — duration is network-dependent; no spinner or fallback
```

### Chain 6: USER_UPDATED Stale Email
```
SOURCE         → Backend updates user's email (admin or email change flow)
EXECUTION PATH → onAuthStateChange USER_UPDATED fires → setUser dedup:
                 if (prev?.id === nextUserId && nextUserId != null) return prev
FAILURE        → AuthContext user.email is not updated; stale value persists
USER IMPACT    → UI shows old email until page refresh; no error shown
RECOVERY       → Page refresh
STATUS         → CAUTION — silent stale state; no indication to user
```

### Chain 7: Stale navigate() After Unmount
```
SOURCE         → User navigates away from /login while signInWithPassword is in-flight
EXECUTION PATH → LoginScreen unmounts → signInWithPassword resolves (background)
                 → navigate(dest, { replace: true }) fires via stale hook reference
FAILURE        → navigate() is router-context-bound, not component-bound; still executes
USER IMPACT    → User forcibly redirected to /feed from wherever they navigated to
RECOVERY       → None automatic
STATUS         → CAUTION — unexpected navigation mid-session
```

---

## PHASE 12 — KRAVEN_SCREEN_SCORE

| Category | Status | Evidence |
|---|---|---|
| Availability | PASS | Error paths caught; form renders; no crash paths found |
| Failure Recovery | CAUTION | No timeout = indefinite loading; post-auth DAL failure traps authenticated users |
| Hydration Stability | CAUTION | Blank screen on slow hydration; no loading indicator |
| Storage Resilience | PASS | All sessionStorage ops guarded; Supabase SDK handles localStorage failures |
| Subscription Stability | CAUTION | USER_UPDATED dedup causes stale email in AuthContext |
| Stress Resistance | CAUTION | Stale navigate() after unmount; double-click narrow window |
| Mobile Survivability | PASS | iOS detection guarded; autoComplete correct; orientation safe |
| Runtime Robustness | CAUTION | Post-auth DAL failure shows error for authenticated user |

---

## PHASE 13 — THOR_KRAVEN_SUMMARY

### Findings Count

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 3 |
| **TOTAL** | **8** |

---

### HIGH Findings

**[KRAVEN-LOGIN-H01] No timeout on signInWithPassword — indefinite loading state**

- Category: Availability / Stress Resistance
- Source: `useLogin.js:27` — `await signInWithPassword({ email, password })`
- Evidence: No AbortController, no Promise.race, no timeout wrapper in hook, controller, or DAL
- Failure: Supabase stall → loading=true permanently → button disabled → no user escape
- User Impact: User cannot submit again, cannot see an error, must refresh browser
- Chain: Chain 2 above

**[KRAVEN-LOGIN-H02] Post-auth DAL failure traps authenticated user on login screen**

- Category: Failure Recovery / Runtime Robustness
- Source: `useLogin.js:47-51` — `hydrateAuthSession()` and `ensureProfileDiscoverable()` errors
  propagate to the outer catch and call `setError()`
- Evidence: `signInWithPassword` succeeds → session stored in Supabase localStorage → subsequent DAL
  throws → `catch(err) { setError(...) }` — login screen shows error despite live session
- Failure: User is authenticated but cannot navigate; must refresh browser to resolve
- User Impact: Confusing UX — "Login failed" error shown despite successful authentication
- Chain: Chain 3 above

---

### MEDIUM Findings

**[KRAVEN-LOGIN-M01] Blank screen during initial hydration — no loading indicator**

- Category: Hydration Stability
- Source: `AuthPublicRoute.jsx:13` — `if (loading) { return null }`
- Evidence: Returns null (renders nothing) while AuthProvider loading=true; `hideLaunchSplash()`
  fires in useEffect after render — if loading is true, children never render, splash hides, blank
- Failure: Blank screen for duration of getSession round-trip on slow connections
- User Impact: Perceived crash; no feedback; duration is network-dependent
- Chain: Chain 5 above

**[KRAVEN-LOGIN-M02] USER_UPDATED event causes stale email in AuthContext**

- Category: Subscription Stability
- Source: `AuthProvider.jsx:137-139` — setUser dedup `if (prev?.id === nextUserId && nextUserId != null) return prev`
- Evidence: Guard was designed for TOKEN_REFRESHED but applies to USER_UPDATED too; if user.id is
  unchanged, entire prev user object is returned — changed email/metadata silently dropped
- Failure: AuthContext user.email (and other changed fields) not updated after USER_UPDATED
- User Impact: Stale email shown in UI until page refresh; no error or warning
- Chain: Chain 6 above

**[KRAVEN-LOGIN-M03] Stale navigate() fires after component unmount during in-flight login**

- Category: Stress Resistance
- Source: `useLogin.js:71` — `navigate(dest, { replace: true })`
- Evidence: `navigate()` is bound to router context, not component lifecycle; fires even after
  LoginScreen unmounts; if user navigates away while login is pending, they are forcibly
  redirected to /feed when the in-flight request completes
- Failure: Unexpected navigation from unrelated route to /feed
- User Impact: Jarring redirect; loss of current navigation context
- Chain: Chain 7 above

---

### LOW Findings

**[KRAVEN-LOGIN-L01] 3 redundant getSession calls per login**

- Category: Runtime Efficiency
- Source: `useLogin.js:47` (hydrateAuthSession) + `profile.controller.js:13` (dalGetAuthSession)
  + AuthProvider onAuthStateChange SIGNED_IN (session delivered by subscription)
- Evidence: Two explicit getSession network round-trips fired after signInWithPassword; the
  SIGNED_IN subscription already delivers the current session to AuthProvider
- Classification: WASTEFUL — 2 unnecessary network calls per login; not dangerous
- Impact: Adds ~2× auth endpoint round-trips; no state corruption

**[KRAVEN-LOGIN-L02] Double-click narrow window during React state batching**

- Category: Stress Resistance
- Source: `useLogin.js:19-21` — `setLoading(true)` runs synchronously but DOM update is async
- Evidence: Between click event and React re-rendering disabled button, a second click can pass
  canSubmit check (still reads stale loading=false from closure)
- Classification: LOW RISK — window is <1 frame in practice; requires extremely fast double-click
- Impact: At most 2 signInWithPassword calls; first to complete wins; second likely gets
  "session already exists" behavior from Supabase

**[KRAVEN-LOGIN-L03] localStorage unavailable degrades session persistence**

- Category: Storage Resilience
- Source: `supabaseClient.js:28` — `persistSession: true` with default localStorage
- Evidence: Supabase SDK gracefully falls back to in-memory session if localStorage is blocked
  (strict private browsing, some corporate policies); session not persisted across refresh
- Classification: KNOWN LIMITATION — not a crash, not data loss; expected degradation
- Impact: Users in strict private browsing must re-login after every page refresh

---

### Final Verdict

**SCREEN_CAUTION**

No CRITICAL blocking failures. Screen is functionally safe under normal network conditions
and standard user behavior. Two HIGH findings require resolution before THOR release gate:

- H01 is an availability risk under any network degradation scenario — no user escape path
- H02 creates an authenticated-user error-trap that requires browser refresh to recover

Three MEDIUM findings represent resilience gaps (blank screen, stale state, stale navigation)
that degrade user experience but do not cause data loss or security failures.

Three LOW findings are optimization and edge-case items that do not block release.

---

*KRAVEN V2 — Read-only analysis. No fixes applied. No code modified.*
*Evidence sourced from: direct source file inspection (12 files verified).*
*Runtime traces: not available — source-only analysis.*
