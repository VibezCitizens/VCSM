# TICKET-PLATFORM-RLS-001 Review

**Date:** 2026-05-27  
**Reviewer:** VENOM  
**Application Scope:** VCSM  
**Schema:** platform  
**Table:** media_assets  
**Migration:** 20260527120000_platform_media_assets_rls_role_hardening.sql

---

## Current Policy Inventory

Live pg_policies snapshot (confirmed 2026-05-27):

| Policy | CMD | Role | Status |
|---|---|---|---|
| media_assets_learning_owner_insert | INSERT | {public} | CONVERT |
| media_assets_vc_owner_insert | INSERT | {public} | CONVERT |
| media_assets_learning_owner_select | SELECT | {public} | CONVERT |
| media_assets_vc_owner_select | SELECT | {public} | CONVERT |
| media_assets_learning_owner_update | UPDATE | {public} | CONVERT |
| media_assets_public_ready_read | SELECT | {public} | PRESERVE — intentionally public |
| actor owner can soft delete media asset | UPDATE | {authenticated} | CORRECT — no action |
| media_assets_vc_owner_update | — | — | ABSENT — already removed |

---

## Policies To Convert

### 1. media_assets_learning_owner_insert

**CMD:** INSERT  
**Current role:** {public}  
**Target role:** {authenticated}  
**Predicate (preserved verbatim):**
```sql
owner_source = 'learning'
AND EXISTS (
  SELECT 1 FROM learning.actor_owners owner
  WHERE actor_id = owner_actor_id
    AND user_id = auth.uid()
)
AND EXISTS (
  SELECT 1 FROM learning.actor_owners creator
  WHERE actor_id = created_by_actor_id
    AND user_id = auth.uid()
)
```
**Observation:** This predicate has no `COALESCE(is_void, false) = false` guard, unlike the vc INSERT and all SELECT/UPDATE variants. Predicate preserved exactly — this observation is out of scope for TICKET-PLATFORM-RLS-001 and logged as a future hardening note.

---

### 2. media_assets_vc_owner_insert

**CMD:** INSERT  
**Current role:** {public}  
**Target role:** {authenticated}  
**Predicate (preserved verbatim):**
```sql
owner_source = 'vc'
AND EXISTS (
  SELECT 1 FROM vc.actor_owners owner
  WHERE actor_id = owner_actor_id
    AND user_id = auth.uid()
    AND COALESCE(owner.is_void, false) = false
)
AND EXISTS (
  SELECT 1 FROM vc.actor_owners creator
  WHERE actor_id = created_by_actor_id
    AND user_id = auth.uid()
    AND COALESCE(creator.is_void, false) = false
)
```

---

### 3. media_assets_learning_owner_select

**CMD:** SELECT  
**Current role:** {public}  
**Target role:** {authenticated}  
**Predicate (preserved verbatim):**
```sql
owner_source = 'learning'
AND EXISTS (
  SELECT 1 FROM learning.actor_owners ao
  WHERE actor_id = owner_actor_id
    AND user_id = auth.uid()
    AND COALESCE(ao.is_void, false) = false
)
```

---

### 4. media_assets_vc_owner_select

**CMD:** SELECT  
**Current role:** {public}  
**Target role:** {authenticated}  
**Predicate (preserved verbatim):**
```sql
owner_source = 'vc'
AND EXISTS (
  SELECT 1 FROM vc.actor_owners ao
  WHERE actor_id = owner_actor_id
    AND user_id = auth.uid()
    AND COALESCE(ao.is_void, false) = false
)
```

---

### 5. media_assets_learning_owner_update

**CMD:** UPDATE  
**Current role:** {public}  
**Target role:** {authenticated}  
**USING + WITH CHECK (preserved verbatim, same predicate for both):**
```sql
owner_source = 'learning'
AND EXISTS (
  SELECT 1 FROM learning.actor_owners ao
  WHERE actor_id = owner_actor_id
    AND user_id = auth.uid()
    AND COALESCE(ao.is_void, false) = false
)
```

---

## Policies To Preserve

### media_assets_public_ready_read

**CMD:** SELECT  
**Current role:** {public}  
**Reason:** Intentionally public. Allows unauthenticated callers to read media assets that are `status = 'ready'`, `deleted_at IS NULL`, and `meta->>'is_public' = true`. This is required for public-facing media display (e.g., public menus, flyer previews, public portfolio thumbnails).

