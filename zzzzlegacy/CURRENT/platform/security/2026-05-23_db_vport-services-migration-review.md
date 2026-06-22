# DB Review — VPORT Services RLS Migration + Pre-flight Audit
**Date:** 2026-05-23  
**Reviewer:** DB (read-only)  
**Scope:** VCSM  
**Files reviewed:**
- `apps/VCSM/supabase/migrations/20260523220000_vport_services_rls_security_fixes.sql`
- `zNOTFORPRODUCTION/_ACTIVE/migrations/preflight_actor_can_manage_profile_legacy_branch.sql`

---

## Summary

| Item | Object | Severity | Blocks Deploy | Finding |
|---|---|---|---|---|
| 1 | `profiles_select_viewer` USING clause | **CRITICAL** | Yes | Calls `actor_can_view_profile` on same table — recursion risk / silent empty results for non-members |
| 2 | `services_select_viewer`, `service_addons_select_viewer` | **HIGH** | Yes (functional) | Uses `actor_can_view_profile` — documented to return false for non-members; breaks public service display |
| 3 | `service_addons`, `service_catalog` | **HIGH** | Yes (fresh deploy) | Missing `GRANT SELECT TO authenticated` — policies unreachable on fresh deploy |
| 4 | `service_catalog_select_active` | **MEDIUM** | No | `TO authenticated` blocks anon viewers of public profiles |
| 5 | `vport.services`, `vport.profiles` | **MEDIUM** | No (pre-existing) | GRANT SELECT gap not closed by this migration |
| 6 | Pre-flight Steps 1 + 2 | **MEDIUM** | No | LEFT JOIN duplicate row risk; use EXISTS subqueries |
| 7 | Conditional migration placeholder | **LOW** | No | SECURITY DEFINER status unknown; must read live function before applying |

**PERMISSIVE dual-SELECT logic:** ✅ Architecturally correct.  
**REVOKE on service_catalog:** ✅ Correct tool and order.  
**service_addons write policies:** ✅ Correct.  
**Pre-flight query intent:** ✅ Correct purpose and interpretation.

---

## DATABASE REVIEW ITEM 1 — CRITICAL

- **Object:** `vport.profiles — profiles_select_viewer`
- **Application Scope:** VCSM
- **Current behavior:** Policy USING calls `vport.actor_can_view_profile(vc.current_actor_id(), id)` on the `vport.profiles` table itself.
- **Problem:** `actor_can_view_profile` almost certainly reads from `vport.profiles` to check `is_active` and `is_deleted`. This creates either (a) infinite recursive policy evaluation if SECURITY INVOKER, crashing every profiles SELECT, or (b) silent empty results for non-team-member authenticated users if SECURITY DEFINER. Migration 20260503040334 explicitly documented that `actor_can_view_profile` "returns false for visitors who are not a team member" — the same breakage applies here for profile discovery.
- **Why it matters:** If recursion: hard crash at first query. If no recursion: every public VPORT profile page returns no profile rows for non-member viewers. Either breaks the entire VPORT platform.
- **Recommended improvement:** Replace USING expression with direct column predicate: `is_active = true AND is_deleted = false`. The profiles table owns these columns — no function call needed.
- **Risk if unchanged:** CRITICAL. Runtime failure or platform-wide profile lookup breakage.
- **Example SQL proposal (text only, do not run):**
```sql
DROP POLICY IF EXISTS profiles_select_viewer ON vport.profiles;
CREATE POLICY profiles_select_viewer ON vport.profiles
  FOR SELECT TO authenticated
  USING (
    is_active  = true
    AND is_deleted = false
  );
```

---

## DATABASE REVIEW ITEM 2 — HIGH

