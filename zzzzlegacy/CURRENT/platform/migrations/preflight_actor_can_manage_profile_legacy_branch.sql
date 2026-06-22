-- =============================================================================
-- Pre-flight Audit: actor_can_manage_profile — Legacy owner_user_id Branch
-- Date: 2026-05-23
-- Context: VENOM finding — actor_can_manage_profile routes through both
--   profiles.owner_user_id (legacy) AND profile_actor_access → actor_owners
--   (canonical). In PERMISSIVE OR mode, a former VPORT owner whose
--   profiles.owner_user_id was not cleared during a transfer retains WRITE
--   access to all managed-profile tables (services, addons, content_pages, etc.).
--
-- PURPOSE:
--   Run this query BEFORE applying the conditional migration below that removes
--   the owner_user_id branch from actor_can_manage_profile.
--
--   INTERPRETATION:
--     0 rows returned  → Safe to remove owner_user_id branch (no stranded owners)
--     N rows returned  → Those N profiles have owners covered ONLY by owner_user_id.
--                        Removing the branch breaks their access. Backfill
--                        profile_actor_access or actor_owners first.
--
-- SAFETY: READ-ONLY. No modifications.
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 1 — Profiles where owner_user_id is set but canonical coverage is missing
-- ──────────────────────────────────────────────────────────────────────────────
-- This identifies profiles that would lose management access if the legacy branch
-- is removed from actor_can_manage_profile.
--
-- Uses NOT EXISTS subqueries instead of LEFT JOIN to avoid duplicate-row inflation.
-- If profile_actor_access or actor_owners had multiple rows for the same
-- combination, a LEFT JOIN would produce duplicate profile rows. NOT EXISTS
-- returns a boolean per profile regardless of duplicate entries.
--
-- SCHEMA NOTE (confirmed against live DB 2026-05-23):
--   vport.profile_actor_access has NO user_id column.
--   Columns: profile_id, actor_id, role, status, is_primary, created_at, updated_at
--   Coverage check must go through: paa.actor_id → vc.actor_owners.actor_id
--   to find the user_id. Direct paa.user_id references will error.

SELECT
  p.id             AS profile_id,
  p.actor_id,
  p.owner_user_id,
  p.is_active,
  p.is_deleted,
  a.kind           AS actor_kind,
  -- profile_actor_access coverage: does a paa record exist where the linked
  -- actor's owner in actor_owners matches owner_user_id?
  EXISTS (
    SELECT 1 FROM vport.profile_actor_access paa
    JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
    WHERE  paa.profile_id = p.id
      AND  ao.user_id     = p.owner_user_id
      AND  paa.status     = 'active'
      AND  COALESCE(ao.is_void, false) = false
  ) AS has_profile_actor_access,
  -- actor_owners coverage: is owner_user_id a direct owner of the profile's actor?
  EXISTS (
    SELECT 1 FROM vc.actor_owners ao
    WHERE  ao.actor_id = p.actor_id
      AND  ao.user_id  = p.owner_user_id
      AND  COALESCE(ao.is_void, false) = false
  ) AS has_actor_owners_coverage
FROM vport.profiles p
LEFT JOIN vc.actors a ON a.id = p.actor_id
WHERE
  p.owner_user_id IS NOT NULL   -- only profiles with the legacy field set
  AND p.is_deleted = false       -- ignore deleted profiles
  -- No canonical coverage via profile_actor_access → actor_owners path
  AND NOT EXISTS (
    SELECT 1 FROM vport.profile_actor_access paa
    JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
    WHERE  paa.profile_id = p.id
      AND  ao.user_id     = p.owner_user_id
      AND  paa.status     = 'active'
      AND  COALESCE(ao.is_void, false) = false
  )
  -- No direct actor_owners coverage for the profile's actor
  AND NOT EXISTS (
    SELECT 1 FROM vc.actor_owners ao
    WHERE  ao.actor_id = p.actor_id
      AND  ao.user_id  = p.owner_user_id
      AND  COALESCE(ao.is_void, false) = false
  )
ORDER BY p.created_at DESC;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 2 — Count summary (quick pass/fail check)
-- ──────────────────────────────────────────────────────────────────────────────
-- Run this after Step 1 for a quick count.
-- 0 = safe to proceed; >0 = migration blocker.
--
-- Uses NOT EXISTS subqueries — each profile counted at most once regardless of
-- duplicate rows in profile_actor_access or actor_owners.
--
-- Live DB result (2026-05-23): 0 stranded owners → SAFE verdict.

