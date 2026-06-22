-- =============================================================
-- PROPOSAL ONLY — DO NOT RUN DIRECTLY
-- Batch 3: moderation.moderators — role table + can_manage_domain v2
-- Migration filename: 20260510090000_create_moderation_moderators.sql
-- Date: 2026-05-10
-- Risk: MEDIUM — new table + FORCE RLS + function update
-- Deploy order: AFTER Batch 1 (requires correct can_manage_domain first)
--   Can deploy independently of Batches 2, 4, 6.
-- =============================================================
--
-- PROBLEM:
--   All moderation access is gated by learning.platform_admins.
--   VCSM content moderators and LMS platform admins are the same role.
--   There is no native VCSM moderation role table.
--
-- FIX:
--   Create moderation.moderators with roles: viewer, moderator, admin.
--   FORCE RLS from day one (no service_role bypass).
--   Admin-only policies for reads and writes (platform_admins manage the table).
--   Update can_manage_domain to check moderators first, fall back to platform_admins.
--   The fallback preserves backward compat — existing LMS admins keep mod access.
--
-- ROLLBACK: See bottom of file.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS moderation.moderators (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  domain              text        NOT NULL
                                  CHECK (domain IN ('vc', 'learning', 'chat', 'system')),
  actor_domain        text        NOT NULL DEFAULT 'vc'
                                  CHECK (actor_domain IN ('vc', 'learning')),
  actor_id            uuid        NOT NULL,
  role                text        NOT NULL DEFAULT 'moderator'
                                  CHECK (role IN ('viewer', 'moderator', 'admin')),
  granted_by_actor_id uuid,
  granted_by_domain   text        DEFAULT 'vc',
  granted_at          timestamptz NOT NULL DEFAULT now(),
  revoked_at          timestamptz,
  revocation_reason   text,
  meta                jsonb       NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT moderators_pkey   PRIMARY KEY (id),
  -- One active grant per actor per domain (revoke by setting revoked_at, not delete)
  CONSTRAINT moderators_unique UNIQUE (domain, actor_domain, actor_id)
);

COMMENT ON TABLE moderation.moderators IS
  'VCSM moderation role assignments. Native role table independent of learning.platform_admins. '
  'Supports viewer/moderator/admin levels per domain. '
  'Revoke via UPDATE revoked_at — never DELETE rows.';

COMMENT ON COLUMN moderation.moderators.actor_id IS
  'Actor UUID — from vc.actors (actor_domain=vc) or learning.actors (actor_domain=learning). '
  'Not a FK due to cross-schema reference.';

-- ─────────────────────────────────────────────────────────────
-- Auto-update trigger
-- ─────────────────────────────────────────────────────────────

-- Reuses existing moderation.set_updated_at() trigger function
CREATE TRIGGER trg_moderation_moderators_updated_at
  BEFORE UPDATE ON moderation.moderators
  FOR EACH ROW EXECUTE FUNCTION moderation.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

-- can_manage_domain lookup: actor_domain + actor_id → is active moderator?
CREATE INDEX IF NOT EXISTS idx_moderation_moderators_actor
  ON moderation.moderators (actor_domain, actor_id)
  WHERE revoked_at IS NULL;

-- Admin UI: list active moderators by domain
CREATE INDEX IF NOT EXISTS idx_moderation_moderators_domain_active
  ON moderation.moderators (domain)
  WHERE revoked_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- RLS — enable AND force (no service_role bypass from day one)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE moderation.moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation.moderators FORCE ROW LEVEL SECURITY;

-- Platform admins can read the full moderators table
CREATE POLICY "moderators_select_platform_admin"
  ON moderation.moderators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM learning.platform_admins pa
      JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
      WHERE ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- Platform admins can grant new moderator roles
CREATE POLICY "moderators_insert_platform_admin"
  ON moderation.moderators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM learning.platform_admins pa
      JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
      WHERE ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- Platform admins can update (revoke) moderator grants
-- Only UPDATE allowed — DELETE is not permitted (soft-revoke only)
CREATE POLICY "moderators_update_platform_admin"
  ON moderation.moderators
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM learning.platform_admins pa
      JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
      WHERE ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM learning.platform_admins pa
      JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
      WHERE ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- No DELETE policy — enforce soft-revoke via revoked_at

-- ─────────────────────────────────────────────────────────────
-- Update can_manage_domain to v2:
--   Check moderation.moderators first (native role, role IN moderator/admin)
--   Fall back to learning.platform_admins (backward compat)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_domain IN ('vc', 'chat', 'system', 'learning') THEN (
      -- Priority 1: check moderation.moderators (native VCSM role table)
      -- Requires role = 'moderator' or 'admin', active grant (revoked_at IS NULL)
      -- Connects via vc.actor_owners: auth.uid() → vc actor_id → moderators
      EXISTS (
        SELECT 1
        FROM moderation.moderators m
        JOIN vc.actor_owners ao
          ON ao.actor_id = m.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
          AND m.domain = p_domain
          AND m.actor_domain = 'vc'
          AND m.role IN ('moderator', 'admin')
          AND m.revoked_at IS NULL
      )
      OR
      -- Priority 2: fallback to learning.platform_admins (legacy compat)
      -- Remove this branch after moderation.moderators is populated
      -- and all existing admins have been migrated to the new table.
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
-- 1. Confirm table exists with FORCE RLS:
-- SELECT relname, relrowsecurity, relforcerowsecurity
-- FROM pg_class
-- WHERE relname = 'moderators'
--   AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');
-- Expected: relrowsecurity=true, relforcerowsecurity=true
--
-- 2. Confirm all three policies:
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'moderation' AND tablename = 'moderators';
--
-- 3. Confirm can_manage_domain v2 body:
-- SELECT pg_get_functiondef(oid) FROM pg_proc
-- WHERE proname = 'can_manage_domain'
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');
--
-- 4. Confirm table is empty (no grants yet):
-- SELECT COUNT(*) FROM moderation.moderators;
-- =============================================================

-- =============================================================
-- ROLLBACK (in order):
--
-- Step 1: Revert can_manage_domain to Batch 1 version
-- CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
-- RETURNS boolean LANGUAGE sql STABLE AS $$
--   SELECT CASE
--     WHEN p_domain IN ('vc', 'chat', 'system') THEN (
--       EXISTS (SELECT 1 FROM learning.platform_admins pa
--         JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
--         WHERE ao.user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
--     )
--     WHEN p_domain = 'learning' THEN (
--       EXISTS (SELECT 1 FROM learning.platform_admins pa
--         JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
--         WHERE ao.user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
--     )
--     ELSE false
--   END;
-- $$;
--
-- Step 2: Drop the table (safe only if no grants have been written)
-- DROP TABLE IF EXISTS moderation.moderators;
-- =============================================================
