# DB Verification — VPORT Services RLS Migration + Pre-flight Re-Review (Live DB)
**Date:** 2026-05-23 18:45  
**Reviewer:** DB (read-only — live DB)  
**Scope:** VCSM  
**Data source:** Live DB `nkdrjlmbtqbywhcthppm.supabase.co` (psql direct connection confirmed)  
**Files reviewed:**
- `apps/VCSM/supabase/migrations/20260523220000_vport_services_rls_security_fixes.sql` (revised)
- `zNOTFORPRODUCTION/_ACTIVE/migrations/preflight_actor_can_manage_profile_legacy_branch.sql` (revised)

**Migration status:** NOT YET APPLIED. Last applied: `20260514000000_chat_inbox_entries_actor_badge_index`.
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced
**Linked Audits:**
  - ARCHITECT: `logan/marvel/architect/modules/vcsm.vport-services-dashboard-card.architecture.md`
  - VENOM: `CURRENT/features/dashboard/evidence/2026-05-23_venom_vport-services-dashboard-card.md`

---

## STEP 1 — SERVICE ROLE VERDICT ✅

### vportSchema Client Credential Analysis

```
File:    apps/VCSM/src/services/supabase/vportClient.js

SOURCE:
  import { supabase } from '@/services/supabase/supabaseClient'
  export const vport = supabase.schema('vport')
  export default vport
```

```
File:    apps/VCSM/src/services/supabase/supabaseClient.js

SOURCE:
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const client = createClient(url, anon, { auth: { persistSession: true, ... } });
```

**VERDICT: vportSchema is the SAME singleton client as the main supabase client.**
It calls `.schema('vport')` on an anon-key browser client. It is NOT a service role.

**Implications:**
- RLS is FULLY ACTIVE on all vport schema table queries from the app
- `auth.uid()` is correctly resolved from the user's JWT on every query
- No service-role bypass is in effect from app code
- All prior VENOM RLS ratings of "ASSUMED" are confirmed ACTIVE for SELECT/INSERT/UPDATE/DELETE
- No VENOM finding severity escalation is required on credential grounds

**Note on .env:** Root `.env` contains only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. No `SERVICE_ROLE_KEY` or `DATABASE_URL` direct connection found in any tracked app file. Service role is only used by server-side Edge Functions (where appropriate).

---

## STEP 2 — RLS STATUS MATRIX

| Table | Schema | RLS Tracked | RLS Forced | Policies Found | Status |
|---|---|---|---|---|---|
| `services` | `vport` | ✅ YES (20260523010000) | NO | 4 policies | ✅ CLEAN |
| `service_catalog` | `vport` | ❌ NOT IN TRACKED MIGRATIONS | UNKNOWN | GRANT only | ⚠️ UNVERIFIED |
| `service_addons` | `vport` | ❌ NOT IN TRACKED MIGRATIONS | UNKNOWN | GRANT only | ⚠️ UNVERIFIED |
| `profiles` | `vport` | ⚠️ PARTIAL — UPDATE only | NO | 1 tracked policy (UPDATE) | ⚠️ PARTIAL |
| `profile_categories` | `vport` | ❌ NOT IN TRACKED MIGRATIONS | UNKNOWN | None found | ⚠️ UNVERIFIED |
| `actors` | `vc` | ⚠️ UNTRACKED (assumed from archive) | UNKNOWN | Not in tracked migrations | ⚠️ UNVERIFIED |
| `actor_owners` | `vc` | ⚠️ UNTRACKED (assumed from archive) | UNKNOWN | Not in tracked migrations | ⚠️ UNVERIFIED |

**Gap pattern:** Same archive migration gap confirmed in prior DB audits (20260416140000, 20260419150000 untracked) also applies to these tables. Live DB may have correct RLS; fresh deployments would not.

---

## STEP 3 — ACTIVE POLICY AUDIT

### 3.1 vport.services — CONFIRMED CLEAN ✅

**Source:** Migration `20260523010000_backfill_tracked_rls_coverage.sql`

| Policy Name | Command | Role | Using Clause | With Check | Ownership Basis |
|---|---|---|---|---|---|
| `services_select_access` | SELECT | authenticated | `vport.actor_can_view_profile(vc.current_actor_id(), profile_id)` | — | actor_can_view_profile |
| `services_insert_managed` | INSERT | authenticated | — | `vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)` | actor_can_manage_profile |
| `services_update_managed` | UPDATE | authenticated | `vport.actor_can_manage_profile(...)` | `vport.actor_can_manage_profile(...)` | actor_can_manage_profile |
| `services_delete_managed` | DELETE | authenticated | `vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)` | — | actor_can_manage_profile |

**Write path is fully protected at DB layer.**
**Select policy does NOT filter by `enabled` column — see DB-SVC-001 below.**

---

### 3.2 vport.service_catalog — ⚠️ RLS NOT TRACKED

**Source:** `20260427060000_grant_vport_write_permissions.sql`
```sql
GRANT INSERT, UPDATE, DELETE ON vport.service_catalog TO authenticated;
```
- Table-level grants are present (INSERT/UPDATE/DELETE to authenticated)
- No `ALTER TABLE vport.service_catalog ENABLE ROW LEVEL SECURITY` found in any tracked migration
- No `CREATE POLICY` statements found for this table
- Live DB may have RLS from untracked archive migration — unverified

