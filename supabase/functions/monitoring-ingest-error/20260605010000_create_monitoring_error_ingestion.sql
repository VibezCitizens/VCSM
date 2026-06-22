-- =============================================================================
-- Migration: 20260605010000_create_monitoring_error_ingestion.sql
-- Ticket: TICKET-MONITORING-INGESTION-0001
-- Date: 2026-06-05
-- Risk: LOW — tables already exist; only additive changes
-- Deploy order: No dependencies; first monitoring migration
-- =============================================================================
--
-- REVISED SCOPE (live schema confirmed 2026-06-05):
--   monitoring schema, tables (error_events, error_groups, error_group_events,
--   projects, releases, alert_rules, alert_deliveries, audit_events) already
--   exist in the live database. This migration does NOT create tables.
--
-- OBJECTS CREATED / MODIFIED:
--   UNIQUE constraint:  monitoring.error_groups(project_id, fingerprint)
--                       Required for ON CONFLICT upsert in the ingest RPC.
--   Function:           monitoring.set_updated_at() — trigger helper (idempotent)
--   Trigger:            trg_error_groups_updated_at on monitoring.error_groups
--   RLS:                Enabled on error_events, error_groups, error_group_events
--                       (no policies — service_role bypasses, all others denied)
--   RPC:                public.monitoring_ingest_error_event(p_event jsonb)
--                       SECURITY DEFINER — sole write path for ingest Edge Function
--
-- ACCESS MODEL:
--   monitoring schema is NOT in PostgREST db-schemas (config.toml).
--   Direct table access via anon/authenticated is not possible.
--   Sole write path: public.monitoring_ingest_error_event RPC via service_role.
--
-- ROLLBACK: See bottom of file.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. UNIQUE CONSTRAINT on error_groups(project_id, fingerprint)
--
--    Required for the ON CONFLICT upsert in the ingest RPC.
--    SAFE: table should be empty at this point (no ingest path existed before).
--    If pre-existing duplicates exist this will fail — investigate before applying.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  constraint_schema = 'monitoring'
      AND  table_name        = 'error_groups'
      AND  constraint_name   = 'error_groups_project_fingerprint_uq'
  ) THEN
    ALTER TABLE monitoring.error_groups
      ADD CONSTRAINT error_groups_project_fingerprint_uq
      UNIQUE (project_id, fingerprint);
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. UPDATED_AT TRIGGER FUNCTION
--    Schema-local pattern — mirrors moderation.set_updated_at() from
--    20260604010000_create_moderation_moderators.sql.
--    CREATE OR REPLACE is idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION monitoring.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_error_groups_updated_at ON monitoring.error_groups;

CREATE TRIGGER trg_error_groups_updated_at
  BEFORE UPDATE ON monitoring.error_groups
  FOR EACH ROW EXECUTE FUNCTION monitoring.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS
