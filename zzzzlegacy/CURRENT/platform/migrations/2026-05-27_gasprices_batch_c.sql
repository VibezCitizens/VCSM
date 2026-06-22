-- =============================================================================
-- [TICKET-0001] Gasprices Batch C — DB Constraint Layer
-- =============================================================================
-- Scope:    vport.fuel_price_submissions, vport.fuel_prices
-- Author:   DataEngineer / Carnage
-- Status:   FULLY APPLIED 2026-05-27 ✅
--           Step 1 (C-001 index) — APPLIED ✅
--           Step 2 (C-004 status constraint) — APPLIED ✅ (preflight confirmed count=0)
--           Step 3 (C-006 evidence DROP) — APPLIED ✅
-- =============================================================================


-- =============================================================================
-- Step 0 — PREFLIGHT (run and review before applying Step 2)
-- =============================================================================

-- Check for existing 'cancelled' submissions.
-- If this returns rows, decide before applying the status constraint below.
-- Options:
--   a. Keep 'cancelled' in the constraint (omit the DROP/ADD in Step 2)
--   b. Update those rows first: UPDATE ... SET status = 'rejected' WHERE status = 'cancelled'

SELECT COUNT(*), status
  FROM vport.fuel_price_submissions
  WHERE status = 'cancelled'
  GROUP BY status;


-- =============================================================================
-- Step 1 — C-001 CRITICAL: Partial UNIQUE index — activates the 23505 catch
-- =============================================================================
-- No dependency on preflight result. Safe to run independently.
-- This makes the already_pending guard in submitFuelPriceSuggestion.controller.js
-- load-bearing. Without this index, the 23505 catch is dead code and Citizens
-- can submit unlimited duplicate pending suggestions.

-- APPLIED 2026-05-27 ✅
CREATE UNIQUE INDEX IF NOT EXISTS uq_fuel_price_submissions_pending
  ON vport.fuel_price_submissions (profile_id, fuel_key, submitted_by_actor_id)
  WHERE status = 'pending';


-- =============================================================================
-- Step 2 — C-004: Tighten status constraint (APPLY ONLY AFTER PREFLIGHT)
-- =============================================================================
-- Current constraint allows: pending, approved, rejected, cancelled
-- App code only writes: pending, approved, rejected
-- No app code path writes 'cancelled'.
--
-- CONDITION: Only apply if Step 0 preflight confirms 0 rows with status = 'cancelled'.
-- If cancelled rows exist, omit this step or handle them first.
--
-- NOTE: The existing constraint name may differ in the live DB.
-- Verify the actual constraint name before executing:
--   SELECT constraint_name FROM information_schema.table_constraints
--   WHERE table_schema = 'vport' AND table_name = 'fuel_price_submissions'
--   AND constraint_type = 'CHECK';

-- APPLIED 2026-05-27 ✅ (preflight confirmed cancelled count = 0)
ALTER TABLE vport.fuel_price_submissions
  DROP CONSTRAINT IF EXISTS fuel_price_submissions_status_check;

ALTER TABLE vport.fuel_price_submissions
  ADD CONSTRAINT fuel_price_submissions_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));


-- =============================================================================
-- Step 3 — C-006: DROP evidence column (app-side selects already cleaned)
-- =============================================================================
-- App code no longer SELECTs or INSERTs evidence.
-- Read DAL select strings were cleaned in Batch B/C app deploy.
-- Column is NOT NULL DEFAULT '{}' — DROP removes constraint along with column.
-- Safe to run once the app deploy (PATCH C-006) is confirmed live.

-- APPLIED 2026-05-27 ✅
ALTER TABLE vport.fuel_price_submissions DROP COLUMN IF EXISTS evidence;


-- =============================================================================
-- Closed — no migration needed
-- =============================================================================
-- C-002 (fuel_prices.fuel_key CHECK):
--   FK → vport.fuel_types(key) already enforces key existence.
--   ALLOWED_FUEL_KEYS in gasPrices.model.js enforces domain-specific filtering at
--   the app layer (controller). Separate concerns, correct layers. No DB CHECK needed.
--
-- C-003 (fuel_price_submissions.fuel_key CHECK):
--   Same as C-002.
--
-- C-005 (UNIQUE on fuel_prices(profile_id, fuel_key)):
--   PRIMARY KEY (profile_id, fuel_key) confirmed in live schema.
--   onConflict: "profile_id,fuel_key" resolves against the PK correctly.
-- =============================================================================
