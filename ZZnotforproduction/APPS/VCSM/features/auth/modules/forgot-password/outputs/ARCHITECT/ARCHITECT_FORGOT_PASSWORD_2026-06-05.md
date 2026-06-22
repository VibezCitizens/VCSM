# ARCHITECT V2 — SCREEN ARCHITECTURE AUDIT
# Route: /forgot-password
# Date: 2026-06-05
# Mode: Runtime + Source Verification
# Authority: READ_ONLY

---

## PHASE 1 — SCREEN_BOUNDARY_MAP

### Route Ownership
| Route | File | Guard |
|---|---|---|
| `/forgot-password` | `auth.routes.jsx:38` | `AuthPublicRoute` |
| `/reset` (alias) | `auth.routes.jsx:28` | `AuthPublicRoute` |

### Dependency Tree

```
AppRoutes (index.jsx)
  └── authPublicRoutes() (auth.routes.jsx)
        └── AuthPublicRoute (AuthPublicRoute.jsx)
              └── ForgotPasswordScreen [lazy] (ForgotPasswordScreen.jsx)
                    └── useResetPassword (useResetPassword.js)
                          └── ctrlSendResetPasswordEmail (sendResetPassword.controller.js)
                                └── dalSendResetPasswordEmail (resetPassword.dal.js)
                                      └── supabase.auth.resetPasswordForEmail (supabaseClient.js)
                                            └── Supabase API (network)

AuthPublicRoute
  └── useAuth() (AuthProvider.jsx)
        └── dalHydrateAuthSession (authSession.read.dal.js)
              └── supabase.auth.getSession (supabaseClient.js)
        └── dalSubscribeAuthStateChange (authSession.read.dal.js)
              └── supabase.auth.onAuthStateChange (supabaseClient.js)

Styles:
  ForgotPasswordScreen
    └── authTheme (authTheme.js)
    └── registerFormCard.css
    └── useTranslation (@i18n)
```

### Owner Summary
| Layer | Owner |
|---|---|
| Route | `auth.routes.jsx` |
| Screen | `ForgotPasswordScreen.jsx` |
| Hook | `useResetPassword.js` |
| Controller | `sendResetPassword.controller.js` |
| DAL | `resetPassword.dal.js` |
| Supabase | `supabaseClient.js` → `supabase.auth.resetPasswordForEmail()` |
| Auth Context | `AuthProvider.jsx` (consumed by route guard only) |
| Navigation | `useNavigate` in `useResetPassword.js` |

---

## PHASE 2 — EXECUTION_CHAIN_MAP

### Primary Flow: Email Submit → Supabase

```
User enters email in <input id="forgot-email">
  → onChange: setEmail(e.target.value)            [useResetPassword.js:13]
  → canSubmit: isValidEmailFormat(email)           [useResetPassword.js:7-9] ← regex validation

User clicks "Send reset link" or submits <form>
  → onSubmit: handleReset(event)                   [useResetPassword.js:32]
    → event.preventDefault()
    → guard: if (!canSubmit) return
    → setErrorMessage('')
    → setLoading(true)
    → await ctrlSendResetPasswordEmail(email)       [sendResetPassword.controller.js:3]
      → String(email || '').trim()                  [normalization]
      → if (!normalizedEmail) throw Error           [empty check]
      → await dalSendResetPasswordEmail({
            email: normalizedEmail,
            redirectTo: `${window.location.origin}/reset-password`   ← DOM access
          })                                        [resetPassword.dal.js:3]
        → supabase.auth.resetPasswordForEmail(
              email,
              { redirectTo }
            )                                       [network request → Supabase]
        → if (error) throw error
    → setSuccessMessage('If an account exists...')  [neutral — user enum prevention]
    → setLoading(false) [finally]

  Success path:
    → render successMessage block
    → useEffect fires: setTimeout(navigate('/login', { replace: true }), 4000ms)
    → OR: goToLogin() on button click
      → navigate('/login', { replace: true })

  Error path:
    → setErrorMessage('Unable to send reset email...')
    → render errorMessage block
```

### Secondary Flow: Auth Guard

```
AuthPublicRoute mount
  → useAuth() → { user, loading }     [AuthProvider.jsx context]
  → if (loading) → return null         [blank screen during hydration]
  → if (user) → <Navigate to="/feed"> [blocks authenticated users]
  → else → render ForgotPasswordScreen
```