--    Enabled on the three tables consumed by the ingest path.
--    ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent.
--    No policies are added — all direct access is denied by default.
--    service_role bypasses RLS (Supabase default behavior).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE monitoring.error_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring.error_groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring.error_group_events ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC: public.monitoring_ingest_error_event
--
--    Entry point for the monitoring-ingest-error Edge Function.
--    Created in public schema so PostgREST discovers it via db-schemas = ["public"].
--    Writes to monitoring schema tables under SECURITY DEFINER (postgres owner).
--
--    Called from Edge Function as:
--      adminClient.rpc("monitoring_ingest_error_event", { p_event: payload })
--
--    Payload fields (all strings unless noted):
--      Required: project_key, environment, severity, message, fingerprint
--      Optional: error_name, stack, feature, module, behavior_id,
--                route, controller, operation,
--                user_actor_id_hash (pre-hashed in Edge Function),
--                session_id_hash (pre-hashed in Edge Function),
--                request_id, correlation_id, url, user_agent,
--                platform, runtime, app_scope, release_version,
--                is_handled (bool), tags (jsonb), context (jsonb),
--                breadcrumbs (jsonb array), occurred_at (ISO timestamp)
--
--    Returns: { "ok": true, "event_id": uuid, "group_id": uuid, "fingerprint": text }
--    Raises:  RAISE EXCEPTION for validation failures or missing project
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.monitoring_ingest_error_event(p_event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = 'monitoring', 'public'
AS $$
DECLARE
  -- Required
  v_project_key    text;
  v_environment    text;
  v_severity       text;
  v_message        text;
  v_fingerprint    text;
  -- Resolved
  v_project_id     uuid;
  v_release_id     uuid;
  v_title          text;
  v_occurred_at    timestamptz;
  -- Optional scalars
  v_error_name     text;
  v_stack          text;
  v_feature        text;
  v_module         text;
  v_behavior_id    text;
  v_route          text;
  v_controller     text;
  v_operation      text;
  v_user_hash      text;
  v_session_hash   text;
  v_request_id     text;
  v_correlation_id text;
  v_url            text;
  v_user_agent     text;
  v_platform       text;
  v_runtime        text;
  v_app_scope      text;
  v_release_ver    text;
  v_is_handled     boolean;
  -- Optional jsonb
  v_tags           jsonb;
  v_context        jsonb;
  v_breadcrumbs    jsonb;
  -- Output
  v_event_id       uuid;
  v_group_id       uuid;
BEGIN

  -- ── Required field extraction + validation ─────────────────────────────────
  v_project_key := p_event->>'project_key';
  v_environment := p_event->>'environment';
  v_severity    := p_event->>'severity';
  v_message     := p_event->>'message';
  v_fingerprint := p_event->>'fingerprint';

  IF v_project_key IS NULL OR trim(v_project_key) = '' THEN
    RAISE EXCEPTION 'INVALID_PAYLOAD: project_key is required';
  END IF;

  IF v_environment NOT IN ('development', 'staging', 'production') THEN
    RAISE EXCEPTION 'INVALID_PAYLOAD: environment must be development|staging|production';
  END IF;

  IF v_severity NOT IN ('debug', 'info', 'warning', 'error', 'fatal') THEN
    RAISE EXCEPTION 'INVALID_PAYLOAD: severity must be debug|info|warning|error|fatal';
  END IF;

  IF v_message IS NULL OR trim(v_message) = '' THEN
    RAISE EXCEPTION 'INVALID_PAYLOAD: message is required';
  END IF;

  IF v_fingerprint IS NULL OR trim(v_fingerprint) = '' THEN
    RAISE EXCEPTION 'INVALID_PAYLOAD: fingerprint is required';
  END IF;

  -- ── Resolve project UUID ────────────────────────────────────────────────────
  -- project_key is the human-readable key from monitoring.projects.key.
  -- The Edge Function passes the text key; the RPC resolves to the UUID FK.
  SELECT id INTO v_project_id
  FROM   monitoring.projects
  WHERE  key       = trim(v_project_key)
    AND  is_active = true;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'PROJECT_NOT_FOUND: no active project with key=%', trim(v_project_key);
  END IF;

  -- ── Optional field extraction ──────────────────────────────────────────────
  v_error_name     := p_event->>'error_name';
  v_stack          := p_event->>'stack';
  v_feature        := p_event->>'feature';
  v_module         := p_event->>'module';
  v_behavior_id    := p_event->>'behavior_id';
  v_route          := p_event->>'route';
  v_controller     := p_event->>'controller';
  v_operation      := p_event->>'operation';
  v_user_hash      := p_event->>'user_actor_id_hash';
  v_session_hash   := p_event->>'session_id_hash';
  v_request_id     := p_event->>'request_id';
  v_correlation_id := p_event->>'correlation_id';
  v_url            := p_event->>'url';
  v_user_agent     := p_event->>'user_agent';
  v_platform       := p_event->>'platform';
  v_runtime        := p_event->>'runtime';
  v_app_scope      := p_event->>'app_scope';
  v_release_ver    := p_event->>'release_version';
  v_is_handled     := COALESCE((p_event->>'is_handled')::boolean, true);
  v_tags           := COALESCE(p_event->'tags',        '{}'::jsonb);
  v_context        := COALESCE(p_event->'context',     '{}'::jsonb);
  v_breadcrumbs    := COALESCE(p_event->'breadcrumbs', '[]'::jsonb);

  -- Safe timestamp cast — malformed ISO value falls back to now()
  BEGIN
    v_occurred_at := (p_event->>'occurred_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    v_occurred_at := NULL;
  END;
  v_occurred_at := COALESCE(v_occurred_at, now());

  -- ── Resolve release_id (optional) ─────────────────────────────────────────
  -- Matched by project + version + environment. NULL if release not found.
  IF v_release_ver IS NOT NULL THEN
    SELECT id INTO v_release_id
    FROM   monitoring.releases
    WHERE  project_id   = v_project_id
      AND  version      = v_release_ver
      AND  environment  = v_environment
    ORDER  BY deployed_at DESC NULLS LAST
    LIMIT  1;
    -- release_id stays NULL if the release record doesn't exist yet — non-fatal
  END IF;

  -- ── Build error group title ────────────────────────────────────────────────
  -- title is NOT NULL in monitoring.error_groups.
  -- Pattern: "ErrorName: message prefix" or just "message prefix" (200 char cap).
  v_title := CASE
    WHEN v_error_name IS NOT NULL AND trim(v_error_name) <> ''
      THEN left(trim(v_error_name) || ': ' || v_message, 200)
    ELSE
      left(v_message, 200)
  END;

  -- ── Upsert error group ─────────────────────────────────────────────────────
  -- INSERT on first occurrence; UPDATE counters on repeat fingerprint.
  -- affected_user_count is intentionally not updated here — accurate unique-user
  -- counting requires a separate table (group_user_hashes). Left for analytics job.
  INSERT INTO monitoring.error_groups (
    project_id, fingerprint, title,    message,   severity,    feature,
    module,     behavior_id, meta,
    first_seen_at, last_seen_at, event_count
  )
  VALUES (
    v_project_id, v_fingerprint, v_title, v_message, v_severity, v_feature,
    v_module,     v_behavior_id, '{}'::jsonb,
    v_occurred_at, v_occurred_at, 1
  )
  ON CONFLICT (project_id, fingerprint) DO UPDATE
    SET event_count  = monitoring.error_groups.event_count + 1,
        last_seen_at = GREATEST(monitoring.error_groups.last_seen_at, EXCLUDED.last_seen_at),
        updated_at   = now()
  RETURNING id INTO v_group_id;

  -- ── Insert error event ─────────────────────────────────────────────────────
  -- group_id set directly (denormalized FK on error_events).
  INSERT INTO monitoring.error_events (
    project_id,   release_id,     group_id,      environment,  app_scope,
    platform,     runtime,        severity,       error_name,   message,
    stack,        fingerprint,    feature,        module,       behavior_id,
    route,        controller,     operation,
    user_actor_id_hash, session_id_hash, request_id, correlation_id,
    url,          user_agent,
    tags,         context,        breadcrumbs,
    is_handled,   occurred_at,    received_at
  )
  VALUES (
    v_project_id, v_release_id,   v_group_id,    v_environment, v_app_scope,
    v_platform,   v_runtime,      v_severity,     v_error_name,  v_message,
    v_stack,      v_fingerprint,  v_feature,      v_module,      v_behavior_id,
    v_route,      v_controller,   v_operation,
    v_user_hash,  v_session_hash,  v_request_id,  v_correlation_id,
    v_url,        v_user_agent,
    v_tags,       v_context,      v_breadcrumbs,
    v_is_handled, v_occurred_at,  now()
  )
  RETURNING id INTO v_event_id;

  -- ── Link event to group (join table) ──────────────────────────────────────
  -- PK is composite (group_id, event_id) — no standalone id column in live schema.
  INSERT INTO monitoring.error_group_events (group_id, event_id)
  VALUES (v_group_id, v_event_id)
  ON CONFLICT (group_id, event_id) DO NOTHING;

  -- ── Return ─────────────────────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'ok',          true,
    'event_id',    v_event_id,
    'group_id',    v_group_id,
    'fingerprint', v_fingerprint
  );

END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. GRANTS
--    Revoke the default PUBLIC execute privilege.
--    EXECUTE restricted to service_role only — Edge Function credentials.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.monitoring_ingest_error_event(jsonb)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.monitoring_ingest_error_event(jsonb)
  TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SCHEMA RELOAD
-- ─────────────────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';


-- =============================================================================
-- POST-DEPLOYMENT VALIDATION (read-only — run in Studio or psql)
-- =============================================================================
/*

-- 1. Confirm UNIQUE constraint added to error_groups
SELECT constraint_name, constraint_type
FROM   information_schema.table_constraints
WHERE  table_schema = 'monitoring'
  AND  table_name   = 'error_groups'
  AND  constraint_name = 'error_groups_project_fingerprint_uq';
-- Expected: 1 row, UNIQUE

-- 2. Confirm updated_at trigger wired
SELECT tgname, tgenabled
FROM   pg_trigger
WHERE  tgrelid = 'monitoring.error_groups'::regclass;
-- Expected: trg_error_groups_updated_at | e

-- 3. Confirm RLS enabled on all three tables (no FORCE required — service_role bypasses)
SELECT relname, relrowsecurity
FROM   pg_class
WHERE  relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'monitoring')
  AND  relname IN ('error_events', 'error_groups', 'error_group_events')
ORDER  BY relname;
-- Expected: relrowsecurity=true for all three

-- 4. Confirm zero RLS policies (no public access)
SELECT policyname, tablename
FROM   pg_policies
WHERE  schemaname = 'monitoring'
  AND  tablename IN ('error_events', 'error_groups', 'error_group_events');
-- Expected: 0 rows

-- 5. Confirm RPC in public schema, SECURITY DEFINER
SELECT n.nspname, p.proname, p.prosecdef
FROM   pg_proc p
JOIN   pg_namespace n ON n.oid = p.pronamespace
WHERE  n.nspname = 'public'
  AND  p.proname = 'monitoring_ingest_error_event';
-- Expected: public | monitoring_ingest_error_event | true

-- 6. Confirm grants: service_role only
SELECT grantee, privilege_type
FROM   information_schema.routine_privileges
WHERE  routine_schema = 'public'
  AND  routine_name   = 'monitoring_ingest_error_event';
-- Expected: service_role | EXECUTE
-- Absent:   anon, authenticated, PUBLIC

-- 7. Smoke test (dev only — requires service_role key and a row in monitoring.projects)
-- First confirm a project exists:
-- SELECT key, is_active FROM monitoring.projects LIMIT 5;
--
-- Then ingest a test event:
-- SELECT public.monitoring_ingest_error_event('{
--   "project_key":  "vcsm",
--   "environment":  "development",
--   "severity":     "error",
--   "message":      "migration smoke test",
--   "fingerprint":  "abc123def456smoke"
-- }'::jsonb);
-- Expected: { "ok": true, "event_id": "...", "group_id": "...", "fingerprint": "abc123def456smoke" }

*/


-- =============================================================================
-- ROLLBACK SQL (text only — do not run unless rolling back)
-- =============================================================================
/*

  REVOKE ALL ON FUNCTION public.monitoring_ingest_error_event(jsonb) FROM service_role;
  DROP FUNCTION IF EXISTS public.monitoring_ingest_error_event(jsonb);

  DROP TRIGGER IF EXISTS trg_error_groups_updated_at ON monitoring.error_groups;
  DROP FUNCTION IF EXISTS monitoring.set_updated_at();

  ALTER TABLE monitoring.error_events       DISABLE ROW LEVEL SECURITY;
  ALTER TABLE monitoring.error_groups       DISABLE ROW LEVEL SECURITY;
  ALTER TABLE monitoring.error_group_events DISABLE ROW LEVEL SECURITY;

  ALTER TABLE monitoring.error_groups
    DROP CONSTRAINT IF EXISTS error_groups_project_fingerprint_uq;

  NOTIFY pgrst, 'reload schema';

*/
