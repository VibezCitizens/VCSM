# [TICKET-MONITORING-AUTH-COVERAGE-001] — Implementation Return
# Auth Callback / Resend Verification / Consent Recording Monitoring

---

## Files Changed

| File | Change |
|---|---|
| `src/features/auth/hooks/useAuthCallback.js` | Added import. Added emit in `result.error` controlled-failure branch (wraps string with `new Error`). Bound `catch {}` → `catch (err)` and added emit. |
| `src/features/auth/hooks/useResendVerification.js` | Added import. Bound `catch {}` → `catch (err)` and added emit. `hasEmail: Boolean(email)` only — raw email never forwarded. |
| `src/features/auth/hooks/useRegister.js` | Added emit in existing `catch (consentErr)` block. Import already present from TICKET-MONITORING-REGISTER-001. Stage `'consentRecording'` distinct from outer `'registerSubmit'`. |

---

## Behavior Changed

### useAuthCallback.js

| Path | Before | After |
|---|---|---|
| `result.ok === false && result.error` | `setError(result.error)` only | Sets error, then emits `stage: 'callbackResolution'` fire-and-forget |
| `catch {}` (unexpected throw) | Sets error, no monitoring | Binds `err`, sets error, then emits `stage: 'callbackResolution'` fire-and-forget |
| `result.ok === false && !result.error` | Navigates to `/login` (email confirmed) | Unchanged — not a failure path, no emit |
| Happy path | Navigates to `/explore` | Unchanged |

Note: controlled-failure emit wraps `result.error` string as `new Error(result.error)` so `captureFrontendError` receives a proper Error object with a usable message.

### useResendVerification.js

| Path | Before | After |
|---|---|---|
| `catch {}` | `setError(...)` only | Binds `err`, sets error, then emits `stage: 'resendVerificationEmail', hasEmail: Boolean(email)` |
| Success path | `setSent(true)` | Unchanged |

### useRegister.js — consent catch

| Path | Before | After |
|---|---|---|
| `catch (consentErr)` | `console.error + setConsentError + return false` | Same, plus emit with `stage: 'consentRecording'` before `return false` |
| Outer `catch (error)` | Emits `stage: 'registerSubmit'` | Unchanged |

---

## Payload Summary

### useAuthCallback — controlled failure
```json
{
  "project_key":  "vcsm",
  "feature":      "auth",
  "module":       "useAuthCallback",
  "controller":   "auth_callback",
  "route":        "<window.location.pathname>",
  "severity":     "error",
  "is_handled":   true,
  "tags":         { "flow": "auth_callback" },
  "context":      { "stage": "callbackResolution" },
  "breadcrumbs":  [{ "type": "auth", "message": "auth_callback_failed" }]
}
```

### useAuthCallback — unexpected catch
Same shape. `err` is an actual Error so `error_name` and `stack` are populated by monitoringClient.

### useResendVerification
```json
{
  "project_key":  "vcsm",
  "feature":      "auth",
  "module":       "useResendVerification",
  "controller":   "resend_verification",
  "route":        "/verify-email",
  "severity":     "error",
  "is_handled":   true,
  "tags":         { "flow": "verify_email" },
  "context":      { "stage": "resendVerificationEmail", "hasEmail": true },
  "breadcrumbs":  [{ "type": "auth", "message": "resend_verification_failed" }]
}
```

### useRegister — consent recording
```json
{
  "project_key":  "vcsm",
  "feature":      "auth",
  "module":       "useRegister",
  "controller":   "register",
  "route":        "/register",
  "severity":     "error",
  "is_handled":   true,
  "tags":         { "flow": "register" },
  "context":      { "stage": "consentRecording" },
  "breadcrumbs":  [{ "type": "auth", "message": "consent_recording_failed" }]
}
```

---

## PII Verification

| Hook | Forbidden fields | Status |
|---|---|---|
| useAuthCallback | email, userId, session, token | None present — route is `window.location.pathname` (path only, no params) |
| useResendVerification | raw email | Only `hasEmail: Boolean(email)` — boolean, no value |
| useRegister consent | email, userId, password | None present — stage string only |

---

## Grep Checks

- `captureFrontendError` in `useAuthCallback.js` → 2 call sites (controlled-failure branch + catch)
- `captureFrontendError` in `useResendVerification.js` → 1 call site
- `captureFrontendError` in `useRegister.js` → 2 call sites (`'registerSubmit'` + `'consentRecording'`)
- No raw email/password/userId/token fields in any new payload

---

## Tests Run

Not run — monitoring additions are fire-and-forget, no behavioral change to hook return values or navigation flow.

---

## Build Result

Not run this session.

---

## Remaining TODOs

- All covered auth hooks: login, forgot-password, reset-password, register (submit + consent), auth-callback, resend-verification
- Possible next coverage areas: onboarding hook failures, chat send failures, booking submission failures