**Classification: DEPLOYMENT GAP RISK**
On a fresh deployment, `service_catalog` has write grants but no RLS. Any authenticated user could INSERT or UPDATE catalog rows.

---

### 3.3 vport.service_addons — ⚠️ RLS NOT TRACKED

**Source:** `20260427060000_grant_vport_write_permissions.sql`
```sql
GRANT INSERT, UPDATE, DELETE ON vport.service_addons TO authenticated;
```
- Same gap as `service_catalog`
- No tracked ENABLE RLS, no tracked CREATE POLICY

**Classification: DEPLOYMENT GAP RISK**

---

### 3.4 vport.profiles — ⚠️ PARTIAL RLS

**Confirmed tracked policy:**
```
profiles_update_by_actor_owner — UPDATE only (canonical)
```
Was accompanied by a duplicate `profiles_update_owner` which was dropped in `20260523190000_portfolio_card_p0_security.sql`.

**SELECT policy for vport.profiles: NOT FOUND IN ANY TRACKED MIGRATION**
The DAL `readVportServicesByActor.dal.js` and `readVportServiceAddonsByActor.dal.js` both query:
```sql
vport.profiles.select('id').eq('actor_id', actorId)
```
If `vport.profiles` has no SELECT RLS, any authenticated user can enumerate `profileId` from `actorId` freely via REST API.
If `vport.profiles` has RLS with `ENABLE ROW LEVEL SECURITY` but zero SELECT policies, the table is locked out.
Live DB status: unverified.

---

### 3.5 vport.profile_categories — ⚠️ RLS NOT TRACKED

Used in `readVportTypeByActorId.dal.js`:
```sql
vportSchema.from("profile_categories")
  .select("category_key")
  .eq("profile_id", actor.vport_id)
  .eq("is_primary", true)
  .maybeSingle()
```
No tracked ENABLE RLS found. If RLS is untracked on live DB, fresh deployments leave this table fully open (read + write) to authenticated role.
Profile categories (vport type / category_key) would be readable and writable by any authenticated user.

---

### 3.6 vc.actors — ⚠️ RLS UNKNOWN (likely from untracked archive)

Used in `readVportTypeByActorId.dal.js` via main `supabase` client:
```sql
supabase.schema("vc").from("actors").select("id,vport_id").eq("id", actorId).maybeSingle()
```
No `ALTER TABLE vc.actors ENABLE ROW LEVEL SECURITY` found in any tracked migration.
No `CREATE POLICY ... ON vc.actors` found in any tracked migration.
The `vc.current_actor_id()` SECURITY DEFINER function reads `vc.actors` directly (no RLS during function execution due to SECURITY DEFINER context).

**Live DB likely has RLS from untracked archive migrations.**
**Whether SELECT on vc.actors is gated (e.g., public read or owner-only) is unverified.**

---

### 3.7 vc.actor_owners — ⚠️ RLS UNKNOWN (likely from untracked archive)

Used inside `assertActorOwnsVportActorController` (via booking DAL):
```sql
readActorOwnerLinkByActorAndUserProfileDAL({ targetActorId, userProfileId })
```
Also used directly in `vc.current_actor_id()` (SECURITY DEFINER context — bypasses RLS).
No tracked ENABLE RLS or CREATE POLICY on `vc.actor_owners`.

`vc.actor_owners` contains user-to-actor ownership mappings — sensitive if enumerable.

---

## STEP 4 — OWNERSHIP FUNCTION AUDIT

### 4.1 vc.current_actor_id() — SECURITY DEFINER

**Confirmed:** SECURITY DEFINER (from `20260519120000_platform_vc_security_hardening.sql` search_path hardening reference)

```sql
CREATE OR REPLACE FUNCTION vc.current_actor_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'vc', 'platform', 'public', 'auth', 'pg_temp'
AS $$
  SELECT a.id FROM vc.actors a
  JOIN platform.user_app_accounts uaa ON uaa.id = a.user_app_account_id
  WHERE uaa.user_id = auth.uid()
    AND a.is_void = false
    AND a.is_deleted = false
  ORDER BY a.created_at ASC  -- deterministic: oldest actor
  LIMIT 1
$$;
```

**Security properties:**
- Returns the authenticated user's primary actor ID based on `auth.uid()`
- `auth.uid()` is resolved from the user's JWT — session-bound
- SECURITY DEFINER allows reading `vc.actors` and `platform.user_app_accounts` bypassing their RLS
- Returns only non-void, non-deleted actors
- `SET search_path` prevents search_path injection (CVE-2018-1058 hardened)
- Deterministic: always returns the oldest actor for multi-actor users

**Risk:** If a user has no `user_app_accounts` row, `current_actor_id()` returns NULL → all `actor_can_manage_profile` checks fail closed. This is the correct secure default.

### 4.2 vport.actor_can_view_profile — Based on active + non-deleted profiles

From migration comments and policy patterns:
```
actor_can_view_profile: is_active = true AND is_deleted = false profiles are publicly readable
```
Any authenticated actor can pass this check for any active, non-deleted VPORT profile.
This means any authenticated user can SELECT all rows in `vport.services` for any active VPORT.

### 4.3 vport.actor_can_manage_profile — Routes through owner_user_id AND profile_actor_access

From migration comments (`20260523010000_backfill_tracked_rls_coverage.sql`):
```
actor_can_manage_profile (vport.*, which routes through profile_actor_access
→ actor_owners as its canonical branch)
```

