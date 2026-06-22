# CARNAGE Migration Report — Booking RLS Policies

**Date:** 2026-05-14  
**Reviewer:** CARNAGE  
**Trigger:** DB-BOOK-01 (bookings SELECT RLS — unknown/unverified) and DB-BOOK-02 (availability_rules UPDATE RLS — no owner filter), both flagged by DB audit and confirmed as security risks by Venom (V-BOOK-01, V-AVAIL-01, V-AVAIL-02) and Sentry (S-BOOK-01)  
**Application Scope:** VCSM  
**Mode:** READ-ONLY PLANNING — no schema modifications applied  

---

## CARNAGE MIGRATION REPORT

**Application Scope:** VCSM  
**Migration reason:** 
- DB-BOOK-01: `vport.bookings` SELECT RLS policy status is UNKNOWN. App-layer ownership assertions exist on some read paths but not all. If no RLS policy restricts access, any authenticated Citizen can read all bookings for any resource by supplying a known `resourceId`.
- DB-BOOK-02: `vport.availability_rules` has no verified RLS UPDATE policy. The app-layer ownership assertion was discovered MISSING from `manageVportAvailabilityRuleController` (V-AVAIL-01, RC-01). Without RLS, any authenticated Citizen with a valid `ruleId` can overwrite any VPORT's availability rules.

**Migration type:** RLS policy creation (SELECT + UPDATE policies on two tables in `vport` schema)  

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vport.bookings` | Booking-sensitive + Identity-sensitive | Contains customer PII (phone, email, name, note), booking schedules, and internal operational notes |
| `vport.availability_rules` | Booking-sensitive + Ownership-sensitive | Controls when VPORTs accept bookings; corruption disrupts business operations |
| `vport.resources` | Ownership-sensitive | JOIN target for ownership resolution — must have indexes for RLS subqueries |
| `vc.actor_owners` | Identity-sensitive + Ownership-sensitive | Authority table for owner verification; referenced in all RLS ownership subqueries |
| `vc.actors` | Identity-sensitive | Required for customer actor ID ↔ auth.uid() mapping |

---

## CURRENT STRUCTURE

| Object | Purpose | Current Policy State |
|---|---|---|
| `vport.bookings` | Booking records — all booking mutations and reads | UNKNOWN — no confirmed SELECT policy; app-layer assertion exists only on dashboard path (confirmed by Sentry/Venom) |
| `vport.availability_rules` | Availability rule records — controls booking windows | UNKNOWN — no confirmed UPDATE policy; only `ruleId` filter in DAL (DB-BOOK-02) |
| `vport.resources` | Resource records — links bookings to owners | Referenced in ownership subqueries for both tables |
| `vc.actor_owners` | Actor ownership links | Referenced in RLS ownership subqueries |
| `vc.actors` | Actor registry | Referenced for `profile_id ↔ auth.uid()` mapping |

### Known bookings read paths (all use `vportClient` — RLS active):

| DAL | Access Pattern | Caller | Protected by app-layer? |
|---|---|---|---|
| `getBookingByIdDAL` | SELECT by PK (`id`) | cancel/confirm controllers | YES — assertion before mutation |
| `listBookingsByCustomerDAL` | SELECT WHERE `customer_actor_id = :actorId` | Customer my-bookings | YES — caller identity is session actorId |
| `listVportBookingHistoryDAL` | SELECT WHERE `resource_id = :resourceId` | Dashboard (owner) | YES — `assertActorOwnsVportActorController` called first |
| `listVportBookingsForProfileDayDAL` | SELECT WHERE `resource_id IN (:ids) AND range` | Dashboard schedule | PARTIAL — gated by screen `isOwner` (string compare, not DB-verified) |
| `getVportBookingByIdDAL` | SELECT by PK (`id`) | Dashboard | PARTIAL — screen-level gate |
| `dalListBookingsByResource` (engine) | SELECT WHERE `resource_id = :resourceId` | `listBookingHistory` engine controller | NO — V-BOOK-01/S-BOOK-01 |
| `listBookingsInRange` | SELECT WHERE `resource_id AND range` | Diagnostics | PARTIAL — dev-only |

### Known availability_rules access patterns:

| DAL | Access Pattern | Caller | Protected? |
|---|---|---|---|
| `listVportAvailabilityRulesByResourceIdDAL` | SELECT WHERE `resource_id = :resourceId AND is_active = true` | Dashboard read | PARTIAL — screen owner gate |
| `upsertVportAvailabilityRuleDAL` (UPDATE) | UPDATE WHERE `id = :ruleId` only | `manageVportAvailabilityRuleController` | NO — V-AVAIL-01/RC-01 |
| `upsertVportAvailabilityRuleDAL` (INSERT) | INSERT with `resource_id` | Same controller | PARTIAL — resource_id present but no ownership check |
| `listAvailabilityRulesByResourceId.dal.js` | SELECT WHERE `resource_id = :resourceId` | Diagnostics/engine | PARTIAL — dev-only |
| `upsertAvailabilityRule.dal.js` | INSERT/UPDATE on availability_rules | Diagnostics | PARTIAL — dev-only |

---

## MIGRATION BLAST RADIUS

**Affected systems:** `vport.bookings` (all booking read/write paths), `vport.availability_rules` (calendar management)  
**Runtime impact:** Adding a restrictive SELECT RLS policy on `vport.bookings` will cause any existing read that doesn't match the policy to return zero rows instead of data. This is a **silent failure risk** — no error thrown, just empty results where data was expected.  
**Release impact:** CRITICAL — these are security-fixing migrations. They must be applied BEFORE any production release of the booking system. However, they must be verified against existing data to ensure no legitimate reads are broken.  
**Rollback impact:** RLS policies can be dropped and re-created without data loss — rollback is FULL.

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vport.bookings` SELECT | CRITICAL | If no policy exists, any authenticated user can read all bookings. If a permissive policy exists, it must be replaced. | DB must verify current policy before this migration applies |
| `vport.availability_rules` UPDATE | CRITICAL | Without an owner-scoped UPDATE policy, V-AVAIL-01 is exploitable at the DB layer even after app-layer fix | DB must verify current policy; Carnage migration applies after verification |
| `vport.resources` | INDIRECT | Referenced in ownership subqueries — must have indexes on `owner_actor_id` and `member_actor_id` | DB: verify index exists |
| `vc.actor_owners` | DIRECT | Referenced in ownership subqueries — must have index on `user_id` | DB: verify index exists |
| `vc.actors` | DIRECT | Referenced for `profile_id ↔ auth.uid()` mapping — must have index on `profile_id` | DB: verify index exists |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| Every `bookings` SELECT (all callers) | HIGH | If RLS policy is more restrictive than current state, reads that assume permissive access will return empty rows | Verify policy against all known read patterns before applying; test all booking flows in staging |
| `availability_rules` UPDATE | MEDIUM | RLS rejection returns a 42501 error code — currently swallowed silently by `manageVportAvailabilityRuleController` catch block | Fix error handling (V-AVAIL-04) before deploying so failures are observable |
| Subquery performance in RLS | MEDIUM | Each SELECT on `bookings` triggers ownership subquery chain through `vport.resources` and `vc.actor_owners` | Add CONCURRENTLY indexes on join columns before deploying policies; see Index Migration section |