### Password Recovery Flow (downstream — /reset-password)

Triggered when user clicks email link:
```
Supabase email link → browser
  → URL: /reset-password?code=<pkce_code>  OR  /reset-password#<implicit_tokens>
  → AuthProvider dalSubscribeAuthStateChange fires PASSWORD_RECOVERY
    → _setRecoveryFlag()                       [sessionStorage 'vc.auth.recovery']
    → navigate('/reset-password', { replace: true })
  → ResetPasswordScreen → useSetNewPassword
    → resolveRecoverySessionController()
      → parses URL params (code / error)
      → if (code): dalExchangeRecoveryCode(code) → supabase.auth.exchangeCodeForSession(code)
      → fallback: readRecoveryNonce() + dalGetAuthSession()
    → if (ok): status = 'ready'
    → updatePasswordController({ password })
      → evaluateRegisterPasswordRules(password)
      → dalUpdateUserPassword(password) → supabase.auth.updateUser({ password })
      → dalSignOutRecoverySession() → supabase.auth.signOut({ scope: 'local' })
    → navigate('/login', { replace: true, state: { passwordReset: true } })
```

---

## PHASE 3 — LAYER_COMPLIANCE

### Screen Analysis — `ForgotPasswordScreen.jsx`

| Rule | Status | Evidence |
|---|---|---|
| No business logic | PASS | All logic delegated to `useResetPassword` |
| No direct navigation | PASS | Navigation via `goToLogin` from hook |
| No controller imports | PASS | Only imports hook |
| No DAL imports | PASS | |
| Pure render | PASS | Conditional render driven by hook state |
| Controlled input | PASS | `value={email}` + `onChange={setEmail}` |

Minor: `onChange={(e) => setEmail(e.target.value)}` is an inline arrow that calls the hook setter — acceptable for a controlled input, not a business logic leak.

### Hook Analysis — `useResetPassword.js`

| Rule | Status | Evidence |
|---|---|---|
| UI state orchestration | PASS | Manages email, successMessage, errorMessage, loading |
| Controller delegation | PASS | Calls `ctrlSendResetPasswordEmail` |
| No DAL imports | PASS | |
| No direct Supabase | PASS | |
| **Business logic** | **VIOLATION** | `isValidEmailFormat` regex defined inline (lines 7-9) |

VIOLATION DETAIL (MEDIUM):
`isValidEmailFormat` at line 7-9 is business validation logic living inside the hook.
Per CLAUDE.md: "Hooks orchestrate UI state only. Controllers own business rules."
This function should be in a model file (e.g., `auth.model.js` or `emailValidation.model.js`)
and called from the controller. Currently the controller does NOT validate email format —
only checks for empty string (line 5 of controller). The hook and controller have diverged
validation paths.

Also: success and error message strings are hardcoded English in the hook rather than i18n keys,
while the screen uses `t()` for all other copy.

### Controller Analysis — `sendResetPassword.controller.js`

| Rule | Status | Evidence |
|---|---|---|
| Business rule ownership | PASS | Email normalization + empty check |
| No hook imports | PASS | |
| No React imports | PASS | |
| **DOM coupling** | **VIOLATION** | `window.location.origin` used directly (line 9) |

VIOLATION DETAIL (MEDIUM):
`window.location.origin` accessed directly inside the controller to build `redirectTo`.
Controllers should be environment-agnostic. This creates:
1. Test environment coupling (requires `jsdom` or browser)
2. Theoretical SSR incompatibility (though VCSM is CSR)
3. Implicit platform assumption rather than explicit injection

The email format validation gap: controller checks `!normalizedEmail` (empty) but not format.
If called without going through the hook guard, any non-empty malformed email reaches Supabase.
Supabase rejects invalid emails server-side, so no functional bug, but defense-in-depth is absent.

### DAL Analysis — `resetPassword.dal.js`

| Rule | Status | Evidence |
|---|---|---|
| Only Supabase access | PASS | All functions call `supabase.auth.*` |
| No business logic | PASS | Thin wrappers only |
| No `select('*')` | PASS | Auth calls, not table queries |
| No React imports | PASS | |
| No controller imports | PASS | |
| Single responsibility | INFO | File hosts 5 functions across 2 flows (see Findings) |

---

