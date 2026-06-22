-- ============================================================
-- STEP 2: RLS POLICY REPAIRS
-- Run after Step 1. Test each section in staging first.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 2A: public.profiles — private profile leakage
--
-- Current: profiles_public_read USING (true) exposes ALL profiles
-- to anon, including private ones.
-- Fix: replace with scoped discoverable-only policy + self-read.
-- ─────────────────────────────────────────────────────────────

-- Drop only the broad USING(true) policy
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;

-- Restore profiles_select_via_actor (owner self-read via actor ownership)
-- auth.uid() = null for anon → EXISTS returns false → anon gets nothing
DROP POLICY IF EXISTS profiles_select_via_actor ON public.profiles;
CREATE POLICY profiles_select_via_actor ON public.profiles
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM vc.actors a
      JOIN vc.actor_owners ao ON ao.actor_id = a.id
      WHERE a.profile_id = profiles.id
        AND ao.user_id = auth.uid()
    )
  );

-- Public read: only publish=true AND discoverable=true profiles
-- NOTE: 'private' is NOT a column on public.profiles — privacy is in
-- vc.actor_privacy_settings. publish + discoverable are the real columns.
DROP POLICY IF EXISTS profiles_discoverable_read ON public.profiles;
CREATE POLICY profiles_discoverable_read ON public.profiles
  FOR SELECT
  TO public
  USING (
    publish = true
    AND coalesce(discoverable, false) = true
  );

-- Authenticated self-read: always allow users to read their own profile
DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- 2B: learning.courses — multi-tenant isolation broken
--
-- Two PERMISSIVE USING (true) policies override all org-scoped
-- policies, allowing any authenticated user to read/insert into
-- any organization's courses.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated can insert courses" ON learning.courses;
DROP POLICY IF EXISTS "authenticated can view courses" ON learning.courses;

CREATE POLICY courses_org_member_select ON learning.courses
  FOR SELECT
  TO authenticated
  USING (
    learning.can_current_user_access_course(id)
  );

CREATE POLICY courses_org_admin_insert ON learning.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    learning.can_current_user_manage_organization(organization_id)
  );


-- ─────────────────────────────────────────────────────────────
-- 2C: wanders.cards — anon role in INSERT policy
--
-- The cards_insert_sender_user policy incorrectly includes anon.
-- Cards are only sent by authenticated users.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cards_insert_sender_user" ON wanders.cards;

CREATE POLICY cards_insert_sender_authenticated ON wanders.cards
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- 2D: vc.friend_ranks — all ranks globally visible
--
-- Current: SELECT USING (true) for authenticated — any user can
-- read all friend rank scores for all actors.
-- Fix: restrict to ranks involving the current actor only.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "friend_ranks visible to authenticated" ON vc.friend_ranks;
DROP POLICY IF EXISTS friend_ranks_self_select ON vc.friend_ranks;

-- Actual columns: owner_actor_id, friend_actor_id (not actor_id)
CREATE POLICY friend_ranks_self_select ON vc.friend_ranks
  FOR SELECT
  TO authenticated
  USING (
    owner_actor_id = vc.current_actor_id()
    OR friend_actor_id = vc.current_actor_id()
  );


-- ─────────────────────────────────────────────────────────────
-- 2E: learning.* tables using public role
--
-- The following tables use {public} (includes anon) where they
-- should use {authenticated} only.
--
-- Pattern: drop the public-role policy, recreate with authenticated.
-- Run one block per table — test each in staging.
-- ─────────────────────────────────────────────────────────────

-- learning.platform_admins — should never be readable by anon
-- (Inspect existing policy names first, then drop and recreate)
-- Example template — replace policy_name with actual name:
--
-- DROP POLICY IF EXISTS "<existing_policy_name>" ON learning.platform_admins;
-- CREATE POLICY platform_admins_authenticated_read ON learning.platform_admins
--   FOR SELECT
--   TO authenticated
--   USING (learning.is_current_user_platform_admin());
--
-- Repeat for:
--   learning.communication_conversations
--   learning.communication_messages
--   learning.communication_message_receipts
--   learning.communication_inbox_entries
--   learning.communication_conversation_members
--   learning.communication_message_attachments
--   learning.communication_message_moderation_actions
--   learning.grades
--   learning.lessons
--   learning.submissions
--
-- NOTE: learning.* policy names must be verified against the live schema
-- before dropping — use the all_rls_policies.csv snapshot as reference.


-- ─────────────────────────────────────────────────────────────
-- 2F: Tables with RLS enabled but zero policies (inaccessible)
--
-- These tables are locked out entirely. Add policies to restore
-- appropriate access. Run only after confirming intended behavior.
-- ─────────────────────────────────────────────────────────────

-- learning.lesson_progress — students should read their own progress
-- CREATE POLICY lesson_progress_student_read ON learning.lesson_progress
--   FOR SELECT
--   TO authenticated
--   USING (
--     learning.can_current_user_access_course(course_id)
--   );
--
-- learning.modules — org members can read
-- CREATE POLICY modules_org_member_read ON learning.modules
--   FOR SELECT
--   TO authenticated
--   USING (
--     learning.can_current_user_access_course(course_id)
--   );
--
-- (Add similar for: submission_files, assignment_rubrics, platform.legal_documents)
