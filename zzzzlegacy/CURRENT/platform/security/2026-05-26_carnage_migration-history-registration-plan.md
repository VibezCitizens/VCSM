# CARNAGE MIGRATION REPORT
**Date:** 2026-05-26  
**Reviewer:** CARNAGE  
**Input:** `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-26_18-00_db_migration-reconciliation.md`  
**Mode:** Migration History Registration Plan  
**Scope:** VCSM  

---

## Application Scope: VCSM
## Migration reason: 19 LOCAL_ONLY migrations in `apps/VCSM/supabase/migrations/` have no corresponding row in `supabase_migrations.schema_migrations`. All affected objects are confirmed live. Migration history is stale.
## Migration type: Manual history INSERT (no schema changes; objects already applied out-of-band)
## Migration Safety Status: CAUTION
## Confidence: HIGH — all objects confirmed present via object-level verification; no schema execution required

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `supabase_migrations.schema_migrations` | Runtime-critical | Supabase CLI reads this to determine pending migrations; incorrect state will block `db push` |
| `vport.availability_rules` (legacy policies) | Ownership-sensitive | Governs who can insert/update/delete booking availability windows |
| `platform.media_assets` (missing soft-delete policy) | Ownership-sensitive | Controls which columns an authenticated actor may write during soft-delete |
| `moderation.actions` (policy mismatch) | Moderation-sensitive | Controls insert/select of actor-level moderation records |
| `vport.fuel_price_submissions` (legacy policies) | Public + Ownership-sensitive | Governs citizen fuel-price submissions with redundant legacy policies |

---

## CURRENT STRUCTURE

| Object | Purpose | Dependencies |
|---|---|---|
| `supabase_migrations.schema_migrations` | Tracks applied migration versions | Supabase CLI `db push`, `migration list`, `migration repair` |
| 31 live history rows (20260427010000–20260523230000) | Confirmed applied state | CLI will use highest version as watermark |
| 19 LOCAL_ONLY migration files | Local files without history records | CLI would attempt to re-apply if `db push` is run |
| 5 out-of-order LOCAL_ONLY files (20260523010000–20260523190000) | Version numbers fall before two live history entries | CLI will refuse out-of-order application |
| 3 PARTIAL-drift migrations | Objects partially applied; legacy objects not cleaned up | Separate schema-fix operations required |

---

## MIGRATION BLAST RADIUS