**Two branches:**
1. `profiles.owner_user_id` path (legacy, still present in the function)
2. `profile_actor_access → actor_owners` path (canonical)

**Risk:** The `owner_user_id` legacy branch in `actor_can_manage_profile` creates the same stale-ownership risk identified in the vport full schema audit (DB-RLS-01 for content_pages). If VPORT ownership transfers via actor_owners but `profiles.owner_user_id` is not updated, the former owner retains WRITE access through the legacy branch of this function. This affects ALL tables using `actor_can_manage_profile` including `vport.services`.

---

## STEP 5 — SECURITY DEFINER MATRIX

| Function | Schema | SECURITY DEFINER | search_path Hardened | Auth Guard | Risk |
|---|---|---|---|---|---|
| `vc.current_actor_id()` | vc | ✅ YES | ✅ YES (20260519120000) | `auth.uid()` implicitly | LOW — reads actor from JWT; no write |
| `vc.mark_read()` | vc | ✅ YES (retained) | ✅ YES | `vc.is_actor_owner()` guard added | LOW — guarded; pending full RLS pass |
| `vc.save_friend_ranks()` | vc | ❌ REMOVED (20260519120000) | N/A | `vc.is_actor_owner()` guard + table RLS | RESOLVED |
| `platform.provision_vcsm_identity()` | platform | ❌ REMOVED (20260518050000) | N/A | GUARD 1+2+3 present; now runs as caller | RESOLVED |
| `vport.add_profile_actor_access()` | vport | ✅ YES | ✅ YES (via _a hardening) | calls actor_can_manage_profile internally | LOW — guarded |
| `vport.create_profile_greenfield()` | vport | ✅ YES | ✅ YES (via _a hardening) | creates profile for authenticated user | LOW — creation only |
| `vport.create_service_for_vport_actor()` | vport | UNKNOWN | ✅ search_path in _a hardening list | Unknown guard | MEDIUM — creates services; review needed |

---

## STEP 6 — DATABASE REVIEW ITEMS

---

```
DATABASE REVIEW ITEM
- Object:             vport.services — SELECT policy does not gate disabled services
- Application Scope:  VCSM
- Current behavior:
  Policy services_select_access:
    FOR SELECT TO authenticated
    USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id))

  actor_can_view_profile resolves to TRUE for any active, non-deleted VPORT profile.
  This policy grants SELECT on ALL rows in vport.services (including enabled=false rows)
  to any authenticated user who can view the profile.

  The `enabled` filter is applied ONLY at the app/DAL layer:
    readVportServicesByActor: .eq("enabled", true) when includeDisabled=false
    readVportServicesByActor: no .eq("enabled") when includeDisabled=true (owner mode)

  Direct REST API query: GET /rest/v1/services?profile_id=eq.<profileId>
  → Returns ALL rows including disabled=false, with zero RLS filtering on enabled column

- Problem:
  The disabled services list is owner-private configuration data. A VPORT owner
  intentionally disables services to hide them from the public catalog. The expectation
  is that non-owners should never see disabled services.

  At the DB layer, this expectation is NOT enforced. Any authenticated user who
  knows a VPORT's profile_id can query vport.services via the Supabase REST API
  and receive all rows including disabled ones. This bypasses the app-layer filter
  entirely.

  This is a DIRECT ESCALATION of VENOM finding V-SVC-001. The concern is not only
  about the asOwner flag in the controller — it's that disabled services are
  fully accessible at the DB layer to any authenticated viewer.

- Why it matters:
  Disabled services reveal the VPORT owner's unpublished or unavailable service
  configuration — what they sell but have turned off, what categories they're not
  ready to offer, what services they may be licensed but not advertising. This is
  confidential business information.

- Recommended improvement:
  Option A (preferred — split SELECT policies):
    -- Public: only enabled services on active profiles
    CREATE POLICY services_select_public ON vport.services
      FOR SELECT TO authenticated
      USING (
        enabled = true
        AND vport.actor_can_view_profile(vc.current_actor_id(), profile_id)
      );

    -- Owner: all services including disabled
    CREATE POLICY services_select_owner ON vport.services
      FOR SELECT TO authenticated
      USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

  Option B (simpler but broader):
    -- Drop services_select_access
    -- Create single policy with OR:
    CREATE POLICY services_select_access ON vport.services
      FOR SELECT TO authenticated
      USING (
        (enabled = true AND vport.actor_can_view_profile(vc.current_actor_id(), profile_id))
        OR
        vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
      );

  Option A is preferred as it avoids the PERMISSIVE OR ambiguity.

- Rationale:
  DB-layer enforcement is the only reliable protection against direct REST API access.
  App-layer filters are bypassed by any caller with a valid JWT and knowledge of the profile_id.

- Risk if unchanged:
  HIGH — Disabled services are a business-confidential configuration. Any authenticated
  Citizen can enumerate the full (including hidden) service catalog of any VPORT.

- Example SQL proposal (text only, do not run):
  See Option A above.

- Follow-up: Carnage (migration), Wolverine (deploy)
```

---

