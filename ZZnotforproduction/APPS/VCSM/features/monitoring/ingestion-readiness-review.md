# Monitoring Ingestion Readiness Review

**Ticket:** TICKET-MONITORING-INGESTION-0001
**Project:** `/Users/vcsm/Desktop/VCSM/apps/VCSM`
**Mode:** Review only — no code modified
**Date:** 2026-06-05

---

## Executive Summary

**Status: PARTIALLY READY**

The project has a functional **Sentry-based monitoring adapter** already installed and
wired into the app bootstrap — but zero Supabase-native monitoring infrastructure.

The desired flow (Frontend → Edge Function → `monitoring.error_events` →
`monitoring.error_groups` → `error_group_events`) **does not exist**. There is
no `monitoring` schema, no `error_events` table, no `error_groups` table, and no
ingestion Edge Function or RPC.

What **does** exist is a thin but well-structured Sentry wrapper with one React error
boundary and one hook-level catch. Sentry is currently inactive because `VITE_SENTRY_DSN`
is not set.

The project is partially ready in that:
- The frontend capture layer has a working foundation (`RouteErrorBoundary`, adapter pattern)
- Sentry SDK is installed and properly isolated
- Edge Function patterns and service_role patterns are established and can be followed
- The `monitoring.js` adapter is designed to be replaced or augmented without touching callers

The project is **not ready** for the Supabase-native ingestion flow because:
- The database layer (`monitoring.*` schema, all tables, indexes, RLS) is entirely absent
- No ingestion Edge Function exists
- No grouping or fingerprinting logic exists
- Global browser error handlers (`window.onerror`, `unhandledrejection`) are not wired to any backend
- Backend/server error capture does not exist

---

## Existing Assets Found

### 1. Sentry Monitoring Adapter

| Field | Value |
|---|---|
| **Path** | `apps/VCSM/src/services/monitoring/monitoring.js` |
| **Purpose** | Wraps Sentry SDK behind a stable internal API; gates on `VITE_SENTRY_DSN` |
| **Evidence** | `initMonitoring()`, `captureMonitoringError()` exported; `@sentry/react` imported |
| **Confidence** | High |

Key design properties:
- No-op when `VITE_SENTRY_DSN` is absent — app runs identically without it
- Callers never import from `@sentry` directly
- `browserTracingIntegration()` configured with 10% trace sample rate
- `sendDefaultPii` intentionally omitted (false by default — no IP/PII sent)

### 2. Sentry React Package

| Field | Value |
|---|---|
| **Path** | `apps/VCSM/package.json` |
| **Purpose** | Provides Sentry SDK for browser error capture |
| **Evidence** | `"@sentry/react": "^10.54.0"` in dependencies |
| **Confidence** | High |

### 3. RouteErrorBoundary

| Field | Value |
|---|---|
| **Path** | `apps/VCSM/src/app/routes/RouteErrorBoundary.jsx` |
| **Purpose** | Catches React render errors and lazy chunk load failures |
| **Evidence** | Class component with `componentDidCatch`, calls `captureMonitoringError` |
| **Confidence** | High |

Behavior:
- Wraps the entire route tree (`AppRoutes` return)
- `getDerivedStateFromError` sets `hasError: true`
- `componentDidCatch` forwards `error` + `info.componentStack` to `captureMonitoringError`
- Shows a "Page unavailable" fallback with a Refresh button

### 4. `initMonitoring()` in App Bootstrap

| Field | Value |
|---|---|
| **Path** | `apps/VCSM/src/main.jsx` |
| **Purpose** | Activates Sentry before `createRoot` — first error is captured |
| **Evidence** | `import { initMonitoring }` + `initMonitoring()` called before React tree |
| **Confidence** | High |

### 5. Hook-Level Error Capture (`useOwnerQuickStats`)

| Field | Value |
|---|---|
| **Path** | `apps/VCSM/src/features/dashboard/vport/hooks/useOwnerQuickStats.js` |
| **Purpose** | Catches async errors from `loadOwnerQuickStatsController` |
| **Evidence** | `.catch((err) => { captureMonitoringError(err, { context, actorId, callerActorId }) })` |
| **Confidence** | High |

This is the **only non-boundary call site** of `captureMonitoringError` in the entire codebase.

### 6. IOSProdRouteDebugger (Dev Tool — NOT a monitoring backend)

| Field | Value |
|---|---|
| **Path** | `apps/VCSM/src/app/platform/ios/IOSProdRouteDebugger.jsx` |
| **Purpose** | Dev-only overlay for debugging iOS PWA routing issues |
| **Evidence** | `window.addEventListener('error', onError)` + `window.addEventListener('unhandledrejection', onRejection)` |
| **Confidence** | High |