- **Object:** `vport.services — services_select_viewer`, `vport.service_addons — service_addons_select_viewer`
- **Application Scope:** VCSM
- **Current behavior:** Both viewer SELECT policies use `vport.actor_can_view_profile(vc.current_actor_id(), profile_id)` as the profile gate.
- **Problem:** Migration 20260503040334 explicitly documented and fixed this exact pattern for `menu_categories`: "The archive SELECT policy used `actor_can_view_profile(current_actor_id, ...)` which returns false for visitors who are not a team member of the profile, so the menu tab rendered empty even when the GRANT was present." The new migration reintroduces the same broken pattern. Standard authenticated citizens viewing any VPORT profile have no team membership and receive 0 service/addon rows.
- **Why it matters:** Public services panel renders empty for all non-owner users. Functional regression disguised as a security fix.
- **Recommended improvement:** Replace with the established inline EXISTS subquery pattern from 20260503040334.
- **Risk if unchanged:** HIGH. Services panel empty for all public viewers.
- **Example SQL proposal (text only, do not run):**
```sql
DROP POLICY IF EXISTS services_select_viewer ON vport.services;
CREATE POLICY services_select_viewer ON vport.services
  FOR SELECT TO authenticated
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1 FROM vport.profiles p
      WHERE  p.id         = services.profile_id
        AND  p.is_active  = true
        AND  p.is_deleted = false
    )
  );

DROP POLICY IF EXISTS service_addons_select_viewer ON vport.service_addons;
CREATE POLICY service_addons_select_viewer ON vport.service_addons
  FOR SELECT TO authenticated
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1 FROM vport.profiles p
      WHERE  p.id         = service_addons.profile_id
        AND  p.is_active  = true
        AND  p.is_deleted = false
    )
  );
```

---

## DATABASE REVIEW ITEM 3 — HIGH

- **Object:** `vport.service_addons`, `vport.service_catalog` — missing `GRANT SELECT`
- **Application Scope:** VCSM
- **Current behavior:** Migration adds RLS SELECT policies for both tables but does not issue `GRANT SELECT TO authenticated`. SELECT was granted by untracked archive migration 20260419150000 (not in tracked chain). Live DB: accessible. Fresh deploy: permission denied before RLS runs.
- **Why it matters:** Migration 20260503040334 established the pattern: always include `GRANT SELECT` explicitly in tracked migrations for tables whose SELECT originated in the untracked archive. The same root cause applies here.
- **Risk if unchanged:** HIGH on fresh deployments — both tables inaccessible. LOW on live DB.
- **Example SQL proposal (text only, do not run):**
```sql
GRANT SELECT ON vport.service_catalog TO authenticated;
GRANT SELECT ON vport.service_addons TO authenticated;
```

---

## DATABASE REVIEW ITEM 4 — MEDIUM

- **Object:** `vport.service_catalog — service_catalog_select_active` — `TO authenticated` only
- **Application Scope:** VCSM
- **Current behavior:** SELECT policy restricted to `authenticated` role.
- **Problem:** Catalog is public reference data. Anon visitors to public VPORT profile pages cannot read catalog rows. Contrast: `fuel_prices_select_public` uses `TO PUBLIC USING (true)`.
- **Risk if unchanged:** MEDIUM. Anon users see empty/fallback catalog data.
- **Example SQL proposal (text only, do not run):**
```sql
DROP POLICY IF EXISTS service_catalog_select_active ON vport.service_catalog;
CREATE POLICY service_catalog_select_active ON vport.service_catalog
  FOR SELECT TO PUBLIC USING (is_active = true);
```

---

## DATABASE REVIEW ITEM 5 — MEDIUM (pre-existing gap)

- **Object:** `vport.services`, `vport.profiles` — `GRANT SELECT` not tracked
- **Application Scope:** VCSM
- **Current behavior:** No tracked migration includes `GRANT SELECT ON vport.services TO authenticated` or `GRANT SELECT ON vport.profiles TO authenticated`. Covered by untracked 20260419150000.
- **Why it matters:** The new migration modifies SELECT policies on both tables — the right moment to backfill the grant.
- **Risk if unchanged:** MEDIUM on fresh deploy. Pre-existing but not addressed.
- **Example SQL proposal (text only, do not run):**
```sql
GRANT SELECT ON vport.services TO authenticated;
GRANT SELECT ON vport.profiles TO authenticated;
```