```
DATABASE REVIEW ITEM
- Object:             vport.service_catalog — RLS not tracked in migrations
- Application Scope:  VCSM
- Current behavior:
  Table has GRANT INSERT, UPDATE, DELETE to authenticated (from 20260427060000).
  No ENABLE ROW LEVEL SECURITY found in any tracked migration.
  No CREATE POLICY found for this table in tracked migrations.
  Live DB may have RLS from untracked archive migration (20260416140000 / 20260419150000).

- Problem:
  On a fresh deployment or DB reset, vport.service_catalog has INSERT/UPDATE/DELETE
  grants but no row-level policies. Any authenticated user can modify the global
  service catalog used for ALL vport types.
  The service catalog is the master list of available services per vport type.
  Unauthorized modifications could corrupt ALL vport service presentations platform-wide.

- Why it matters:
  service_catalog is a platform-wide reference table. Corruption of this table
  would cause incorrect service catalogs to be shown to all VPORTs and viewers
  on fresh deployments.

- Recommended improvement (text only, do not run):
  -- Enable RLS
  ALTER TABLE vport.service_catalog ENABLE ROW LEVEL SECURITY;
  FORCE ROW LEVEL SECURITY on vport.service_catalog (for service_role protection);

  -- Public read: any authenticated user can read the service catalog
  CREATE POLICY service_catalog_select_public ON vport.service_catalog
    FOR SELECT TO authenticated
    USING (is_active = true);

  -- Writes: restricted to platform admin / service role only
  -- (No app-layer writes should be permitted from browser clients)
  -- No INSERT/UPDATE/DELETE policies for authenticated role
  -- Revoke the write grants if browser writes are never needed:
  -- REVOKE INSERT, UPDATE, DELETE ON vport.service_catalog FROM authenticated;

- Rationale:
  Reference/catalog tables should be read-only from browser clients.
  No application code currently writes to service_catalog from the browser.
  Write access should be service-role only (migrations only).

- Risk if unchanged:
  HIGH — Any authenticated user can corrupt the global service catalog on fresh deploys.

- Follow-up: Carnage (migration to backfill RLS tracking)
```

---

```
DATABASE REVIEW ITEM
- Object:             vport.service_addons — RLS not tracked in migrations
- Application Scope:  VCSM
- Current behavior:
  Same gap as vport.service_catalog. GRANT INSERT/UPDATE/DELETE present.
  No ENABLE ROW LEVEL SECURITY tracked. No policies tracked.
  service_addons are per-profile add-ons (specific to individual VPORT actors).

- Problem:
  Without tracked RLS, fresh deployments leave service_addons unprotected.
  Any authenticated user could read, insert, update, or delete add-on rows
  for any VPORT profile.
  service_addons affects the booking and services UX for all vport types.

- Why it matters:
  Unlike service_catalog (platform-wide), service_addons are per-profile.
  Without RLS, cross-actor write is possible on fresh deployment.

- Recommended improvement (text only, do not run):
  ALTER TABLE vport.service_addons ENABLE ROW LEVEL SECURITY;

  -- Public read: enabled add-ons on active profiles
  CREATE POLICY service_addons_select_public ON vport.service_addons
    FOR SELECT TO authenticated
    USING (
      enabled = true
      AND vport.actor_can_view_profile(vc.current_actor_id(), profile_id)
    );

  -- Owner read: all add-ons including disabled
  CREATE POLICY service_addons_select_owner ON vport.service_addons
    FOR SELECT TO authenticated
    USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

  -- Writes: owner only
  CREATE POLICY service_addons_insert_managed ON vport.service_addons
    FOR INSERT TO authenticated
    WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

  CREATE POLICY service_addons_update_managed ON vport.service_addons
    FOR UPDATE TO authenticated
    USING      (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
    WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

  CREATE POLICY service_addons_delete_managed ON vport.service_addons
    FOR DELETE TO authenticated
    USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

- Risk if unchanged:
  HIGH — Per-actor add-on data unprotected at DB layer on fresh deployments.

- Follow-up: Carnage (bundle with services catalog RLS backfill migration)
```

---

```
DATABASE REVIEW ITEM
- Object:             vport.profiles — SELECT policy not tracked
- Application Scope:  VCSM
- Current behavior:
  profiles_update_by_actor_owner policy is tracked (UPDATE).
  No SELECT policy found in any tracked migration for vport.profiles.
  DAL queries: .from("profiles").select("id").eq("actor_id", actorId)
  (used by 3 resolveProfileId() calls in service DALs)

- Problem:
  If vport.profiles has RLS enabled with no SELECT policy, the table is locked
  out — all resolveProfileId() calls would fail silently (return null).
  If vport.profiles has no RLS at all, any authenticated user can enumerate
  profileId → actorId mappings across all VPORT profiles.

  The live DB has a SELECT grant from 20260430600000 (grant_vport_profile_public_details_select)
  but the RLS SELECT policy is untracked.

- Why it matters:
  vport.profiles contains VPORT business profile data including owner_user_id,
  is_active, is_deleted, and profile metadata. Without a tracked SELECT RLS,
  fresh deployments are either locked out (zero policy + RLS) or fully open.

- Recommended improvement (text only, do not run):
  Verify live DB SELECT policy on vport.profiles, then backfill to tracked migrations:

  -- Option: public read for active, non-deleted profiles
  CREATE POLICY profiles_select_public ON vport.profiles
    FOR SELECT TO authenticated
    USING (is_active = true AND is_deleted = false);

  -- Owner: all profiles including inactive (for owner dashboard)
  CREATE POLICY profiles_select_owner ON vport.profiles
    FOR SELECT TO authenticated
    USING (vport.actor_can_manage_profile(vc.current_actor_id(), id));

- Risk if unchanged:
  MEDIUM — profileId enumeration possible if no RLS on profiles SELECT.
  Deployment gap: fresh deploys may be locked out of all profile reads.

- Follow-up: Carnage (SELECT policy backfill)
```

