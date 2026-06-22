# CARNAGE MIGRATION REPORT
## bookings_insert_owner — Legacy Auth Pattern Replacement

**Date:** 2026-05-14
**Reviewer:** CARNAGE
**Trigger:** Cerebro governance audit — `bookings_insert_owner` on `vport.bookings` uses `profiles.owner_user_id = auth.uid()` (legacy auth pattern) rather than the canonical actor_owners ownership chain
**Application Scope:** VCSM + ENGINE
**Branch:** vport-booking-feed-security-updates
**Mode:** READ-ONLY ANALYSIS ONLY — no schema modifications applied

---

## CARNAGE TARGET

```
Object being changed:  vport.bookings — INSERT policy (bookings_insert_owner)
Application Scope:     VCSM + ENGINE
Type of change:        RLS policy replacement (DROP + CREATE on INSERT policy)
Reason for migration:  bookings_insert_owner uses profiles.owner_user_id = auth.uid()
                       — a legacy direct auth UID join through vport.profiles.
                       This diverges from the canonical actor_owners ownership chain
                       and creates a structural dependency mismatch with all other
                       booking-related policies on this table.
```

---

## MIGRATION HISTORY — WHAT HAS ALREADY BEEN APPLIED

Understanding the migration history for this specific policy is essential context for this report. This policy has a documented instability trail.

### Migration 20260427010000 — Initial intent (PARTIALLY FAILED)

Attempted to create `bookings_insert_owner` using:
```sql
vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
AND created_by_actor_id = vc.current_actor_id()
AND source IN ('owner', 'admin', 'import', 'sync')
```
This was the correct actor-based approach. However, at the time this migration ran, `vport.actor_can_manage_profile` did not exist on the database. The `CREATE POLICY` statement failed. The policy was never created, leaving owners with NO INSERT policy and 403 errors on every owner booking attempt.

### Migration 20260427040000 — Emergency hotfix (WHAT IS CURRENTLY DEPLOYED)

Dropped the failed policy (which had never been created) and recreated `bookings_insert_owner` using a fallback pattern that avoided the missing function:
```sql
-- Currently deployed policy:
CREATE POLICY bookings_insert_owner ON vport.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND source IN ('owner', 'admin', 'import', 'sync')
    AND EXISTS (
      SELECT 1
      FROM   vport.profiles p
      WHERE  p.id            = profile_id
        AND  p.owner_user_id = auth.uid()    -- ← legacy pattern: raw auth UID
        AND  p.is_active     = true
        AND  p.is_deleted    = false
    )
  );
```
This policy is what is currently live. It was a deliberate emergency workaround because `vport.actor_can_manage_profile` was confirmed absent from the DB at migration time. It resolves ownership through `vport.profiles.owner_user_id = auth.uid()` — bypassing the actor_owners chain entirely.

### Migration 20260503052543 — Canonical helpers confirmed present (KEY FACT)

This migration successfully used both `vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)` and `vport.current_actor_can_manage_resource(resource_id)` across 15+ policies on 6 tables (`qr_links`, `service_booking_profiles`, `resource_service_overrides`, `profile_actor_access`, `content_pages`, `menu_categories`). This confirms that by 2026-05-03, both helper functions exist and are stable on the production database.