**Predicate:**
```sql
status = 'ready'
AND deleted_at IS NULL
AND COALESCE((meta->>'is_public')::boolean, false) = true
```

**This policy must not be modified by this migration.**

---

## Migration Plan

**File:** `apps/VCSM/supabase/migrations/20260527120000_platform_media_assets_rls_role_hardening.sql`

**Pattern:** DROP POLICY IF EXISTS + CREATE (idempotent, safe to re-run)

**Operations:** 5 policy replacements — role only, predicates verbatim.

**Untouched:** `media_assets_public_ready_read`, `actor owner can soft delete media asset`

```sql
-- 1. media_assets_learning_owner_insert
DROP POLICY IF EXISTS media_assets_learning_owner_insert ON platform.media_assets;
CREATE POLICY media_assets_learning_owner_insert
  ON platform.media_assets AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    owner_source = 'learning'
    AND EXISTS (SELECT 1 FROM learning.actor_owners owner WHERE actor_id = owner_actor_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM learning.actor_owners creator WHERE actor_id = created_by_actor_id AND user_id = auth.uid())
  );

-- 2. media_assets_vc_owner_insert
DROP POLICY IF EXISTS media_assets_vc_owner_insert ON platform.media_assets;
CREATE POLICY media_assets_vc_owner_insert
  ON platform.media_assets AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    owner_source = 'vc'
    AND EXISTS (SELECT 1 FROM vc.actor_owners owner WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(owner.is_void, false) = false)
    AND EXISTS (SELECT 1 FROM vc.actor_owners creator WHERE actor_id = created_by_actor_id AND user_id = auth.uid() AND COALESCE(creator.is_void, false) = false)
  );

-- 3. media_assets_learning_owner_select
DROP POLICY IF EXISTS media_assets_learning_owner_select ON platform.media_assets;
CREATE POLICY media_assets_learning_owner_select
  ON platform.media_assets AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    owner_source = 'learning'
    AND EXISTS (SELECT 1 FROM learning.actor_owners ao WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
  );

-- 4. media_assets_vc_owner_select
DROP POLICY IF EXISTS media_assets_vc_owner_select ON platform.media_assets;
CREATE POLICY media_assets_vc_owner_select
  ON platform.media_assets AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    owner_source = 'vc'
    AND EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
  );

-- 5. media_assets_learning_owner_update
DROP POLICY IF EXISTS media_assets_learning_owner_update ON platform.media_assets;
CREATE POLICY media_assets_learning_owner_update
  ON platform.media_assets AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    owner_source = 'learning'
    AND EXISTS (SELECT 1 FROM learning.actor_owners ao WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
  )
  WITH CHECK (
    owner_source = 'learning'
    AND EXISTS (SELECT 1 FROM learning.actor_owners ao WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
  );
```

---

## Verification SQL

Run after migration to confirm state:

```sql
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'platform'
  AND tablename  = 'media_assets'
ORDER BY cmd, policyname;
```

**Expected results:**

| policyname | cmd | roles |
|---|---|---|
| actor owner can soft delete media asset | UPDATE | {authenticated} |
| media_assets_learning_owner_insert | INSERT | {authenticated} |
| media_assets_learning_owner_select | SELECT | {authenticated} |
| media_assets_learning_owner_update | UPDATE | {authenticated} |
| media_assets_public_ready_read | SELECT | {public} |
| media_assets_vc_owner_insert | INSERT | {authenticated} |
| media_assets_vc_owner_select | SELECT | {authenticated} |

**Failure condition:** Any of the five converted policies still showing `{public}` in the `roles` column.

---

## Rollback SQL