---

```
DATABASE REVIEW ITEM
- Object:             actor_can_manage_profile — owner_user_id legacy branch
- Application Scope:  VCSM
- Current behavior:
  actor_can_manage_profile routes through BOTH:
    1. profiles.owner_user_id = auth.uid()  (legacy branch)
    2. profile_actor_access → actor_owners  (canonical branch)

  Because PostgreSQL evaluates EITHER branch as sufficient (OR logic within
  the function), a user whose auth.uid() matches profiles.owner_user_id
  has WRITE access to all actor_can_manage_profile-protected tables,
  even if actor_owners no longer reflects them as the canonical owner.

- Problem:
  VPORT ownership transfers update actor_owners but may not update
  profiles.owner_user_id. If this divergence exists, former VPORT owners
  retain write access to vport.services (INSERT/UPDATE/DELETE) via the
  legacy branch. This affects ALL tables protected by actor_can_manage_profile:
    vport.services, vport.service_addons (if added), vport.rates,
    vport.menu_categories, vport.content_pages, vport.portfolio_items,
    vport.portfolio_media, vport.locksmith_service_details, and others.

- Why it matters:
  A transferred VPORT's previous owner could modify the new owner's
  service catalog, menu, portfolio, and content after ownership transfer.

- Recommended improvement (text only, do not run):
  Remove the owner_user_id legacy branch from vport.actor_can_manage_profile:

  CREATE OR REPLACE FUNCTION vport.actor_can_manage_profile(p_actor_id uuid, p_profile_id uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = 'vport', 'vc', 'public', 'pg_temp'
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM vport.profile_actor_access paa
      JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
      WHERE paa.profile_id = p_profile_id
        AND ao.user_id = auth.uid()
        AND paa.is_active = true
        AND NOT COALESCE(ao.is_void, false)
    )
  $$;

  Pre-migration: verify all VPORT owners have profile_actor_access rows before removing
  the owner_user_id branch. This is the same pre-flight required for the content_pages
  legacy policy cleanup (DB-RLS-01 in the full schema audit).

- Risk if unchanged:
  HIGH — Former VPORT owners retain write access to all managed-profile tables
  if profiles.owner_user_id was not updated during ownership transfer.

- Follow-up: Carnage (function body update), DB (pre-flight ownership sync check)
```

---

```
DATABASE REVIEW ITEM
- Object:             vport.service_catalog — write grants should be revoked from authenticated
- Application Scope:  VCSM
- Current behavior:
  20260427060000 grants:
    GRANT INSERT, UPDATE, DELETE ON vport.service_catalog TO authenticated;
  No app code performs browser-side writes to service_catalog.
  Service catalog is a platform reference table populated by migrations only.

- Problem:
  Browser-accessible write grants on a platform reference table are an
  unnecessary attack surface. Even with RLS, the grants create a
  permission that should not exist.

- Why it matters:
  Principle of least privilege: if no app code writes to service_catalog
  from the browser, the authenticated role should not have those grants.

- Recommended improvement (text only, do not run):
  REVOKE INSERT, UPDATE, DELETE ON vport.service_catalog FROM authenticated;
  -- Service catalog modifications are migrations-only (service_role).

- Risk if unchanged:
  LOW — No functional impact today; reduces attack surface if RLS is ever
  misconfigured.

- Follow-up: Verify no app code writes to service_catalog, then Carnage (revoke migration)
```

---

## STEP 7 — RECLASSIFICATION OF VENOM FINDINGS

Based on DB verification, the following VENOM findings require severity updates:

### V-SVC-001 — asOwner flag — SEVERITY CONFIRMED HIGH + NEW DIMENSION IDENTIFIED

**DB layer verdict:**
The RLS SELECT policy `services_select_access` allows any authenticated user to read ALL services rows (including disabled) for any active VPORT. The `enabled` column is not gated at DB layer.

**Reclassification:**
V-SVC-001 remains HIGH. A new finding `DB-SVC-001` (above) is identified as HIGH:
"Disabled services are fully readable by any authenticated user at DB layer."

The `asOwner` flag concern in V-SVC-001 is now SECONDARY to the DB-layer gap. Even without manipulating the `asOwner` flag, any authenticated user can query all services (including disabled) directly via REST API.

### V-SVC-003 — listVportServicesForProfile — CONFIRMED HIGH

The shadow controller can read all services including disabled via `includeDisabled=true` and there is no RLS-layer protection for disabled services. Confirmed standalone risk.

### V-SVC-004 — Triple profileId resolution — CONFIRMED, NEW DIMENSION

If `vport.profiles` SELECT policy is not tracked and the live DB has an open SELECT, the triple `resolveProfileId()` calls are also an enumeration oracle for profileId from any actorId. Severity confirmed LOW but risk is broader than originally assessed.

### RLS ratings UPDATE (from VENOM report):

| Finding | Old RLS Dependency | New RLS Dependency |
|---|---|---|
| V-SVC-001 (asOwner read) | ASSUMED | CONFIRMED ACTIVE but insufficient — enabled not gated |
| V-SVC-003 (shadow controller) | ASSUMED | CONFIRMED ACTIVE but insufficient — enabled not gated |
| V-SVC-004 (profileId resolution) | UNVERIFIED | UNVERIFIED — profiles SELECT policy not tracked |
| Write path (upsert) | ASSUMED | CONFIRMED ACTIVE and CORRECT |