---

## DATABASE REVIEW ITEM 6 — MEDIUM

- **Object:** Pre-flight Steps 1 + 2 — LEFT JOIN duplicate row risk
- **Application Scope:** VCSM
- **Current behavior:** Step 2 COUNT uses `LEFT JOIN vport.profile_actor_access` and `LEFT JOIN vc.actor_owners`. If either table has duplicate rows for the same (profile_id, user_id), the COUNT overcounts stranded owners.
- **Why it matters:** Pre-flight determines whether it is safe to remove a security function branch. A false SAFE verdict from duplicate-row artifact could break valid owner access.
- **Recommended improvement:** Use NOT EXISTS subqueries instead of LEFT JOIN.
- **Risk if unchanged:** MEDIUM. Only a risk if data has duplicates, but the query must be defensive.
- **Example SQL proposal (text only, do not run):**
```sql
SELECT
  COUNT(*) AS stranded_owner_count,
  CASE
    WHEN COUNT(*) = 0
      THEN 'SAFE — owner_user_id branch can be removed'
    ELSE 'BLOCKED — ' || COUNT(*)::text ||
         ' profile(s) need canonical coverage before removal'
  END AS verdict
FROM vport.profiles p
WHERE
  p.owner_user_id IS NOT NULL
  AND p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM vport.profile_actor_access paa
    WHERE paa.profile_id = p.id AND paa.user_id = p.owner_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM vc.actor_owners ao
    WHERE ao.actor_id = p.actor_id AND ao.user_id = p.owner_user_id
  );
```

---

## DATABASE REVIEW ITEM 7 — LOW

- **Object:** Pre-flight conditional migration placeholder function body
- **Application Scope:** VCSM
- **Current behavior:** Placeholder marks `SECURITY INVOKER`. Live function security context is unknown.
- **Problem:** If live function is `SECURITY DEFINER`, replacing with `SECURITY INVOKER` alters behavior for all policies that call it — they would now read profile_actor_access and actor_owners under caller's RLS context, potentially breaking all managed-profile write operations.
- **Risk if unchanged:** LOW for pre-flight SQL itself. HIGH if placeholder is applied without reading live function first. The comments correctly gate this behind `\sf vport.actor_can_manage_profile`.
- **Example SQL proposal:** None — must read live function first.

---

## PERMISSIVE DUAL-SELECT LOGIC — CONFIRMED CORRECT

```
Policy A (viewer): USING (enabled=true AND <profile check>)
Policy B (owner):  USING (actor_can_manage_profile(...))

Anon caller:          Both TO authenticated → no access ✓
Non-owner, enabled:   A=PASS, B=FAIL → visible ✓
Non-owner, disabled:  A=FAIL, B=FAIL → hidden ✓  ← this is the DB-SVC-001 fix
Owner, disabled:      A=FAIL, B=PASS → visible ✓
Owner, enabled:       A=PASS, B=PASS → visible ✓

Logic is sound. Profile check in Policy A is the only broken element (Item 2).
```

---

## RECOMMENDED CORRECTED MIGRATION SECTIONS (text only — do not run)

```sql
-- SECTION 1 (services):
GRANT SELECT ON vport.services TO authenticated;
-- Replace services_select_viewer with inline EXISTS subquery (see Item 2)

-- SECTION 2 (service_catalog):
GRANT SELECT ON vport.service_catalog TO authenticated;
-- Change TO authenticated → TO PUBLIC on SELECT policy (see Item 4)

-- SECTION 3 (service_addons):
GRANT SELECT ON vport.service_addons TO authenticated;
-- Replace service_addons_select_viewer with inline EXISTS subquery (see Item 2)

-- SECTION 4 (profiles):
GRANT SELECT ON vport.profiles TO authenticated;
-- Replace profiles_select_viewer with direct column predicate (see Item 1)
```

---

*Report generated by DB command (read-only analysis). No database modifications were made.*