## PHASE 4 — ROUTE_ARCHITECTURE

### Registration

```
index.jsx
  → authPublicRoutes({ ForgotPasswordScreen, ... })
    → /forgot-password  [AuthPublicRoute guard]  ← primary
    → /reset            [AuthPublicRoute guard]  ← alias, no canonical redirect
    → /reset-password   [NO guard — intentional, recovery session gate in controller]
    → /login            [AuthPublicRoute guard]
    → /register         [AuthPublicRoute guard]
    → /auth/callback    [AuthPublicRoute guard]
    → /verify-email     [AuthPublicRoute guard]
```

### Routes Reaching /forgot-password

| Source | Method |
|---|---|
| `/login` | User clicks "Forgot password?" link (not verified — outside scope) |
| `/reset-password` invalid state | `<Link to="/forgot-password">` (ResetPasswordScreen.jsx:59) |
| `/reset` | Same component — alias route |
| Direct navigation | User types URL |
| 404 wildcard | Redirects to `/login`, not `/forgot-password` |

### Routes Reachable FROM /forgot-password

| Route | Trigger |
|---|---|
| `/login` | `goToLogin()` on success, `<Link to="/login">` on form, auto-redirect after 4s |
| `/reset-password` | User clicks email link (Supabase-originated, not from this screen) |
| `/feed` | If user is authenticated — AuthPublicRoute redirects before screen renders |

### Route Guard Integrity

`AuthPublicRoute`:
- Reads `useAuth()` context
- `loading → null` (blank screen, no spinner) ← NOTE
- `user !== null → <Navigate to="/feed" replace>` ✓
- `user === null → children` ✓

`/reset-password` is intentionally NOT wrapped in AuthPublicRoute — documented rationale
in auth.routes.jsx:46-62. Correct decision: PASSWORD_RECOVERY sets `user`, which would
cause AuthPublicRoute to redirect recovery users to /feed.

### Alias Issue (LOW)

`/reset` is registered as a backward-compat alias but does NOT redirect to `/forgot-password`.
The user's URL stays `/reset` if they navigate there. Comment confirms intent to keep alive
but no canonical normalization.

---

## PHASE 5 — STATE_ARCHITECTURE

### React State (useResetPassword)

| State | Owner | Lifecycle | Mutations |
|---|---|---|---|
| `email` | useResetPassword | Component mount → unmount | `setEmail` via input onChange |
| `successMessage` | useResetPassword | Component mount → unmount | Set on Supabase success |
| `errorMessage` | useResetPassword | Component mount → unmount | Set on catch, cleared on submit |
| `loading` | useResetPassword | Component mount → unmount | True during async, false in finally |

Derived:
| Derived | Source |
|---|---|
| `canSubmit` | `useMemo([email, loading, successMessage])` → `isValidEmailFormat(email) && !loading && !successMessage` |

### Context State (AuthProvider)

| State | Owner | Consumers in scope |
|---|---|---|
| `user` | AuthProvider | AuthPublicRoute |
| `loading` | AuthProvider | AuthPublicRoute |

ForgotPasswordScreen itself does NOT consume AuthContext — all auth context consumption
is at the route guard level. ✓

### URL State
None. Email is not persisted to URL.

### sessionStorage
`vc.auth.recovery` — NOT touched by forgot-password flow.
Written by AuthProvider on PASSWORD_RECOVERY; read by setNewPassword.controller.
Cleared on SIGNED_IN, SIGNED_OUT, USER_UPDATED.

### localStorage
Not touched by forgot-password flow.

### Auto-redirect Timer

```javascript
useEffect(() => {
  if (!successMessage || errorMessage) return
  const timer = setTimeout(() => navigate('/login', { replace: true }), 4000)
  return () => clearTimeout(timer)
}, [successMessage, errorMessage, navigate])
```

Cleanup is correct — timer is cleared on unmount. ✓
Race condition: if `errorMessage` becomes truthy AFTER `successMessage` is set
(impossible in current code — they are mutually exclusive state paths),
the guard `if (!successMessage || errorMessage) return` would cancel the timer.
Logic is safe.

---

## PHASE 6 — AUTH_BOUNDARY_REVIEW

### Access Classification

