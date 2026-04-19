-- ============================================================
-- Migration: Add INSERT policy to vc.post_rose_gifts
-- Date: 2026-04-19
-- ============================================================
-- Gap: vc.post_rose_gifts had RLS enabled with only a SELECT policy.
--      No INSERT policy existed, blocking all authenticated rose sends
--      with error 42501 (row-level security policy violation).
--
-- Pattern: mirrors post_reactions_insert — user must own the actor
--          that is performing the action (via vc.actor_owners).
-- ============================================================

CREATE POLICY post_rose_gifts_insert
  ON vc.post_rose_gifts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM vc.actor_owners ao
      WHERE ao.actor_id = post_rose_gifts.actor_id
        AND ao.user_id = auth.uid()
    )
  );