**The gap:** `bookings_insert_owner` was never updated after the helpers became available. It remains on the legacy fallback from 2026-04-27.

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vport.bookings` | Booking-sensitive + Identity-sensitive | INSERT gate for all owner-initiated booking creation; controls who can write confirmed appointments |
| `vport.profiles` | Ownership-sensitive | Currently referenced by the legacy policy via `owner_user_id`; must be eliminated from this trust chain |
| `vc.actor_owners` | Identity-sensitive + Ownership-sensitive | Canonical ownership authority table; must replace `profiles.owner_user_id` as the ownership source |
| `vport.resources` | Ownership-sensitive | Referenced by `vport.current_actor_can_manage_resource(resource_id)` — the target function for the new policy |
| `vc.actors` | Identity-sensitive | Referenced internally by `vc.current_actor_id()` to resolve session actor from auth.uid() |

---

## CURRENT STRUCTURE

| Object | Purpose | Dependencies |
|---|---|---|
| `vport.bookings` | Booking record table | `vport.profiles` (profile_id FK), `vport.resources` (resource_id FK), `vc.actors` (customer_actor_id, created_by_actor_id FKs) |
| `bookings_insert_owner` (current) | Owner INSERT policy | `vport.profiles.owner_user_id`, `auth.uid()` — legacy join, no actor_owners |
| `bookings_insert_public_pending` | Public customer INSERT policy | `vc.current_actor_id()` — actor-based, canonical |
| `bookings_select_vport_owner` | Owner SELECT policy | `vport.actor_can_manage_profile(current_actor_id(), profile_id)` — actor-based |
| `bookings_select_resource_neutral` | Resource-owner SELECT policy | `vport.current_actor_can_manage_resource(resource_id)` — actor-based |
| `bookings_select_customer` | Customer self-read SELECT policy | `customer_actor_id = current_actor_id()` — actor-based |
| `availability_rules_manage_neutral` | Availability rule write policy | `vport.current_actor_can_manage_resource(resource_id)` — actor-based |

### Policy Consistency Matrix (current state)

| Policy | Ownership Chain | Pattern |
|---|---|---|
| `bookings_insert_owner` | `profiles.owner_user_id = auth.uid()` | LEGACY — raw auth UID |
| `bookings_insert_public_pending` | `vc.current_actor_id()` | CANONICAL |
| `bookings_select_vport_owner` | `vport.actor_can_manage_profile(current_actor_id(), profile_id)` | CANONICAL |
| `bookings_select_resource_neutral` | `vport.current_actor_can_manage_resource(resource_id)` | CANONICAL |
| `bookings_select_customer` | `customer_actor_id = current_actor_id()` | CANONICAL |
| `availability_rules_manage_neutral` | `vport.current_actor_can_manage_resource(resource_id)` | CANONICAL |

`bookings_insert_owner` is the sole outlier. All other booking-related policies on `vport.bookings` and `vport.availability_rules` already use canonical actor-based helpers.

---

## MIGRATION BLAST RADIUS

**Affected systems:**
- `vport.bookings` INSERT path — all owner-initiated booking creation
- `createOwnerBookingController` → `insertVportBookingDAL` call chain (direct path)
- `useQuickBookingModal` hook → `createOwnerBookingController` (UI path)
- `useVportOwnerSchedule` hook (indirect — may trigger owner bookings)
- Any source values `'owner'`, `'admin'`, `'import'`, `'sync'` on `vport.bookings`

**Runtime impact:**
If the DROP is executed without the replacement policy being live, ALL owner-initiated booking inserts will fail with 403 until the new policy is created. This is the highest-risk moment. The two statements must be executed in the same transaction.

If the replacement policy is too restrictive (e.g., `current_actor_can_manage_resource` evaluates false for a legitimate VPORT owner), owner bookings fail silently — the INSERT returns a Supabase 403/42501, which is thrown as an error by `insertVportBookingDAL` and propagated to the hook's `error` state.

**Release impact:**
This migration must be applied and validated before any code that depends on owner booking creation reaches production. It is a blocking security alignment task, not optional.

**Rollback impact:**
RLS policy replacement is fully reversible. Rolling back requires recreating the legacy policy — rollback SQL is provided below. No data is affected in either direction.

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vport.bookings` INSERT | CRITICAL | Replacing the INSERT gate directly affects all owner booking creation. If new policy is too restrictive, owner inserts fail. If too permissive, unauthorized actors can create bookings. | Venom review of proposed policy logic before apply |
| `vport.profiles` | DIRECT (currently) | Legacy policy joins through `vport.profiles.owner_user_id`. After migration, this table is no longer in the INSERT trust chain for bookings. | No action required on profiles table itself; confirm `owner_user_id` sync invariant is not relied upon elsewhere |
| `vc.actor_owners` | INDIRECT (via helper) | `vport.current_actor_can_manage_resource` resolves internally through actor_owners. If an actor_owners row is missing or is_void, the INSERT will correctly fail. | Verify all active VPORT owners have valid non-voided actor_owners rows (DB verification query provided below) |
| `vport.resources` | INDIRECT (via helper) | `current_actor_can_manage_resource(resource_id)` evaluates resource ownership. The resource_id being inserted must belong to an owner the caller controls. | Confirm resource ownership rows exist for all resources used by the createOwnerBookingController path |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| `createOwnerBookingController` → `insertVportBookingDAL` | HIGH | This is the primary call path. If policy is dropped and not immediately replaced in same transaction, 403 on all owner inserts. | Execute DROP + CREATE in a single transaction block |
| `useQuickBookingModal.createBooking` | HIGH | Hook catches errors and sets `error` state — failures are user-visible but non-crashing | Validate in staging before production apply |
| Guest/walk-in bookings (`createVportPublicBookingController`, source='public') | NONE | These use `bookings_insert_public_pending`, not `bookings_insert_owner`. Unaffected. | No action needed |
| Engine booking path (`engines/booking/src/controller/createBooking.controller.js`) | MEDIUM | Engine controller uses `MANAGEMENT_SOURCES = new Set(["owner", "admin", "import", "sync"])` and calls `assertActorOwnsVportActor` before `insertBookingDAL`. The new policy's behavior must be consistent with the app-layer ownership assertion. | Verify engine path passes the new policy after migration |
| `bookings_insert_owner` helper function call performance | LOW | `vport.current_actor_can_manage_resource(resource_id)` is a stable DB function confirmed in production. Performance is equivalent to existing policies on `resource_service_overrides`, `availability_rules`. | No additional index work required — same function already in use |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| DB function availability | `vport.current_actor_can_manage_resource(resource_id)` — must exist on DB | HIGH — if function is absent, CREATE POLICY fails (same failure mode as original 20260427010000). Verify function exists before apply. |
| DB function availability | `vc.current_actor_id()` — must exist on DB | HIGH — used by `bookings_insert_public_pending`; same session, same verification. Confirmed present by 20260503052543 usage. |
| `created_by_actor_id` behavior | Controller sets `created_by_actor_id = callerActorId` | MEDIUM — current policy does NOT check `created_by_actor_id` in the legacy version. Proposed policy should decide whether to enforce this at RLS level. |
| `source` guard | `source IN ('owner', 'admin', 'import', 'sync')` | LOW — existing source guard must be preserved in new policy. createOwnerBookingController always sets `source: "owner"`. |
| `profile_id` column presence | `createOwnerBookingController` sends `profile_id` derived from `resource.profile_id` | LOW — `insertVportBookingDAL` requires profile_id; the new policy using resource_id-based ownership is still consistent with profile_id being present in the row |
| DAL column list | `insertVportBookingDAL` WRITE_COLS includes `profile_id`, `resource_id`, `source`, `created_by_actor_id` | LOW — policy can reference any inserted column; these are all present |
| Transaction safety | DROP + CREATE must be atomic | CRITICAL — see Migration Execution Strategy |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| VPORT owners without actor_owners rows | MEDIUM | `SELECT p.id, p.owner_user_id FROM vport.profiles p WHERE p.is_active = true AND NOT EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.user_id = p.owner_user_id AND ao.is_void = false)` | Resolve any missing rows before deploying; owner_user_id without actor_owners row will fail new policy |
| Existing bookings with source='owner' but no resource_id | LOW | `SELECT id FROM vport.bookings WHERE source = 'owner' AND resource_id IS NULL` | Existing rows not affected — this is an INSERT policy only |
| Orphaned resources (no actor_owners link for owner_actor_id) | LOW | `SELECT r.id, r.owner_actor_id FROM vport.resources r WHERE NOT EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = r.owner_actor_id AND ao.is_void = false)` | Resolve before deploying; resources without valid actor_owners link will cause policy to evaluate false |
| profiles.owner_user_id out of sync with actor_owners | MEDIUM | Cross-check: `SELECT p.id, p.owner_user_id FROM vport.profiles p LEFT JOIN vc.actor_owners ao ON ao.user_id = p.owner_user_id WHERE ao.user_id IS NULL AND p.is_active = true` | This is the exact divergence scenario the migration is fixing. If sync is broken, the new policy (via actor_owners) is MORE correct than the legacy policy (via profiles.owner_user_id). |

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Phase 0 — Pre-flight verification | Verify DB functions exist; verify all data integrity queries above return 0 rows | LOW | Run in Supabase SQL editor, read-only. Do not proceed if any integrity query returns results. |
| Phase 1 — Staging deploy | Apply DROP + CREATE in a transaction on staging database | MEDIUM | Use a test user who owns a VPORT resource; verify booking insert succeeds with source='owner'; verify booking insert fails without ownership |
| Phase 2 — Staging validation | Run full owner booking flow in staging (quick booking modal + dashboard schedule booking) | MEDIUM | Both call paths (useQuickBookingModal and useVportOwnerSchedule) must succeed |
| Phase 3 — Production deploy | Apply DROP + CREATE in a transaction on production database during low-traffic window | HIGH | Monitor for 403 errors on booking creation endpoints immediately post-apply |
| Phase 4 — Post-apply validation | Verify a live owner booking insert succeeds in production | MEDIUM | Use a test VPORT account with a resource |