```sql
-- Rollback: restore five policies to {public} role.
-- Do NOT run unless migration must be reverted.

DROP POLICY IF EXISTS media_assets_learning_owner_insert ON platform.media_assets;
CREATE POLICY media_assets_learning_owner_insert
  ON platform.media_assets AS PERMISSIVE FOR INSERT TO PUBLIC
  WITH CHECK (
    owner_source = 'learning'
    AND EXISTS (SELECT 1 FROM learning.actor_owners owner WHERE actor_id = owner_actor_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM learning.actor_owners creator WHERE actor_id = created_by_actor_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS media_assets_vc_owner_insert ON platform.media_assets;
CREATE POLICY media_assets_vc_owner_insert
  ON platform.media_assets AS PERMISSIVE FOR INSERT TO PUBLIC
  WITH CHECK (
    owner_source = 'vc'
    AND EXISTS (SELECT 1 FROM vc.actor_owners owner WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(owner.is_void, false) = false)
    AND EXISTS (SELECT 1 FROM vc.actor_owners creator WHERE actor_id = created_by_actor_id AND user_id = auth.uid() AND COALESCE(creator.is_void, false) = false)
  );

DROP POLICY IF EXISTS media_assets_learning_owner_select ON platform.media_assets;
CREATE POLICY media_assets_learning_owner_select
  ON platform.media_assets AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (
    owner_source = 'learning'
    AND EXISTS (SELECT 1 FROM learning.actor_owners ao WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
  );

DROP POLICY IF EXISTS media_assets_vc_owner_select ON platform.media_assets;
CREATE POLICY media_assets_vc_owner_select
  ON platform.media_assets AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (
    owner_source = 'vc'
    AND EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
  );

DROP POLICY IF EXISTS media_assets_learning_owner_update ON platform.media_assets;
CREATE POLICY media_assets_learning_owner_update
  ON platform.media_assets AS PERMISSIVE FOR UPDATE TO PUBLIC
  USING (
    owner_source = 'learning'
    AND EXISTS (SELECT 1 FROM learning.actor_owners ao WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
  )
  WITH CHECK (
    owner_source = 'learning'
    AND EXISTS (SELECT 1 FROM learning.actor_owners ao WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
  );
```

---

## Risk Analysis

### VENOM SECURITY FINDING — PLAT-RLS-001-A

**Location:** `platform.media_assets` — policies: `media_assets_vc_owner_insert`, `media_assets_vc_owner_select`, `media_assets_learning_owner_insert`, `media_assets_learning_owner_select`, `media_assets_learning_owner_update`  
**Application Scope:** VCSM  

**Current behavior:**  
Five authenticated-owner policies are assigned `TO PUBLIC`. PostgREST does not reject unauthenticated callers before policy evaluation. `auth.uid()` returns NULL for anon, so the `EXISTS(... user_id = auth.uid())` predicates prevent any anon access from succeeding. However, the policy body still executes under the anon role — SQL runs against `learning.actor_owners` and `vc.actor_owners` tables for every unauthenticated request that matches the policy's table and command.

**Risk:**  
Single-layer defense (auth.uid() NULL guard only). No PostgREST-layer pre-rejection. Any regression in the predicate (e.g., if `auth.uid()` semantics change, or a future policy edit accidentally removes the user_id clause) would silently elevate anon access to full table visibility.

**Severity:** MEDIUM  

**Exploitability:**  
LOW (auth.uid() NULL guard holds today)  

**Attack Preconditions:**
- Anon caller or unauthenticated Supabase client
- Direct REST call to `/rest/v1/media_assets` with INSERT, SELECT, or UPDATE
- Predicate regression required for actual data breach (not currently possible)

**Blast Radius:**
- Single actor's media assets (SELECT/UPDATE)
- Any actor on the platform (INSERT — if predicate regresses, any anon could INSERT rows claiming ownership of arbitrary actors)

**Trust Boundary:**  
Public Visitor → Authenticated Owner (boundary is enforced only inside policy body, not at PostgREST gate)

**Why it matters:**  
The SQL execution model for `{public}` policies means unauthenticated requests trigger joins against `vc.actor_owners` and `learning.actor_owners` for every denied request. This is unnecessary load, creates a wider attack surface for future predicate drift, and violates the established platform convention of using `{authenticated}` for owner-only operations.

**Recommended mitigation:**  
Convert all five policies to `TO authenticated`. This causes PostgREST to reject unauthenticated requests with HTTP 401 before any SQL executes. Predicates unchanged.

**Rationale:**  
Defense-in-depth. The same correction was applied to `vport.bookings` and `vport.profiles` policies in TICKET-0008. `media_assets_vc_owner_update` was already removed. `actor owner can soft delete media asset` is already `{authenticated}`. This migration aligns the remaining five policies with the platform's established pattern.

**Follow-up command:** DB (apply migration), Carnage (if schema diff review needed)