---

## MIGRATION 1 — DB-BOOK-01: `vport.bookings` SELECT RLS Policy

### CARNAGE TARGET

**Object:** `vport.bookings` — SELECT policy  
**Application Scope:** VCSM  
**Type of change:** RLS policy creation (new restrictive SELECT policy)  
**Reason:** SELECT access is currently unverified. Without a restrictive policy, the engine `listBookingHistory` gap (V-BOOK-01) is fully exploitable at the DB layer.

---

### Migration Safety Status: HIGH RISK

**Confidence:** MEDIUM (RLS current state unknown — must be verified by DB before applying)  
**Blocking risks:**
- If the table currently has no RLS enabled, enabling RLS first will block ALL reads until a policy is added (brief window of full block)
- If a permissive policy exists, dropping it before the new policy lands creates a brief unprotected window
- Silent row-level failure: reads for rows the user doesn't own return empty instead of errors — callers must handle empty results gracefully

---

### Pre-Migration Verification Query (run in Supabase SQL editor — READ ONLY)

```sql
-- Step 1: Verify current RLS state on vport.bookings
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'bookings'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vport');

-- Step 2: List existing policies on vport.bookings
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bookings'
  AND schemaname = 'vport';

-- Step 3: Verify index exists on vport.resources.owner_actor_id
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'resources'
  AND schemaname = 'vport'
  AND indexdef LIKE '%owner_actor_id%';

-- Step 4: Verify index exists on vc.actor_owners.user_id
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'actor_owners'
  AND schemaname = 'vc'
  AND indexdef LIKE '%user_id%';

-- Step 5: Verify index exists on vport.bookings.customer_actor_id
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bookings'
  AND schemaname = 'vport'
  AND indexdef LIKE '%customer_actor_id%';

-- Step 6: Verify index exists on vport.bookings.resource_id
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bookings'
  AND schemaname = 'vport'
  AND indexdef LIKE '%resource_id%';
```