| Scenario | Behavior |
|---|---|
| Anonymous user | Full access — screen renders |
| Authenticated user | Redirected to `/feed` by AuthPublicRoute |
| Recovery session user | Redirected to `/feed` by AuthPublicRoute (before reset-password note: this affects /forgot-password, not /reset-password which has no guard) |
| Loading state | Blank screen (null render) |

### Trust Boundaries

| Boundary | Input | Trust Level |
|---|---|---|
| Email input | User-supplied string | Untrusted |
| Email format check | Hook regex | Client-side only |
| Email normalization | Controller trim | Safe |
| `redirectTo` URL | `window.location.origin` + hardcoded path | Trusted origin |
| Supabase API | Normalized email | Server validates |
| Success/error message | Controlled strings | Not user-supplied |

### User Enumeration Prevention ✓

The success message is intentionally neutral:
`'If an account exists for that email, a reset link has been sent.'`
This prevents attackers from discovering whether an email is registered.
Correctly documented in code comment (useResetPassword.js:41).

### PASSWORD_RECOVERY Event Integration

AuthProvider listens for `PASSWORD_RECOVERY` and:
1. Writes recovery nonce to sessionStorage
2. Navigates to `/reset-password`

This is downstream of the forgot-password screen — triggered by the Supabase email link,
not by anything the forgot-password screen does. The nonce design is sound for its
stated purpose (casual bypass prevention), with the client-side limitation clearly
documented in both AuthProvider.jsx and setNewPassword.controller.js.

---

## PHASE 7 — DATA_FLOW_MAP

```
email input (user-supplied)
│
├── Raw capture: onChange → setEmail(e.target.value)   [no transformation]
│
├── Validation gate: canSubmit = isValidEmailFormat(email)
│     Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
│     NOTE: validation is in hook, not model/controller
│
├── Normalization: String(email || '').trim()          [controller, line 4]
│
├── Empty guard: if (!normalizedEmail) throw           [controller, line 5]
│     (format not re-validated here — gap)
│
└── Supabase call: supabase.auth.resetPasswordForEmail(email, { redirectTo })
      │
      ├── Supabase SDK: validates email server-side
      ├── Supabase API: sends email if account exists
      └── Response: { error } only — no user data returned
```

### redirectTo Construction
```javascript
redirectTo: `${window.location.origin}/reset-password`
// Example: https://app.vibezcitizens.com/reset-password
// Uses same-origin — not user-supplied — safe
```

### Sanitization Assessment

| Input | Sanitized | Notes |
|---|---|---|
| email → DOM render | N/A | Never rendered as HTML; sent to Supabase SDK |
| successMessage | Hardcoded string | Not user-supplied — safe |
| errorMessage | Hardcoded string | Not user-supplied — safe |
| redirectTo | Same-origin | Not user-supplied — safe |

No XSS vectors identified in this flow.

---

## PHASE 8 — CONTRACT_COMPLIANCE

Reference: `apps/VCSM/CLAUDE.md`

| Contract Rule | Status | Evidence |
|---|---|---|
| DAL → Model → Controller → Hook → Screen | PARTIAL | Email validation in hook instead of model |
| Screens contain no business logic | PASS | |
| Hooks orchestrate UI state only | VIOLATION | `isValidEmailFormat` in hook |
| Controllers own business rules | PARTIAL | Only empty check, no format validation |
| DAL owns auth access | PASS | |
| No reverse dependencies | PASS | |
| All colors via `--vc-*` CSS custom properties | **VIOLATION** | 10+ hardcoded hex values in ForgotPasswordScreen |
| No hardcoded color classes | **VIOLATION** | #6C4DF6, #9ca3af, #22c55e, #ef4444, #86efac, #fecaca, #d1d5db |
| `select('*')` banned | PASS (N/A) | No table queries in this flow |
| Files under 300 lines | PASS | Max is AuthProvider at 224 lines |
| @/ path aliases | PASS | All imports use @/ |
| JavaScript only | PASS | |
| `@/...` not `../../` | PASS | |
| No adapter bypass | INFO | ForgotPasswordScreen not in adapter (see below) |

### Adapter Note

`auth.adapter.js` exports:
- `useAuthOps`, `authTheme`, `isEmailVerifiedModel`, `CompleteProfileGate`,
  `VerifyEmailRequiredScreen`, `ConsentCheckbox`, `bootstrapJoinOnboardingController`