**CISSP Domain:**  
- Primary: Identity and Access Management  
- Secondary: Security Architecture and Engineering, Software Development Security

---

### Code Path Findings (Read-only — source code inspection)

**File:** [apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js](apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js)  
**Finding:** `insertMediaAssetDAL` performs no controller-level auth check before INSERT. `ownerActorId` and `createdByActorId` are caller-supplied parameters. RLS WITH CHECK is the sole gate. With `{authenticated}` role on the INSERT policies, PostgREST rejects unauthenticated callers before SQL. With `{public}`, the database evaluates the predicate and relies on `auth.uid()` to return NULL.

**File:** [apps/VCSM/src/features/media/model/mediaAsset.model.js](apps/VCSM/src/features/media/model/mediaAsset.model.js)  
**Finding:** `SCOPE_MAP` confirms VCSM app only emits `owner_source` values of `'vc'`, `'vport'`, and `'chat'` — never `'learning'`. The learning INSERT/SELECT/UPDATE policies are used by a different caller context (learning schema app). This means `media_assets_learning_owner_*` policies are not exercised by the VCSM `/learning` route through `insertMediaAssetDAL` — they target a separate actor_owners path.

**File:** [apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js](apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js)  
**Finding:** `softDeleteMediaAssetDAL` filters only by `.eq('id', assetId)` — no ownership filter at DAL layer. Correctly relies on the DB RLS policy `actor owner can soft delete media asset` (already `{authenticated}`, WITH CHECK restricts to `status = 'deleted' AND deleted_by_actor_id IS NOT NULL`). This is the established pattern — column-level state transition guard at DB, minimal controller.

---

### Hardening Note — learning INSERT is_void gap (OUT OF SCOPE for this ticket)

`media_assets_learning_owner_insert` WITH CHECK does not include `COALESCE(is_void, false) = false` on its `learning.actor_owners` lookup, unlike the equivalent `media_assets_vc_owner_insert` and all SELECT/UPDATE policies. This means a void learning actor could INSERT media assets. This is preserved exactly per ticket scope. Recommend a follow-up ticket to align.

---

## Final Expected State

After `20260527120000_platform_media_assets_rls_role_hardening.sql` is applied:

| Policy | CMD | Role |
|---|---|---|
| media_assets_learning_owner_insert | INSERT | **{authenticated}** |
| media_assets_vc_owner_insert | INSERT | **{authenticated}** |
| media_assets_learning_owner_select | SELECT | **{authenticated}** |
| media_assets_vc_owner_select | SELECT | **{authenticated}** |
| media_assets_learning_owner_update | UPDATE | **{authenticated}** |
| media_assets_public_ready_read | SELECT | {public} (unchanged) |
| actor owner can soft delete media asset | UPDATE | {authenticated} (unchanged) |

**Behavior change:**  
- Unauthenticated REST calls to INSERT/SELECT/UPDATE on `platform.media_assets` with owner-scoped intent are now rejected by PostgREST with HTTP 401 before SQL executes.  
- Authenticated callers: no behavior change. Policy predicates are identical.  
- Public reads of `status = 'ready'` media via `media_assets_public_ready_read` are unaffected.

**TICKET-PLATFORM-RLS-001 status after migration:** COMPLETE (pending verification SQL confirmation).

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | Role drift is a governance issue but finding classified below |
| Asset Security | 1 | Media asset row access scope covers data minimization and access control |
| Security Architecture and Engineering | 1 | Defense-in-depth gap — single-layer auth.uid() guard |
| Communication and Network Security | 1 | PostgREST anon pre-rejection gate missing for five policies |
| Identity and Access Management | 1 | Primary: {public} role allows unauthenticated policy evaluation |
| Security Assessment and Testing | 0 | No new test coverage gap identified — RLS correctness verified via pg_policies |
| Security Operations | 0 | No debug/audit trail concern on this path |
| Software Development Security | 1 | insertMediaAssetDAL has no app-layer auth guard; relies entirely on RLS |

**Uncovered domains:**  
- Security and Risk Management — not directly applicable at this scope  
- Security Assessment and Testing — existing live DB verification pattern sufficient  
- Security Operations — no audit/logging concern on this migration  

All uncovered domains are out of scope for this table-level RLS role hardening ticket.
