-- =============================================================
-- PROPOSAL ONLY — DO NOT RUN DIRECTLY
-- Batch 4: moderation.block_actor — bidirectional follow + friend_ranks
-- Migration filename: 20260510100000_fix_block_actor_bidirectional_follows.sql
-- Date: 2026-05-10
-- Risk: MEDIUM — replaces a SECURITY DEFINER RPC
-- Deploy order: Independent — can deploy any time (no dependency on other batches)
-- =============================================================
--
-- PROBLEM 1:
--   block_actor deactivates vc.actor_follows WHERE blocker follows blocked.
--   The reverse direction (blocked follows blocker) is not deactivated.
--   Result: blocked actor remains a follower of the person who blocked them.
--
-- PROBLEM 2:
--   vc.friend_ranks cleanup is client-side only in applyBlockSideEffects.js
--   with a silently swallowed try/catch. Network failure = stale friend rows.
--
-- FIX:
--   Add second UPDATE for the reverse follow direction.
--   Add DELETE on vc.friend_ranks bidirectionally inside the RPC.
--   The RPC is already SECURITY DEFINER with search_path including vc,
--   so both vc tables are accessible.
--
-- AFTER DEPLOYING — app code changes required:
--   Remove deleteFriendRankRowsBetweenActors() call from:
--     apps/VCSM/src/features/block/controllers/blockActor.controller.js
--   Remove the try/catch wrapper around it in both blockActorController
--   and toggleBlockActorController.
--   The import of applyBlockSideEffects can then be removed entirely.
--
-- ROLLBACK: See bottom of file.
-- =============================================================

-- Pre-deployment: inspect current block_actor body
-- SELECT pg_get_functiondef(oid) FROM pg_proc
-- WHERE proname = 'block_actor'
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');

CREATE OR REPLACE FUNCTION moderation.block_actor(
  p_blocker_actor_id uuid,
  p_blocked_actor_id uuid,
  p_reason           text DEFAULT NULL
)
RETURNS moderation.blocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'moderation', 'vc', 'public', 'auth'
AS $$
DECLARE
  v_row moderation.blocks%ROWTYPE;
BEGIN
  -- ─────────────────────────────────────────────────────────
  -- Guard: caller must own the blocker actor
  -- ─────────────────────────────────────────────────────────
  IF NOT moderation.is_current_vc_actor(p_blocker_actor_id) THEN
    RAISE EXCEPTION 'Not allowed to block from this actor'
      USING errcode = '42501';
  END IF;

  -- ─────────────────────────────────────────────────────────
  -- Guard: cannot block self
  -- ─────────────────────────────────────────────────────────
  IF p_blocker_actor_id = p_blocked_actor_id THEN
    RAISE EXCEPTION 'Cannot block self'
      USING errcode = '22023';
  END IF;

  -- ─────────────────────────────────────────────────────────
  -- Upsert block row
  -- ON CONFLICT reactivates a previously released block
  -- ─────────────────────────────────────────────────────────
  INSERT INTO moderation.blocks (
    blocker_domain,
    blocker_actor_id,
    blocked_domain,
    blocked_actor_id,
    status,
    reason,
    released_at,
    meta
  )
  VALUES (
    'vc', p_blocker_actor_id,
    'vc', p_blocked_actor_id,
    'active',
    p_reason,
    NULL,
    '{}'::jsonb
  )
  ON CONFLICT (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id)
  DO UPDATE SET
    status      = 'active',
    reason      = EXCLUDED.reason,
    released_at = NULL,
    updated_at  = NOW()
  RETURNING * INTO v_row;

  -- ─────────────────────────────────────────────────────────
  -- Audit: insert block_events row
  -- ─────────────────────────────────────────────────────────
  INSERT INTO moderation.block_events (
    blocker_domain,
    blocker_actor_id,
    blocked_domain,
    blocked_actor_id,
    event_type,
    reason,
    actor_domain,
    actor_id,
    meta
  )
  VALUES (
    'vc', p_blocker_actor_id,
    'vc', p_blocked_actor_id,
    'blocked',
    p_reason,
    'vc', p_blocker_actor_id,
    '{}'::jsonb
  );

  -- ─────────────────────────────────────────────────────────
  -- Follow cleanup: blocker → blocked (existing)
  -- ─────────────────────────────────────────────────────────
  UPDATE vc.actor_follows
  SET is_active = false
  WHERE follower_actor_id = p_blocker_actor_id
    AND followed_actor_id = p_blocked_actor_id;

  -- ─────────────────────────────────────────────────────────
  -- Follow cleanup: blocked → blocker (NEW — was missing)
  -- Prevents blocked actor from remaining a follower of their blocker
  -- ─────────────────────────────────────────────────────────
  UPDATE vc.actor_follows
  SET is_active = false
  WHERE follower_actor_id = p_blocked_actor_id
    AND followed_actor_id = p_blocker_actor_id;

  -- ─────────────────────────────────────────────────────────
  -- Friend ranks cleanup: bidirectional (NEW — moved from client-side)
  -- Previously in applyBlockSideEffects.js with a silently swallowed try/catch.
  -- Now atomic inside the RPC — no client-side failure risk.
  -- ─────────────────────────────────────────────────────────
  DELETE FROM vc.friend_ranks
  WHERE (owner_actor_id = p_blocker_actor_id AND friend_actor_id = p_blocked_actor_id)
     OR (owner_actor_id = p_blocked_actor_id AND friend_actor_id = p_blocker_actor_id);

  RETURN v_row;