NOT exported: `ForgotPasswordScreen`, `useResetPassword`, `sendResetPassword.controller`.
The screen is accessed directly via `lazyPublic.jsx` → route injection.
This is acceptable: the app-level route registry is infrastructure, not a feature consumer.
No contract violation here.

---

## PHASE 9 — SPOF_MAP

### SPOF-1: Supabase Auth Service (HIGH blast radius)

**Component:** `supabase.auth.resetPasswordForEmail()`
**Location:** `resetPassword.dal.js:4`
**Failure mode:** Supabase outage or network partition
**Blast radius:** ALL users unable to request password reset
**Fallback:** None — DAL throws, hook catches, shows generic error message
**Detection:** Error surfaces to user as "Unable to send reset email"

### SPOF-2: AuthProvider Hydration Hang (MEDIUM blast radius)

**Component:** `AuthProvider.jsx` → `useAuth()` → `AuthPublicRoute.jsx:14`
**Failure mode:** `dalHydrateAuthSession()` never resolves (network stall)
**Blast radius:** AuthPublicRoute renders `null` forever — blank screen on all auth routes
**Fallback:** None — no timeout in AuthProvider hydration
**Detection:** User sees blank screen with no feedback

### SPOF-3: Supabase Client Misconfiguration (CRITICAL blast radius)

**Component:** `supabaseClient.js:7-10`
**Failure mode:** Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`
**Blast radius:** Entire auth system non-functional (createClient with undefined values)
**Fallback:** `console.error` logged, but no hard throw — app continues with broken client
**Detection:** All Supabase calls fail silently or with confusing errors

### SPOF-4: DOM Coupling in Controller (LOW blast radius)

**Component:** `sendResetPassword.controller.js:9`
**Failure mode:** `window` undefined (test env, hypothetical SSR)
**Blast radius:** Controller throws `ReferenceError` in non-browser environments
**Fallback:** None
**Detection:** Test failures if controller unit tested outside jsdom

### SPOF-5: sessionStorage Unavailability (LOW blast radius, RECOVERY FLOW ONLY)

**Component:** `AuthProvider.jsx:46-57`, `setNewPassword.controller.js:55-71`
**Failure mode:** sessionStorage blocked by browser privacy settings
**Blast radius:** Users with blocked sessionStorage cannot complete password reset
  (recovery nonce cannot be written or read — `_setRecoveryFlag` silently swallows error)
**Fallback:** None — PKCE code path still works if code is in URL
**Detection:** User sees "Reset link is invalid" with no explanation

---

## PHASE 10 — ARCHITECT_FINDINGS

---

### FINDING-001 | HIGH | Theme Contract Violation — Hardcoded Colors

**File:** `apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx`
**Lines:** 38, 46, 52, 59, 68, 79, 93, 94, 106
**Evidence:**
```
#9ca3af  (line 38, 52, 93)   → text-muted
#22c55e  (line 46)            → success green
#86efac  (line 46)            → success text
#ef4444  (line 68)            → error red
#fecaca  (line 68)            → error text
#d1d5db  (line 79)            → label color
#6C4DF6  (lines 59, 94, 106)  → brand purple
#7657ff  (line 59, 106)       → brand purple hover
```
**Contract:** `apps/VCSM/CLAUDE.md`: "All colors via `--vc-*` CSS custom properties. Do not hardcode Tailwind blue/slate/indigo/neutral classes."
**Architectural impact:** Color values duplicated across ForgotPasswordScreen, ResetPasswordScreen, LoginScreen, RegisterScreen (same pattern). Theme changes require touching each file.
**Blast radius:** All 4 auth screens deviate from design system. A theme update will require manual synchronization across all files rather than a single CSS variable change.

---

### FINDING-002 | MEDIUM | Business Logic in Hook — Email Validation

**File:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js`
**Lines:** 7-9
**Evidence:**
```javascript
function isValidEmailFormat(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}
```
**Contract:** "Hooks orchestrate UI state only. Controllers own business rules."
**Architectural impact:**
1. Email format validation is not reachable from the controller layer
2. The controller only checks `if (!normalizedEmail)` — format validation is skipped if controller is called directly
3. Creates two diverged validation gates: hook (format check) + controller (empty check only)
4. Validation logic is not testable without instantiating the hook
**Blast radius:** Medium — validation inconsistency could allow malformed emails to reach Supabase in non-UI paths; Supabase will reject them server-side, but the architecture gap remains.