**Important:** This component listens to `window.error` and `unhandledrejection` and
appends entries to a local in-memory log only. It does **not** send data to any backend.
It is enabled via `localStorage` flag and is not connected to monitoring infrastructure.

### 7. Edge Function Patterns (existing, not monitoring)

Five Edge Functions exist. None are monitoring-related. They establish the pattern:

| Function | Path |
|---|---|
| `delete-citizen-account` | `supabase/functions/delete-citizen-account/index.ts` |
| `reverse-geocode` | `supabase/functions/reverse-geocode/index.ts` |
| `send-citizen-invite` | `supabase/functions/send-citizen-invite/index.ts` |
| `send-lead-confirmation` | `supabase/functions/send-lead-confirmation/index.ts` |
| `send-push-notification` | `supabase/functions/send-push-notification/index.ts` |

The `delete-citizen-account` function demonstrates the correct `service_role` pattern:
- Anon client used for JWT-gated RPC calls
- Service role client used only for privileged Supabase Auth admin operations
- `SUPABASE_SERVICE_ROLE_KEY` accessed only via `Deno.env.get()` — never exposed to frontend

### 8. CORS Headers Pattern (established)

All existing Edge Functions restrict `Access-Control-Allow-Origin` to
`"https://vibezcitizens.com"`. This pattern must be followed in any new ingestion function.

### 9. Sentry DSN Environment Variable Slot

| Field | Value |
|---|---|
| **Path** | `apps/VCSM/.env.example` |
| **Evidence** | `VITE_SENTRY_DSN=` (empty, documented) |
| **Confidence** | High |

The Sentry DSN is documented and ready to be configured. It is currently unset in
`.env.local`, so Sentry is inactive in all environments.

---

## Desired Flow Coverage

| Step | Exists? | Evidence | Gap |
|---|---|---|---|
| Capture frontend error (React render) | Partial | `RouteErrorBoundary.jsx` | Only route-level; no component-level boundaries in individual features |
| Capture frontend error (unhandled promise) | No | `IOSProdRouteDebugger` captures locally only | No global `unhandledrejection` → backend pipeline |
| Capture frontend error (global JS) | No | `IOSProdRouteDebugger` captures locally only | No global `window.onerror` → backend pipeline |
| Capture backend error | No | None found | No shared logger; no Edge Function error capture; no RPC error capture |
| Send to Edge Function or RPC | No | None found | No ingestion endpoint exists |
| Insert `monitoring.error_events` | No | No migration, no table | Schema not created |
| Find/create `monitoring.error_groups` | No | No migration, no table | Schema not created; no fingerprinting logic |
| Update `event_count` / `last_seen_at` | No | None found | No upsert/increment logic |
| Link `monitoring.error_group_events` | No | No migration, no table | Schema not created |

---

## Database Review

### monitoring Schema
**DOES NOT EXIST.**

No migration in the 70-migration history creates a `monitoring` schema or any of the
following objects:

- `monitoring.error_events`
- `monitoring.error_groups`
- `monitoring.error_group_events`
- Any indexes on `project_id + fingerprint`
- Any RLS policies for monitoring tables
- Any `event_count` / `last_seen_at` columns

### Confirmed Existing Schemas (from migrations)
The live database has the following schemas (inferred from migration history):
`public`, `vc`, `platform`, `notification`, `moderation`, `traze`

No `monitoring` schema is present.

### Related: `user_ns` Table (Wanders Feature — NOT error fingerprinting)
The `userFingerprints.read.dal.js` and `userFingerprints.write.dal.js` files exist
under `src/features/wanders/core/dal/` and reference a `user_ns` table. This is an
unrelated wanders-feature namespace tracking table — it is **not** error fingerprinting
infrastructure and must not be confused with the monitoring `fingerprint` column concept.

---

## Edge Function / RPC Review

### Ingestion Edge Function
**DOES NOT EXIST.** No Edge Function accepts error events.

### Ingestion RPC
**DOES NOT EXIST.** No database function in migrations handles error ingestion.

### Existing Pattern (reference for implementation)
The `delete-citizen-account` function is the best reference implementation:
- Verifies caller JWT via anon client (no userId from client body — auth.uid() is source of truth)
- Uses service role only for privileged operations
- Returns structured `{ ok, code, message }` responses
- Handles CORS preflight correctly

---

## Frontend Capture Review

### What Works
- `RouteErrorBoundary` catches React component tree failures and chunk load errors
- `initMonitoring()` runs before any component renders — first error is captured
- `captureMonitoringError` is a stable, no-op-safe abstraction

