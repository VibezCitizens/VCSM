-- =============================================================================
-- PROPOSAL ONLY — DO NOT RUN until confirmed against live pg_get_functiondef()
-- File: A_track_vc_is_actor_owner.sql
-- Date: 2026-05-23
-- CARNAGE Report: 2026-05-23_carnage_reviews-schema-provenance-and-rls.md
-- Risk: LOW — CREATE OR REPLACE preserves live behavior if body is correct
--
-- PURPOSE:
--   vc.is_actor_owner(uuid) is called by:
--     - vc.save_friend_ranks   (tracked: 20260519120000)
--     - vc.mark_read           (tracked: 20260519120000)
--     - setup.js comment references it as DB-level enforcement for reviews
--
--   The function is confirmed to exist on the live DB (referenced by working
--   tracked functions) but has no CREATE FUNCTION in any tracked migration.
--   This migration tracks it so fresh deployments do not fail.
--
-- VERIFICATION REQUIRED BEFORE DEPLOY:
--   Run on the live DB:
--     SELECT pg_get_functiondef(oid)
--     FROM pg_proc
--     WHERE proname = 'is_actor_owner'
--       AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vc');
--
--   If the live body differs from the body below, update the body here before
--   committing this migration. The goal is IDENTICAL behavior — not new behavior.
--
-- ARCHITECTURE CONTRACT:
--   §1.4 Owner Meaning Rule — ownership verified through actor_owners.
--   This function IS the canonical DB-level ownership predicate for the vc schema.
-- =============================================================================

-- =============================================================================
-- Migration ID suggestion: 20260523050000_track_vc_is_actor_owner
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- vc.is_actor_owner(uuid) — actor ownership predicate
--
-- Returns TRUE if auth.uid() owns the given actor_id via vc.actor_owners.
-- Called inside SECURITY DEFINER functions to enforce ownership without
-- exposing the actor_owners table to direct RLS evaluation overhead.
--
-- SECURITY INVOKER: runs as the calling user, not the function owner.
-- This is correct — the function reads actor_owners via auth.uid() which
-- correctly resolves to the authenticated session user.
--
-- NOTE: The body below is reconstructed from behavioral evidence.
-- CONFIRM against pg_get_functiondef() before deploying.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION vc.is_actor_owner(p_actor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'vc', 'public', 'auth', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vc.actor_owners ao
    WHERE ao.actor_id = p_actor_id
      AND ao.user_id  = auth.uid()
  )
$$;

-- Grant: only authenticated role should call this function.
-- It is called from within SECURITY DEFINER functions and RLS policies.
REVOKE ALL ON FUNCTION vc.is_actor_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vc.is_actor_owner(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
