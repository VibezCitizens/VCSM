# monitoring-ingest-error

Edge Function that validates, normalizes, and persists error events from any VCSM surface (frontend, backend, edge function, or RPC).

---

## Endpoint

```
POST /functions/v1/monitoring-ingest-error
```

---

## Request Payload

`project_id` maps to `monitoring.projects.key` — the text key, not the UUID.

| Field | Type | Required | Notes |
|---|---|---|---|
| `project_id` | string | Yes | Key from `monitoring.projects.key` (e.g. `"vcsm"`) |
| `environment` | `development \| staging \| production` | Yes | |
| `severity` | `debug \| info \| warning \| error \| fatal` | Yes | |
| `message` | string | Yes | Normalized: trimmed, whitespace collapsed, capped at 500 chars |
| `error_name` | string | No | Error class name (e.g. `"TypeError"`) |
| `stack` | string | No | Full stack trace |
| `feature` | string | No | VCSM feature name |
| `module` | string | No | Module or component name |
| `behavior_id` | string | No | Behavior contract identifier |
| `route` | string | No | URL path where error occurred |
| `controller` | string | No | Controller name |
| `operation` | string | No | Operation name |
| `user_actor_id` | string | No | Raw actor ID — hashed to SHA-256 by Edge Function before storage |
| `session_id` | string | No | Raw session ID — hashed to SHA-256 by Edge Function before storage |
| `request_id` | string | No | |
| `correlation_id` | string | No | |
| `url` | string | No | Full URL |
| `user_agent` | string | No | |
| `platform` | string | No | e.g. `"web"`, `"ios"` |
| `runtime` | string | No | e.g. `"react"`, `"supabase-edge"` |
| `app_scope` | string | No | e.g. `"vcsm"`, `"wentrex"` |
| `release_version` | string | No | Version string — resolved to `release_id` UUID by RPC |
| `is_handled` | boolean | No | Default `true` — `false` for uncaught exceptions |
| `tags` | object | No | Sanitized to max depth 3, max 50 keys per level |
| `context` | object | No | Sanitized to max depth 3 |
| `breadcrumbs` | array | No | Sanitized to max 50 items |
| `occurred_at` | ISO timestamp | No | Defaults to server `now()` if omitted |

**Max payload size:** 64 KB

**PII handling:** `user_actor_id` and `session_id` are hashed with SHA-256 inside the Edge Function before the RPC is called. Raw values never reach the database.

---

## Response

### Success

```json
{
  "ok": true,
  "event_id": "uuid-or-null",
  "group_id": "uuid-or-null",
  "fingerprint": "sha256hex"
}
```

`event_id` and `group_id` are `null` when the RPC does not return them (direct insert path).

### Failure

```json
{
  "ok": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

| Code | HTTP | Meaning |
|---|---|---|
| `METHOD_NOT_ALLOWED` | 405 | Non-POST request |
| `UNAUTHORIZED` | 401 | Missing or malformed Bearer token |
| `PAYLOAD_TOO_LARGE` | 413 | Body exceeds 64 KB |
| `INVALID_INPUT` | 400 | Missing required field or invalid enum value |
| `MONITORING_DB_MISSING` | 501 | No RPC or monitoring.error_events table found |
| `PERSISTENCE_FAILED` | 500 | Unexpected DB error |

---

## Fingerprint

Deterministic SHA-256 over:

```
project_key | environment | error_name | normalized_message | top_stack_frame
```

`source` is excluded — it has no column in the live schema. Top stack frame is the first `"at ..."` line from the stack with line/column numbers stripped, so the fingerprint survives minor code edits.

---

## Persistence Order

1. RPC `monitoring_ingest_error_event(p_event)` — sole path
2. RPC `ingest_error_event(p_event)` — alternate name fallback

No direct-insert fallback. `monitoring` schema is not in PostgREST `db-schemas` — direct inserts would always fail. Returns `501 MONITORING_DB_MISSING` if neither RPC is found.

---

## Required Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | Yes | Auto-injected by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Auto-injected by Supabase — never exposed to client |

---

## Database Foundation

The live monitoring schema (`monitoring.projects`, `monitoring.error_events`, `monitoring.error_groups`, `monitoring.error_group_events`, etc.) already exists.

Migration `20260605010000_create_monitoring_error_ingestion.sql` adds:
- `UNIQUE (project_id, fingerprint)` constraint on `monitoring.error_groups`
- `monitoring.set_updated_at()` trigger function + trigger on `error_groups`
- RLS enabled on the three ingest tables (no policies — service_role only)
- `public.monitoring_ingest_error_event(p_event jsonb)` RPC — SECURITY DEFINER, service_role only

**Prerequisite:** At least one row must exist in `monitoring.projects` with `is_active = true` for ingestion to succeed. The RPC raises `PROJECT_NOT_FOUND` if the `project_key` has no active match.

---

## Local Testing

```bash
curl -i -X POST http://localhost:54321/functions/v1/monitoring-ingest-error \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "project_id":   "vcsm",
    "environment":  "development",
    "severity":     "error",
    "message":      "Test monitoring ingestion error",
    "error_name":   "TypeError",
    "route":        "/login",
    "feature":      "auth"
  }'
```

Expected successful response (after migration applied and project row exists):

```json
{
  "ok": true,
  "event_id": "...",
  "group_id": "...",
  "fingerprint": "..."
}
```

Expected response if no active project with key `"vcsm"`:

```json
{
  "ok": false,
  "error": "Failed to persist error event.",
  "code": "PERSISTENCE_FAILED"
}
```

---

## Deploy

```bash
supabase functions deploy monitoring-ingest-error --project-ref <ref>
```