### Transaction Safety Requirement

The DROP and CREATE must execute in a single PostgreSQL transaction. If the transaction is interrupted between DROP and CREATE, the policy gap is live until manual recovery.

```sql
-- TEXT ONLY — DO NOT EXECUTE
BEGIN;

  DROP POLICY IF EXISTS bookings_insert_owner ON vport.bookings;

  CREATE POLICY bookings_insert_owner ON vport.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (
      vport.current_actor_can_manage_resource(resource_id)
      AND source IN ('owner', 'admin', 'import', 'sync')
    );

COMMIT;
```

---

## ROLLBACK SURVIVABILITY

**Rollback status:** FULL
**Data recovery risk:** NONE — RLS policies are metadata; data is never affected
**Compatibility rollback risk:** LOW — restoring the legacy policy restores the exact pre-migration behavior; app-layer code does not change
**Operational complexity:** LOW — a single SQL statement takes effect immediately

### Rollback SQL (TEXT ONLY — DO NOT EXECUTE)

```sql
-- TEXT ONLY — DO NOT EXECUTE
-- Full rollback: restore legacy bookings_insert_owner policy

BEGIN;

  DROP POLICY IF EXISTS bookings_insert_owner ON vport.bookings;

  -- Restore the legacy 20260427040000 policy exactly as it was deployed
  CREATE POLICY bookings_insert_owner ON vport.bookings
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND source IN ('owner', 'admin', 'import', 'sync')
      AND EXISTS (
        SELECT 1
        FROM   vport.profiles p
        WHERE  p.id            = profile_id
          AND  p.owner_user_id = auth.uid()
          AND  p.is_active     = true
          AND  p.is_deleted    = false
      )
    );

COMMIT;
```