### What Is Missing
1. **Global `window.onerror` handler** — unhandled synchronous JS errors outside React tree are not forwarded to any backend
2. **Global `unhandledrejection` handler** — unhandled promise rejections are not forwarded to any backend (IOSProdRouteDebugger captures them locally, but that is a dev overlay, not an ingestion pipeline)
3. **Systematic hook/controller error capture** — only `useOwnerQuickStats` has explicit error capture; the rest of the ~40+ hooks across the codebase do not
4. **Route-level `errorElement`** — React Router v6 supports `errorElement` on individual routes; none are configured beyond the root `RouteErrorBoundary`
5. **User/actor context in captures** — `captureMonitoringError` accepts a `context` object, but there is no mechanism that automatically attaches `actorId`, `userId`, or session data to every capture

### Current Sentry Activation Status
**INACTIVE.** `VITE_SENTRY_DSN` is not set. `initMonitoring()` returns early and `_active`
remains `false`. All `captureMonitoringError` calls are no-ops in every environment.

---

## Backend Capture Review

### What Works
Nothing. Backend error capture does not exist.

### What Is Missing
1. **Shared Edge Function logger** — no `log()` or `captureError()` utility shared across Edge Functions
2. **Edge Function error capture** — uncaught exceptions inside Edge Functions are swallowed or returned as 500s; none are forwarded to a monitoring store
3. **RPC error forwarding** — Supabase RPC errors are returned to the caller but not logged server-side to any monitoring store
4. **Supabase query error capture** — DAL files handle query errors locally (logging to dev console or returning null) but do not send to any backend monitoring system

---

## Security Risks

### MEDIUM — No ingestion rate limiting design exists

When the Edge Function is built, there will be no rate limiting on error ingestion by default.
An unauthenticated spam flood of error events could fill the `monitoring.error_events` table.
The function must validate or throttle before inserting.

### MEDIUM — Stack trace data in database requires RLS protection

Stack traces contain file paths, function names, and potentially variable values. If
`monitoring.error_events` is created without strict RLS, any authenticated user could
read others' stack traces. `select` on these tables must be restricted to service role
or platform admin actors only.

### LOW — `IOSProdRouteDebugger` captures error data to localStorage

`window.onerror` and `unhandledrejection` are captured and stored in `localStorage` by
the iOS debugger when enabled. This persists error data (including filenames, line numbers,
rejection reasons) in the browser's local storage. This is dev-only behavior controlled by
a localStorage flag and is low risk in practice.

### LOW — `captureMonitoringError` sends context object to Sentry without sanitization

The `context` parameter is forwarded directly to `Sentry.captureException` as `extra`.
If a caller passes sensitive data (e.g. tokens, PII) in the context object, it would be
sent to Sentry. Callers should be reviewed before widespread adoption.

### INFO — `service_role` key is not exposed in frontend

Confirmed: no `service_role` or `SUPABASE_SERVICE_ROLE_KEY` is referenced anywhere in
`apps/VCSM/src/`. Edge Functions access it only via `Deno.env.get()`.

---

## Missing Pieces

In implementation order:

1. **`monitoring` schema migration** — `CREATE SCHEMA monitoring` with `GRANT USAGE` to `authenticated`
2. **`monitoring.error_groups` table migration** — `project_id`, `fingerprint`, `title`, `event_count`, `first_seen_at`, `last_seen_at`, `is_resolved`; composite unique index on `(project_id, fingerprint)`
3. **`monitoring.error_events` table migration** — `group_id FK`, `project_id`, `message`, `stack_trace`, `context` JSONB, `actor_id`, `url`, `user_agent`, `created_at`; index on `(group_id, created_at)`
4. **`monitoring.error_group_events` table migration** (or use `error_events.group_id` FK — see plan note below)
5. **RLS policies** — `SELECT` restricted to service role; `INSERT` denied to all roles (inserts only via Edge Function using service role client)
6. **Fingerprinting utility** — deterministic hash of `(message + normalized_stack)` to group similar errors; must be computed server-side in the Edge Function
7. **Ingestion Edge Function** (`ingest-error-event`) — accepts POST with `{ project_id, message, stack, context, actor_id, url, user_agent }`, verifies caller (allow anonymous errors with rate limit), fingerprints, upserts `error_groups`, inserts `error_events`, links join record if needed
8. **Global `window.onerror` handler** in `main.jsx` — sends to ingestion endpoint (or to `captureMonitoringError` if keeping Sentry as primary)
9. **Global `unhandledrejection` handler** in `main.jsx` — same
10. **Actor context auto-attachment** — mechanism to attach `actorId` / `userId` to every `captureMonitoringError` call without requiring callers to pass it manually (Sentry `setUser` / `setTag`)
11. **Systematic hook/controller error wrapping** — audit all async hooks and controllers; add `.catch` with `captureMonitoringError`
12. **Edge Function error wrapper** — shared `try/catch` pattern with logging for all Edge Functions

---

## Recommended Implementation Plan