**Affected systems:** Supabase CLI migration state tracking; VCSM schema governance  
**Runtime impact:** NONE if INSERTs are executed correctly — all objects already live  
**Release impact:** Without registration, `supabase db push` is blocked and any future migration deployment will fail or produce incorrect diff  
**Rollback impact:** DELETE the INSERTed rows to revert; no schema objects affected  

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vport.availability_rules` legacy policies | DIRECT — active live policies with mixed roles | MEDIUM — {public} role on write policies bypasses PostgREST role gate | VENOM + schema cleanup migration |
| `platform.media_assets` missing policy | DIRECT — UPDATE path is broader than intended | MEDIUM — actors can UPDATE beyond soft-delete columns | VENOM + apply missing policy |
| `moderation.actions` policy mismatch | DIRECT — live policies differ from migration intent | MEDIUM — unknown whether conditions are equivalent | VENOM + condition inspection |
| `vport.fuel_price_submissions` legacy policies | INDIRECT — new policies overlap with legacy | LOW — legacy policies have auth guards | Cleanup migration |
| All other 15 LOCAL_ONLY migrations | INDIRECT or NONE | NONE — objects verified present | History INSERT only |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| `supabase_migrations.schema_migrations` INSERT | LOW | History table is append-only; no triggers or cascade effects | Run each INSERT individually with row verification after |
| Supabase CLI future run | BLOCKED without fix | CLI will reject out-of-order entries or attempt re-apply | Complete registration plan before any future `db push` |
| Application runtime | NONE | No application code reads from `schema_migrations` | None required |
| Out-of-order INSERT (Option A) | LOW | Manual INSERT bypasses CLI ordering check | Acceptable — objects are already live |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| RLS dependency | `vport.availability_rules` legacy policy cleanup required before 20260515010000 can be cleanly registered | MEDIUM |
| RLS dependency | `platform.media_assets` soft-delete policy must be applied before 20260519200000 is fully clean | MEDIUM |
| Schema equivalence verification | `moderation.actions` conditions must be compared before marking 20260518020000 as clean | MEDIUM |
| CLI watermark | 20260523010000–20260523190000 version numbers fall before live history watermark; must use manual INSERT not CLI | CRITICAL |
| Release dependency | THOR must receive this plan as a release gate input | HIGH |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Duplicate history INSERT | LOW — version is natural key; duplicate INSERT will fail with constraint violation | Attempt INSERT; verify row count afterward | Run as individual INSERTs; catch unique constraint violations |
| Incorrect name field | LOW — name is informational only; CLI uses version as key | Visual inspection before INSERT | Match names exactly from local `.sql` filenames |
| Premature registration of PARTIAL-drift migrations | MEDIUM — registering 20260515010000, 20260518020000, 20260519200000 before their schema drift is resolved will hide the drift | VENOM finding status | Document in NOTES column that objects have known partial drift |

---

## ⚔️ CONFLICT RESOLUTION DECLARATION

### Out-of-Order Conflict: Option A Selected

The five migrations with version numbers that sort before live history entries 20260523220000 and 20260523230000 are:

- `20260523010000_backfill_tracked_rls_coverage`
- `20260523020000_fix_vport_rates_rls`
- `20260523030000_fix_content_pages_rls`
- `20260523040000_fix_bookings_rls`
- `20260523190000_portfolio_card_p0_security`

**Decision: Option A — Manual INSERT at natural version positions.**

**Rationale:**

1. All five migrations have confirmed object-level presence. Their schema objects are live. No SQL needs to run.
2. Manual INSERT into `supabase_migrations.schema_migrations` bypasses the CLI ordering check entirely — the CLI ordering check only applies during `supabase db push` (which attempts to run migration SQL). A direct INSERT is a history reconciliation operation, not a migration execution.
3. Option B (renumber local files) is rejected because: (a) it modifies local migration files which creates a discrepancy between the git history and the file inventory; (b) it risks breaking any tooling or documentation that references the original version numbers; (c) it provides no advantage — the DB objects are already live regardless of file version number.
4. After Option A INSERTs, the history table will have entries for all 19 LOCAL_ONLY migrations. Future `supabase db push` calls will correctly see no pending migrations and will not attempt re-application.

**Option B is explicitly rejected.**

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Phase 1 | Schema drift remediation (pre-INSERT) | MEDIUM | Apply missing soft-delete policy (20260519200000 scope) and verify moderation.actions conditions before proceeding |
| Phase 2 | History INSERT for Group 1 (non-out-of-order, no drift) | LOW | 7 clean migrations; no schema changes required |
| Phase 3 | History INSERT for PARTIAL-drift migrations | CAUTION | Insert with drift noted; VENOM findings remain open until schema fixes are applied |
| Phase 4 | History INSERT for Group 2 (out-of-order, Option A) | LOW | Manual INSERT bypasses CLI check; objects already live |
| Phase 5 | History INSERT for Group 3 (post-out-of-order) | LOW | 5 clean migrations; no schema changes required |
| Phase 6 | Legacy policy cleanup migrations | MEDIUM | Separate dedicated migrations for availability_rules and fuel_price_submissions |

---

## ROLLBACK SURVIVABILITY

**Rollback status:** FULL  
**Data recovery risk:** NONE — history INSERTs can be reversed with DELETE on the (version) key  
**Compatibility rollback risk:** LOW — deleting history rows does not change schema objects; objects remain live  
**Operational complexity:** LOW — each INSERT is a single-row operation; rollback is DELETE WHERE version = '...'  

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| All 19 LOCAL_ONLY migration versions identified | ✅ COMPLETE | From DB reconciliation report |
| Object-level presence confirmed for all 19 | ✅ COMPLETE | 16 NONE drift, 3 PARTIAL drift |
| Out-of-order conflict identified | ✅ COMPLETE | 5 migrations (20260523010000–20260523190000) |
| Conflict resolution declared | ✅ COMPLETE | Option A selected |
| PARTIAL drift migrations documented | ✅ COMPLETE | 20260515010000, 20260518020000, 20260519200000 |
| INSERT SQL proposals written (text only) | ✅ COMPLETE | See Safe INSERT Plan below |
| Rollback strategy defined | ✅ COMPLETE | DELETE on version key |
| RLS impact reviewed | ✅ COMPLETE | VENOM follow-up required for 3 findings |
| THOR release gate dependency declared | ✅ COMPLETE | Phase 6 cleanup migrations gate release |
| Schema fixes required before clean state | ✅ DOCUMENTED | 3 fixes identified |

---

## 📋 SAFE MANUAL HISTORY INSERT PLAN

> **READ THIS FIRST:**
> - All SQL below is **TEXT ONLY — DO NOT RUN automatically**
> - Execute as `postgres` or `service_role` with direct psql access
> - Run each INSERT **individually** and verify the row count before proceeding
> - Do **NOT** run these through the Supabase CLI `migration` command
> - Do **NOT** run these through any application code path
> - Verify connection to the **live production DB** only: `nkdrjlmbtqbywhcthppm`

---

### PHASE 1 — Schema Drift Remediation (Must Happen Before Phase 3)

These are prerequisite schema operations. They must be applied via the Supabase SQL editor before registering the PARTIAL migrations in Phase 3.

#### Fix 1a — Apply missing soft-delete policy (for 20260519200000)

```sql
-- TEXT ONLY — DO NOT RUN automatically
-- Prerequisite for Phase 3, migration 20260519200000