---

## STEP 8 — THOR STATUS FOR SERVICES CARD

### Release Readiness Assessment

| Area | Status | Finding | Action Required |
|---|---|---|---|
| Write path RLS | ✅ PASS | `actor_can_manage_profile` enforced at DB layer for INSERT/UPDATE/DELETE | None — verified |
| Read path RLS (enabled gate) | ❌ FAIL | `services_select_access` does not filter `enabled` at DB layer | DB-SVC-001 migration required |
| service_catalog RLS | ⚠️ UNVERIFIED | No tracked RLS for service_catalog; write grants present | Carnage backfill migration |
| service_addons RLS | ⚠️ UNVERIFIED | No tracked RLS for service_addons | Carnage backfill migration |
| vportSchema credentials | ✅ PASS | Confirmed anon key — RLS active | None |
| SECURITY DEFINER functions | ✅ PASS | current_actor_id hardened; search_path set | None (monitoring) |
| actor_can_manage_profile legacy branch | ⚠️ RISK | owner_user_id legacy branch in function = stale ownership risk | Pre-flight check + Carnage |

### THOR Verdict

**DO NOT RELEASE** the services dashboard card write path for VPORT transfers until `actor_can_manage_profile` legacy `owner_user_id` branch is addressed.

**RELEASE CONDITIONAL** for all other paths: The services card is functional and safe for normal owner usage. The DB-SVC-001 disabled-services exposure is a hardening gap, not a P0 blocker for the read path (app layer correctly filters `enabled=true` for non-owners; REST API bypass requires direct querying).

### Release Gates Summary

| Gate | Severity | P Priority | Status |
|---|---|---|---|
| DB-SVC-001: Add `enabled=true` to services_select_access policy | HIGH | P1 | ❌ OPEN |
| Backfill RLS tracking for service_catalog | HIGH | P1 | ❌ OPEN |
| Backfill RLS tracking for service_addons | HIGH | P1 | ❌ OPEN |
| actor_can_manage_profile owner_user_id legacy branch cleanup | HIGH | P1 | ❌ OPEN (pre-flight required) |
| Backfill SELECT policy for vport.profiles | MEDIUM | P2 | ❌ OPEN |
| V-SVC-001: Add callerActorId to getVportServicesController | HIGH | P0 | ❌ OPEN (app layer) |
| V-SVC-003: Delete listVportServicesForProfile.controller.js | HIGH | P1 | ❌ OPEN (app layer) |

---

*This report is read-only analysis. All SQL proposals are text only and must not be executed automatically. All structural fixes require Carnage migration planning and THOR release gating.*

---

---

# PART 2 — Live DB Re-Verification of Revised Migration (2026-05-23 18:45)

**Trigger:** User requested DB command re-review of revised `20260523220000_vport_services_rls_security_fixes.sql` after DB review corrections were applied.  
**Data source:** psql direct — `db.nkdrjlmbtqbywhcthppm.supabase.co:5432`  
**Migration status:** NOT yet applied. Last applied: `20260514000000`

---

## Live DB State — RLS Enabled

All four target tables: `relrowsecurity = true`. ✅

## Live DB State — GRANT SELECT

| Table | anon | authenticated |
|---|---|---|
| `vport.services` | ❌ not granted | ✅ granted |
| `vport.service_catalog` | ✅ granted | ✅ granted |
| `vport.service_addons` | ✅ granted | ✅ granted |
| `vport.profiles` | ✅ granted | ✅ granted |

`vport.services` has no anon SELECT — services require authentication to browse. Noted; consistent with product intent.

## Live DB State — GRANT INSERT/UPDATE/DELETE (authenticated)

`service_catalog`: no write grants. Migration REVOKE is a no-op — already clean. ✅  
`service_addons`: INSERT/UPDATE/DELETE granted. Migration write policies apply. ✅

---

## Summary

| # | Object | Severity | Finding |
|---|---|---|---|
| 1 | `service_catalog_select_public` (TO public, USING true) | **HIGH** | Residual live policy not dropped by migration — negates is_active filter via PERMISSIVE OR |
| 2 | `service_addons_select` (TO public, actor_can_view_profile) | **MEDIUM** | Archive SELECT policy not dropped — parallel path without enabled=true for authenticated viewers |
| 3 | `service_addons_update/delete` TO public | **LOW** | Duplicate policies for public role — same ownership check, safe but messy |
| 4 | Pre-flight `paa.user_id` column error | **CRITICAL** | `profile_actor_access` has no `user_id` column — pre-flight Steps 1 and 2 error immediately |
| 5 | `actor_can_manage_profile` live definition | **INFO** | Confirmed SECURITY DEFINER; two-arg form ignores p_actor_id, delegates to single-arg using auth.uid() |
| 6 | `actor_can_view_profile` live definition | **INFO** | Confirmed SECURITY DEFINER; condition 1 returns true for any active, non-deleted profile — no recursion risk |
| 7 | Pre-flight conditional migration placeholder | **MEDIUM** | Must use SECURITY DEFINER + auth.uid() directly; NOT the SECURITY INVOKER + p_actor_id join shown |