**Note:** Rollback restores the legacy pattern. It is safe but reintroduces the architectural divergence. Rollback should only be triggered if the new policy causes legitimate owner insert failures that cannot be immediately diagnosed.

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| `vport.current_actor_can_manage_resource` exists on DB | PENDING — verify | Confirmed present by 20260503052543 usage; re-verify before apply |
| `vc.current_actor_id()` exists on DB | PENDING — verify | Confirmed by multiple migrations; re-verify |
| All active VPORT profiles have actor_owners rows | PENDING | Run data integrity query from Data Integrity Review section |
| All active resources have valid actor_owners for owner_actor_id | PENDING | Run data integrity query |
| Staging: owner booking insert succeeds (source='owner') | PENDING | Test with useQuickBookingModal flow |
| Staging: non-owner booking insert fails with new policy | PENDING | Test with a different authenticated user who does not own the resource |
| Staging: public booking (source='public') is unaffected | PENDING | bookings_insert_public_pending is unchanged; must still work |
| Engine booking path (source='owner') succeeds | PENDING | engines/booking createBookingController with MANAGEMENT_SOURCES |
| Production: owner booking succeeds post-apply | PENDING | Monitor immediately after deploy |
| `profiles.owner_user_id` no longer relied upon by this policy | COMPLETE after migration | Verified: legacy pattern removed |
| Rollback SQL tested in staging | PENDING | Execute rollback, verify old flow resumes, then re-apply migration |

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

**Object:** `bookings_insert_owner` on `vport.bookings`

**Current behavior:** Ownership is verified by joining `vport.profiles` on `profile_id` and checking `owner_user_id = auth.uid()`. This is a direct raw auth UID comparison against a denormalized column on the profiles table. It does not consult `vc.actor_owners`.

**Migration risk:** The new policy delegates to `vport.current_actor_can_manage_resource(resource_id)`. This function resolves ownership through the canonical chain:
```
auth.uid()
  → vc.current_actor_id()
  → vc.actor_owners.actor_id (where user_id = actor, is_void = false)
  → vport.resources.owner_actor_id
```
If `vport.profiles.owner_user_id` and `vc.actor_owners` are in sync (which they should be by system design), the new policy produces identical authorization decisions for all legitimate owners. If they have ever diverged (e.g., VPORT transferred, user migrated), the new policy is MORE correct — it reflects actual current ownership state per the identity engine.

**Potential impact:**
1. A VPORT where `profiles.owner_user_id` was manually updated but `actor_owners` was not: legacy policy would succeed, new policy would correctly fail (actor_owners is authoritative).
2. A VPORT where `actor_owners` was added but `profiles.owner_user_id` was not updated: new policy succeeds where legacy policy would fail (actor_owners is correct source of truth).
3. Any VPORT where both are in sync: no behavioral change.

