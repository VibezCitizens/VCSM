-- ============================================================
-- STEP 4: DROP DEAD LEGACY FUNCTIONS
--
-- Run ONLY after:
-- 1. Step 1 (REVOKE) is applied
-- 2. Step 3 (app code migration) is deployed and confirmed
-- 3. You have grepped the codebase and confirmed no .rpc() callers
--
-- Grep command to verify before running:
--   grep -rn "\.rpc(" apps/VCSM/src engines/ | grep -E \
--     "block_user|cancel_friend_request|follow_user|is_blocked|\
--      react_to_post|respond_friend_request|send_friend_request|\
--      start_direct_conversation|unread_total|publish_profile|\
--      unpublish_profile|get_profile_min|profile_preview|\
--      search_profiles|read_actor_profile|get_unread_message_total|\
--      mark_all_messages_seen"
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Legacy social functions — target tables no longer exist
-- ─────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.block_user(uuid);
DROP FUNCTION IF EXISTS public.cancel_friend_request(uuid, uuid);
DROP FUNCTION IF EXISTS public.cancel_friend_request(uuid);
DROP FUNCTION IF EXISTS public.follow_user(uuid, uuid);
DROP FUNCTION IF EXISTS public.follow_user(uuid);
DROP FUNCTION IF EXISTS public.is_blocked(uuid);
DROP FUNCTION IF EXISTS public.react_to_post(uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.respond_friend_request(uuid, text);
DROP FUNCTION IF EXISTS public.respond_friend_request(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.send_friend_request(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.send_friend_request(uuid, text);
DROP FUNCTION IF EXISTS public.start_direct_conversation(uuid);

-- ─────────────────────────────────────────────────────────────
-- Functions replaced by RLS + direct queries
-- Only drop after app code confirms direct queries work
-- ─────────────────────────────────────────────────────────────

-- Replaced in readActorProfile.dal.js (Step 3)
DROP FUNCTION IF EXISTS vc.read_actor_profile(uuid);

-- Replace these after migrating any remaining callers:
DROP FUNCTION IF EXISTS public.get_profile_min_by_id(uuid);
DROP FUNCTION IF EXISTS public.get_profile_min_by_username(text);
DROP FUNCTION IF EXISTS public.profile_preview(text);
DROP FUNCTION IF EXISTS public.search_profiles(text, integer);
DROP FUNCTION IF EXISTS public.publish_profile();
DROP FUNCTION IF EXISTS public.unpublish_profile();

-- ─────────────────────────────────────────────────────────────
-- Critical functions — only drop after body is rewritten (Step 5)
-- to no longer need SECURITY DEFINER
-- ─────────────────────────────────────────────────────────────

-- Drop after Step 5 rewrite removes uid parameter
-- DROP FUNCTION IF EXISTS public.mark_all_messages_seen(uuid);
-- DROP FUNCTION IF EXISTS public.get_unread_message_total(uuid);