SELECT
  COUNT(*)                                        AS stranded_owner_count,
  CASE
    WHEN COUNT(*) = 0
      THEN 'SAFE — owner_user_id branch can be removed'
    ELSE
      'BLOCKED — ' || COUNT(*)::text ||
      ' profile(s) need canonical coverage before removal'
  END                                             AS verdict
FROM vport.profiles p
WHERE
  p.owner_user_id IS NOT NULL
  AND p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM vport.profile_actor_access paa
    JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
    WHERE  paa.profile_id = p.id
      AND  ao.user_id     = p.owner_user_id
      AND  paa.status     = 'active'
      AND  COALESCE(ao.is_void, false) = false
  )
  AND NOT EXISTS (
    SELECT 1 FROM vc.actor_owners ao
    WHERE  ao.actor_id = p.actor_id
      AND  ao.user_id  = p.owner_user_id
      AND  COALESCE(ao.is_void, false) = false
  );


-- =============================================================================
-- CONDITIONAL MIGRATION — only apply if Step 2 returns 0 (SAFE verdict)
-- =============================================================================
-- Run Steps 1 and 2 first. If count = 0, apply the block below.
-- DO NOT apply if any stranded owners are returned.
--
-- This replaces actor_can_manage_profile to remove the owner_user_id legacy
-- branch, making profile_actor_access → actor_owners the only path.
--
-- ─── MANDATORY PRE-WORK ──────────────────────────────────────────────────────
--
-- STEP A — Read the live function definition BEFORE writing the replacement:
--
--   \sf vport.actor_can_manage_profile
--
--   or:
--
--   SELECT pg_get_functiondef(oid)
--   FROM pg_proc
--   WHERE proname = 'actor_can_manage_profile'
--     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vport');
--
-- STEP B — Security context confirmed from live DB (2026-05-23).
--
--   Live function is SECURITY DEFINER with SET search_path TO 'vport','vc','public'.
--
--   Two overloads exist:
--     single-arg: actor_can_manage_profile(p_profile_id uuid)
--       — checks owner_user_id = auth.uid() OR profile_actor_access → actor_owners
--     two-arg: actor_can_manage_profile(p_actor_id uuid, p_profile_id uuid)
--       — simply calls single-arg; p_actor_id is IGNORED
--
--   The conditional migration below:
--     — Must preserve SECURITY DEFINER (function reads profile_actor_access +
--       actor_owners internally; DEFINER bypasses their RLS as required)
--     — Must use auth.uid() directly, NOT p_actor_id (which is intentionally ignored)
--     — Must replace only the single-arg form (remove owner_user_id branch)
--     — Must leave the two-arg pass-through unchanged
--
--   MUST NOT change to SECURITY INVOKER — doing so would subject internal reads
--   to the caller's RLS, breaking ownership checks for all managed-profile tables.
--
-- STEP C — Validate before deploying to staging:
--   Call actor_can_manage_profile as an authenticated owner of a VPORT.
--   Confirm it returns true. Confirm a non-owner returns false.
--
-- STEP D — Apply as a new tracked migration with its own timestamp.
--   Do NOT amend this file. Create a new migration file.
--
-- ─────────────────────────────────────────────────────────────────────────────
--
-- REPLACEMENT BODY — confirmed against live DB (2026-05-23).
-- Removes only the owner_user_id branch from the single-arg form.
-- Two-arg pass-through is reproduced unchanged.
-- DO NOT apply as-is — apply as a new tracked migration with its own timestamp.
-- =============================================================================
/*
  -- SINGLE-ARG FORM: canonical path only (owner_user_id branch removed)
  -- auth.uid() is used directly — p_actor_id does not exist in this overload.
  CREATE OR REPLACE FUNCTION vport.actor_can_manage_profile(
    p_profile_id uuid
  )
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER  -- MUST remain DEFINER — reads profile_actor_access + actor_owners
  SET search_path TO 'vport', 'vc', 'public'
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM vport.profile_actor_access paa
      JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
      WHERE paa.profile_id = p_profile_id
        AND ao.user_id     = auth.uid()
        AND paa.status     = 'active'
        AND COALESCE(ao.is_void, false) = false
    );
  $$;

  -- TWO-ARG PASS-THROUGH: unchanged — p_actor_id is intentionally ignored.
  CREATE OR REPLACE FUNCTION vport.actor_can_manage_profile(
    p_actor_id   uuid,
    p_profile_id uuid
  )
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'vport', 'vc', 'public'
  AS $$
    SELECT vport.actor_can_manage_profile(p_profile_id);
  $$;
*/

-- =============================================================================
-- END OF PRE-FLIGHT AUDIT
-- =============================================================================
