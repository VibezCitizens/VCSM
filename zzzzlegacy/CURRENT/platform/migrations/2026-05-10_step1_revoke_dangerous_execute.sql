-- ============================================================
-- STEP 1: REVOKE EXECUTE — IMMEDIATE SAFETY
-- Run this FIRST, before any other batch.
-- These functions have no auth guard inside their bodies or
-- write to dead legacy tables. Revoking EXECUTE removes them
-- from the PostgREST RPC surface immediately.
--
-- Apply in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- CRITICAL: functions with no internal auth guard
-- ─────────────────────────────────────────────────────────────

-- Any authenticated caller can delete any user's data
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_everywhere(uuid)
  FROM anon, authenticated;

-- Takes uid as parameter, no auth.uid() check — any caller updates any profile's last_seen
REVOKE EXECUTE ON FUNCTION public.mark_all_messages_seen(uuid)
  FROM anon, authenticated;

-- Takes uid as parameter — suspected same pattern as mark_all_messages_seen
REVOKE EXECUTE ON FUNCTION public.get_unread_message_total(uuid)
  FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- LEGACY: functions writing to tables that no longer exist
-- (public.user_blocks, public.followers, public.friends,
--  public.friend_requests are not in the current schema)
-- ─────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.block_user(uuid)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_friend_request(uuid, uuid)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_friend_request(uuid)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.follow_user(uuid, uuid)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.follow_user(uuid)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid)
  FROM anon, authenticated;

-- Empty stub — BEGIN with only a comment, no logic
REVOKE EXECUTE ON FUNCTION public.react_to_post(uuid, uuid, boolean)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.respond_friend_request(uuid, text)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.respond_friend_request(uuid, uuid, text)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.send_friend_request(uuid, uuid, text)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.send_friend_request(uuid, text)
  FROM anon, authenticated;

-- Pure passthrough wrapper: SELECT vc.start_direct_conversation(other_user_id)
REVOKE EXECUTE ON FUNCTION public.start_direct_conversation(uuid)
  FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- AUTHENTICATED-ONLY: remove anon from functions that should
-- never be called by unauthenticated clients
-- ─────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.publish_profile()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.unpublish_profile()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.create_tenant_bootstrap(uuid, text, text, text, uuid, text, text)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.generate_username(text, text)
  FROM anon;
