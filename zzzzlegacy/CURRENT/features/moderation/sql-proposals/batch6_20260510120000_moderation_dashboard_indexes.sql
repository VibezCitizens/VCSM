-- =============================================================
-- PROPOSAL ONLY — DO NOT RUN DIRECTLY
-- Batch 6: Dashboard support indexes + duplicate index cleanup
-- Migration filename: 20260510120000_moderation_dashboard_indexes.sql
-- Date: 2026-05-10
-- Risk: LOW — additive indexes + dropping confirmed duplicates
-- Deploy order: Independent — can deploy any time.
--   Dropping duplicate indexes is safe at any point.
--   New indexes are additive and do not affect query semantics.
-- =============================================================
--
-- PROBLEM 1: Missing report queue index
--   The dashboard queue query filters by status (open/triaged/in_review/needs_more_info)
--   and orders by priority ASC, created_at ASC. The existing
--   idx_moderation_reports_status_priority covers (status, priority, created_at DESC)
--   — wrong sort direction and includes all statuses rather than a partial
--   index on actionable statuses. Dashboard queue scans the full index and
--   discards resolved/dismissed rows on every page load.
--
-- PROBLEM 2: Missing actor-target composite index on moderation.actions
--   getHiddenPostIdsForActor (postVisibility.controller.js) calls
--   listModerationActionsForActorOnObjectsDAL which filters by:
--     actor_id, target_type, target_id IN (...), created_at DESC
--   The only available index is idx_moderation_actions_target which covers
--   (target_domain, target_type, target_id, created_at DESC) — actor_id is
--   not in that index. Every call is a full actor-scan on the actions table.
--
-- PROBLEM 3: Duplicate indexes on moderation.blocks
--   Confirmed duplicate pairs from snapshot audit (2026-05-10):
--     blocks_lookup_idx  ≡ moderation_blocks_lookup_idx
--     blocks_reverse_lookup_idx ≡ moderation_blocks_reverse_lookup_idx
--   The `moderation_*` prefixed copies are the older set. Keeping duplicates
--   doubles write IO on every INSERT/UPDATE to the blocks table.
--
-- ROLLBACK: See bottom of file.
-- =============================================================


-- =============================================================
-- 1. Report dashboard queue index
--    Partial: only actionable statuses (resolved/dismissed excluded)
--    Sort: priority ASC (lowest number = highest priority first),
--          created_at ASC (oldest unresolved first), id for stable pagination
-- =============================================================

-- Pre-deployment: confirm this index does not already exist
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'moderation'
--   AND tablename = 'reports'
--   AND indexname = 'idx_moderation_reports_dashboard_queue';

CREATE INDEX IF NOT EXISTS idx_moderation_reports_dashboard_queue
  ON moderation.reports (status, priority ASC, created_at ASC, id)
  WHERE status IN ('open', 'triaged', 'in_review', 'needs_more_info');


-- =============================================================
-- 2. Moderation actions: actor-target composite index
--    Covers: getHiddenPostIdsForActor and any query filtering by
--    actor_id + target_type + target_id with ordering by created_at DESC
-- =============================================================

-- Pre-deployment: confirm this index does not already exist
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'moderation'
--   AND tablename = 'actions'
--   AND indexname = 'idx_moderation_actions_actor_target';

CREATE INDEX IF NOT EXISTS idx_moderation_actions_actor_target
  ON moderation.actions (actor_id, target_type, target_id, created_at DESC);


-- =============================================================
-- 3. Drop confirmed duplicate block indexes
--
--    Verified duplicate pairs (same columns, same sort, same predicate):
--      blocks_lookup_idx  ≡  moderation_blocks_lookup_idx
--        Both: btree (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id)
--      blocks_reverse_lookup_idx  ≡  moderation_blocks_reverse_lookup_idx
--        Both: btree (blocked_domain, blocked_actor_id, blocker_domain, blocker_actor_id)
--
--    Dropping the older `moderation_*` prefixed copies.
--    The non-prefixed versions (blocks_lookup_idx, blocks_reverse_lookup_idx) are retained.
--
-- Pre-deployment: confirm the pairs are identical before dropping
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'moderation'
--   AND tablename = 'blocks'
--   AND indexname IN (
--     'blocks_lookup_idx',
--     'moderation_blocks_lookup_idx',
--     'blocks_reverse_lookup_idx',
--     'moderation_blocks_reverse_lookup_idx'
--   )
-- ORDER BY indexname;
-- =============================================================

DROP INDEX IF EXISTS moderation.moderation_blocks_lookup_idx;
DROP INDEX IF EXISTS moderation.moderation_blocks_reverse_lookup_idx;


-- =============================================================
-- Post-deployment validation queries (read-only):
--
-- 1. Confirm new report queue index:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'moderation'
--   AND tablename = 'reports'
--   AND indexname = 'idx_moderation_reports_dashboard_queue';
-- Expected: 1 row with partial WHERE clause visible in indexdef
--
-- 2. Confirm new actor-target actions index:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'moderation'
--   AND tablename = 'actions'
--   AND indexname = 'idx_moderation_actions_actor_target';
-- Expected: 1 row
--
-- 3. Confirm duplicate indexes are gone:
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'moderation'
--   AND tablename = 'blocks'
-- ORDER BY indexname;
-- Expected: moderation_blocks_lookup_idx and moderation_blocks_reverse_lookup_idx
-- are NOT present. blocks_lookup_idx and blocks_reverse_lookup_idx remain.
--
-- 4. Full index list on moderation.blocks (expected 4 after this migration):
--   blocks_pkey
--   blocks_lookup_idx
--   blocks_reverse_lookup_idx
--   idx_moderation_blocks_blocked
-- =============================================================


-- =============================================================
-- ROLLBACK:
--
-- -- Restore duplicate indexes (if something depended on the moderation_ prefixed names)
-- CREATE INDEX IF NOT EXISTS moderation_blocks_lookup_idx
--   ON moderation.blocks (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id);
--
-- CREATE INDEX IF NOT EXISTS moderation_blocks_reverse_lookup_idx
--   ON moderation.blocks (blocked_domain, blocked_actor_id, blocker_domain, blocker_actor_id);
--
-- -- Drop new indexes
-- DROP INDEX IF EXISTS moderation.idx_moderation_reports_dashboard_queue;
-- DROP INDEX IF EXISTS moderation.idx_moderation_actions_actor_target;
-- =============================================================
