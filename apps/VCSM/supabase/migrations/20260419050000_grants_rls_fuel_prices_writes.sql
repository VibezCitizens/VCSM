-- Migration: grants_rls_fuel_prices_writes
-- Fixes missing INSERT/UPDATE policies and grants on gas price tables.
--
-- Root cause audit:
--   vport.fuel_prices              — SELECT only; no INSERT/UPDATE → upserts silently rejected
--   vport.fuel_price_history       — SELECT only; no INSERT → history writes silently rejected
--   vport.fuel_price_submission_reviews — zero policies → all client writes blocked
--
-- All owner checks use vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
-- consistent with every other vport profile-owned table in the codebase.

-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA vport TO authenticated;

-- fuel_prices: owner upsert (submitFuelPriceSuggestion.controller — owner path)
GRANT INSERT ON vport.fuel_prices TO authenticated;
GRANT UPDATE ON vport.fuel_prices TO authenticated;

-- fuel_price_history: written on approved review (reviewFuelPriceSuggestion.controller)
GRANT INSERT ON vport.fuel_price_history TO authenticated;

-- fuel_price_submission_reviews: created when owner approves/rejects a submission
GRANT INSERT ON vport.fuel_price_submission_reviews TO authenticated;
GRANT UPDATE ON vport.fuel_price_submission_reviews TO authenticated;

-- ============================================================
-- vport.fuel_prices — INSERT + UPDATE for station owner
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_prices'
      AND policyname = 'fuel_prices_insert_owner'
  ) THEN
    CREATE POLICY fuel_prices_insert_owner
      ON vport.fuel_prices
      FOR INSERT
      TO authenticated
      WITH CHECK (
        vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_prices'
      AND policyname = 'fuel_prices_update_owner'
  ) THEN
    CREATE POLICY fuel_prices_update_owner
      ON vport.fuel_prices
      FOR UPDATE
      TO authenticated
      USING (
        vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
      )
      WITH CHECK (
        vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
      );
  END IF;
END $$;

-- ============================================================
-- vport.fuel_price_history — INSERT for owner / approving actor
-- The actor writing history is the one who approved or directly updated the price.
-- They must manage the profile the price belongs to.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_price_history'
      AND policyname = 'fuel_price_history_insert_owner'
  ) THEN
    CREATE POLICY fuel_price_history_insert_owner
      ON vport.fuel_price_history
      FOR INSERT
      TO authenticated
      WITH CHECK (
        vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
      );
  END IF;
END $$;

-- ============================================================
-- vport.fuel_price_submission_reviews — INSERT + UPDATE for station owner
-- Owner creates a review row when approving or rejecting a submission.
-- UPDATE allows marking a review as applied_to_official.
-- Joins through fuel_price_submissions to reach profile_id.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_price_submission_reviews'
      AND policyname = 'fuel_price_submission_reviews_insert_owner'
  ) THEN
    CREATE POLICY fuel_price_submission_reviews_insert_owner
      ON vport.fuel_price_submission_reviews
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM vport.fuel_price_submissions s
          WHERE s.id = fuel_price_submission_reviews.submission_id
            AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_price_submission_reviews'
      AND policyname = 'fuel_price_submission_reviews_update_owner'
  ) THEN
    CREATE POLICY fuel_price_submission_reviews_update_owner
      ON vport.fuel_price_submission_reviews
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM vport.fuel_price_submissions s
          WHERE s.id = fuel_price_submission_reviews.submission_id
            AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM vport.fuel_price_submissions s
          WHERE s.id = fuel_price_submission_reviews.submission_id
            AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
        )
      );
  END IF;
END $$;

-- ============================================================
-- Owner SELECT on fuel_price_submission_reviews
-- (was service_role only; owner needs to read their own review rows)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_price_submission_reviews'
      AND policyname = 'fuel_price_submission_reviews_select_owner'
  ) THEN
    CREATE POLICY fuel_price_submission_reviews_select_owner
      ON vport.fuel_price_submission_reviews
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM vport.fuel_price_submissions s
          WHERE s.id = fuel_price_submission_reviews.submission_id
            AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
        )
      );
  END IF;
END $$;