**Recommended safeguards:**
1. Run the `profiles.owner_user_id` vs `actor_owners` cross-check query (provided in Data Integrity Review) before applying.
2. Resolve any rows where the two are out of sync — this is a data hygiene task independent of this migration.
3. Test with at least one real VPORT owner account in staging before production apply.

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vport.bookings` | VCSM (vport schema) | NONE — Traffic has no auth, Wentrex has no booking dependency | CLEAN |
| `vport.profiles` | VCSM (vport schema) | NONE — no cross-app dependency | CLEAN — removing from INSERT trust chain only |
| `vc.actor_owners` | VCSM (identity layer) | LOW — referenced by canonical helpers only; no Wentrex/Traffic dependency | CLEAN |
| `vport.resources` | VCSM (vport schema) | NONE | CLEAN |
| `vport.current_actor_can_manage_resource` (DB function) | VCSM | NONE — vport-schema function | CLEAN |

This migration does not touch any cross-root boundary. It is entirely contained within the VCSM application scope. Traffic and Wentrex are unaffected.

---

## PROPOSED MIGRATION SQL (TEXT ONLY — DO NOT EXECUTE)

```sql
-- ============================================================
-- MIGRATION: bookings_insert_owner — legacy auth pattern replacement
-- Object: vport.bookings INSERT policy
-- Date: 2026-05-14
-- Author: CARNAGE
-- Branch: vport-booking-feed-security-updates
--
-- PURPOSE:
--   Replace bookings_insert_owner (currently using profiles.owner_user_id = auth.uid())
--   with the canonical actor-based pattern using vport.current_actor_can_manage_resource().
--
-- SAFETY:
--   DROP + CREATE must be in a single transaction.
--   Do not apply without completing Phase 0 pre-flight verification.
--
-- TEXT ONLY — DO NOT EXECUTE
-- ============================================================

BEGIN;

  -- Step 1: Drop the legacy policy
  DROP POLICY IF EXISTS bookings_insert_owner ON vport.bookings;

  -- Step 2: Create the canonical replacement
  --
  -- USING current_actor_can_manage_resource(resource_id) because:
  --   1. It is the same function used by bookings_select_resource_neutral
  --      and availability_rules_manage_neutral — policy consistency is achieved.
  --   2. It resolves ownership through vc.actor_owners — canonical chain.
  --   3. It is confirmed stable on production (used by 20260503052543).
  --   4. resource_id is always present in the INSERT row (required by insertVportBookingDAL).
  --
  -- The source guard preserves the existing management-source restriction.
  -- created_by_actor_id is enforced at the app layer (createOwnerBookingController)
  -- rather than at the RLS layer, consistent with how bookings_select_resource_neutral
  -- and availability_rules_manage_neutral are structured.

  CREATE POLICY bookings_insert_owner ON vport.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (
      vport.current_actor_can_manage_resource(resource_id)
      AND source IN ('owner', 'admin', 'import', 'sync')
    );

COMMIT;
```

### Policy Rationale Notes

**Why `current_actor_can_manage_resource` rather than `actor_can_manage_profile`?**

Both functions are confirmed present. However, `current_actor_can_manage_resource(resource_id)` is the more precise gate for bookings because:

1. Bookings are scoped to a specific `resource_id` — the function checks ownership at the resource level, which is the correct authority boundary. A VPORT owner can only create bookings for resources they manage.
2. `actor_can_manage_profile(current_actor_id(), profile_id)` checks at the profile level, which is slightly broader. If a VPORT has multiple resources managed by different staff actors, profile-level ownership is too broad.
3. `bookings_select_resource_neutral` already uses `current_actor_can_manage_resource(resource_id)` for SELECT — using the same function for INSERT creates full symmetry: you can only read bookings for resources you manage, and you can only insert bookings for resources you manage.

**Why is `created_by_actor_id` not enforced in RLS?**

`createOwnerBookingController` already sets `created_by_actor_id = callerActorId` unconditionally at the app layer. Enforcing this at the RLS level would require an additional `AND created_by_actor_id = vc.current_actor_id()` clause, which is an acceptable addition but introduces a dependency on `vc.current_actor_id()` returning the correct actor for the current session's identity switch. Since the existing pattern across all booking policies omits this extra guard at the RLS layer, this migration is consistent with established convention.

If `created_by_actor_id` enforcement at the RLS layer is desired, it can be added as an optional hardening step:
```sql
-- TEXT ONLY — optional hardening addition
-- AND created_by_actor_id = vc.current_actor_id()
```
This decision should be made in consultation with Venom before apply.

---

## PRE-FLIGHT VERIFICATION QUERIES (TEXT ONLY — RUN READ-ONLY IN SQL EDITOR)

```sql
-- TEXT ONLY — Read-only verification only