END;
$$;

-- =============================================================
-- Post-deployment validation queries (read-only):
--
-- 1. Inspect updated function body:
-- SELECT pg_get_functiondef(oid) FROM pg_proc
-- WHERE proname = 'block_actor'
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');
-- (Confirm second UPDATE and DELETE are present)
--
-- 2. Count orphaned follows (should be cleaned up retroactively via separate one-time script):
-- SELECT COUNT(*) AS orphaned_follows
-- FROM vc.actor_follows af
-- JOIN moderation.blocks b
--   ON b.blocker_actor_id = af.followed_actor_id
--   AND b.blocked_actor_id = af.follower_actor_id
--   AND b.status = 'active'
-- WHERE af.is_active = true;
--
-- 3. Count orphaned friend ranks:
-- SELECT COUNT(*) AS orphaned_friend_ranks
-- FROM vc.friend_ranks fr
-- JOIN moderation.blocks b ON (
--   (b.blocker_actor_id = fr.owner_actor_id AND b.blocked_actor_id = fr.friend_actor_id)
--   OR (b.blocker_actor_id = fr.friend_actor_id AND b.blocked_actor_id = fr.owner_actor_id)
-- )
-- WHERE b.status = 'active';
-- (Historical stale rows — these will need a separate one-time backfill)
-- =============================================================

-- =============================================================
-- ROLLBACK (restore original — one-directional follow only):
--
-- CREATE OR REPLACE FUNCTION moderation.block_actor(
--   p_blocker_actor_id uuid,
--   p_blocked_actor_id uuid,
--   p_reason text DEFAULT NULL
-- )
-- RETURNS moderation.blocks
-- LANGUAGE plpgsql SECURITY DEFINER
-- SET search_path TO 'moderation', 'vc', 'public', 'auth'
-- AS $$
-- DECLARE
--   v_row moderation.blocks%ROWTYPE;
-- BEGIN
--   IF NOT moderation.is_current_vc_actor(p_blocker_actor_id) THEN
--     RAISE EXCEPTION 'Not allowed to block from this actor' USING errcode = '42501';
--   END IF;
--   IF p_blocker_actor_id = p_blocked_actor_id THEN
--     RAISE EXCEPTION 'Cannot block self' USING errcode = '22023';
--   END IF;
--   INSERT INTO moderation.blocks (blocker_domain, blocker_actor_id, blocked_domain,
--     blocked_actor_id, status, reason, released_at, meta)
--   VALUES ('vc', p_blocker_actor_id, 'vc', p_blocked_actor_id, 'active', p_reason, NULL, '{}')
--   ON CONFLICT (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id)
--   DO UPDATE SET status = 'active', reason = EXCLUDED.reason,
--     released_at = NULL, updated_at = NOW()
--   RETURNING * INTO v_row;
--   INSERT INTO moderation.block_events (blocker_domain, blocker_actor_id, blocked_domain,
--     blocked_actor_id, event_type, reason, actor_domain, actor_id, meta)
--   VALUES ('vc', p_blocker_actor_id, 'vc', p_blocked_actor_id,
--     'blocked', p_reason, 'vc', p_blocker_actor_id, '{}');
--   UPDATE vc.actor_follows SET is_active = false
--   WHERE follower_actor_id = p_blocker_actor_id AND followed_actor_id = p_blocked_actor_id;
--   RETURN v_row;
-- END;
-- $$;
-- =============================================================
