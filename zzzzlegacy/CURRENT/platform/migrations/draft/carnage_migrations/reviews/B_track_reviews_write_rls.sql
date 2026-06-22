-- =============================================================================
-- PROPOSAL ONLY — DO NOT RUN until confirmed against live DB policy state
-- File: B_track_reviews_write_rls.sql
-- Date: 2026-05-23
-- CARNAGE Report: 2026-05-23_carnage_reviews-schema-provenance-and-rls.md
-- Risk: CAUTION — adds write-path RLS enforcement. Tightens security.
--   Safe if app code fix (setup.js isActorOwner) deploys simultaneously.
--
-- PURPOSE:
--   Tracks and enforces write-path grants + RLS for:
--     - reviews.reviews           (UPDATE body, soft-delete)
--     - reviews.review_dimension_ratings  (UPSERT, DELETE)
--
-- WHAT IS ALREADY TRACKED (do NOT duplicate):
--   - GRANT SELECT ON reviews.reviews TO authenticated         (20260503052543:62)
--   - GRANT SELECT ON reviews.review_dimension_ratings         (20260503052543:63)
--   - GRANT USAGE ON SCHEMA reviews TO authenticated           (20260503040334, 20260503052543)
--   - reviews.review_dimensions SELECT + RLS                   (20260503040334, 20260503052543)
--
-- VERIFICATION REQUIRED BEFORE DEPLOY:
--   Run on the live DB to see what policies currently exist:
--     SELECT tablename, policyname, cmd, qual
--     FROM pg_policies
--     WHERE schemaname = 'reviews';
--
--   If policies already exist with identical logic, the DROP IF EXISTS + CREATE
--   pattern below replaces them safely (idempotent).
--
-- ARCHITECTURE CONTRACT:
--   §1.4 Owner Meaning Rule — owner verified through vc.actor_owners.
--   UPDATE policy checks: actor_owners WHERE actor_id = author_actor_id AND user_id = auth.uid()
--   This is the canonical ownership model. No profileId, no raw userId.
--
-- DEPLOY ORDER:
--   Migration A (track_vc_is_actor_owner) must be deployed first if this
--   migration references vc.is_actor_owner() inline. This migration uses the
--   actor_owners EXISTS pattern directly (no function call) to avoid the
--   dependency — either approach is equivalent.
-- =============================================================================

-- =============================================================================
-- Migration ID suggestion: 20260523060000_track_reviews_write_rls
-- =============================================================================


-- =============================================================================
-- SECTION 1: reviews.reviews — write grants + RLS
--
-- The engine writes to reviews.reviews via two paths:
--   A. INSERT — always via reviews.upsert_neutral_review() SECURITY DEFINER RPC.
--      SECURITY DEFINER bypasses RLS for INSERT. No INSERT RLS policy needed.
--      No direct INSERT grant needed for the RPC path.
--
--   B. UPDATE — dalUpdateReviewBody, dalSoftDeleteReview call
--      supabase.from('reviews').update(...).eq('id', reviewId) directly.
--      This IS subject to RLS. The UPDATE policy must enforce that only the
--      review's author_actor_id owner (via actor_owners) can update.
--
-- SELECT policy: any authenticated user can read active, non-deleted reviews.
-- =============================================================================

-- Enable RLS (idempotent — no-op if already enabled)
ALTER TABLE reviews.reviews ENABLE ROW LEVEL SECURITY;

-- Grant INSERT for RPC fallback path (anon inserts via SECURITY DEFINER don't
-- need a client-role INSERT grant, but including it ensures the authenticated
-- role can reach the upsert path if the RPC changes to non-SECURITY DEFINER).
-- The RLS INSERT policy is intentionally omitted — all INSERTs go via RPC.
GRANT INSERT, UPDATE ON reviews.reviews TO authenticated;

-- DROP all candidate policy names before recreating (idempotent)
DROP POLICY IF EXISTS reviews_select_public   ON reviews.reviews;
DROP POLICY IF EXISTS reviews_select_active   ON reviews.reviews;
DROP POLICY IF EXISTS reviews_update_author   ON reviews.reviews;
DROP POLICY IF EXISTS reviews_insert_author   ON reviews.reviews;
DROP POLICY IF EXISTS reviews_delete_author   ON reviews.reviews;

-- SELECT: any authenticated user reads active, non-deleted review cards.
-- Deleted reviews are excluded at DB level (defense-in-depth vs app layer).
CREATE POLICY reviews_select_public ON reviews.reviews
  FOR SELECT
  TO authenticated
  USING (
    active_card = true
    AND is_deleted = false
  );