**Mandatory:** Run all 6 verification queries. If indexes are missing, apply the index migration (below) BEFORE the RLS policy.

---

### Index Migration (if missing — apply FIRST)

```sql
-- Apply CONCURRENTLY to avoid blocking reads during creation
-- Run separately from the main migration

-- Index for bookings.customer_actor_id (needed for customer self-read policy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_vport_bookings_customer_actor_id
  ON vport.bookings (customer_actor_id);

-- Index for bookings.resource_id (needed for owner policy subquery)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_vport_bookings_resource_id
  ON vport.bookings (resource_id);

-- Index for resources.owner_actor_id (needed for ownership resolution)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_vport_resources_owner_actor_id
  ON vport.resources (owner_actor_id);

-- Index for actor_owners.user_id (needed for auth.uid() → actor_id resolution)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_vc_actor_owners_user_id
  ON vc.actor_owners (user_id);

-- IMPORTANT: CREATE INDEX CONCURRENTLY must run outside a transaction block.
-- Run each statement separately.
```

---

### RLS Policy Migration — `vport.bookings` SELECT

```sql
-- ============================================================
-- MIGRATION: vport.bookings — restrictive SELECT RLS policy
-- DB-BOOK-01 — proposed by Carnage 2026-05-14
-- ANALYSIS ONLY — do not apply without DB + Venom review
-- ============================================================

-- Step 1: Verify RLS is enabled on the table
-- (If relrowsecurity = false, run: ALTER TABLE vport.bookings ENABLE ROW LEVEL SECURITY;)
-- Do NOT enable RLS in the same transaction as the policy — brief window of full block.
-- Pre-enable RLS in a separate step before policy creation.

-- Step 2: Drop existing permissive SELECT policy if it exists
-- Replace 'existing_policy_name' with the actual policy name found in pre-migration verification
-- DO NOT run this until Step 1 is confirmed and Step 3 is tested in staging
-- DROP POLICY IF EXISTS "existing_policy_name" ON vport.bookings;

-- Step 3: Create restrictive SELECT policy
CREATE POLICY "bookings_select_party_only"
  ON vport.bookings
  FOR SELECT
  USING (
    -- Party 1: Customer sees their own bookings
    -- customer_actor_id matches the caller's actor record by auth.uid() ↔ profile_id
    customer_actor_id IN (
      SELECT id FROM vc.actors
      WHERE profile_id = auth.uid()
        AND kind = 'user'
        AND is_void = false
      LIMIT 1
    )

    OR

    -- Party 2: Resource owner sees all bookings for their resources
    -- Resolves: auth.uid() → actor_owners.actor_id → resources.owner_actor_id
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.owner_actor_id IN (
        SELECT ao.actor_id FROM vc.actor_owners ao
        WHERE ao.user_id = auth.uid()
          AND ao.is_void = false
      )
    )

    OR

    -- Party 3: Staff/member assigned to resource sees bookings for their resource
    -- Covers team members with member_actor_id on the resource
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.member_actor_id IN (
        SELECT a.id FROM vc.actors a
        WHERE a.profile_id = auth.uid()
          AND a.kind = 'user'
          AND a.is_void = false
        LIMIT 1
      )
    )
  );

-- ============================================================
-- PROPOSAL ONLY — verify in staging before production apply
-- ============================================================
```

**Policy rationale:**  
- Customer clause: reads `vc.actors` to map `auth.uid()` to the customer's actor ID — correctly scoped by `kind = 'user'` and `is_void = false`  
- Owner clause: traverses `vc.actor_owners` to get all actor IDs owned by the current user, then matches against `resources.owner_actor_id` — covers all VPORT actors they own  
- Member clause: covers staff/team resources with `member_actor_id` — allows team members to see their assigned resource's bookings

---

### Compatibility Impact on Existing DAL Patterns

