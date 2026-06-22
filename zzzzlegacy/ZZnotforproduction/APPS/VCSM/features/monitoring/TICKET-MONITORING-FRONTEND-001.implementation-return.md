# [TICKET-MONITORING-FRONTEND-001] — Implementation Return
# Emit Login Errors to Monitoring

---

## Files Changed

| File | Change |
|---|---|
| `src/services/monitoring/monitoringClient.js` | CREATED — `captureFrontendError` export |
| `src/features/auth/hooks/useLogin.js` | UPDATED — import + call in catch block |

---

## Files Changed Detail

### `src/services/monitoring/monitoringClient.js` (new)

Exports `captureFrontendError(error, options)`:
- Wraps `supabase.functions.invoke('monitoring-ingest-error')` — uses the anon client, auth header injected automatically
- Catches all errors internally — never throws to caller
- Strips PII keys (`password`, `token`, `email`, `access_token`, `refresh_token`, `session_token`, `secret`, `credential`, `api_key`, `auth_token`) from `tags`, `context`, `breadcrumbs` before send
- Payload exactly matches the Edge Function schema: `project_key`, `environment`, `severity`, `message`, `error_name`, `stack`, `feature`, `module`, `controller`, `route`, `platform`, `runtime`, `app_scope`, `release_version`, `is_handled`, `tags`, `context`, `breadcrumbs`
- `environment` from `import.meta.env.MODE`
- `release_version` from `import.meta.env.VITE_APP_VERSION ?? 'local-dev'`

### `src/features/auth/hooks/useLogin.js` (updated)

Added import at line 7:
```js
import { captureFrontendError } from '@/services/monitoring/monitoringClient'
```

Added call at end of catch block (before `return false`):
```js
captureFrontendError(err, {
  feature:    'auth',
  module:     'useLogin',
  controller: 'login',
  route:      '/login',
  tags:       { flow: 'login' },
  context: {
    stage:    'signInWithPassword',
    hasEmail: Boolean(email),   // ← boolean only, never raw email
  },
  breadcrumbs: [
    { type: 'auth', message: 'login_submit_failed' },
  ],
})
```

All existing behavior preserved: `debugLoginError`, `isEmailNotConfirmedError`, `setError`, `return false` — unchanged.

---

## Behavior Changed

| | Before | After |
|---|---|---|
| Failed login UI message | Shown via `setError(mapLoginError(err))` | Identical — unchanged |
| Debug panel | `debugLoginError('LOGIN_FLOW_ERROR', ...)` fires | Identical — unchanged |
| Monitoring emission | None | `captureFrontendError` fires (fire-and-forget, no await) |
| Login flow blocked by monitoring | N/A | Never — `captureFrontendError` catches all errors internally |

`captureFrontendError` is not awaited — the monitoring call is fire-and-forget. The login catch path completes and returns `false` synchronously regardless of monitoring outcome.

---

## Payload Emitted on Login Failure

```json
{
  "project_key":     "vcsm",
  "environment":     "development",
  "severity":        "error",
  "message":         "<error.message, trimmed, max 500 chars>",
  "error_name":      "Error",
  "stack":           "<error.stack>",
  "feature":         "auth",
  "module":          "useLogin",
  "controller":      "login",
  "route":           "/login",
  "platform":        "web",
  "runtime":         "react",
  "app_scope":       "vcsm",
  "release_version": "local-dev",
  "is_handled":      true,
  "tags":            { "flow": "login" },
  "context":         { "stage": "signInWithPassword", "hasEmail": true },
  "breadcrumbs":     [{ "type": "auth", "message": "login_submit_failed" }]
}
```

---

## PII Excluded

| Field | Status |
|---|---|
| `email` (raw) | EXCLUDED — never in payload |
| `password` | EXCLUDED — never in payload |
| `access_token` | EXCLUDED — never in payload |
| `refresh_token` | EXCLUDED — never in payload |
| `hasEmail` | INCLUDED — boolean only, safe |
| `user_actor_id` | EXCLUDED — not available in catch scope |
| `session_id` | EXCLUDED — not available in catch scope |

`stripPii()` in `monitoringClient.js` removes any of `password, token, email, access_token, refresh_token, session_token, secret, credential, api_key, auth_token` from `tags`, `context`, and `breadcrumbs` at up to 3 levels of nesting.

---

## Test Result

Manual validation via live Edge Function:

Sending the same payload shape as the login call emits:
- HTTP 200 from `monitoring-ingest-error`
- `event_id` and `group_id` returned
- `monitoring.error_events` row inserted
- `monitoring.error_groups` groups repeated failures on same fingerprint
- No raw PII stored (SHA-256 hash path in Edge Function — `user_actor_id` and `session_id` not sent from frontend, so hashing is bypassed and columns are null)

Smoke test from TICKET-MONITORING-INGESTION-0001 confirms the end-to-end pipeline is live.

---

## Build Result

```
vite v6.4.2 building for development...
✓ built in 5.89s
```

No errors. No warnings related to new files.

---

## Remaining TODOs

- TICKET-MONITORING-INGESTION-0001 infra note: 12 security migrations in `apps/VCSM/supabase/migrations/`
  (`20260527080000`–`20260604040000`) are unapplied to the live DB — separate ticket required
- No other login-related surfaces need monitoring at this time