-- UPDATE: only the review's author may edit the body or soft-delete.
-- Soft-delete writes is_deleted = true via the same UPDATE path.
--
-- USING clause: which rows are eligible for update (the reviewer's own rows).
-- WITH CHECK clause: the row after update must still be authored by the same actor.
-- Both join vc.actor_owners to confirm auth.uid() owns the author actor.
CREATE POLICY reviews_update_author ON reviews.reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM vc.actor_owners ao
      WHERE ao.actor_id = reviews.author_actor_id
        AND ao.user_id  = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM vc.actor_owners ao
      WHERE ao.actor_id = reviews.author_actor_id
        AND ao.user_id  = auth.uid()
    )
  );


-- =============================================================================
-- SECTION 2: reviews.review_dimension_ratings — write grants + RLS
--
-- Engine writes via dalUpsertDimensionRatings (INSERT ON CONFLICT UPDATE).
-- This is a direct supabase.from('review_dimension_ratings').upsert(...) —
-- NOT a SECURITY DEFINER RPC. RLS applies to both the INSERT and the implicit
-- UPDATE in the upsert.
--
-- Engine deletes via dalDeleteDimensionRatingsForReview:
--   supabase.from('review_dimension_ratings').delete().eq('review_id', reviewId)
-- This is also direct — RLS applies.
--
-- Ownership is indirect: ratings are linked to reviews by review_id.
-- The rating's review.author_actor_id must be owned by auth.uid().
-- =============================================================================

-- Enable RLS (idempotent)
ALTER TABLE reviews.review_dimension_ratings ENABLE ROW LEVEL SECURITY;

-- Grant writes (SELECT already granted in 20260503052543)
GRANT INSERT, UPDATE, DELETE ON reviews.review_dimension_ratings TO authenticated;

-- DROP all candidate policy names
DROP POLICY IF EXISTS ratings_select_public  ON reviews.review_dimension_ratings;
DROP POLICY IF EXISTS ratings_select_active  ON reviews.review_dimension_ratings;
DROP POLICY IF EXISTS ratings_insert_author  ON reviews.review_dimension_ratings;
DROP POLICY IF EXISTS ratings_update_author  ON reviews.review_dimension_ratings;
DROP POLICY IF EXISTS ratings_upsert_author  ON reviews.review_dimension_ratings;
DROP POLICY IF EXISTS ratings_delete_author  ON reviews.review_dimension_ratings;

-- SELECT: any authenticated user can read dimension ratings for readable reviews.
-- Filters out ratings linked to deleted or inactive reviews (join guard).
CREATE POLICY ratings_select_public ON reviews.review_dimension_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM reviews.reviews r
      WHERE r.id          = review_dimension_ratings.review_id
        AND r.active_card = true
        AND r.is_deleted  = false
    )
  );

-- INSERT: only the review's author (via actor_owners) may add ratings.
-- PostgREST upsert with onConflict evaluates INSERT policy on first write.
CREATE POLICY ratings_insert_author ON reviews.review_dimension_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM reviews.reviews r
      JOIN vc.actor_owners ao ON ao.actor_id = r.author_actor_id
      WHERE r.id        = review_dimension_ratings.review_id
        AND ao.user_id  = auth.uid()
    )
  );

-- UPDATE: only the review's author may update existing ratings.
-- Evaluated for the ON CONFLICT DO UPDATE branch of upsert.
CREATE POLICY ratings_update_author ON reviews.review_dimension_ratings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM reviews.reviews r
      JOIN vc.actor_owners ao ON ao.actor_id = r.author_actor_id
      WHERE r.id        = review_dimension_ratings.review_id
        AND ao.user_id  = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM reviews.reviews r
      JOIN vc.actor_owners ao ON ao.actor_id = r.author_actor_id
      WHERE r.id        = review_dimension_ratings.review_id
        AND ao.user_id  = auth.uid()
    )
  );

-- DELETE: only the review's author may delete their dimension ratings.
-- dalDeleteDimensionRatingsForReview calls .delete().eq('review_id', reviewId)
CREATE POLICY ratings_delete_author ON reviews.review_dimension_ratings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM reviews.reviews r
      JOIN vc.actor_owners ao ON ao.actor_id = r.author_actor_id
      WHERE r.id        = review_dimension_ratings.review_id
        AND ao.user_id  = auth.uid()
    )
  );


-- =============================================================================
-- Reload PostgREST schema cache
-- =============================================================================

NOTIFY pgrst, 'reload schema';