| DAL Read Pattern | Compatible with New Policy? | Notes |
|---|---|---|
| `getBookingByIdDAL` — SELECT by PK | YES | Caller must be customer or resource owner |
| `listBookingsByCustomerDAL` — SELECT by `customer_actor_id` | YES | Customer sees their own bookings (Party 1) |
| `listVportBookingHistoryDAL` — SELECT by `resource_id` | YES | Owner sees bookings for their resource (Party 2) |
| `listVportBookingsForProfileDayDAL` — SELECT by `resource_id IN` | YES | Owner's resources — Party 2 applies |
| `getVportBookingByIdDAL` — SELECT by PK | YES | Caller must be party to the booking |
| `dalListBookingsByResource` (engine) — SELECT by `resource_id` | YES — but only if caller is the resource owner | Engine currently has no ownership context — V-BOOK-01 fix required; after fix, Party 2 applies |
| `listBookingsInRange` (diagnostics) | PARTIAL — returns only rows the session user is party to | Acceptable for diagnostics |

**Critical compatibility note:** If `dalListBookingsByResource` (engine `listBookingHistory`) is called by an authenticated user who is NOT the resource owner, the policy will return 0 rows with no error. This is silent failure. The engine must be fixed (V-BOOK-01/S-BOOK-01/RC-03) BEFORE this policy is applied to production, so the app layer correctly gates who can call this path.

---

## MIGRATION 2 — DB-BOOK-02: `vport.availability_rules` UPDATE RLS Policy

### CARNAGE TARGET

**Object:** `vport.availability_rules` — UPDATE policy  
**Application Scope:** VCSM  
**Type of change:** RLS policy creation (new restrictive UPDATE policy)  
**Reason:** The DAL `upsertVportAvailabilityRuleDAL` UPDATE path filters only by `ruleId` — no `resource_id` or owner filter. Without an RLS UPDATE policy, any authenticated user with a valid `ruleId` can overwrite any VPORT's availability rules (V-AVAIL-01, DB-BOOK-02).

---

### Migration Safety Status: CAUTION

**Confidence:** MEDIUM (UPDATE policy is a new addition; existing app-layer fix for RC-01 must deploy concurrently)  
**Blocking risks:**
- If the app-layer fix for RC-01 (ownership assertion in controller) deploys WITHOUT this migration, the DB is still unprotected — app layer is the only gate
- If this migration deploys WITHOUT the RC-01 app-layer fix, users with legitimate access may hit RLS rejections if the controller doesn't forward their identity correctly — silent failure (error swallowed by catch block)
- The recommended deploy sequence: app-layer fix (RC-01) FIRST, then RLS policy — both are defense-in-depth, not either/or

---

### Pre-Migration Verification Query

```sql
-- Step 1: Verify current RLS state on vport.availability_rules
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'availability_rules'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vport');

-- Step 2: List existing policies on vport.availability_rules
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'availability_rules'
  AND schemaname = 'vport';

-- Step 3: Verify index exists on vport.availability_rules.resource_id
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'availability_rules'
  AND schemaname = 'vport'
  AND indexdef LIKE '%resource_id%';
```

---

### Index Migration (if missing — apply FIRST)

```sql
-- Index for availability_rules.resource_id (needed for UPDATE policy subquery)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_vport_availability_rules_resource_id
  ON vport.availability_rules (resource_id);

-- Run CONCURRENTLY outside a transaction block.
```

---

### RLS Policy Migration — `vport.availability_rules` UPDATE

```sql
-- ============================================================
-- MIGRATION: vport.availability_rules — restrictive UPDATE RLS policy
-- DB-BOOK-02 — proposed by Carnage 2026-05-14
-- ANALYSIS ONLY — do not apply without DB + Venom review
-- ============================================================

-- Step 1: Verify RLS is enabled on the table
-- (If not: ALTER TABLE vport.availability_rules ENABLE ROW LEVEL SECURITY;)
-- Note: enabling RLS blocks all rows until policies are in place — brief window risk

-- Step 2: Create UPDATE policy — resource owner only
CREATE POLICY "availability_rules_update_owner_only"
  ON vport.availability_rules
  FOR UPDATE
  USING (
    -- Only allow UPDATE if the resource's owner is the current user
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.owner_actor_id IN (
        SELECT ao.actor_id FROM vc.actor_owners ao
        WHERE ao.user_id = auth.uid()
          AND ao.is_void = false
      )
    )
  )
  WITH CHECK (
    -- Ensure the resource_id cannot be changed to a resource the user doesn't own
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.owner_actor_id IN (
        SELECT ao.actor_id FROM vc.actor_owners ao
        WHERE ao.user_id = auth.uid()
          AND ao.is_void = false
      )
    )
  );

-- ============================================================
-- PROPOSAL ONLY — verify in staging before production apply
-- ============================================================
```

