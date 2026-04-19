-- ============================================================
-- Migration: Fix notification delivery RPC ambiguous column bug
-- Date: 2026-04-19
-- Scope: notification.upsert_rendered, notification.insert_inbox_item, notification.update_recipient_status
-- ============================================================
-- Root cause:
--   Both functions used RETURNS TABLE(..., recipient_id uuid, ...) which
--   creates an implicit PL/pgSQL OUT parameter named "recipient_id".
--   This clashed with ON CONFLICT (recipient_id) inside the function body,
--   causing PostgreSQL error 42702 (column reference "recipient_id" is ambiguous).
--
--   Result: every notification stalled at "pending" status — rendered and
--   inbox_items rows were never created, so the inbox read query (which
--   filters status='delivered') returned zero rows and the badge showed 0.
--
--   A third instance of the same bug was found in update_recipient_status:
--   RETURNS TABLE(id uuid, status text, delivered_at ...) created an implicit
--   OUT parameter 'delivered_at' that clashed with 'ELSE delivered_at' in the
--   CASE expression of the UPDATE SET clause — same 42702 pattern.
--   This caused status to never flip from 'pending' to 'delivered' even after
--   rendered and inbox_items rows were successfully written.
--
-- Fix:
--   1. Rename RETURNS TABLE columns to out_* to avoid shadowing
--   2. Replace ON CONFLICT (recipient_id) with ON CONFLICT ON CONSTRAINT <pk>
--   3. In update_recipient_status, qualify ELSE branch as notification.recipients.delivered_at
-- ============================================================


-- ===========================================================
-- Fix 1: notification.upsert_rendered
-- ===========================================================

DROP FUNCTION IF EXISTS notification.upsert_rendered(uuid, uuid, text, text, text, text, text, text, text, jsonb);

CREATE FUNCTION notification.upsert_rendered(
  p_recipient_id uuid,
  p_template_id uuid DEFAULT NULL,
  p_locale text DEFAULT 'en',
  p_title text DEFAULT NULL,
  p_body text DEFAULT NULL,
  p_cta_label text DEFAULT NULL,
  p_link_path text DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_icon text DEFAULT NULL,
  p_render_context jsonb DEFAULT NULL
)
RETURNS TABLE(
  out_recipient_id uuid,
  out_title text,
  out_body text,
  out_link_path text,
  out_rendered_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'notification', 'public', 'pg_temp'
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_recipient_id IS NULL THEN
    RAISE EXCEPTION 'recipient_id is required';
  END IF;

  RETURN QUERY
  INSERT INTO notification.rendered (
    recipient_id,
    template_id,
    locale,
    title,
    body,
    cta_label,
    link_path,
    image_url,
    icon,
    render_context,
    rendered_at,
    updated_at
  )
  VALUES (
    p_recipient_id,
    p_template_id,
    COALESCE(NULLIF(BTRIM(p_locale), ''), 'en'),
    p_title,
    p_body,
    p_cta_label,
    p_link_path,
    p_image_url,
    p_icon,
    COALESCE(p_render_context, '{}'::jsonb),
    v_now,
    v_now
  )
  ON CONFLICT ON CONSTRAINT rendered_pkey DO UPDATE
  SET
    template_id    = EXCLUDED.template_id,
    locale         = EXCLUDED.locale,
    title          = EXCLUDED.title,
    body           = EXCLUDED.body,
    cta_label      = EXCLUDED.cta_label,
    link_path      = EXCLUDED.link_path,
    image_url      = EXCLUDED.image_url,
    icon           = EXCLUDED.icon,
    render_context = EXCLUDED.render_context,
    rendered_at    = EXCLUDED.rendered_at,
    updated_at     = EXCLUDED.updated_at
  RETURNING
    notification.rendered.recipient_id,
    notification.rendered.title,
    notification.rendered.body,
    notification.rendered.link_path,
    notification.rendered.rendered_at;
END;
$$;


-- ===========================================================
-- Fix 2: notification.insert_inbox_item
-- ===========================================================

-- ===========================================================
-- Fix 3: notification.update_recipient_status
-- ===========================================================

DROP FUNCTION IF EXISTS notification.update_recipient_status(uuid, text, text);

CREATE FUNCTION notification.update_recipient_status(
  p_recipient_id uuid,
  p_status text,
  p_error_message text DEFAULT NULL
)
RETURNS TABLE(
  out_id uuid,
  out_status text,
  out_delivered_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'notification', 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  UPDATE notification.recipients
  SET
    status        = p_status,
    error_message = p_error_message,
    delivered_at  = CASE
      WHEN p_status = 'delivered' THEN now()
      ELSE notification.recipients.delivered_at
    END
  WHERE notification.recipients.id = p_recipient_id
  RETURNING
    notification.recipients.id,
    notification.recipients.status,
    notification.recipients.delivered_at;
END;
$$;


-- ===========================================================
-- Fix 2: notification.insert_inbox_item  (original Fix 2 follows)
-- ===========================================================

DROP FUNCTION IF EXISTS notification.insert_inbox_item(uuid);

CREATE FUNCTION notification.insert_inbox_item(p_recipient_id uuid)
RETURNS TABLE(
  out_recipient_id uuid,
  out_is_seen boolean,
  out_is_read boolean,
  out_badge_counted boolean,
  out_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'notification', 'public', 'auth', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_recipient_id IS NULL THEN
    RAISE EXCEPTION 'recipient_id is required';
  END IF;

  RETURN QUERY
  INSERT INTO notification.inbox_items (recipient_id)
  VALUES (p_recipient_id)
  ON CONFLICT ON CONSTRAINT inbox_items_pkey DO UPDATE
  SET updated_at = now()
  RETURNING
    notification.inbox_items.recipient_id,
    notification.inbox_items.is_seen,
    notification.inbox_items.is_read,
    notification.inbox_items.badge_counted,
    notification.inbox_items.created_at;
END;
$$;
