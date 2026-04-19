-- Migration: grants_rls_fuel_price_submissions
-- Grants authenticated users INSERT/SELECT/UPDATE access to vport.fuel_price_submissions
-- and establishes RLS policies for citizen submissions and owner-only approval.
--
-- Table columns (from DAL):
--   id, profile_id, fuel_key, proposed_price, currency_code, unit,
--   submitted_by_actor_id, submitted_at, status, reviewed_at,
--   reviewed_by_actor_id, decision_reason, evidence

-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA vport TO authenticated;

GRANT INSERT ON vport.fuel_price_submissions TO authenticated;
GRANT SELECT ON vport.fuel_price_submissions TO authenticated;
GRANT UPDATE ON vport.fuel_price_submissions TO authenticated;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE vport.fuel_price_submissions ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- Citizens: INSERT their own submissions
-- submitted_by_actor_id must be an actor owned by the caller
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_price_submissions'
      AND policyname = 'citizen_insert_fuel_price_submission'
  ) THEN
    CREATE POLICY citizen_insert_fuel_price_submission
      ON vport.fuel_price_submissions
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM vc.actor_owners ao
          WHERE ao.actor_id = fuel_price_submissions.submitted_by_actor_id
            AND ao.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- Citizens: SELECT — all authenticated can read submissions
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_price_submissions'
      AND policyname = 'citizen_select_fuel_price_submission'
  ) THEN
    CREATE POLICY citizen_select_fuel_price_submission
      ON vport.fuel_price_submissions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- Station owners: UPDATE (approve / reject submissions)
-- Caller must own the vport actor whose profile_id matches
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vport'
      AND tablename  = 'fuel_price_submissions'
      AND policyname = 'owner_update_fuel_price_submission'
  ) THEN
    CREATE POLICY owner_update_fuel_price_submission
      ON vport.fuel_price_submissions
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM vport.profiles p
          JOIN vc.actor_owners ao ON ao.actor_id = p.actor_id
          WHERE p.id = fuel_price_submissions.profile_id
            AND ao.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM vport.profiles p
          JOIN vc.actor_owners ao ON ao.actor_id = p.actor_id
          WHERE p.id = fuel_price_submissions.profile_id
            AND ao.user_id = auth.uid()
        )
      );
  END IF;
END $$;
