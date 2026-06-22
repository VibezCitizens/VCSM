# VCSM Email Flows

Last updated: April 25, 2026

## 1. Overview

VCSM uses two Supabase-triggered email flows:

1. **Email verification** — sent on new account registration; user must verify before accessing protected routes
2. **Password recovery** — sent when user requests a password reset; recovery link must land on `/reset-password`

Both flows use Supabase Auth email delivery. The app handles token exchange and session resolution on the client.

## 2. Supabase URL Configuration Requirements

These URLs must be in the Supabase dashboard → Authentication → URL Configuration → **Redirect URLs** allowlist. If a `redirectTo` URL is not in the allowlist, Supabase silently ignores it and uses the site URL default — which routes to `/auth/callback` and breaks the recovery flow.

| Environment | Required URL |
|---|---|
| Production | `https://vibezcitizens.com/reset-password` |
| Development | `http://localhost:5173/reset-password` |
| Production (callback) | `https://vibezcitizens.com/auth/callback` |
| Development (callback) | `http://localhost:5173/auth/callback` |

Site URL (Authentication → URL Configuration → Site URL): `https://vibezcitizens.com`

## 3. Token Types

Supabase supports two redirect modes. Both use `detectSessionInUrl: true` in the client (configured in `apps/VCSM/src/services/supabase/supabaseClient.js`).

### PKCE (default in Supabase v2)

- Link: `https://vibezcitizens.com/reset-password?code=<code>`
- Code is a one-time-use PKCE authorization code
- Exchange: `supabase.auth.exchangeCodeForSession(code)` — requires code verifier from sessionStorage
- `detectSessionInUrl: true` handles exchange automatically during client init (async)
- Fires `onAuthStateChange` with event `PASSWORD_RECOVERY` (recovery) or `SIGNED_IN` (signup confirm)

### Implicit (hash tokens)

- Link: `https://vibezcitizens.com/reset-password#access_token=...&type=recovery`
- Hash tokens are processed synchronously by `detectSessionInUrl` during `supabase.createClient()`
- `onAuthStateChange` fires before React mounts — may be missed by component-level listeners
- Fallback: `supabase.auth.getSession()` returns the session after synchronous processing
- Hash is cleared by `window.history.replaceState` before React `useEffect` runs

## 4. Flow 1: Email Verification (Registration)

### Trigger

`supabase.auth.signUp({ email, password })` in `register.dal.js`. When Supabase requires email confirmation (configured in dashboard), it returns `user` with no `session`. The register controller detects this via `!newSession` and returns `{ requiresEmailConfirm: true }`.

### Register screen behavior

`useRegister.js`:
- On `requiresEmailConfirm: true` → `navigate('/verify-email', { replace: true, state: { email: form.email } })`
- Does NOT stay on the register screen — navigates immediately
- Removed: `waitingForEmailConfirm` state, `user?.email_confirmed_at` watcher, `useAuth` import — all replaced by the navigation

### /verify-email route

`src/app/routes/public/auth.routes.jsx` → `/verify-email` public route → `VerifyEmailRequiredScreen`

`VerifyEmailRequiredScreen.jsx`:
- Reads email from `location.state?.email` (set by register navigation) or from the optional `email` prop (ProtectedRoute gate usage)
- Copy: "Check your email to confirm your account. After confirming, return and log in."
- Shows "A confirmation link was sent to {email}"
- 4-second countdown (`setInterval`) — navigates to `/login` on completion
- Shows "Redirecting to login in Xs…" countdown text
- Resend button still present via `useResendVerification`

### Verification link

Supabase sends link to: `<SUPABASE_EMAIL_CONFIRM_REDIRECT_URL>/auth/callback?code=...`

Link lands on: `/auth/callback`

### Auth callback resolution

`AuthCallbackScreen.jsx` → `useAuthCallback.js` → `resolveAuthCallbackController()`:

```text
parseCallbackParams()
  -> check hash for type=recovery  (if yes -> isRecovery: true, do not exchange)
  -> check for ?code=              (if yes -> dalExchangeCodeForSession(code))
  -> fallback getSession()         (for implicit hash tokens)
```

On success (`ok: true, isRecovery: false`):
- `navigate('/explore', { replace: true })`
- `ProtectedRoute` takes over → email verification gate → consent gate → `ProfileGatedOutlet` (CompleteProfileGate)

On `!result.ok` with no error (silent failure — no session, no error message):
- `navigate('/login', { replace: true, state: { emailConfirmed: true } })`

### Login screen email-confirmed banner

`LoginScreen.jsx` reads `location.state?.emailConfirmed === true` and renders a green banner:

> **Email confirmed** — You can now log in to your account.

Only shown when arriving via the silent-failure callback path above.

### Email verification gate (ProtectedRoute)

`apps/VCSM/src/app/guards/ProtectedRoute.jsx` — unchanged:
- If `user` exists but `!isEmailVerifiedModel(user)` (i.e. `email_confirmed_at` is null)
- Renders `VerifyEmailRequiredScreen` in place of the protected content
- In this gate context, `email` is passed as a prop (not from location state)

### Key files

