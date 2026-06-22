-- ============================================================
-- STEP 5: HARDEN REMAINING SECURITY DEFINER FUNCTIONS
--
-- Goal: every SECURITY DEFINER function that remains must have:
--   1. SET search_path = '<schema>', 'pg_temp'  ← done in secdef_a
--   2. Internal auth.uid() guard (no uid-as-parameter pattern)
--   3. REVOKE EXECUTE FROM anon (where anon should never call)
--
-- NOTE: search_path was applied to ALL functions in secdef_a.
-- This file handles the remaining two concerns only.
-- Run after Steps 1-4 and secdef_a/b/c.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- CRITICAL FIX 1: public.admin_delete_user_everywhere
--
-- The live DB has the real deletion body but NO authorization
-- check — any authenticated user could call this and delete
-- any other user's data. Adding the platform admin guard.
--
-- search_path already applied via secdef_a.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_user_everywhere(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'learning', 'platform', 'auth', 'pg_temp'
AS $$
begin
  -- GUARD: only platform admins may call this function
  IF NOT EXISTS (
    SELECT 1 FROM learning.platform_admins
    WHERE user_id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'insufficient privileges: platform admin required';
  END IF;

  -- collect every actor tied either by user_id, actor_owners, or profile_id
  create temporary table tmp_target_actors on commit drop as
  select distinct a.id
  from learning.actors a
  where a.user_id = p_user_id
     or a.profile_id = p_user_id

  union

  select distinct ao.actor_id
  from learning.actor_owners ao
  where ao.user_id = p_user_id;

  -- learning-side cleanup
  delete from learning.audit_log
  where actor_id in (select id from tmp_target_actors);

  delete from learning.parent_student_links
  where parent_actor_id in (select id from tmp_target_actors)
     or student_actor_id in (select id from tmp_target_actors)
     or created_by_actor_id in (select id from tmp_target_actors);

  delete from learning.observer_student_links
  where observer_actor_id in (select id from tmp_target_actors)
     or student_actor_id in (select id from tmp_target_actors);

  delete from learning.organization_memberships
  where actor_id in (select id from tmp_target_actors)
     or created_by_actor_id in (select id from tmp_target_actors);

  delete from learning.course_memberships
  where actor_id in (select id from tmp_target_actors)
     or created_by_actor_id in (select id from tmp_target_actors);

  delete from learning.grades
  where actor_id in (select id from tmp_target_actors)
     or graded_by_actor_id in (select id from tmp_target_actors);

  delete from learning.submissions
  where actor_id in (select id from tmp_target_actors);

  delete from learning.lesson_progress
  where actor_id in (select id from tmp_target_actors);

  delete from learning.platform_admins
  where actor_id in (select id from tmp_target_actors);

  delete from learning.actor_access
  where actor_id in (select id from tmp_target_actors)
     or granted_by_actor_id in (select id from tmp_target_actors);

  delete from learning.actor_identities
  where actor_id in (select id from tmp_target_actors);

  delete from learning.actor_profiles
  where actor_id in (select id from tmp_target_actors);

  delete from learning.actor_owners
  where actor_id in (select id from tmp_target_actors)
     or user_id = p_user_id;

  delete from learning.communication_message_receipts
  where actor_id in (select id from tmp_target_actors);

  delete from learning.communication_message_moderation_actions
  where actor_id in (select id from tmp_target_actors);

  delete from learning.communication_conversation_members
  where actor_id in (select id from tmp_target_actors)
     or added_by_actor_id in (select id from tmp_target_actors)
     or removed_by_actor_id in (select id from tmp_target_actors);

  delete from learning.communication_messages
  where sender_actor_id in (select id from tmp_target_actors)
     or hidden_by_actor_id in (select id from tmp_target_actors);

  -- platform-side cleanup
  delete from platform.user_app_actor_links
  where actor_id in (select id from tmp_target_actors);

  delete from platform.user_app_preferences
  where user_app_account_id in (
    select id from platform.user_app_accounts where user_id = p_user_id
  );

  delete from platform.user_app_state
  where user_app_account_id in (
    select id from platform.user_app_accounts where user_id = p_user_id
  );

  delete from platform.user_capabilities
  where user_app_account_id in (
    select id from platform.user_app_accounts where user_id = p_user_id
  );

  delete from platform.user_app_account_roles
  where user_app_account_id in (
    select id from platform.user_app_accounts where user_id = p_user_id
  );

  delete from platform.user_app_access
  where user_id = p_user_id;

  delete from platform.user_app_accounts
  where user_id = p_user_id;

  -- break all profile FKs, not just one actor
  update learning.actors
  set profile_id = null
  where id in (select id from tmp_target_actors)
     or profile_id = p_user_id;

  -- delete all matching actors
  delete from learning.actors
  where id in (select id from tmp_target_actors)
     or user_id = p_user_id
     or profile_id = p_user_id;

  -- now profile + auth
  delete from public.profiles
  where id = p_user_id;

  delete from auth.users
  where id = p_user_id;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user_everywhere(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user_everywhere(uuid) TO service_role;


-- ─────────────────────────────────────────────────────────────
-- CRITICAL FIX 2: public.mark_all_messages_seen
--
-- The old uid-parameter version (public.mark_all_messages_seen(uuid))
-- still exists in the live DB. Create the no-uid version that uses
-- auth.uid() internally, then revoke the old one.
-- Step 4 drops the old uid-param version after this runs.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_all_messages_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  UPDATE profiles SET last_seen = now() WHERE id = auth.uid();
$$;

-- Revoke old uid-parameter version (drop is in Step 4)
REVOKE EXECUTE ON FUNCTION public.mark_all_messages_seen(uuid) FROM anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- FIX 3: public.get_unread_message_total
--
-- References vc.inbox_entries which no longer exists.
-- Already revoked in Step 1 (idempotent here).
-- No new version needed — notification unread count is fetched
-- app-side via direct queries to notification.recipients.
-- ─────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.get_unread_message_total(uuid) FROM anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- REVOKE anon from all auth-only functions
-- Signatures verified against live DB on 2026-05-10.
-- ─────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION vc.create_actor_for_user(text, uuid, uuid, boolean, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION vc.create_notification(uuid, uuid, text, text, uuid, text, uuid, text, jsonb, boolean, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION vc.ensure_my_actor() FROM anon;
REVOKE EXECUTE ON FUNCTION vc.mark_read(uuid, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION vc.recompute_conversation_pointers(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION vc.vc_get_or_create_one_to_one(uuid, uuid, uuid) FROM anon;

-- 8-arg signature (gained p_attachments jsonb after original draft)
REVOKE EXECUTE ON FUNCTION chat.send_message_atomic(uuid, uuid, text, text, uuid, uuid, jsonb, jsonb) FROM anon;

REVOKE EXECUTE ON FUNCTION public.ensure_dm_bootstrap(uuid, uuid, uuid, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