-- Step 1: Column-level grant (verify not already present first)
GRANT UPDATE (status, deleted_at, deleted_by_actor_id, updated_at)
  ON platform.media_assets TO authenticated;

-- Step 2: Create the restrictive soft-delete policy
CREATE POLICY "actor owner can soft delete media asset"
  ON platform.media_assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners
      WHERE actor_owners.actor_id = media_assets.owner_actor_id
        AND actor_owners.user_id  = auth.uid()
    )
  )
  WITH CHECK (
    status = 'deleted'
    AND deleted_by_actor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM vc.actor_owners
      WHERE actor_owners.actor_id = media_assets.owner_actor_id
        AND actor_owners.user_id  = auth.uid()
    )
  );

-- Verify after:
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'platform' AND tablename = 'media_assets';
```

#### Fix 1b — Inspect and resolve moderation.actions conditions (for 20260518020000)

```sql
-- TEXT ONLY — READ ONLY inspection
-- Run this FIRST and compare conditions before deciding to INSERT 20260518020000

SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'moderation' AND tablename = 'actions'
ORDER BY policyname;
```

**After inspection:** Compare `actions_select_own` condition against the intended `actor_id IN (SELECT ao.actor_id FROM vc.actor_owners ao WHERE ao.user_id = auth.uid())`. If equivalent: proceed to INSERT in Phase 3. If not equivalent: apply the canonical policies first.

---

### PHASE 2 — History INSERT: Group 1, Clean Migrations

These 7 migrations have confirmed object presence and no drift. No schema changes required.

```sql
-- TEXT ONLY — DO NOT RUN automatically
-- Run each INSERT individually; verify row exists before next INSERT

-- Migration 1
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260515020000', 'vport_resources_actor_rls_rebuild');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260515020000';

-- Migration 2
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260518010000', 'actor_onboarding_steps_rls');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260518010000';

-- Migration 3
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260518030000', 'actor_follows_sf07_resolution');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260518030000';

-- Migration 4
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260518040000', 'platform_provision_vcsm_identity');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260518040000';

-- Migration 5
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260518050000', 'platform_provision_vcsm_identity_rls');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260518050000';

