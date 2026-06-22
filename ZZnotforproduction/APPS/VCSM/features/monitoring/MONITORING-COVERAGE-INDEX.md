# VCSM Frontend Monitoring — Coverage Index

Last updated: 2026-06-06

All files that emit via `captureFrontendError`, host a listener, or wire monitoring into the app.

---

## Core Infrastructure

| File | Role | Notes |
|---|---|---|
| `src/services/monitoring/monitoringClient.js` | **Sole emit point** — `captureFrontendError()` | PII stripping, self-recursion guard, fire-and-forget via `supabase.functions.invoke('monitoring-ingest-error')` |
| `src/app/monitoring/MonitoringErrorBoundary.jsx` | React error boundary | `componentDidCatch` → emit; fallback UI rendered; emits once per crash |
| `src/app/monitoring/registerGlobalErrorHandlers.js` | Global listeners — `window.error` + `unhandledrejection` | Idempotent guard (`_registered`); rejection normalized to Error before emit |
| `src/main.jsx` | Wiring | `registerGlobalErrorHandlers()` at lines 33; `<MonitoringErrorBoundary>` at lines 115–129 |

---

## Auth Hook Call Sites

| File | Line(s) | Call sites | Stage tag | Trigger |
|---|---|---|---|---|
| `src/features/auth/hooks/useLogin.js` | 96 | 1 | `signInWithPassword` | `catch (err)` on Supabase login failure |
| `src/features/auth/hooks/useResetPassword.js` | 56 | 1 | `resetPasswordForEmail` | `catch (err)` on send-reset-email failure |
| `src/features/auth/hooks/useSetNewPassword.js` | 122 | 1 | `securePasswordUpdate` | `catch (err)` on update-password failure |
| `src/features/auth/hooks/useRegister.js` | 150, 169 | 2 | `consentRecording` / `registerSubmit` | consent `catch (consentErr)` (line 150); outer `catch (error)` (line 169) |
| `src/features/auth/hooks/useAuthCallback.js` | 21, 45 | 2 | `callbackResolution` | `result.error` controlled-failure branch (line 21, wraps string as `new Error`); outer `catch (err)` (line 45) |
| `src/features/auth/hooks/useResendVerification.js` | 20 | 1 | `resendVerificationEmail` | `catch (err)` on resend failure |

---

## Emission Point Count

| Layer | Count |
|---|---|
| React error boundary (`componentDidCatch`) | 1 |
| Global window listeners (`window.error` + `unhandledrejection`) | 2 |
| Auth hook catch blocks | 8 |
| **Total** | **11** |

---

## PII Rules (enforced in monitoringClient.js — all call sites comply)

Stripped server-side by `stripPii()`:
`password, token, email, access_token, refresh_token, session_token, secret, credential, api_key, auth_token`

Call-site rules applied at each hook:
- No raw email value — only `hasEmail: Boolean(email)`
- No password, permitId, JWT, session token, userId, actorId in any context field
- `hasRecoveryPermit: true` boolean flag only (useSetNewPassword)
- Static stage strings only in `context.stage`

---

## Self-Recursion Guard

`isSelfReferential()` in `monitoringClient.js` checks error stack + message for:
- `monitoring-ingest-error`
- `monitoringClient`
- `captureFrontendError`

Matching errors are dropped silently — never re-emitted.

---

## Backend

| Component | Path |
|---|---|
| Edge Function | `apps/VCSM/supabase/functions/monitoring-ingest-error/index.ts` |
| Migration | `supabase/migrations/20260605010000_create_monitoring_error_ingestion.sql` |
| RPC | `public.monitoring_ingest_error_event(p_event jsonb)` — SECURITY DEFINER |
| Schema | `monitoring.error_events`, `monitoring.error_groups`, `monitoring.error_group_events`, `monitoring.projects` |

---

## Coverage Gaps (not yet monitored)

- Onboarding hooks
- Chat / messaging send failures
- Booking submission failures
- Feed post / reaction failures
- File upload failures
- Vport management mutations
