-- Migration: Fix missing table-level GRANTs for fuel_price_submissions
-- Scope: vport schema (DB only)
-- Updated: 2026-05-26 — removed anon SELECT (VENOM F-005)
--
-- Root cause:
--   vport.fuel_price_submissions and vport.fuel_price_submission_reviews have
--   valid RLS policies but no GRANT SELECT/INSERT/UPDATE for the authenticated
--   role. PostgreSQL evaluates GRANTs before RLS — so the policies never fire
--   and the client gets "permission denied for table fuel_price_submissions".
--
--   All other vport tables have their grants set. These two were likely created
--   after the initial GRANT ALL IN SCHEMA sweep.
--
-- VENOM F-005 correction:
--   Original draft of this migration included GRANT SELECT TO anon. This was
--   removed because the raw table contains proposed_price, submitted_by_actor_id,
--   and submission UUIDs — none of which are safe to expose to unauthenticated
--   clients without row-level filtering. RLS policies (20260526010000) enforce
--   visibility at the row level for authenticated users.
--
-- Safe: adds GRANT only — does not modify RLS policies or function definitions.

-- ── fuel_price_submissions ────────────────────────────────────────────────────
-- authenticated: SELECT (own submissions + stations they manage), INSERT, UPDATE
-- anon: NO access — raw table contains proposed_price, submitted_by_actor_id,
--       and submission UUIDs. RLS policies enforce row-level visibility.
--       See migration 20260526010000_fuel_price_submissions_rls.sql for policies.
GRANT SELECT, INSERT, UPDATE
  ON vport.fuel_price_submissions
  TO authenticated;

-- ── fuel_price_submission_reviews ─────────────────────────────────────────────
-- Its RLS policies JOIN against fuel_price_submissions; grant the table itself
-- so vport owners can read/insert review decisions.
GRANT SELECT, INSERT, UPDATE
  ON vport.fuel_price_submission_reviews
  TO authenticated;


-- ── Validation (run after applying) ──────────────────────────────────────────
/*
-- Confirm GRANTs are in place
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'vport'
  AND table_name IN ('fuel_price_submissions', 'fuel_price_submission_reviews')
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;
-- Expected: authenticated rows for SELECT/INSERT/UPDATE on both tables
--           anon row for SELECT on fuel_price_submissions
*/