---

### FINDING-003 | MEDIUM | Browser Global Coupling in Controller

**File:** `apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js`
**Line:** 9
**Evidence:**
```javascript
redirectTo: `${window.location.origin}/reset-password`,
```
**Architectural impact:**
1. Controller accesses `window.location.origin` directly — not injected, not a parameter
2. Controllers should be environment-agnostic
3. Cannot unit test without browser environment or jsdom setup
4. If app ever adds SSR or edge function wrappers, this breaks at import
**Blast radius:** Low-medium — currently CSR-only so no runtime failure, but test coverage gap and architectural coupling.

---

### FINDING-004 | LOW | Dual Route Registration Without Canonical Redirect

**File:** `apps/VCSM/src/app/routes/public/auth.routes.jsx`
**Lines:** 28-36
**Evidence:**
```javascript
// /reset kept as alias for backward compat (linked from login screen)
{
  path: '/reset',
  element: (
    <AuthPublicRoute>
      <ForgotPasswordScreen />
    </AuthPublicRoute>
  ),
},
```
**Architectural impact:**
1. Two canonical URLs for the same screen (`/reset` and `/forgot-password`)
2. No redirect from `/reset` → `/forgot-password` — URL stays as `/reset`
3. Analytics will split between two paths
4. Bookmarks/links to `/reset` never normalize to the canonical URL
**Blast radius:** Low — functional equivalence maintained, but URL inconsistency and analytics fragmentation.

---

### FINDING-005 | LOW | AuthPublicRoute Renders `null` During Hydration

**File:** `apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx`
**Line:** 13-15
**Evidence:**
```javascript
if (loading) {
  return null
}
```
**Architectural impact:** Blank screen rendered during auth session hydration — no loading state, no skeleton. Duration varies with network speed.
**Blast radius:** Low — transient UX issue on first load; not visible on fast connections.

---

### FINDING-006 | LOW | i18n Inconsistency — Hardcoded English Strings in Hook

**File:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js`
**Lines:** 42, 44
**Evidence:**
```javascript
setSuccessMessage('If an account exists for that email, a reset link has been sent.')  // line 42
setErrorMessage('Unable to send reset email. Please try again.')                         // line 44
```
**Context:** The screen uses `t('auth.forgot.*')` for all copy, but these strings in the hook bypass the i18n system.
**Architectural impact:** Two copy sources for auth strings (i18n keys + hardcoded). Platform is bilingual; these strings cannot be translated.
**Blast radius:** Low — functional but i18n incomplete. Affects Spanish locale.

---

### FINDING-007 | INFO | `errorMessage` also hardcoded English in hook

**File:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js`
**Line:** 44
Same classification as FINDING-006 — captured together for tracking.

---

### FINDING-008 | INFO | DAL File Hosts Two Separate Flow Functions

**File:** `apps/VCSM/src/features/auth/dal/resetPassword.dal.js`
**Lines:** 1-30
**Evidence:**
```
dalSendResetPasswordEmail     → forgot-password flow
dalExchangeRecoveryCode       → reset-password flow
dalUpdateUserPassword         → reset-password flow
dalSignOutRecoverySession     → reset-password flow
dalSubscribeToAuthStateChange → reset-password flow
```
**Architectural impact:** File name suggests reset-password DAL but hosts forgot-password DAL as well. At 30 lines, not a size issue, but semantic coupling.
**Blast radius:** INFO — no runtime impact. Maintenance clarity concern only.

---

### FINDING-009 | INFO | Recovery Nonce Key Duplicated Across Two Files

**Files:**
- `AuthProvider.jsx:44` → `const RECOVERY_FLAG_KEY = 'vc.auth.recovery'`
- `setNewPassword.controller.js:47` → `const RECOVERY_NONCE_KEY = 'vc.auth.recovery'`
**Evidence:** Both define the same sessionStorage key string independently. Comment says "Key must stay in sync."
**Architectural impact:** Manual synchronization required. If one is changed, the recovery flow silently breaks.
**Blast radius:** INFO — currently in sync. Future refactor risk.

---

### FINDING-010 | INFO | Dual Validation Gates (Hook + Controller) Are Diverged