-- Migration 6
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260519120000', 'platform_vc_security_hardening');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260519120000';
```

---

### PHASE 3 — History INSERT: PARTIAL-Drift Migrations

These 3 migrations have PARTIAL drift. Register them after Phase 1 schema fixes are applied.

```sql
-- TEXT ONLY — DO NOT RUN automatically
-- Only run AFTER Phase 1 fixes are verified

-- Migration 7 (PARTIAL — legacy availability_rules policies not yet dropped)
-- NOTE: Registering history even with partial drift. Legacy policy cleanup
-- is a separate Phase 6 migration. The registration here records that the
-- NEW policies from this migration are live.
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260515010000', 'vport_booking_resource_rls_policies');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260515010000';

-- Migration 8 (PARTIAL — moderation.actions policies have different names)
-- NOTE: Only register if Phase 1 inspection confirms conditions are equivalent.
-- If conditions are NOT equivalent, apply canonical policies first, then INSERT.
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260518020000', 'moderation_actions_rls');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260518020000';

-- Migration 9 (PARTIAL — soft-delete policy missing; only register after Fix 1a applied)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260519200000', 'media_assets_soft_delete_policy');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260519200000';
```

---

### PHASE 4 — History INSERT: Out-of-Order Migrations (Option A)

These 5 migrations (version numbers 20260523010000–20260523190000) sort before live history entries 20260523220000 and 20260523230000. **All their objects are confirmed live.** Manual INSERT bypasses the CLI ordering restriction.

```sql
-- TEXT ONLY — DO NOT RUN automatically
-- Option A: Register at natural version positions
-- Objects are confirmed live — no SQL execution is required for these

-- Migration 10 (out-of-order, NONE drift)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260523010000', 'backfill_tracked_rls_coverage');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260523010000';

-- Migration 11 (out-of-order, NONE drift)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260523020000', 'fix_vport_rates_rls');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260523020000';

-- Migration 12 (out-of-order, NONE drift)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260523030000', 'fix_content_pages_rls');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260523030000';

-- Migration 13 (out-of-order, NONE drift)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260523040000', 'fix_bookings_rls');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260523040000';

-- Migration 14 (out-of-order, NONE drift)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260523190000', 'portfolio_card_p0_security');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260523190000';
```

---

### PHASE 5 — History INSERT: Group 3, Post-Out-of-Order Clean Migrations

These 5 migrations have confirmed object presence and no schema drift.

```sql
-- TEXT ONLY — DO NOT RUN automatically

-- Migration 15
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260524010000', 'business_card_leads_p0_security');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260524010000';

-- Migration 16 (column-level grant UNKNOWN — verify pg_attribute_acl separately)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260524020000', 'business_card_leads_p1_hardening');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260524020000';
-- Verify column grant:
-- SELECT attname, attacl FROM pg_attribute
-- WHERE attrelid = 'vport.business_card_leads'::regclass AND attacl IS NOT NULL;

-- Migration 17
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260525010000', 'reviews_schema_housekeeping');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260525010000';

-- Migration 18 (legacy policies present — cleanup in Phase 6)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260526010000', 'fuel_price_submissions_rls');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260526010000';

-- Migration 19
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260526020000', 'fix_fuel_price_submissions_grants');
-- Verify: SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260526020000';
```

---

### PHASE 6 — Schema Cleanup Migrations (Separate Dedicated Migrations)

These are NOT history INSERTs. These are new migration files to be written and applied via the SQL editor, then registered as new history entries.

#### Cleanup Migration A — Drop legacy availability_rules policies + re-create as authenticated

```sql
-- TEXT ONLY — DO NOT RUN automatically
-- New migration file: 20260527010000_cleanup_availability_rules_legacy_policies.sql

-- Step 1: Drop legacy public-role policies that 20260515010000 missed
DROP POLICY IF EXISTS availability_rules_manage_neutral ON vport.availability_rules;
DROP POLICY IF EXISTS availability_rules_select_neutral ON vport.availability_rules;

-- Step 2: Re-create write policies as {authenticated}
-- (Current: availability_rules_delete, availability_rules_insert,
--  availability_rules_update are {public} — acceptable since SECURITY DEFINER
--  guards block anon, but {authenticated} is architecturally correct)
DROP POLICY IF EXISTS availability_rules_delete ON vport.availability_rules;
CREATE POLICY availability_rules_delete ON vport.availability_rules
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );

