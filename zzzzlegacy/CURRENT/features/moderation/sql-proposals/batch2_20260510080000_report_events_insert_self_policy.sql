-- =============================================================
-- PROPOSAL ONLY — DO NOT RUN DIRECTLY
-- Batch 2: moderation.report_events — reporter self-insert policy
-- Migration filename: 20260510080000_report_events_insert_self_policy.sql
-- Date: 2026-05-10
-- Risk: LOW — purely additive, no existing policy modified
-- Deploy order: FIRST or SAME as Batch 1 (safe either way)
-- =============================================================
--
-- PROBLEM:
--   moderation.report_events has no INSERT policy for reporters.
--   Every reporter INSERT gets RLS denied. The DAL responds by setting
--   skipReportEventsInsertForSession = true for the rest of the session.
--   Result: report_events table is empty for all user-filed reports.
--
-- FIX:
--   Add moderation_report_events_insert_self scoped to:
--     - event_type = 'created' only (reporters cannot fake lifecycle events)
--     - reporter_actor_id match via moderation.is_self_actor()
--
-- AFTER DEPLOYING:
--   Remove skipReportEventsInsertForSession flag from
--   apps/VCSM/src/features/moderation/dal/reports.dal.js
--
-- ROLLBACK: See bottom of file.
-- =============================================================

-- Pre-deployment check: confirm policy does not already exist
-- SELECT policyname FROM pg_policies
-- WHERE schemaname = 'moderation'
--   AND tablename = 'report_events'
--   AND policyname = 'moderation_report_events_insert_self';

DROP POLICY IF EXISTS "moderation_report_events_insert_self"
  ON moderation.report_events;

CREATE POLICY "moderation_report_events_insert_self"
  ON moderation.report_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only 'created' events allowed for reporters.
    -- Moderator events (dismissed, action_taken, etc.) require
    -- moderation_report_events_insert_moderator (which checks can_manage_domain).
    event_type = 'created'

    -- The report being linked must belong to the current session actor.
    AND EXISTS (
      SELECT 1
      FROM moderation.reports r
      WHERE r.id = report_events.report_id
        AND moderation.is_self_actor(r.reporter_domain, r.reporter_actor_id)
    )
  );

-- =============================================================
-- Post-deployment validation queries (read-only):
--
-- 1. Confirm policy exists:
-- SELECT policyname, cmd, with_check
-- FROM pg_policies
-- WHERE schemaname = 'moderation'
--   AND tablename = 'report_events'
--   AND policyname = 'moderation_report_events_insert_self';
--
-- 2. Count reports with no events (historical gap — will not be backfilled):
-- SELECT COUNT(*) AS reports_without_audit
-- FROM moderation.reports r
-- WHERE NOT EXISTS (
--   SELECT 1 FROM moderation.report_events re WHERE re.report_id = r.id
-- );
--
-- 3. After a test report is filed by a regular user, confirm the event exists:
-- SELECT report_id, event_type, created_at
-- FROM moderation.report_events
-- WHERE created_at > now() - interval '5 minutes'
-- ORDER BY created_at DESC;
-- =============================================================

-- =============================================================
-- ROLLBACK:
--
-- DROP POLICY IF EXISTS "moderation_report_events_insert_self"
--   ON moderation.report_events;
-- =============================================================