**Files:** `useResetPassword.js:8` + `sendResetPassword.controller.js:5`
**Evidence:**
- Hook validates email format (regex)
- Controller validates only empty string
**Architectural impact:** Callers of the controller bypassing the hook get weaker validation.
**Blast radius:** INFO — Supabase rejects malformed emails server-side; no functional gap.

---

## PHASE 11 — ARCHITECT_SCORECARD

| Dimension | Score | Notes |
|---|---|---|
| Architecture | 78/100 | Clear layer separation, minor coupling in controller |
| Layering | 70/100 | Email validation in hook (violates contract), diverged gates |
| Routing | 82/100 | Correct guards, dual-URL alias without redirect |
| State Ownership | 88/100 | Clean separation, no cross-feature state leakage |
| Auth Boundaries | 90/100 | Correct public guard, neutral response, sound nonce design |
| Dependency Direction | 92/100 | All imports flow correctly downward, @/ aliases used |
| Contract Compliance | 65/100 | Hardcoded colors violate --vc-* contract; i18n partially bypassed |
| Maintainability | 75/100 | Files well-sized, but hardcoded colors and duplicate key reduce score |

**Overall: 80/100**

---

## PHASE 12 — THOR_ARCHITECT_SUMMARY

### Findings Count

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 2 |
| LOW | 3 |
| INFO | 4 |
| **Total** | **10** |

### Architectural Risks

1. **Theme contract violations** — Hardcoded hex colors across auth screen family will resist design system evolution. High maintenance cost as the design matures.
2. **Validation placement** — Email format check in hook leaves controller callable without format validation. Divergence from the model/controller validation contract.
3. **Controller DOM coupling** — `window.location.origin` in controller creates test and environment coupling. Low current risk but blocks future testability.

### Contract Violations

| Violation | File | Rule |
|---|---|---|
| Hardcoded colors (#6C4DF6, etc.) | ForgotPasswordScreen.jsx | CLAUDE.md: all colors via --vc-* |
| Business logic in hook | useResetPassword.js | CLAUDE.md: hooks orchestrate UI state only |

### Refactor Recommendations (ranked by impact)

1. **[HIGH priority]** Extract email validation to `emailValidation.model.js` or add to existing `auth.model.js`. Move call into controller.
2. **[HIGH priority]** Replace all hardcoded hex values in auth screens with `--vc-*` CSS custom properties. This applies to ForgotPasswordScreen, ResetPasswordScreen, LoginScreen, RegisterScreen.
3. **[MEDIUM priority]** Add success and error i18n keys (`auth.forgot.successMessage`, `auth.forgot.errorMessage`) and use `t()` from hook or pass strings via prop.
4. **[LOW priority]** Add canonical redirect from `/reset` → `/forgot-password` (301-style `<Navigate>`).
5. **[LOW priority]** Extract shared `RECOVERY_NONCE_KEY` constant to `auth.constants.js` and import from both files.
6. **[LOW priority]** Inject `window.location.origin` into controller as a parameter or move URL construction to a config utility.
7. **[INFO]** Add loading spinner/skeleton to `AuthPublicRoute` during hydration instead of null render.

### Release Readiness

**Functional flow:** CORRECT
- Email submission → Supabase API: works correctly
- User enumeration prevention: in place (neutral message)
- Auto-redirect after success: works correctly with cleanup
- Back to login path: works correctly via Link and goToLogin
- Route guard: correctly blocks authenticated users
- Recovery flow downstream: sound PKCE + nonce design

**Blocking issues:** NONE

**Non-blocking issues:**
- Theme contract violations (HIGH finding — tracked, not blocking)
- Layer violation (MEDIUM finding — tracked, not blocking)
- i18n inconsistency (LOW finding)

### Final Verdict

```
SCREEN_CAUTION
```

The forgot-password flow is functionally correct with no critical bugs or security
issues in the primary flow. SCREEN_CAUTION is issued due to:

1. Theme contract violation (HIGH) — hardcoded colors across the auth screen family
2. Layering violation (MEDIUM) — email validation logic misplaced in hook
3. i18n bypass (LOW) — success/error strings not using translation system

No THOR-blocking conditions. Recommended action: track findings in engineering tickets
before next auth-area release.

---

*Report generated: 2026-06-05*
*Authority: READ_ONLY — No code was modified during this audit*
*Source verified: All findings trace to actual code lines*
