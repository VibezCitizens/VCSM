-- =============================================================
-- PROPOSAL ONLY — DO NOT RUN DIRECTLY
-- Batch 5: FORCE ROW LEVEL SECURITY — all moderation tables
-- Migration filename: 20260510110000_force_rls_moderation_tables.sql
-- Date: 2026-05-10
-- Risk: LOW — no logic change, only closes service_role bypass
-- Deploy order: LAST — must deploy AFTER Batch 1 is verified in prod.
--   If any service_role background workers read moderation tables,
--   they must be audited and either given explicit grants or switched
--   to session-based auth before this migration runs.
-- =============================================================
--
-- PROBLEM:
--   All five moderation tables have RLS enabled but not forced.
--   service_role connections bypass all policies completely.
--   A misconfigured worker or Edge Function can read/write
--   block relationships, reports, and moderation actions without restriction.
--
-- FIX:
--   Apply FORCE ROW LEVEL SECURITY to all five tables.
--   This ensures policies apply to ALL roles including postgres and service_role.
--
-- PRE-DEPLOYMENT CHECKLIST:
--   [ ] Batch 1 has been deployed and verified in production
--   [ ] Batch 2 has been deployed and verified in production
--   [ ] All Supabase Edge Functions that touch moderation tables have been audited
--   [ ] All pg_cron / pg_net jobs have been audited for moderation table access
--   [ ] No background worker relies on service_role bypass for moderation reads
--
-- ROLLBACK: See bottom of file.
-- =============================================================

-- Pre-deployment: confirm current RLS/FORCE state
-- SELECT relname, relrowsecurity, relforcerowsecurity
-- FROM pg_class
-- WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation')
--   AND relname IN ('blocks', 'block_events', 'reports', 'report_events', 'actions')
-- ORDER BY relname;

ALTER TABLE moderation.blocks        FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.block_events  FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.reports       FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.report_events FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.actions       FORCE ROW LEVEL SECURITY;

-- =============================================================
-- Post-deployment validation queries (read-only):
--
-- SELECT relname, relrowsecurity, relforcerowsecurity
-- FROM pg_class
-- WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation')
--   AND relname IN ('blocks', 'block_events', 'reports', 'report_events', 'actions')
-- ORDER BY relname;
-- Expected: relrowsecurity=true, relforcerowsecurity=true for all five rows
-- =============================================================

-- =============================================================
-- ROLLBACK:
--
-- ALTER TABLE moderation.blocks        NO FORCE ROW LEVEL SECURITY;
-- ALTER TABLE moderation.block_events  NO FORCE ROW LEVEL SECURITY;
-- ALTER TABLE moderation.reports       NO FORCE ROW LEVEL SECURITY;
-- ALTER TABLE moderation.report_events NO FORCE ROW LEVEL SECURITY;
-- ALTER TABLE moderation.actions       NO FORCE ROW LEVEL SECURITY;
-- =============================================================
