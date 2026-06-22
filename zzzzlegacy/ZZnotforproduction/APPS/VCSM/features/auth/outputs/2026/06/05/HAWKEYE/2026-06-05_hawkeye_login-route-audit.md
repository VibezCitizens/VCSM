# HAWKEYE V2 — /login Route Audit
Date: 2026-06-05
Scope: /login — runtime + source verification
Mode: BLIND_REVERIFY — no prior VENOM/BLACKWIDOW/ELEKTRA findings consulted

---

## ARCHITECT PREFLIGHT STATUS

No dedicated ARCHITECT report exists for the auth feature at this scope.
Global architecture map at `ZZnotforproduction/APPS/VCSM/GLOBAL_ARCHITECTURE.md` covers the platform
boundary. Proceeding under HAWKEYE's own source-read authority per runtime + source mode.

---

## PHASE 1 — LOGIN_ROUTE_ENTRY_MAP

Every route that can reach /login, verified from source.

| # | SOURCE_ROUTE | TRIGGER | STATE PASSED | DESTINATION |
|---|---|---|---|---|
| 1 | Any protected route | `ProtectedRoute.jsx:38` — `!user` after auth hydration | None | /login replace |
| 2 | Any protected route | `AuthProvider.jsx:195` — `logout(navState)` call | Caller-supplied `navState` object (see callers) | /login replace |
| 3 | Any unknown path | `routes/index.jsx:261` — `{ path: "*" }` catch-all | None | /login replace |
| 4 | /feed | `CentralFeedScreen.jsx:130` — secondary `!user` guard | None | /login replace |
| 5 | /profile/:actorId | `ActorProfileScreen.jsx:143` — `!identity` after load | None | /login replace |
| 6 | /verify-email | `VerifyEmailRequiredScreen.jsx:22` — countdown timer fires | None | /login replace |
| 7 | /reset-password (success) | `useResetPassword.js:22` — success handler | None | /login replace |
| 8 | /reset-password (error) | `useResetPassword.js:51` — error fallback | None | /login replace |
| 9 | /onboarding | `useAuthOnboarding.js:47` — no session bounceToLogin() | None | /login replace |
| 10 | /auth/callback | `useAuthCallback.js:21` — result.ok === false, no result.error | `{ emailConfirmed: true }` | /login replace |
| 11 | /reset-password (complete) | `useSetNewPassword.js:118` — password updated | `{ passwordReset: true }` | /login replace |
| 12 | /wanders/* (public) | `WandersShareVCSM.jsx:31` — goLogin() button | `{ from, card, wandersFlow: true }` | /login push |
| 13 | Any public page with PublicNavbar | `PublicNavbar.jsx:162` — Link to="/login" | None | /login push |
| 14 | Any public page with PublicNavbarMobileMenu | `PublicNavbarMobileMenu.jsx:62` — Link to="/login" | None | /login push |
| 15 | /how-to/create-profile | `HowToCreateProfileScreen.jsx:165` — Link to="/login" | None | /login push |
| 16 | /how-to/create-vport | `HowToCreateVportScreen.jsx:238` — Link to="/login" | None | /login push |
| 17 | /register | `RegisterFormCard.jsx:255` — Link to="/login" | None | /login push |
| 18 | /forgot-password | `ForgotPasswordScreen.jsx:115` — Link to="/login" | None | /login push |
| 19 | /reset-password | `ResetPasswordScreen.jsx:65` — Link to="/login" | None | /login push |
| 20 | /auth/callback (error) | `AuthCallbackScreen.jsx:27` — Link to="/login" | None | /login push |

**Logout callers that supply navState:**
The `logout(navState)` function signature accepts a navState object. Verified callers:
all confirmed pass `{}` (empty object) or no argument. AuthProvider:195 results in `state: {}` at /login — empty state.

---

## PHASE 2 — LOGIN_STATE_ORIGIN_MAP

Every key read from `location.state` in the /login context.

### `state.accountDeleted`
- **Read at:** `LoginScreen.jsx:37` — `location?.state?.accountDeleted === true`
- **Source files:** No current caller passes `{ accountDeleted: true }` to /login in verified source. The key is referenced in LoginScreen but no navigation in the codebase was found passing it.
- **Validation:** Strict boolean equality check (`=== true`) — non-boolean values coerce to false. SAFE.
- **Sanitization:** None needed — only controls banner display, no action taken.
- **Type enforcement:** `=== true` enforces exact boolean match.
- **FINDING:** Dead banner state — `accountDeleted` banner is rendered defensively but no current code path produces it. ORPHAN STATE.

### `state.emailConfirmed`
- **Read at:** `LoginScreen.jsx:38` — `location?.state?.emailConfirmed === true`
- **Source:** `useAuthCallback.js:21` — `navigate('/login', { replace: true, state: { emailConfirmed: true } })`
- **Source actor:** Auth callback controller on verification success (no session from Supabase)
- **Validation:** Strict boolean equality check (`=== true`). SAFE.
- **Sanitization:** None needed — controls success banner only.

### `state.from`
- **Read at:** `LoginScreen.jsx:43` — `navState` memo: `typeof s.from === 'string' ? s.from : null`
  - Also: `useLogin.js:56` — `const rawFrom = location?.state?.from`
- **Sources:**
  - `WandersShareVCSM.jsx:17` — `navState.from = fromPath` (prop, default `"/wanders/sent"`, string)
  - No ProtectedRoute or primary auth guards pass `from`
- **Validation in LoginScreen:** `typeof s.from === 'string' ? s.from : null` — accepts any string
- **Validation in useLogin.js:** `typeof rawFrom === 'string'` — accepts any string OR object with `.pathname`
- **Sanitization:** Blocklist applied in useLogin: `/login`, `/register`, `/reset`, `/forgot-password`
- **Type enforcement:** Partial — string coercion only, no URL protocol/hostname check

### `state.card`
- **Read at:** `LoginScreen.jsx:44` — `navState` memo: `typeof s.card === 'string' ? s.card : null`
- **Source:** `WandersShareVCSM.jsx:24` — `card: (cardPublicId || "").trim() || null`
- **Validation:** `typeof s.card === 'string' ? s.card : null`
- **Use:** Passed to /register via Link state. Not used for navigation in LoginScreen itself.

### `state.wandersFlow`
- **Source:** `WandersShareVCSM.jsx` — `wandersFlow: true`
- **Read at:** Not read by LoginScreen. Passed through to /register via navState but navState only extracts `from` and `card`.
- **FINDING:** `wandersFlow` is passed to /login state but not consumed by LoginScreen. Key is silently dropped.

### `state.passwordReset`
- **Source:** `useSetNewPassword.js:118` — `{ passwordReset: true }`
- **Read at:** Not read by LoginScreen. Key is not consumed. Banner for password reset success does not exist.
- **FINDING:** `passwordReset` is passed to /login but not rendered. Dead state — no success feedback shown to user after password reset completion.

---

## PHASE 3 — HAWKEYE_REDIRECT_ANALYSIS

### Redirect chain in useLogin.js (lines 56–71)

```
location.state.from
  → rawFrom (any type)
  → from:
      if string → rawFrom as-is
      if object with .pathname (string) → rawFrom.pathname + (rawFrom.search || '')
      else → null
  → dest:
      if from and not in blocklist → from
      else → '/feed'
  → navigate(dest, { replace: true })
```

**Q: Can external URLs reach dest?**
`from` accepts any string. If `from = 'https://evil.com'`, then `dest = 'https://evil.com'`. React Router v6 `navigate()` with a string argument does NOT perform external URL navigation — it pushes to the browser history as a relative path, resulting in `{origin}/https://evil.com` being resolved. External open redirect via `navigate()` is NOT achievable.
STATUS: SAFE

**Q: Can malformed objects reach dest?**
`rawFrom` object path: `rawFrom.pathname + (rawFrom.search || '')`. `rawFrom.search` is not validated for type — if `rawFrom.search` is an object, `(rawFrom.search || '')` returns the object which when concatenated with a string becomes `[object Object]`. The resulting `from` string would be malformed but not exploitable.
STATUS: SAFE

**Q: Can pathname/search manipulation reach dest?**
`rawFrom.search` could be attacker-controlled if the state source is attacker-controlled. Sources of state: only `WandersShareVCSM` passes `from` (as a string, from `fromPath` prop). No source passes a `from` object with pathname/search. The object branch is defensive code with no current callers.
STATUS: SAFE (no current callers reach object branch)

**Q: Can stale state survive logout/login?**
React Router's location.state is session-history-bound. On logout, `navigate('/login', { replace: true, state: {} })` is called — `replace: true` replaces the history entry, clearing prior state. On next navigation to /login from a guard (`replace: true`), state is set by the caller.
STATUS: SAFE — replace:true clears prior state on each auth transition

**Q: Can router history inject state?**
Browser cannot programmatically inject state into an existing history entry. State must come from programmatic `navigate()` calls within the app.
STATUS: SAFE

**Q: Can nested routes inject state?**
No nested routes within /login. LoginScreen is a flat component.
STATUS: N/A

**Q: Can any caller pass attacker-controlled values?**
All callers of navigate('/login') are internal app code. The only external-data source that reaches state is `WandersShareVCSM` which sets `from = fromPath` (a prop controlled by the component tree, not user input) and `card = cardPublicId` (a Supabase-sourced ID, not user-typed).
STATUS: SAFE

**Q: Blocklist completeness**
Current blocklist: `['/login', '/register', '/reset', '/forgot-password']`
Missing from blocklist: `/reset-password`, `/verify-email`, `/auth/callback`, `/onboarding`, `/welcome`
Impact: If `from` were set to `/reset-password`, after login the user lands on the reset-password form. The recovery controller gates that page with a nonce — landing there without a nonce results in `status: 'invalid'` (error card shown, no form). No security bypass.
STATUS: CAUTION — incomplete blocklist, no exploitable bypass found

**OVERALL REDIRECT STATUS: SAFE**

---

## PHASE 4 — AUTHPUBLICROUTE_VERDICT

**Source:** `apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx`

```js
const { user, loading } = useAuth()

useEffect(() => { hideLaunchSplash() }, [])

if (loading) return null
if (user) return <Navigate to="/feed" replace />
return children
```

**Q: Can authenticated users see login?**
No. `user !== null` → `<Navigate to="/feed" replace />` fires before children render.
VERDICT: NO

**Q: Can unauthenticated users reach protected content?**
No. ProtectedRoute also guards all protected routes independently of AuthPublicRoute.
VERDICT: NO

**Q: Can hydration races expose UI?**
During `loading === true`, `return null` prevents any UI from rendering — neither the login form nor the redirect fires. No flash of login UI before auth hydration completes.
VERDICT: NO RACE

**Q: Can stale sessions cause loops?**
AuthPublicRoute redirects `user → /feed`. If /feed's ProtectedRoute then redirects back to /login (e.g., identity failure), a loop would form. Verified: `CentralFeedScreen.jsx:130` has its own `!user` guard but this is redundant behind ProtectedRoute. ProtectedRoute checks `user` from the same AuthContext — if user is set, ProtectedRoute renders children, not /login. No loop.
VERDICT: NO LOOP

**Q: Can multi-tab auth state cause inconsistencies?**
Supabase broadcasts auth events cross-tab via localStorage. AuthProvider's `onAuthStateChange` subscriber updates state. If Tab B logs in while Tab A is on /login, Tab A's AuthProvider receives SIGNED_IN, sets user, AuthPublicRoute fires redirect to /feed. CONSISTENT.
VERDICT: CONSISTENT

**Q: Can refresh create route instability?**
On refresh at /login: AuthProvider runs `dalHydrateAuthSession()` (getSession()). If valid session exists: user is set → AuthPublicRoute redirects to /feed. If no session: user is null → login form renders. Stable.
VERDICT: STABLE

**AUTHPUBLICROUTE_VERDICT: PASS**

---

## PHASE 5 — LOGIN_FLOW_MAP

```
LoginScreen (onSubmit)
  └─ handleLogin(e) [useLogin.js]
     ├─ e.preventDefault()
     ├─ setLoading(true)
     └─ signInWithPassword({ email, password }) [login.controller.js]
           └─ dalSignInWithPassword() → supabase.auth.signInWithPassword()
           └─ if (error) THROW error   ← controller throws on ANY Supabase error

BRANCH: signInWithPassword throws
  └─ catch(err) in useLogin
       ├─ setError(err?.message || 'Login failed')
       └─ return false
  
  ⚠ DEAD CODE PATH: lines 30–36 in useLogin.js are UNREACHABLE
    The controller always throws before returning.
    `if (signInError)` → never true.
    `isEmailNotConfirmedError(signInError)` → never called.
    EMAIL_NOT_CONFIRMED users: see raw Supabase error message via catch block.

BRANCH: signInWithPassword succeeds
  ├─ hydrateAuthSession() → supabase.auth.getSession()
  ├─ if (data?.user?.id) → ensureProfileDiscoverable(userId)
  │     └─ validates session ownership, may update profiles.discoverable
  ├─ redirect resolution:
  │     rawFrom ← location.state.from
  │     from ← sanitized string or null
  │     dest ← from (if not in blocklist) else '/feed'
  └─ navigate(dest, { replace: true })

BRANCH: EMAIL_NOT_CONFIRMED (via catch block)
  └─ setError(err?.message) → shows raw Supabase error string
  ⚠ NOT the custom "Please verify your email before continuing." message

BRANCH: NETWORK_ERROR
  └─ catch(err) → setError(err?.message || 'Login failed')

BRANCH: SESSION_EXISTS (already authenticated)
  └─ AuthPublicRoute intercepts → Navigate to="/feed" replace
  → Form never renders
```

---

## PHASE 6 — SESSION_CONSISTENCY_REPORT

**Mechanism:** AuthProvider subscribes to `supabase.auth.onAuthStateChange` via `dalSubscribeAuthStateChange`. Supabase broadcasts state changes across tabs via localStorage (BroadcastChannel or storage events).

| Scenario | Tab A | Tab B | Result |
|---|---|---|---|
| Tab A logs in | SIGNED_IN → user set → /feed | If on /login → AuthPublicRoute fires → /feed | CONSISTENT |
| Tab A logs out | SIGNED_OUT → user null → /login | ProtectedRoute fires → /login | CONSISTENT |
| Token refresh | TOKEN_REFRESHED → user ID unchanged guard → no re-render | Same | CONSISTENT |
| Session expiration | SIGNED_OUT → user null | Same | CONSISTENT |
| Tab A account deletion | logout() called → user null → /login | onAuthStateChange fires → SIGNED_OUT → redirect | CONSISTENT |
| Email verification in Tab B | Tab A on login → no event fired here (verification does not invalidate existing session) | N/A | NEUTRAL |

**Logout scope:** `supabase.auth.signOut({ scope: 'local' })` — only current tab's session is revoked. Other devices/tabs with the same Supabase session keep their tokens until natural expiry. Not a bug per se (common pattern) but worth noting for session governance.

**SESSION_CONSISTENCY_REPORT: CONSISTENT**

---

## PHASE 7 — NAVIGATION_RESILIENCE_REPORT

| Scenario | Behavior | Status |
|---|---|---|
| Browser refresh at /login | AuthProvider hydrates → if no session → login renders | STABLE |
| Browser refresh at /login (authenticated) | AuthProvider hydrates → user set → AuthPublicRoute → /feed | STABLE |
| Browser back from /feed to /login | AuthPublicRoute checks user → user set → /feed | STABLE — no re-entry |
| Browser forward from /login | Depends on history; replace:true on auth transitions removes /login entries | STABLE |
| Deep link to /login | No state in URL; React Router state not injectable via URL | SAFE |
| Direct URL entry /login | Same as deep link | SAFE |
| History replacement | All auth guard redirects use replace:true — no orphan stack entries | CLEAN |
| Catch-all redirect to /login | `*` → /login replace, no `from` state — attempted URL is LOST | CAUTION — UX only |
| Bookmark /settings when logged out | `*` catches it → /login, no from → after login lands on /feed not /settings | CAUTION — UX only |
| Stale banner after back navigation | `emailConfirmed` banner: state is in history entry; back navigation restores state → banner re-shows | CAUTION — stale UI |

**Stale banner detail:**
If user lands on /login with `{ emailConfirmed: true }` then navigates forward and back, the history entry with state is restored. `emailConfirmed` banner re-appears. Not a security issue but can confuse users.

**NAVIGATION_RESILIENCE_REPORT: STABLE with CAUTION items (UX, not security)**

---

## PHASE 8 — HAWKEYE_CHAIN_MAP

Full source-to-sink route map for /login.

```
[1] ProtectedRoute (!user)
    STATE: none
    GUARD: AuthPublicRoute (user=null passes, user≠null → /feed)
    DESTINATION: LoginScreen renders

[2] logout() → AuthProvider
    STATE: {} (empty navState)
    GUARD: AuthPublicRoute
    DESTINATION: LoginScreen renders

[3] * catch-all
    STATE: none
    GUARD: AuthPublicRoute
    DESTINATION: LoginScreen renders — attempted URL LOST

[4] useAuthCallback (email verified, no session)
    STATE: { emailConfirmed: true }
    GUARD: AuthPublicRoute
    DESTINATION: LoginScreen renders, emailConfirmed banner shown

[5] useSetNewPassword (password updated)
    STATE: { passwordReset: true }
    GUARD: AuthPublicRoute
    DESTINATION: LoginScreen renders, NO banner shown (state not consumed)

[6] WandersShareVCSM (goLogin)
    STATE: { from: '/wanders/sent', card: <publicId>, wandersFlow: true }
    GUARD: AuthPublicRoute
    DESTINATION: LoginScreen renders
    POST-LOGIN: navigate to /wanders/sent (or /feed if blocklisted)

[7] Link to="/login" (multiple public screens)
    STATE: none
    GUARD: AuthPublicRoute
    DESTINATION: LoginScreen renders

LOGIN SUCCESS CHAIN:
    LoginScreen → useLogin.handleLogin
    → signInWithPassword → supabase (throws on error)
    → hydrateAuthSession → supabase.auth.getSession()
    → ensureProfileDiscoverable → profiles table (ownership verified)
    → dest resolution (blocklist check)
    → navigate(dest, { replace: true })
    → ProtectedRoute (user≠null → Outlet) → target screen
```

---

## PHASE 9 — HAWKEYE_SCREEN_SCORE

| Category | Status | Evidence |
|---|---|---|
| Route Entry Control | PASS | All auth-protected entries go through ProtectedRoute; AuthPublicRoute blocks authenticated access to login form |
| State Validation | CAUTION | `from` accepts any string (no protocol check); `accountDeleted` and `passwordReset` are dead/unrendered state |
| Redirect Safety | PASS | navigate() does not execute external URL redirects; blocklist prevents loop back to auth routes |
| Route Guard Safety | PASS | AuthPublicRoute reliably blocks authenticated users; double-guard in ProtectedRoute + screen-level |
| Session Consistency | PASS | onAuthStateChange cross-tab sync is consistent for login/logout/expiry |
| Multi-Tab Behavior | PASS | SIGNED_IN/SIGNED_OUT events propagate; user state updates correctly across tabs |
| Navigation Stability | PASS | replace:true used consistently; no redirect loops confirmed |
| Deep Link Safety | PASS | React Router state not injectable via URL; direct URL entry produces no state |

---

## PHASE 10 — THOR_HAWKEYE_SUMMARY

**Audit scope:** /login route — source + runtime
**Files read:** 14 source files verified independently

### Findings

| ID | Severity | Category | Description |
|---|---|---|---|
| HE-LOGIN-001 | MEDIUM | Behavioral Bug | `isEmailNotConfirmedError` handler is UNREACHABLE dead code. `signInWithPassword` controller throws before returning, making `signInError` always null. Users with unverified email see raw Supabase error string, not the custom "Please verify your email before continuing." message. |
| HE-LOGIN-002 | LOW | State Integrity | `state.passwordReset` key is passed by `useSetNewPassword.js` to /login but is never read by LoginScreen. No success feedback is rendered after password reset completion. |
| HE-LOGIN-003 | LOW | State Integrity | `state.accountDeleted` key is read defensively by LoginScreen but no current code path in the verified codebase produces this state. Dead banner. |
| HE-LOGIN-004 | LOW | Navigation | Catch-all `*` route redirects to /login with no `from` state. Attempted URL is silently lost. Users who bookmark protected routes and access them while logged out will land on /feed after login, not the bookmarked page. |
| HE-LOGIN-005 | LOW | Navigation | Stale `emailConfirmed` banner can reappear on browser back navigation (history entry preserves state). Not exploitable; UI confusion only. |
| HE-LOGIN-006 | INFO | State Hygiene | `state.wandersFlow: true` is passed to /login from WandersShareVCSM but is not consumed by LoginScreen. Key is silently dropped before navState is forwarded to /register. |
| HE-LOGIN-007 | INFO | Redirect Blocklist | `/reset-password`, `/verify-email`, `/auth/callback`, `/onboarding`, `/welcome` are not in the `from` blocklist. No exploitable bypass confirmed (each route has its own access gate), but completeness is missing. |
| HE-LOGIN-008 | INFO | Session Scope | `supabase.auth.signOut({ scope: 'local' })` only revokes current tab's session. Other active sessions remain valid until token expiry. Intentional design but not documented in the logout path. |

### Counts
- CRITICAL: 0
- HIGH: 0
- MEDIUM: 1 (HE-LOGIN-001 — dead email-not-confirmed UX path)
- LOW: 4 (HE-LOGIN-002, 003, 004, 005)
- INFO: 3 (HE-LOGIN-006, 007, 008)

### Route Risks
- Catch-all loses attempted URL (LOW, no security impact)

### State Risks
- `from` accepts any string (INFO — react-router navigate() prevents external execution)
- Three state keys are orphaned or unreachable (LOW)

### Redirect Risks
- Blocklist incomplete (INFO — no bypass confirmed)
- External URL not executable via navigate() (SAFE)

### Session Risks
- Local-scope signOut leaves remote sessions alive (INFO)

### Multi-Tab Risks
- None found — onAuthStateChange cross-tab sync behaves correctly

### Navigation Risks
- Stale banner on back navigation (LOW)
- Bookmark loss via catch-all (LOW)

---

## FINAL VERDICT

**SCREEN_CAUTION**

Reason: One MEDIUM behavioral bug (HE-LOGIN-001: email-not-confirmed error handler is dead code, users see wrong error message). No security blocking issues. No exploitable redirect chain. No session integrity failures. THOR gate: not blocked, but HE-LOGIN-001 should be triaged before next release.