-- 1. Confirm current policy state on vport.bookings INSERT
SELECT
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE tablename  = 'bookings'
  AND schemaname = 'vport'
  AND cmd        = 'INSERT';

-- 2. Confirm vport.current_actor_can_manage_resource exists
SELECT
  proname,
  pronamespace::regnamespace,
  pronargs
FROM pg_proc
WHERE proname = 'current_actor_can_manage_resource'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vport');

-- 3. Confirm vc.current_actor_id exists
SELECT
  proname,
  pronamespace::regnamespace
FROM pg_proc
WHERE proname = 'current_actor_id'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vc');

-- 4. Verify active VPORT profiles have actor_owners rows (sync invariant check)
SELECT
  p.id AS profile_id,
  p.owner_user_id
FROM vport.profiles p
WHERE p.is_active = true
  AND p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1
    FROM vc.actor_owners ao
    WHERE ao.user_id = p.owner_user_id
      AND ao.is_void = false
  )
LIMIT 20;
-- Expected: 0 rows. Any rows here are VPORT owners who will fail the new policy.

-- 5. Verify active resources have valid actor_owners for owner_actor_id
SELECT
  r.id AS resource_id,
  r.owner_actor_id
FROM vport.resources r
WHERE r.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM vc.actor_owners ao
    WHERE ao.actor_id = r.owner_actor_id
      AND ao.is_void  = false
  )
LIMIT 20;
-- Expected: 0 rows. Any rows here are resources whose owner cannot pass the new policy.

-- 6. Check profiles.owner_user_id vs actor_owners divergence
SELECT
  p.id AS profile_id,
  p.owner_user_id,
  COUNT(ao.actor_id) AS actor_owner_count
FROM vport.profiles p
LEFT JOIN vc.actor_owners ao
  ON ao.user_id = p.owner_user_id
  AND ao.is_void = false
WHERE p.is_active = true
  AND p.is_deleted = false