**Policy rationale:**  
- `USING`: Restricts which rows the UPDATE can target — only availability rules belonging to resources owned by the current user
- `WITH CHECK`: Prevents the `resource_id` column from being changed to a resource the user doesn't own (extra guard against UPDATE-based escalation)
- Both clauses use the same ownership chain: `auth.uid() → actor_owners.actor_id → resources.owner_actor_id`

---

### INSERT Policy for `vport.availability_rules` (recommended companion)

```sql
-- ============================================================
-- COMPANION: availability_rules INSERT policy
-- Not in DB-BOOK-02 scope but required for defense-in-depth
-- ============================================================

CREATE POLICY "availability_rules_insert_owner_only"
  ON vport.availability_rules
  FOR INSERT
  WITH CHECK (
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.owner_actor_id IN (
        SELECT ao.actor_id FROM vc.actor_owners ao
        WHERE ao.user_id = auth.uid()
          AND ao.is_void = false
      )
    )
  );
```

**Rationale:** The INSERT path (`upsertVportAvailabilityRuleDAL` without `ruleId`) is currently only gated by `resource_id` presence — not ownership. Adding an INSERT policy closes this gap. Recommend including in the same migration batch.

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| App-layer controller fix (RC-01) | `manageVportAvailabilityRuleController` — must pass `callerActorId` | HIGH — RLS fix alone without app-layer fix leaves error handling broken (silent swallow) |
| App-layer engine fix (RC-03/V-BOOK-01) | Engine `listBookingHistory` — must add ownership gate | HIGH — bookings RLS policy will silently return 0 rows if engine calls without ownership context |
| Index pre-migration | All 5 indexes listed above | MEDIUM — RLS subqueries will scan without indexes, causing O(n) performance on every SELECT/UPDATE |
| Error handling fix (V-AVAIL-04) | `manageVportAvailabilityRuleController` error catch block | MEDIUM — RLS rejection (42501) is swallowed silently; must be surfaced before RLS deploys |
| RLS enabled (table-level) | Both tables | HIGH — must enable RLS before policy creation; brief gap window if done in wrong order |

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Phase 0 — Verify | Run all pre-migration verification queries | LOW | Determine current RLS state; abort if unexpected policies exist |
| Phase 1 — Indexes | Create CONCURRENTLY indexes on all join columns | LOW | Must run OUTSIDE transactions; takes time proportional to table size |
| Phase 2 — App-layer fixes | Deploy RC-01 (controller ownership gate) and V-AVAIL-04 (error handling) | MEDIUM | Deploy to staging first; must be live before RLS policies |
| Phase 3 — availability_rules policies | Apply UPDATE + INSERT policies on `vport.availability_rules` | CAUTION | Less blast radius than bookings; apply first to verify pattern |
| Phase 4 — bookings policy | Apply SELECT policy on `vport.bookings` in staging | HIGH RISK | Verify ALL read paths return correct data for known test scenarios |
| Phase 5 — bookings policy production | Apply SELECT policy on `vport.bookings` in production | HIGH RISK | Only after Phase 4 staging verification passes |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Orphaned bookings (no resource) | LOW | `SELECT * FROM vport.bookings WHERE resource_id NOT IN (SELECT id FROM vport.resources)` | Fix orphaned rows before deploying bookings policy |
| Orphaned availability_rules (no resource) | LOW | `SELECT * FROM vport.availability_rules WHERE resource_id NOT IN (SELECT id FROM vport.resources)` | Fix before deploying availability policy |
| actor_owners missing for legitimate VPORT owners | MEDIUM | Run DB-BOOK-04 verification query | If invariant broken, owner reads will fail after policy applies |

---

## ROLLBACK SURVIVABILITY

**Rollback status:** FULL — RLS policies are metadata; DROP POLICY is instant, non-destructive  
**Data recovery risk:** NONE — RLS policies do not affect data, only visibility  
**Compatibility rollback risk:** LOW — dropping the policy restores original (permissive/unknown) state  
**Operational complexity:** LOW — `DROP POLICY "policy_name" ON schema.table;` takes effect immediately  

### Rollback SQL