- `apps/VCSM/src/features/auth/controllers/register.controller.js`
- `apps/VCSM/src/features/auth/hooks/useRegister.js`
- `apps/VCSM/src/features/auth/screens/VerifyEmailRequiredScreen.jsx`
- `apps/VCSM/src/app/routes/public/auth.routes.jsx` — `/verify-email` route
- `apps/VCSM/src/app/routes/index.jsx` — lazy `VerifyEmailRequiredScreen` import
- `apps/VCSM/src/features/auth/screens/AuthCallbackScreen.jsx`
- `apps/VCSM/src/features/auth/hooks/useAuthCallback.js`
- `apps/VCSM/src/features/auth/controllers/authCallback.controller.js`
- `apps/VCSM/src/features/auth/dal/authCallback.dal.js`
- `apps/VCSM/src/features/auth/model/emailVerification.model.js`
- `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` — `emailConfirmed` banner
- `apps/VCSM/src/features/auth/hooks/useResendVerification.js`
- `apps/VCSM/src/features/auth/controllers/resendVerification.controller.js`
- `apps/VCSM/src/features/auth/dal/emailVerification.dal.js`

### Full flow diagram

```text
RegisterScreen
  -> signUp() -> { user, session: null }
  -> requiresEmailConfirm: true
  -> navigate('/verify-email', { state: { email } })
        |
        v
/verify-email (VerifyEmailRequiredScreen)
  -> shows "Check your email to confirm your account"
  -> 4-second countdown -> auto-navigate('/login')
        |
        | (user opens email, clicks confirmation link)
        v
/auth/callback?code=...
  -> resolveAuthCallbackController
  -> dalExchangeCodeForSession(code) -> session established
        |
        v
  result.ok + !isRecovery
  -> navigate('/explore', { replace: true })
        |
        v
/explore -> ProtectedRoute
  -> email verified ✓
  -> consent gate ✓ (or shows ConsentGateScreen)
  -> ProfileGatedOutlet -> CompleteProfileGate
  -> if profile incomplete -> /onboarding
  -> if complete -> /explore renders

--- silent failure path ---
result.ok = false, no error
  -> navigate('/login', { state: { emailConfirmed: true } })
  -> LoginScreen shows "Email confirmed" green banner
```

## 5. Flow 2: Password Recovery

### Trigger

`ForgotPasswordScreen.jsx` → `useResetPassword.handleReset()` → `ctrlSendResetPasswordEmail(email)`:

```js
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
```

The `redirectTo` is dynamic — uses `window.location.origin` so it works on both prod and dev without code changes.

### Email sent

Supabase sends recovery email. Link format: `https://vibezcitizens.com/reset-password?code=<pkce_code>`

The link must go to `/reset-password`, not `/auth/callback`. If the `redirectTo` URL is not in the Supabase allowlist, Supabase falls back to the site URL and the link may land on `/auth/callback` instead — which would navigate to `/feed`.

### Recovery link landing

Link lands on `/reset-password`. This is a **public route** (inside `AuthPublicRoute`). It does not require authentication to render.

#### Safety net — AuthProvider

`AuthProvider.onAuthStateChange` handles `PASSWORD_RECOVERY` event:

```text
onAuthStateChange(PASSWORD_RECOVERY, session)
  -> navigate('/reset-password', { replace: true })
```

This fires regardless of which URL the link lands on. If the recovery link lands on `/auth/callback` (allowlist misconfiguration), the session exchange still triggers `PASSWORD_RECOVERY` → `AuthProvider` navigates to `/reset-password`.

#### Safety net — Auth callback detection

`resolveAuthCallbackController()` reads hash params before exchanging:

```text
hash.get('type') === 'recovery'
  -> return { ok: true, isRecovery: true }
useAuthCallback:
  result.isRecovery -> navigate('/reset-password', { replace: true })
```

This handles implicit-flow recovery tokens landing on `/auth/callback`.

### Session resolution on /reset-password

`useSetNewPassword.js` uses a dual-path detection strategy to handle timing variance between `detectSessionInUrl` and component mount:

```text
Path A — onAuthStateChange listener:
  supabase.auth.onAuthStateChange(PASSWORD_RECOVERY)
    -> if session -> status = 'ready'
  Handles: PKCE code exchange still in-flight when component mounts

Path B — controller fallback:
  resolveRecoverySessionController()
    -> if ?code= param: dalExchangeRecoveryCode(code) [may fail if detectSessionInUrl won]
    -> fallthrough: dalGetRecoverySession() -> getSession()
    -> if session: status = 'ready'
  Handles: detectSessionInUrl already finished, implicit hash tokens

Timeout: 15 seconds -> status = 'invalid'
  Shows "link expired" card with "Request a new link" button -> /forgot-password
```

The controller's fallthrough behavior is critical: if `dalExchangeRecoveryCode` fails (because `detectSessionInUrl` consumed the code first), it falls through to `dalGetRecoverySession()` rather than returning an error.

### Password update