DROP POLICY IF EXISTS availability_rules_insert ON vport.availability_rules;
CREATE POLICY availability_rules_insert ON vport.availability_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );

DROP POLICY IF EXISTS availability_rules_update ON vport.availability_rules;
CREATE POLICY availability_rules_update ON vport.availability_rules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );
```

#### Cleanup Migration B — Drop legacy fuel_price_submissions policies

```sql
-- TEXT ONLY — DO NOT RUN automatically
-- New migration file: 20260527020000_cleanup_fuel_price_submissions_legacy_policies.sql

DROP POLICY IF EXISTS fuel_price_submissions_insert_own ON vport.fuel_price_submissions;
DROP POLICY IF EXISTS fuel_price_submissions_select_own ON vport.fuel_price_submissions;
DROP POLICY IF EXISTS citizen_insert_fuel_price_submission ON vport.fuel_price_submissions;
DROP POLICY IF EXISTS citizen_select_fuel_price_submission ON vport.fuel_price_submissions;
DROP POLICY IF EXISTS owner_update_fuel_price_submission ON vport.fuel_price_submissions;
```

---

## POST-REGISTRATION VERIFICATION QUERY

After all 19 INSERTs complete, run this to confirm the final state:

```sql
-- TEXT ONLY — verification only
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;
-- Expected: 50 rows total (31 original + 19 newly registered)
```

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

**Object:** `supabase_migrations.schema_migrations`  
**Current behavior:** 19 LOCAL_ONLY migrations represent schema work applied out-of-band, creating a gap between migration history state and actual DB object state  
**Migration risk:** If `supabase db push` is run before registration, the CLI will attempt to re-execute migration SQL that has already been applied, causing duplicate policy creation errors or constraint violations  
**Potential impact:** Schema inconsistency; blocked deployments; misleading `migration list` output  
**Recommended safeguards:** Complete all 19 INSERTs before any future use of `supabase db push` or `supabase migration up`

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `supabase_migrations.schema_migrations` | VCSM | NONE — shared infra table, but history rows are VCSM-specific | SCOPED |
| `vport.availability_rules` | VCSM | NONE | SCOPED |
| `platform.media_assets` | VCSM | NONE | SCOPED |
| `moderation.actions` | VCSM | NONE | SCOPED |
| `vport.fuel_price_submissions` | VCSM | NONE | SCOPED |

---

## RECOMMENDED HANDOFFS

- **VENOM** — Security review of all 4 drift/legacy policy findings already in progress → `2026-05-26_venom_db-drift-rls-review.md`
- **THOR** — Release gate decision required before any schema cleanup migrations (Phase 6) are applied to production
- **ELEKTRA** — Verify DAL code paths that touch `platform.media_assets`, `moderation.actions`, and `vport.availability_rules` against confirmed RLS state after Phase 1 schema fixes
- **HAWKEYE** — Verify API endpoint contracts for booking availability, media soft-delete, and moderation action endpoints against expected post-fix RLS behavior
- **LOGAN** — Update schema ownership documentation to reflect newly registered migrations after all INSERTs are complete

---

## FINAL CARNAGE STATUS: CAUTION

**Reason:** History registration itself is LOW risk (objects already live, INSERTs are reversible). CAUTION is warranted because:
1. Three PARTIAL-drift migrations require prerequisite schema fixes (Phase 1) before full governance compliance is achieved
2. The out-of-order conflict (Option A) bypasses CLI ordering via direct INSERT — technically safe but operationally non-standard
3. Legacy policy accumulation on `vport.availability_rules` and `vport.fuel_price_submissions` creates ongoing governance debt that requires Phase 6 cleanup migrations before the overall schema state is fully clean

**Not BLOCKED** because: all objects are confirmed live, no destructive changes are required, and full rollback is available via DELETE.

---

*CARNAGE analysis complete — read-only review. No migrations were run. No schema was modified.*  
*Generated: 2026-05-26*