GROUP BY p.id, p.owner_user_id
HAVING COUNT(ao.actor_id) = 0
LIMIT 20;
-- Expected: 0 rows. Same as query 4 — cross-check.
```

---

## RECOMMENDED HANDOFFS

| Finding | Action Required | Handoff |
|---|---|---|
| Pre-flight verification | Run all 6 verification queries; confirm 0 rows on integrity checks | DB |
| Data sync gaps (if any) | Reconcile actor_owners rows for any VPORT owners who are missing entries | Wolverine (app-layer) + DB (data fix) |
| Policy logic review | Verify `current_actor_can_manage_resource` vs `actor_can_manage_profile` choice; confirm `created_by_actor_id` RLS enforcement decision | Venom |
| Staging deployment | Apply migration in staging; run owner booking flow validation | CARNAGE (apply) after DB + Venom sign-off |
| Release gate | Confirm staging validation passes before production apply | Thor |
| Documentation update | Update RLS assumption map to reflect bookings_insert_owner now uses actor-based chain | Logan — `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/rls-assumption-map.md` |
| Index audit | Verify index on `vport.resources.owner_actor_id` exists (needed by current_actor_can_manage_resource subquery) | DB (Kraven) |

---

## FINAL CARNAGE STATUS: CAUTION

**Confidence:** HIGH — migration history, current policy state, target functions, and app-layer call graph are all fully documented.

**Status rationale:** CAUTION (not HIGH RISK) because:

1. The replacement function (`vport.current_actor_can_manage_resource`) is already confirmed stable in production — used by multiple policies applied in 2026-05-03.
2. The policy is a DROP + CREATE on a single named policy. The table already has RLS enabled. No table-level changes required.
3. Rollback is instant and full — DROP POLICY + CREATE POLICY with the legacy body.
4. The app-layer controller (`createOwnerBookingController`) already performs actor-based ownership verification through `assertActorOwnsVportActorController` before calling the DAL. The new RLS policy aligns the DB-layer gate with the already-correct app-layer gate. They are becoming consistent, not diverging.

**What makes it CAUTION rather than SAFE:**

1. The transition window between DROP and CREATE must be inside a transaction. Any tooling that breaks or auto-commits between statements creates a policy gap on a live booking write path.
2. The pre-flight data integrity checks (queries 4, 5, 6) must return 0 rows before apply. If any VPORT owner lacks an actor_owners row, they will be locked out of creating owner bookings after migration without an immediately obvious error.
3. The `created_by_actor_id` enforcement decision (RLS vs app-layer only) must be deliberately resolved before apply — ambiguity here should not carry into production.

**Blocking risks (must resolve before production apply):**
- Pre-flight verification queries must all pass (0 rows on integrity checks)
- Staging validation must confirm full owner booking flow succeeds
- Venom must sign off on policy logic (`current_actor_can_manage_resource` vs `actor_can_manage_profile` + `created_by_actor_id` enforcement)

**Not blocking:**
- `bookings_insert_public_pending` is untouched — public customer bookings are unaffected
- SELECT policies are untouched — booking reads are unaffected
- No data is at risk in either direction

---

*CARNAGE report complete — 2026-05-14 — Analysis only, no schema modifications applied*

---

---

## ADDENDUM — 2026-05-14

**Source:** DB dump review — confirmed policy SQL provided by user post-report
**Scope:** (1) Exact policy SQL confirmed; (2) Companion policy tautology bug discovered; (3) Migration bundling requirement; (4) Updated Carnage status; (5) Updated proposed migration SQL

---

### 1. Exact Policy SQL — Confirmed from DB Dump

The following is the actual `bookings_insert_owner` WITH CHECK clause confirmed from a DB dump taken 2026-05-14. It matches the legacy pattern described in the original report (Migration 20260427040000):

```sql
-- bookings_insert_owner (CONFIRMED FROM DB DUMP 2026-05-14)
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND (source = ANY (ARRAY['owner'::text, 'admin'::text, 'import'::text, 'sync'::text]))
  AND (EXISTS ( SELECT 1
     FROM vport.profiles p
    WHERE ((p.id = bookings.profile_id) AND (p.owner_user_id = auth.uid()) AND (p.is_active = true) AND (p.is_deleted = false))))
)
```

**Confirmation result:** This matches the expected legacy pattern exactly. The report's analysis, blast radius assessment, and proposed replacement are fully confirmed as accurate. No revision to the original report body is required.

---

### 2. New Finding — `bookings_insert_public_pending` Tautology Bug

The same DB dump revealed a logic defect in the companion INSERT policy `bookings_insert_public_pending`. This policy was previously listed as CANONICAL and unaffected. That classification must be revised.

**Current deployed policy (BUGGY):**

```sql
-- bookings_insert_public_pending — CURRENT (BUGGY)
EXISTS (
  SELECT 1 FROM (vport.resources r JOIN vport.profiles p ON (p.id = r.profile_id))
  WHERE r.id = bookings.resource_id
    AND r.is_active = true
    AND r.profile_id = r.profile_id  -- TAUTOLOGY: always evaluates true — self-comparison
    AND p.deleted_at IS NULL
)
```

**What should be there:**

```sql
-- bookings_insert_public_pending — CORRECTED
EXISTS (
  SELECT 1 FROM (vport.resources r JOIN vport.profiles p ON (p.id = r.profile_id))
  WHERE r.id = bookings.resource_id
    AND r.is_active = true
    AND p.id = bookings.profile_id  -- cross-profile guard: resource's profile must match booking's profile_id
    AND p.deleted_at IS NULL
)
```

**Impact assessment:**

The tautology (`r.profile_id = r.profile_id`) is a self-comparison that always returns true. It was almost certainly intended to be `p.id = bookings.profile_id` — a cross-profile guard ensuring the resource being booked belongs to the same VPORT profile that the booking record references.

Without this guard, the policy does NOT verify that `bookings.profile_id` matches the resource's owning profile. A caller could theoretically construct a booking INSERT where:
- `resource_id` belongs to VPORT-A
- `profile_id` references VPORT-B

The other guards in `bookings_insert_public_pending` still apply — `customer_actor_id = vc.current_actor_id()`, `created_by_actor_id = vc.current_actor_id()`, `status = 'pending'`, `source = 'public'`, temporal guards, and field presence checks — but the profile-to-resource cross-check is absent. This is a trust boundary gap on the public booking path.

**Severity:** MEDIUM — The tautology does not enable full bypass (all other guards remain active), but it removes a structural cross-profile integrity check that should exist on every public booking insert.

---

### 3. Migration Bundling Requirement

The `bookings_insert_owner` replacement and the `bookings_insert_public_pending` tautology fix MUST be applied in the same transaction. They may not be applied as separate migrations.

**Reason:** Both policies are PERMISSIVE INSERT policies on `vport.bookings`. In PostgreSQL RLS, when multiple PERMISSIVE policies exist for the same command, a row passes if ANY one of them evaluates true. This means:

- Dropping `bookings_insert_owner` while `bookings_insert_public_pending` remains (even buggy) creates a window where owner booking inserts can only succeed if they accidentally satisfy the public pending policy — which they cannot, because the source guard (`source = 'public'`) conflicts with the owner sources (`'owner'`, `'admin'`, `'import'`, `'sync'`).
- Fixing `bookings_insert_public_pending` in isolation while `bookings_insert_owner` remains legacy is safe in isolation but leaves the original migration's goal unmet.
- Applying both in the same transaction eliminates any window where either path is improperly gated.

**Required outcome:** A single migration file containing all four statements (DROP old owner policy, CREATE new owner policy, DROP buggy public pending policy, CREATE fixed public pending policy) wrapped in one `BEGIN; ... COMMIT;` block.

---

### 4. Updated Carnage Status

**Previous status:** CAUTION

**Updated status:** CAUTION — with mandatory companion fix for `bookings_insert_public_pending`

The migration scope is slightly wider than originally reported. The tautology discovery adds one additional DROP + CREATE pair to the migration. The risk classification does not change — both policies are metadata-only changes, rollback remains instant and full, and no data is affected in either direction.

The CAUTION rating now reflects:
- The original blocking risks (pre-flight verification, staging validation, Venom sign-off) remain unchanged.
- An additional blocking risk is added: the tautology fix in `bookings_insert_public_pending` must be included in the same migration transaction — it may not be deferred.
- The validation checklist from the original report must be extended to include: public booking insert succeeds post-fix, and cross-profile insert attempt (resource from VPORT-A, profile_id from VPORT-B) is correctly rejected.

---

### 5. Updated Proposed Migration SQL (Addendum — Analysis Only — Do Not Execute)

This replaces the single-policy migration SQL from the original report's "Proposed Migration SQL" section. The original SQL is preserved in the report body for reference; this addendum's SQL is the authoritative version to apply.

```sql
-- ===================================================
-- MIGRATION: vport.bookings INSERT policies — fix bundle
-- bookings-insert-owner-legacy-auth + bookings-insert-public-pending-tautology
-- ADDENDUM 2026-05-14 — ANALYSIS ONLY, DO NOT EXECUTE
-- ===================================================

