-- =============================================================
-- PROPOSAL ONLY — DO NOT RUN DIRECTLY
-- Batch 1: moderation.can_manage_domain — fix vc branch
-- Migration filename: 20260510070000_fix_moderation_can_manage_domain.sql
-- Date: 2026-05-10
-- Risk: HIGH — behavior-changing, 8 RLS policies depend on this function
-- Deploy order: FIRST in the remediation sequence
--   (must deploy before Batch 5 / FORCE RLS)
--   Deploy same release as app code fix to assertModerationAccess.dal.js
-- =============================================================
--
-- PROBLEM:
--   moderation.can_manage_domain('vc') currently returns TRUE for any
--   authenticated user who has a vc actor. This grants moderator-level
--   RLS access to all VCSM users on reports, actions, block_events.
--
-- FIX:
--   Replace vc branch with platform_admins check via actor_owners.
--   Uses the same pattern as the existing 'learning' branch.
--   Collapses chat/system to the same check (was hardcoded false).
--
-- ROLLBACK: See bottom of file.
-- =============================================================

-- Pre-deployment validation (read-only, run before applying)
-- SELECT proname, prosrc FROM pg_proc
-- WHERE proname = 'can_manage_domain'
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');

CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_domain IN ('vc', 'chat', 'system') THEN (
      -- auth.uid() → learning.actor_owners → learning.platform_admins
      -- Identical to the 'learning' branch below and to
      -- learning.is_current_user_platform_admin() semantics.
      -- After Batch 3 (moderation.moderators table), this will also
      -- check moderation.moderators with platform_admins as fallback.
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    WHEN p_domain = 'learning' THEN (
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    ELSE false
  END;
$$;

-- =============================================================
-- Post-deployment validation queries (read-only):
--
-- 1. Inspect updated function body:
-- SELECT pg_get_functiondef(oid) FROM pg_proc
-- WHERE proname = 'can_manage_domain'
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');
--
-- 2. Count users who now qualify as moderators (should be small — admin-only):
-- SELECT COUNT(DISTINCT ao.user_id) AS platform_admin_count
-- FROM learning.platform_admins pa
-- JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
-- WHERE COALESCE(ao.is_void, false) = false;
--
-- 3. As a non-admin user, confirm SELECT returns nothing from reports:
-- SELECT COUNT(*) FROM moderation.reports;  -- expect: only own reports
-- =============================================================

-- =============================================================
-- ROLLBACK (restore original broken implementation):
--
-- CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
-- RETURNS boolean
-- LANGUAGE sql STABLE
-- AS $$
--   select case
--     when p_domain = 'vc' then exists (
--       select 1
--       from vc.actor_owners ao
--       join vc.actors a on a.id = ao.actor_id
--       where ao.user_id = auth.uid()
--         and coalesce(ao.is_void, false) = false
--     )
--     when p_domain = 'learning' then exists (
--       select 1
--       from learning.platform_admins pa
--       join learning.actor_owners ao on ao.actor_id = pa.actor_id
--       where ao.user_id = auth.uid()
--         and coalesce(ao.is_void, false) = false
--     )
--     when p_domain = 'chat' then false
--     when p_domain = 'system' then false
--     else false
--   end
-- $$;
-- =============================================================
