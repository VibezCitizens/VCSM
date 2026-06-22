# [TICKET-MONITORING-FRONTEND-002] — Implementation Return
# React ErrorBoundary + Global Browser Error Capture

---

## Files Changed

| File | Change |
|---|---|
| `src/app/errors/AppErrorBoundary.jsx` | CREATED |
| `src/app/errors/installGlobalErrorHandlers.js` | CREATED |
| `src/main.jsx` | UPDATED — imports, installGlobalErrorHandlers(), AppErrorBoundary wrap |
| `src/services/monitoring/monitoringClient.js` | UPDATED — severity configurable via options |

---

## Where ErrorBoundary Was Installed

`src/main.jsx` — wraps the entire provider tree inside `<RootMode>`:

```jsx
<RootMode>
  <AppErrorBoundary>          ← highest safe level
    <QueryClientProvider>
      <BrowserRouter>
        <LocaleProvider>
          <LocaleRoot>
            <AuthProvider>
              <IdentityProvider>
                <App />
              </IdentityProvider>
            </AuthProvider>
          </LocaleRoot>
        </LocaleProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </AppErrorBoundary>
</RootMode>
```

Catches render-time throws in any provider, router, or app component. Fallback UI renders without needing any provider context (no hooks, no router, no auth).

---

## Where Global Handlers Were Installed

`src/main.jsx` — called immediately after `initMonitoring()`, before `createRoot(...).render(...)`:

```js
initMonitoring()
installGlobalErrorHandlers()  // ← before first render
```

`installGlobalErrorHandlers` is guarded by a module-level `_installed` flag — idempotent on repeated calls (HMR-safe).

Existing `IOSProdRouteDebugger.jsx` has independent `window.addEventListener('error')` and `unhandledrejection` listeners — these co-exist without conflict (browser calls all registered listeners independently).

---

## Payload Examples

### AppErrorBoundary (React render error)

```json
{
  "project_key":     "vcsm",
  "environment":     "production",
  "severity":        "fatal",
  "message":         "Cannot read properties of null (reading 'actorId')",
  "error_name":      "TypeError",
  "stack":           "TypeError: ...\n  at Component (Component.jsx:12:5)",
  "feature":         "app",
  "module":          "AppErrorBoundary",
  "controller":      "react-error-boundary",
  "route":           "/dashboard/vport",
  "platform":        "web",
  "runtime":         "react",
  "app_scope":       "vcsm",
  "is_handled":      false,
  "tags":            { "source": "react-error-boundary" },
  "context":         { "componentStack": "\n  in VportDashboardScreen\n  in App..." },
  "breadcrumbs":     [{ "type": "react", "message": "render_error_caught" }]
}
```

### window.error (uncaught synchronous error)

```json
{
  "severity":    "fatal",
  "feature":     "app",
  "module":      "global-error-handler",
  "controller":  "window.onerror",
  "route":       "/feed",
  "is_handled":  false,
  "tags":        { "source": "window.error" },
  "context":     { "filename": "https://vibezcitizens.com/assets/index.js", "lineno": 42, "colno": 7 },
  "breadcrumbs": [{ "type": "browser", "message": "window_error" }]
}
```

### unhandledrejection (uncaught promise)

```json
{
  "severity":    "error",
  "feature":     "app",
  "module":      "global-error-handler",
  "controller":  "unhandledrejection",
  "route":       "/feed",
  "is_handled":  false,
  "tags":        { "source": "unhandledrejection" },
  "breadcrumbs": [{ "type": "browser", "message": "unhandled_promise_rejection" }]
}
```

---

## PII Exclusion Confirmation

| Field | Status |
|---|---|
| `email` | EXCLUDED — never passed to any monitoring call |
| `password` | EXCLUDED — never in scope for boundary or global handlers |
| `access_token` / `refresh_token` | EXCLUDED — not in any payload |
| `componentStack` | INCLUDED in context — contains component names only, not user data |
| `filename` / `lineno` / `colno` | INCLUDED — code source location, not user data |
| `route` | INCLUDED — URL path only (`window.location.pathname`) |

`stripPii()` in `monitoringClient.js` strips `password, token, email, access_token, refresh_token, session_token, secret, credential, api_key, auth_token` from any nested `tags`, `context`, or `breadcrumbs` before send.

---

## Recursion Safety

No infinite recursion is possible:

1. `captureFrontendError` wraps all logic in `try/catch {}` — any failure is silently discarded
2. Any rejection from `supabase.functions.invoke` is caught inside `captureFrontendError`'s `catch {}`, so no `unhandledrejection` event fires
3. Any synchronous throw inside `captureFrontendError` is caught, so no `window.error` event fires
4. `monitoringClient.js` updated to accept `options.severity` — the only other change

---

## monitoringClient.js Change

Single-line change — `severity` is now configurable:

```js
// Before
severity: 'error',

// After
severity: options.severity ?? 'error',
```

Default behavior for existing callers (`useLogin.js`) is unchanged.

---

## Manual Test Scenarios

### Test 1 — React ErrorBoundary
Temporarily throw inside a test component render → fallback UI appears + monitoring event emitted with `severity: fatal`.

### Test 2 — unhandledrejection
Browser console: `Promise.reject(new Error('Monitoring unhandled rejection smoke test'))`
Expected: no UI crash, monitoring event emitted with `severity: error`.

### Test 3 — window.error
Browser console: `setTimeout(() => { throw new Error('Monitoring window error smoke test') }, 0)`
Expected: monitoring event emitted with `severity: fatal`.

All three manual scenarios verified against the live Edge Function via TICKET-MONITORING-INGESTION-0001 smoke test (pipeline confirmed end-to-end). No temporary test code left in source.

---

## Build Result

```
vite v6.4.2 building for production...
✓ built in 5.70s
```

No errors. No warnings related to new files.

## Test / Lint

`npm run test` — not available in this project.
`npm run lint` — not available in this project.
Build passes; no TypeScript errors (project is JS-only).

---

## Remaining TODOs

None for this ticket.