**Revised migration core logic:** ✅ Architecturally correct.  
**services_select_viewer / service_addons_select_viewer:** ✅ EXISTS subquery is correct — better than actor_can_view_profile even though function currently works.  
**profiles_select_viewer:** ✅ Direct column predicate eliminates function call overhead and future breakage risk.  
**service_catalog TO PUBLIC:** ✅ Correct.  
**PERMISSIVE dual-SELECT logic:** ✅ Sound.

---

## DB REVIEW ITEM A — HIGH (NEW — live DB only)

- **Object:** `vport.service_catalog — service_catalog_select_public` (live archive policy)
- **Live query confirms:** `policyname = 'service_catalog_select_public', roles = {public}, qual = true`
- **Problem:** PERMISSIVE policies combine with OR. `service_catalog_select_public` has `USING (true)` — every catalog row passes for every role. Migration creates `service_catalog_select_active` (TO PUBLIC, `is_active = true`) but does NOT drop `service_catalog_select_public`. After migration, both coexist. PERMISSIVE OR means any row passes either policy — the `is_active = true` filter is completely dead.
- **Why it matters:** Migration's stated goal: "restricted to active rows only (is_active=false are retired/stale catalog entries)." That goal is unachievable with `service_catalog_select_public` (USING true) present.
- **Risk if unchanged:** HIGH. All catalog rows remain visible after migration — the security fix is defeated.
- **Required migration addition (text only, do not run):**
```sql
-- In Section 2, add BEFORE the existing DROP POLICY IF EXISTS service_catalog_select_active:
DROP POLICY IF EXISTS service_catalog_select_public ON vport.service_catalog;
```

---

## DB REVIEW ITEM B — MEDIUM (NEW — live DB only)

- **Object:** `vport.service_addons — service_addons_select` (TO public, actor_can_view_profile)
- **Live query confirms:** `policyname = 'service_addons_select', roles = {public}, qual = vport.actor_can_view_profile(vc.current_actor_id(), profile_id)`
- **Problem:** This archive policy has no `enabled = true` filter. After migration, `service_addons_select_viewer` (TO authenticated, enabled=true, EXISTS) is the correct viewer path. But `service_addons_select` (TO public = applies to authenticated too) remains. For authenticated viewers whose `actor_can_view_profile` returns true (any active profile), PERMISSIVE OR means `service_addons_select` passes — they see ALL add-ons including disabled ones, bypassing the new enabled=true restriction.
- **Why it matters:** The DB-SVC-001 fix for service_addons (enabled=true filter) is partially defeated by this residual policy for authenticated viewers.
- **Risk if unchanged:** MEDIUM. Authenticated viewers of active profiles see all add-ons (enabled + disabled) via the archive path.
- **Required migration addition (text only, do not run):**
```sql
-- In Section 3 DROP block, add:
DROP POLICY IF EXISTS service_addons_select ON vport.service_addons;
```

---

## DB REVIEW ITEM C — LOW (NEW — live DB only)

- **Object:** `vport.service_addons — service_addons_update`, `service_addons_delete` (TO public)
- **Live query confirms:** Both use `actor_can_manage_profile` in USING (and WITH CHECK for update). Same ownership check as managed versions.
- **Problem:** Redundant policies coexist with `service_addons_update_managed` and `service_addons_delete_managed`. No security bypass — anon has no UPDATE/DELETE grants; authenticated users see same check in both. Cosmetic/maintainability issue.
- **Risk if unchanged:** LOW. No bypass. Policy audit noise.
- **Recommended cleanup (text only, do not run):**
```sql
DROP POLICY IF EXISTS service_addons_update ON vport.service_addons;
DROP POLICY IF EXISTS service_addons_delete ON vport.service_addons;
```

---

## DB REVIEW ITEM D — CRITICAL (pre-flight bug)

- **Object:** Pre-flight Steps 1 and 2 — `paa.user_id` column does not exist
- **Live schema confirms:** `vport.profile_actor_access` columns: `profile_id, actor_id, role, status, is_primary, created_at, updated_at`. NO `user_id` column.
- **Problem:** Both Step 1 and Step 2 contain `WHERE paa.profile_id = p.id AND paa.user_id = p.owner_user_id`. This column does not exist. Running either step produces:
  ```
  ERROR: column paa.user_id does not exist
  ```
- **Corrected join path:** `profile_actor_access.actor_id → vc.actor_owners.actor_id → vc.actor_owners.user_id`
- **Corrected Step 2 run against live DB:** Returns `0 / SAFE — owner_user_id branch can be removed` ✅
- **Risk if unchanged:** CRITICAL for pre-flight usability — the safety gate errors before producing a verdict.
- **Corrected query form (text only, do not run):**
```sql
-- Replace: paa.user_id = p.owner_user_id
-- With:
EXISTS (
  SELECT 1 FROM vport.profile_actor_access paa
  JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
  WHERE paa.profile_id = p.id
    AND ao.user_id     = p.owner_user_id
    AND paa.status     = 'active'
    AND COALESCE(ao.is_void, false) = false
)
-- And separately for actor_owners direct:
EXISTS (
  SELECT 1 FROM vc.actor_owners ao
  WHERE ao.actor_id = p.actor_id
    AND ao.user_id  = p.owner_user_id
    AND COALESCE(ao.is_void, false) = false
)
```

---

## DB REVIEW ITEM E — INFO (actor_can_manage_profile live definition)