```text
useSetNewPassword.handleSubmit()
  -> updatePasswordController({ password })
      -> evaluateRegisterPasswordRules(password) — must pass all rules
      -> dalUpdateUserPassword() — supabase.auth.updateUser({ password })
      -> dalSignOutRecoverySession() — supabase.auth.signOut({ scope: 'local' })
  -> navigate('/login', { replace: true, state: { passwordReset: true } })
```

The recovery session is signed out after password update so the user must log in fresh with their new credentials.

### Key files

- `apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx`
- `apps/VCSM/src/features/auth/hooks/useResetPassword.js`
- `apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js`
- `apps/VCSM/src/features/auth/screens/ResetPasswordScreen.jsx`
- `apps/VCSM/src/features/auth/hooks/useSetNewPassword.js`
- `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js`
- `apps/VCSM/src/features/auth/dal/resetPassword.dal.js`
- `apps/VCSM/src/app/providers/AuthProvider.jsx` — `PASSWORD_RECOVERY` handler
- `apps/VCSM/src/features/auth/controllers/authCallback.controller.js` — `isRecovery` detection
- `apps/VCSM/src/features/auth/hooks/useAuthCallback.js` — `isRecovery` redirect

### Full flow diagram

```text
ForgotPasswordScreen
  -> resetPasswordForEmail(email, { redirectTo: origin/reset-password })
  -> successMessage shown + "Redirecting you to login..."
  -> 4-second timer -> navigate('/login')
  -> OR user clicks "Back to login" button -> navigate('/login') immediately
        |
        | (user opens email)
        v
Supabase link -> /reset-password?code=...
        |
        | (PKCE exchange — two parallel paths)
        v
Path A: onAuthStateChange(PASSWORD_RECOVERY)    Path B: resolveRecoverySessionController()
  -> status = 'ready'                             -> getSession() -> status = 'ready'
        |
        v
ResetPasswordScreen renders form
  -> user enters new password
  -> password rules validation (live)
  -> confirm password match (live)
  -> submit -> updatePasswordController
      -> dalUpdateUserPassword
      -> dalSignOutRecoverySession
  -> navigate('/login', { state: { passwordReset: true } })
        |
        v
LoginScreen (user logs in manually with new password)
```

## 6. Forgot Password UX

`ForgotPasswordScreen.jsx`:
- Neutral success message: "If an account exists for that email, a reset link has been sent." (no user enumeration)
- "Redirecting you to login…" helper text
- 4-second auto-redirect via `useEffect` timer (cleared on unmount)
- Full-width purple CTA button "Back to login" for immediate navigation
- Secondary ghost button "Back to login" also shown in pre-success state
- Form hidden after success (`!successMessage` conditional)
- Error message shown if email sending fails — does not trigger auto-redirect

Timer logic in `useResetPassword.js`:

```js
useEffect(() => {
  if (!successMessage || errorMessage) return
  const timer = setTimeout(() => navigate('/login', { replace: true }), 4000)
  return () => clearTimeout(timer)
}, [successMessage, errorMessage, navigate])
```

## 7. ResetPasswordScreen UX States

| State | Condition | UI |
|---|---|---|
| `loading` | Session not yet resolved | Spinner "Verifying reset link…" |
| `invalid` | No session after 15s timeout, or URL error | Error card with "Request a new link" → /forgot-password and "Back to login" → /login |
| `ready` | Recovery session established | Password form with live validation rules |
| Saving | Form submitted | Button text "Saving…", disabled |
| Success | Password updated | Navigates to /login immediately |

Password validation uses `evaluateRegisterPasswordRules` — the same rules as registration. Confirm password uses `evaluateConfirmPasswordState`.

## 8. Email Verification Model

`apps/VCSM/src/features/auth/model/emailVerification.model.js`:

```js
export function isEmailVerifiedModel(user) {
  if (!user) return false
  return Boolean(user.email_confirmed_at)
}
```

This is the single source of truth used by `ProtectedRoute` to gate all protected routes.

## 9. Resend Verification

`VerifyEmailRequiredScreen` exposes a resend button via `useResendVerification`:

```text
useResendVerification.resend(email)
  -> resendVerificationEmailController({ email })
  -> dalResendVerificationEmail({ email })
  -> supabase.auth.resend({ type: 'signup', email })
```

Button is disabled after first send to prevent spam. Shows "sent" confirmation.

## 10. Known Constraints

- **PKCE code verifier**: PKCE requires the code verifier to be in sessionStorage. If the recovery link opens in a new tab from a different browser session, the code verifier is absent and `exchangeCodeForSession` fails. The fallthrough to `getSession()` handles this if `detectSessionInUrl` succeeded first.
- **Implicit flow event timing**: `PASSWORD_RECOVERY` fires synchronously during `supabase.createClient()` for hash-based tokens — before React mounts. The `onAuthStateChange` listener in `useSetNewPassword` may miss this. Path B (getSession fallback) covers this case.
- **Supabase allowlist required**: If `/reset-password` is not in the Supabase redirect URL allowlist, links land on `/auth/callback`. The auth callback safety nets redirect to `/reset-password`, but this adds latency. Always keep the allowlist current.
- **Single-use codes**: PKCE codes are single-use. A race between `detectSessionInUrl` and `resolveRecoverySessionController` is expected and handled by the fallthrough pattern.