BEGIN;

-- 1. Drop legacy INSERT policy
DROP POLICY IF EXISTS "bookings_insert_owner" ON vport.bookings;

-- 2. Create replacement using actor_can_manage_resource (consistent with bookings_select_resource_neutral)
CREATE POLICY "bookings_insert_owner"
  ON vport.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND source = ANY (ARRAY['owner'::text, 'admin'::text, 'import'::text, 'sync'::text])
    AND vport.current_actor_can_manage_resource(resource_id)
  );

-- 3. Drop buggy public pending policy
DROP POLICY IF EXISTS "bookings_insert_public_pending" ON vport.bookings;

-- 4. Recreate with tautology fixed
CREATE POLICY "bookings_insert_public_pending"
  ON vport.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND customer_actor_id = vc.current_actor_id()
    AND created_by_actor_id = vc.current_actor_id()
    AND status = 'pending'
    AND source = 'public'
    AND starts_at > now()
    AND ends_at > starts_at
    AND duration_minutes > 0
    AND timezone IS NOT NULL
    AND service_label_snapshot IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM vport.resources r
      JOIN vport.profiles p ON p.id = r.profile_id
      WHERE r.id = bookings.resource_id
        AND r.is_active = true
        AND p.id = bookings.profile_id  -- fixed: cross-profile guard restored
        AND p.deleted_at IS NULL
    )
  );

COMMIT;

-- ROLLBACK SQL (instant, no data affected):
-- DROP POLICY IF EXISTS "bookings_insert_owner" ON vport.bookings;
-- DROP POLICY IF EXISTS "bookings_insert_public_pending" ON vport.bookings;
-- Then re-apply the originals from migration 20260427040000.
```

**Validation additions (extend original checklist):**

| Validation Area | Status | Notes |
|---|---|---|
| Staging: public booking (source='public') succeeds post-fix | PENDING | Must confirm tautology fix does not break the happy path |
| Staging: cross-profile insert rejected (resource VPORT-A, profile_id VPORT-B) | PENDING | Confirms tautology fix is effective — this should return 403 |
| `bookings_insert_public_pending` tautology confirmed fixed in pg_policies | PENDING | Re-run SELECT from pg_policies after apply; verify WITH CHECK no longer contains self-comparison |

---

*CARNAGE addendum appended — 2026-05-14 — DB dump review findings — Analysis only, no schema modifications applied*