> Review only. Do not implement without a follow-up ticket and approval.

### Phase 1: Database Foundation

- Migration: `CREATE SCHEMA monitoring`
- Migration: `CREATE TABLE monitoring.error_groups` with columns: `id`, `project_id`, `fingerprint` (text, unique per project), `title`, `event_count` (int default 1), `first_seen_at`, `last_seen_at`, `is_resolved` (bool default false), `created_at`
- Migration: `CREATE TABLE monitoring.error_events` with columns: `id`, `group_id` (FK → error_groups), `project_id`, `message`, `stack_trace` (text), `context` (jsonb), `actor_id` (nullable), `url`, `user_agent`, `created_at`
- Note: `monitoring.error_group_events` as described in the ticket may be redundant if `error_events.group_id` already provides the link. Evaluate whether a separate join table adds value before creating it.
- Migration: composite unique index on `error_groups(project_id, fingerprint)`
- Migration: index on `error_events(group_id, created_at DESC)`
- Migration: RLS `ENABLE` on both tables; `INSERT`/`SELECT`/`UPDATE` denied to `authenticated` and `anon` (service role only via Edge Function)

### Phase 2: Edge Function Ingestion

- New Edge Function: `ingest-error-event`
- Accepts: `POST { project_id, message, stack, context, actor_id?, url, user_agent }`
- Security: accept anonymous POSTs (frontend errors happen before auth), but rate-limit by IP or project_id
- Fingerprint: `SHA-256(project_id + ":" + message + ":" + normalized_first_stack_frame)`
- Upsert `error_groups` using `ON CONFLICT (project_id, fingerprint) DO UPDATE SET event_count = event_count + 1, last_seen_at = now()`
- Insert `error_events` with `group_id` from the upsert
- Use service role client (Deno.env) for all inserts — never anon client
- Follow existing CORS pattern: `Access-Control-Allow-Origin: https://vibezcitizens.com`

### Phase 3: Frontend Capture

- Option A: Extend `monitoring.js` adapter with a `sendToIngest()` path alongside Sentry
- Option B: Use Sentry only and skip the custom ingestion (simpler — Sentry already installed)
- If building custom ingestion: add `window.onerror` and `unhandledrejection` handlers in `main.jsx` after `initMonitoring()`
- Add `actorId` auto-attachment via `Sentry.setUser()` in the identity setup flow (call after actor resolves)
- Audit all hooks — add `.catch(captureMonitoringError)` to async effects without error handling

### Phase 4: Backend Capture

- Create shared Edge Function error wrapper: `try { ... } catch (err) { await logEdgeFunctionError(err, context) }`
- Wire `logEdgeFunctionError` to either: call the `ingest-error-event` function, or use Sentry server-side SDK (Deno)
- Log RPC errors from the DAL layer where they surface to the controller

### Phase 5: Dashboard / Query Layer

- Read-only RPC `get_error_groups(project_id)` — returns paginated groups with counts
- Read-only RPC `get_error_events(group_id)` — returns events for a group
- Admin-only (service role or platform admin actor)
- Out of scope for MVP

### Phase 6: Security Hardening

- Rate limiting on `ingest-error-event` by IP and by `project_id`
- Stack trace truncation — cap at 8KB to prevent storage abuse
- Sanitize `context` JSONB to reject keys matching known secret patterns
- Verify no PII leaks (actor_id, not user_id, not email)
- Set RLS `FORCE ROW SECURITY` on monitoring tables
- Audit all `captureMonitoringError` call sites for sensitive context keys

---

## Final Recommendation

| Question | Answer |
|---|---|
| Can existing pieces be reused? | **Yes** — `monitoring.js` adapter, `RouteErrorBoundary`, Sentry SDK, Edge Function CORS pattern |
| Is a new Edge Function needed? | **Yes** — `ingest-error-event` must be created |
| Is a new RPC needed? | **Yes** — for error group upsert logic (or handle entirely in Edge Function) |
| Are migrations needed? | **Yes** — `monitoring` schema + `error_groups` + `error_events` tables + indexes + RLS |
| Does frontend capture need to be added? | **Yes** — global handlers missing; only route boundary exists |
| Is the existing Sentry adapter a conflict? | **No** — the adapter pattern in `monitoring.js` can be extended to route to both Sentry and the custom ingestion endpoint, keeping callers unchanged |
| Should Sentry be removed in favor of custom ingestion? | **No recommendation** — Sentry provides grouping, replay, performance tracing, and alerting that a custom table system would require significant effort to replicate. Consider keeping Sentry as the primary capture layer and building the custom ingestion only for internal dashboards or specific high-volume events. |
| Biggest risk in implementation | **Phase 1 migration** — monitoring schema must have strict RLS before any ingestion is wired up to prevent data exposure |