```sql
-- Rollback bookings SELECT policy
DROP POLICY IF EXISTS "bookings_select_party_only" ON vport.bookings;

-- Rollback availability_rules UPDATE policy
DROP POLICY IF EXISTS "availability_rules_update_owner_only" ON vport.availability_rules;

-- Rollback availability_rules INSERT policy (if companion was applied)
DROP POLICY IF EXISTS "availability_rules_insert_owner_only" ON vport.availability_rules;

-- Note: These are instant. No data is affected.
-- If RLS was enabled at the table level (relrowsecurity), decide whether to disable it:
-- ALTER TABLE vport.bookings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE vport.availability_rules DISABLE ROW LEVEL SECURITY;
```

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility (bookings) | PENDING — requires DB to verify current state | Run pre-migration queries; confirm no existing policies conflict |
| Schema compatibility (availability_rules) | PENDING | Same as above |
| DAL compatibility — all bookings reads | PENDING | Test all 7 DAL read patterns in staging after policy application |
| DAL compatibility — availability_rules reads | PENDING | Test `listVportAvailabilityRulesByResourceIdDAL` returns correct results for owner |
| Engine compatibility — `listBookingHistory` | BLOCKED — RC-03 must be fixed first | Engine call without ownership context will silently return 0 rows after policy applies |
| Error handling compatibility | PENDING — V-AVAIL-04 must be fixed first | RLS rejections must surface as actionable errors, not silent empty results |
| Performance — subquery timing | PENDING — requires Supabase EXPLAIN ANALYZE after index creation | Verify index usage in query plan for `bookings` and `availability_rules` RLS queries |
| Rollback validation | READY — DROP POLICY instant | No special validation required |
| Owner identity invariant (DB-BOOK-04) | PENDING | Run DB-BOOK-04 verification query before bookings policy deploys |

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

**Object:** `vport.bookings` SELECT policy + `vport.availability_rules` UPDATE policy  
**Current behavior:** No confirmed restrictive policy exists; all authenticated callers may be able to read/update any row (UNKNOWN current state)  
**Migration risk:** The new policies use `auth.uid() → vc.actors.profile_id → vc.actor_owners.user_id` chain. If this invariant is broken for any actor (DB-BOOK-04), legitimate owners will be locked out of their own booking data after the policy applies.  
**Potential impact:** Legitimate VPORT owners see empty booking history / cannot update availability rules  
**Recommended safeguards:**
1. Run DB-BOOK-04 invariant verification query before applying bookings SELECT policy
2. Verify actor_owners rows exist for all active VPORT owners before applying
3. Deploy to staging with known test users first; confirm they can read their own bookings

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vport.bookings` | VCSM | NONE — vport schema is VCSM-owned | CLEAN |
| `vport.availability_rules` | VCSM | NONE — vport schema is VCSM-owned | CLEAN |
| `vc.actor_owners` | VCSM (identity layer) | LOW — WENTREX does not use actor_owners; Traffic has no auth | CLEAN |
| `vc.actors` | VCSM (identity layer) | LOW — WENTREX has its own user model; Traffic has no auth | CLEAN |

---

## RECOMMENDED HANDOFFS

| Finding | Action Required | Handoff |
|---|---|---|
| Phase 0 — DB verification | Run pre-migration queries; confirm RLS current state | DB |
| Phase 0 — Index verification | Confirm all 5 indexes exist | DB |
| Phase 0 — Invariant check | Run DB-BOOK-04 verification query | DB |
| Phase 1 — Index creation | Create CONCURRENTLY indexes if missing | Carnage (apply) — after DB confirms need |
| Phase 2 — App-layer controller fix | RC-01 (manageVportAvailabilityRuleController) + V-AVAIL-04 (error handling) | Wolverine |
| Phase 3 — availability_rules policies | Apply UPDATE + INSERT policies | Carnage (apply) — after Wolverine RC-01 confirmed |
| Phase 4/5 — bookings SELECT policy | Apply in staging then production | Carnage (apply) — after engine V-BOOK-01 fix confirmed in staging |
| RLS security review | Verify policy logic against all read paths | Venom |
| Release gate | Confirm all phases complete before production | Thor |

---

## FINAL CARNAGE STATUS: HIGH RISK

**Reason:** Both migrations are security-critical and correct the identified trust boundary failures. However, the bookings SELECT policy has HIGH RISK because:
1. Current policy state is UNKNOWN — could conflict with existing policies
2. Incorrect application causes silent empty-result failures across all booking read paths
3. The engine path (V-BOOK-01) must be fixed BEFORE this deploys to avoid silent failures on that path
4. The owner identity invariant (DB-BOOK-04) must be verified before application

The availability_rules UPDATE policy is CAUTION (less blast radius). Both migrate safely if the prerequisite app-layer fixes and index migrations are applied first in the correct sequence.

**Required sequence:** Verify → Indexes → App-layer fixes → availability_rules policies → bookings policy (staging) → bookings policy (production)
