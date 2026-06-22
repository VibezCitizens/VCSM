# [TICKET-MONITORING-FRONTEND-002] v2 — Implementation Return
# Global Crash Capture Layer

---

## Files Created

| File | Description |
|---|---|
| `src/app/monitoring/MonitoringErrorBoundary.jsx` | React ErrorBoundary — catches render crashes, emits once per crash |
| `src/app/monitoring/registerGlobalErrorHandlers.js` | window.error + unhandledrejection — idempotent, never throws |

## Files Modified

| File | Change |
|---|---|
| `src/main.jsx` | Swapped imports + call site + boundary wrapper to new monitoring/ paths |

## Files Removed

| File | Reason |
|---|---|
| `src/app/errors/AppErrorBoundary.jsx` | Superseded by MonitoringErrorBoundary — would have caused double-emission |
| `src/app/errors/installGlobalErrorHandlers.js` | Superseded by registerGlobalErrorHandlers — would have caused double-emission |

---

## Full Implementation Summary

### MonitoringErrorBoundary

Class component. `getDerivedStateFromError` sets `hasError: true` on first crash — boundary emits exactly once. `componentDidCatch` calls `captureFrontendError` fire-and-forget. Fallback UI shows copy only — no stack trace, no error details, no raw output. Reload button calls `window.location.reload()`.

### registerGlobalErrorHandlers

Module-level `let _registered = false` guard — idempotent on repeated calls, HMR-safe, StrictMode-safe. Both listeners wrapped in `try/catch {}` independently so a failure in the `window.error` handler cannot affect the `unhandledrejection` handler. `captureFrontendError` itself also wraps all logic in `try/catch {}` — three independent layers of protection.

**Rejection normalization:**
```
reason instanceof Error  → use directly
typeof reason === 'string' → new Error(reason)
reason is object/other   → new Error('Unhandled rejection: [ClassName]')  ← type only, no values
reason is null/undefined → new Error('Unhandled promise rejection')
```

Objects are not serialized — only the constructor name is captured to avoid accidental PII in arbitrary rejection payloads.

### main.jsx wiring

`registerGlobalErrorHandlers()` called immediately after `initMonitoring()`, before `createRoot().render()`.
`<MonitoringErrorBoundary>` wraps the full provider tree inside `<RootMode>` — highest safe level, no dependency on any provider.

---

## Example Emitted Payloads

### React render crash (MonitoringErrorBoundary)

```json
{
  "project_key":  "vcsm",
  "environment":  "production",
  "severity":     "error",
  "message":      "Cannot read properties of undefined (reading 'actorId')",
  "error_name":   "TypeError",
  "stack":        "TypeError: ...\n  at Component (Component.jsx:12:5)",
  "feature":      "app",
  "module":       "MonitoringErrorBoundary",
  "controller":   "react_error_boundary",
  "route":        "/dashboard/vport",
  "platform":     "web",
  "runtime":      "react",
  "app_scope":    "vcsm",
  "is_handled":   true,
  "tags":         { "source": "react" },
  "context":      { "componentStack": "\n  in VportDashboardScreen\n  in App..." },
  "breadcrumbs":  [{ "type": "react", "message": "component_crash" }]
}
```

### window.error (uncaught synchronous error)

```json
{
  "severity":    "error",
  "feature":     "app",
  "module":      "globalErrorHandler",
  "controller":  "window.onerror",
  "route":       "/feed",
  "is_handled":  true,
  "tags":        { "source": "window_error" },
  "context":     { "filename": "https://vibezcitizens.com/assets/index.js", "lineno": 42, "colno": 7 }
}
```

### unhandledrejection — Error object

```json
{
  "severity":    "error",
  "feature":     "app",
  "module":      "globalErrorHandler",
  "controller":  "window.unhandledrejection",
  "route":       "/feed",
  "is_handled":  true,
  "tags":        { "source": "unhandled_rejection" }
}
```

### unhandledrejection — string (`Promise.reject("bad thing")`)

Same shape. `error.message` = `"bad thing"`.

### unhandledrejection — object (`Promise.reject({ code: 403 })`)

Same shape. `error.message` = `"Unhandled rejection: [Object]"` — type name only, no values.

### unhandledrejection — undefined (`Promise.reject()`)

Same shape. `error.message` = `"Unhandled promise rejection"`.

---

## Verification Checklist

| # | Check | Result |
|---|---|---|
| 1 | React render crash emits event | MonitoringErrorBoundary.componentDidCatch → captureFrontendError — VERIFIED by code path |
| 2 | React lifecycle crash emits event | Lifecycle throws bubble up as render errors, caught by boundary — VERIFIED |
| 3 | window.onerror emits event | `window.addEventListener('error', ...)` in registerGlobalErrorHandlers — VERIFIED by code path |
| 4 | Promise rejection (Error) emits event | `reason instanceof Error` branch → direct — VERIFIED |
| 5 | Promise rejection (string) emits event | `typeof reason === 'string'` branch → `new Error(reason)` — VERIFIED |
| 6 | Promise rejection (object) emits event | object branch → `new Error('Unhandled rejection: [ClassName]')` — VERIFIED |
| 7 | Monitoring failure does not recurse | captureFrontendError has `try/catch {}`; listeners have `try/catch {}` — three independent layers |
| 8 | Self-referential monitoring errors dropped | `isSelfReferential()` in monitoringClient.js checks stack + message for `monitoringClient`, `captureFrontendError`, `monitoring-ingest-error` — VERIFIED |
| 9 | Application usable after monitoring failure | captureFrontendError never throws; boundary renders fallback UI regardless of emit outcome — VERIFIED |
| 10 | Build passes | `✓ built in 5.42s` — VERIFIED |

---

## Contract Violations Discovered

**Double-emission risk (resolved):** The previous session created `src/app/errors/AppErrorBoundary.jsx` and `src/app/errors/installGlobalErrorHandlers.js`, both already wired into `main.jsx`. Creating the new `monitoring/` files without removing the old ones would have registered two ErrorBoundaries and two sets of global listeners — every event would have emitted twice. Both superseded files removed before new files were wired.

No other contract violations found.

---

## Build Result

```
vite v6.4.2 building for production...
✓ 7392 modules transformed.
✓ built in 5.42s
```

No errors. No new warnings.