- **Live function confirmed (two overloads):**

  **Single-arg** `actor_can_manage_profile(p_profile_id uuid)` — SECURITY DEFINER, `SET search_path TO 'vport', 'vc', 'public'`:
  ```sql
  SELECT
    EXISTS (SELECT 1 FROM vport.profiles WHERE id = p_profile_id AND owner_user_id = auth.uid() AND is_deleted = false)
    OR
    EXISTS (
      SELECT 1 FROM vport.profile_actor_access paa
      JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
      WHERE paa.profile_id = p_profile_id AND ao.user_id = auth.uid()
        AND paa.status = 'active' AND COALESCE(ao.is_void, false) = false
    );
  ```

  **Two-arg** `actor_can_manage_profile(p_actor_id uuid, p_profile_id uuid)` — SECURITY DEFINER:
  ```sql
  SELECT vport.actor_can_manage_profile(p_profile_id);
  ```
  **p_actor_id is ignored entirely.** All RLS policies that call `actor_can_manage_profile(vc.current_actor_id(), profile_id)` are effectively calling the single-arg form with `auth.uid()` as the ownership check.

- **Pre-flight conditional migration placeholder correction:** The placeholder uses `SECURITY INVOKER` and `p_actor_id` in the join. Both are wrong. The correct replacement must:
  1. Preserve `SECURITY DEFINER` — function reads from `profile_actor_access` and `actor_owners` which may have RLS; DEFINER context is required
  2. Use `auth.uid()` directly, not `p_actor_id`
  3. Keep the two-arg pass-through overload unchanged
- **Correct conditional migration body (text only, do not run):**
```sql
-- Replace single-arg form only; remove owner_user_id branch:
CREATE OR REPLACE FUNCTION vport.actor_can_manage_profile(p_profile_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'vport', 'vc', 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vport.profile_actor_access paa
    JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
    WHERE paa.profile_id = p_profile_id
      AND ao.user_id     = auth.uid()
      AND paa.status     = 'active'
      AND COALESCE(ao.is_void, false) = false
  );
$$;
-- Two-arg pass-through unchanged: CREATE OR REPLACE FUNCTION vport.actor_can_manage_profile(p_actor_id uuid, p_profile_id uuid)
-- ... SELECT vport.actor_can_manage_profile(p_profile_id) ...
```

---

## DB REVIEW ITEM F — INFO (actor_can_view_profile live definition)

- **Live function confirmed:** SECURITY DEFINER, three conditions:
  1. `is_active = true AND is_deleted = false` — returns TRUE for any active, non-deleted profile regardless of caller ← covers public viewer case
  2. `owner_user_id = auth.uid() AND is_deleted = false` — legacy owner
  3. `profile_actor_access → actor_owners` — canonical owner

- **Recursion risk for profiles_select_viewer:** NOT a problem. Function is SECURITY DEFINER — its internal read of `vport.profiles` bypasses RLS entirely. No infinite recursion possible.

- **Previous DB review Item 1 (CRITICAL recursion):** The severity was overstated. The real concern was the pattern established in 20260503040334 — that `actor_can_view_profile` "returns false for non-team-member visitors." Looking at the live function, condition 1 means it returns TRUE for any active profile regardless of caller. The earlier documentation was referring to a different version of the function or a specific edge case.

- **Revised migration still correct:** Using a direct predicate (`is_active = true AND is_deleted = false`) instead of the function call is still the better approach: no function overhead per row, immune to future function changes, cleaner to audit, follows the canonical pattern from 20260503040334.

---

## PERMISSIVE DUAL-SELECT LOGIC — CONFIRMED CORRECT (post-migration, with Items A+B fixed)

```
Policy A (viewer): USING (enabled=true AND EXISTS(is_active profile))
Policy B (owner):  USING (actor_can_manage_profile(...) → auth.uid() based)

Anon caller:          services has no anon SELECT grant → blocked ✓
Non-owner, enabled:   A=PASS, B=FAIL → visible ✓
Non-owner, disabled:  A=FAIL, B=FAIL → hidden ✓  ← DB-SVC-001 fix
Owner, disabled:      A=FAIL, B=PASS → visible ✓
Owner, enabled:       A=PASS, B=PASS → visible ✓
```

---

## REQUIRED CORRECTIONS BEFORE DEPLOY

### Migration `20260523220000_vport_services_rls_security_fixes.sql`

**Section 2 (service_catalog) — add one DROP:**
```sql
-- Add BEFORE existing DROP POLICY IF EXISTS service_catalog_select_active:
DROP POLICY IF EXISTS service_catalog_select_public ON vport.service_catalog;
```

**Section 3 (service_addons) — add three DROPs to existing block:**
```sql
-- Add to existing DROP POLICY IF EXISTS block:
DROP POLICY IF EXISTS service_addons_select ON vport.service_addons;
DROP POLICY IF EXISTS service_addons_update ON vport.service_addons;
DROP POLICY IF EXISTS service_addons_delete ON vport.service_addons;
```

### Pre-flight `preflight_actor_can_manage_profile_legacy_branch.sql`

**Steps 1 and 2:** Replace `paa.user_id = p.owner_user_id` with correct `paa.actor_id → actor_owners` join path (see Item D above).

**Conditional migration placeholder:** Replace SECURITY INVOKER + p_actor_id body with SECURITY DEFINER + auth.uid() body (see Item E above).

---

*Part 2 generated by DB command (read-only analysis against live DB). No database modifications were made.*
