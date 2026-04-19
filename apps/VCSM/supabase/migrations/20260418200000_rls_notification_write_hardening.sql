-- ============================================================
-- Migration: Notification schema RLS — write hardening
-- Date: 2026-04-18
-- Scope: notification.events, notification.inbox_items,
--        notification.rendered, notification.recipients
-- ============================================================
-- Audit findings (all read policies already in place):
--
--   GAP 1 — notification.events: no INSERT block.
--            Events are created only via create_event() SECURITY DEFINER.
--            Direct client INSERT must be blocked.
--
--   GAP 2 — notification.inbox_items: no INSERT or DELETE block.
--            Items are created via insert_inbox_item() SECURITY DEFINER.
--            Archival is done via UPDATE (archived_at), not DELETE.
--            Direct INSERT and DELETE must be blocked.
--
--   GAP 3 — notification.rendered: no INSERT, UPDATE, or DELETE block.
--            Content is created/updated via upsert_rendered() SECURITY DEFINER.
--            Direct client writes must be blocked entirely.
--
--   GAP 4 — notification.recipients: no INSERT block.
--            Recipients are created via insert_recipients() SECURITY DEFINER.
--            Direct client INSERT must be blocked.
--
--   SECONDARY — notification.events SELECT policy uses vc.current_actor_id()
--            for the recipient join, which is correct for kind='actor' but
--            misses kind='user' and kind='app_account' recipients. Replaced
--            with notification.can_access_recipient() for full coverage.
--
-- All service_role operations bypass RLS and are unaffected.
-- ============================================================


-- ===========================================================
-- GAP 1: notification.events — block direct INSERT
-- ===========================================================

CREATE POLICY notification_events_no_direct_insert
  ON notification.events
  FOR INSERT
  WITH CHECK (false);


-- ===========================================================
-- GAP 1 (secondary): Fix notification.events SELECT to use
-- can_access_recipient() instead of bare recipient_actor_id check.
-- This ensures kind='user' and kind='app_account' recipients also
-- have visibility into their event records.
-- ===========================================================

DROP POLICY IF EXISTS notification_events_select_own ON notification.events;

CREATE POLICY notification_events_select_own
  ON notification.events
  FOR SELECT
  USING (
    -- Viewer sent the event (source actor)
    source_actor_id = vc.current_actor_id()
    OR
    -- Viewer is a recipient of the event (any recipient_kind)
    EXISTS (
      SELECT 1
      FROM notification.recipients nr
      WHERE nr.event_id = events.id
        AND notification.can_access_recipient(
          nr.recipient_user_app_account_id,
          nr.recipient_actor_id,
          nr.recipient_user_id,
          nr.recipient_kind,
          nr.recipient_domain
        )
    )
  );


-- ===========================================================
-- GAP 2: notification.inbox_items — block direct INSERT + DELETE
-- ===========================================================

CREATE POLICY notification_inbox_items_no_direct_insert
  ON notification.inbox_items
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY notification_inbox_items_no_direct_delete
  ON notification.inbox_items
  FOR DELETE
  USING (false);


-- ===========================================================
-- GAP 3: notification.rendered — block direct INSERT, UPDATE, DELETE
-- ===========================================================

CREATE POLICY notification_rendered_no_direct_insert
  ON notification.rendered
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY notification_rendered_no_direct_update
  ON notification.rendered
  FOR UPDATE
  USING (false);

CREATE POLICY notification_rendered_no_direct_delete
  ON notification.rendered
  FOR DELETE
  USING (false);


-- ===========================================================
-- GAP 4: notification.recipients — block direct INSERT
-- ===========================================================

CREATE POLICY notification_recipients_no_direct_insert
  ON notification.recipients
  FOR INSERT
  WITH CHECK (false);
