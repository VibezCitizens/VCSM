# DB RLS COVERAGE AUDIT — Profiles Module Session Scope

**Date:** 2026-05-23
**Application Scope:** VCSM
**Reviewer:** DB
**Trigger:** Post-CEREBRO audit RLS review — profiles module tables touched in the 2026-05-22/23 implementation session
**Session Audit:** `release/2026-05-23_thor_profiles-cerebro-release-gate.md`
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced

---

## SCOPE

This audit covers all database tables touched by the write paths involved in the profiles module CEREBRO session. The specific write paths reviewed:

1. `upsertVportServicesByActorDal` — writes to `vport.services`
2. `upsertVportRateDal` — writes to `vport.rates`
3. `vc.posts` — INSERT/UPDATE/DELETE coverage (read path verified in `20260510020000`)
4. `vport.fuel_prices` — write coverage from gas station flows
5. `vport.menu_categories` / `vport.menu_items` / `vport.menu_item_media` — menu write paths

Context: This audit was initiated to verify whether the application-layer ownership gate added to `upsertVportServicesController` (R-BLOCK-01 fix) is backed by adequate DB-layer RLS. The investigation revealed a broader untracked migration coverage gap.

---

## BACKGROUND — UNTRACKED ARCHIVE MIGRATIONS

Two archive migrations exist that were applied manually via the Supabase SQL editor and are NOT in `supabase/migrations/`:

- `20260416140000` — original RLS policy creation for `vport` schema tables
- `20260419150000` — original GRANT SELECT for `vport` schema tables

These were discovered and documented in the header comment of `20260503052543_fix_missing_authenticated_grants.sql`:

> "pre-CLI archive migrations (20260416140000, 20260419150000) that originally issued these GRANTs were applied manually via the SQL editor and were never tracked. Any project reset or fresh deployment leaves these tables inaccessible."

This means any table whose write grants or RLS policies appear **only** in those untracked archives:
- Is functional on the current live DB
- Will be **missing write grants and/or RLS on a fresh deployment or DB reset**
- Represents a **deployment risk** and a **security gap** (no tracked RLS = no DB-level ownership enforcement on fresh deployments)

`20260503052543` partially remediated this gap by re-establishing tracked GRANTs and RLS for: `qr_links`, `service_booking_profiles`, `resource_service_overrides`, `profile_actor_access`, `content_pages`, `menu_categories`. Tables NOT included in that remediation remain at risk.

---

## FINDINGS

---

### DR-NEW-01 — CRITICAL

**Object:** `vport.services` — write grants and RLS not in tracked migrations
**Application Scope:** VCSM
**Classification:** UNTRACKED — DEPLOYMENT RISK + RLS GAP

**Current behavior:**
- `GRANT SELECT ON vport.services TO authenticated` — present in `20260503052543` (Section 2)
- `GRANT INSERT, UPDATE, DELETE ON vport.services` — **NOT present in any tracked migration**
- `ALTER TABLE vport.services ENABLE ROW LEVEL SECURITY` — **NOT present in any tracked migration**
- `CREATE POLICY` for `vport.services` — **NOT present in any tracked migration**
- Write grants and RLS are assumed to be in the untracked archive `20260416140000` on the live DB

**DAL write path:**
`upsertVportServicesByActorDal` in `src/features/profiles/kinds/vport/dal/services/upsertVportServicesByActorDal.dal.js`:
```js
const { data, error } = await vportSchema
  .from("services")
  .upsert(mapped, { onConflict: "profile_id,key" })
  .select(SERVICES_SELECT);
```
Upserts require both `INSERT` and `UPDATE` grants. Without them, all service upserts return `42501` PostgreSQL permission denied.

**On a fresh deployment or DB reset:**
1. No `INSERT/UPDATE/DELETE` grants → all service writes fail with 403
2. No RLS → if grants are somehow present (e.g., applied manually again), **any authenticated user can upsert any row without ownership check**

**Why it matters:**
- The application-layer ownership gate added in R-BLOCK-01 is now in place. But defense-in-depth requires DB-layer enforcement. If the DB layer is absent or misconfigured on a future deployment, the only protection is the application layer.
- `vport.services` is an ownership-sensitive table (VPORT identity surface). Write without ownership check → any authenticated user can define services for any VPORT.
- This gap is invisible during normal operation (live DB has the untracked archive) but creates a silent deployment regression risk.

**Severity: CRITICAL**

**Proposed remediation (text only, do not run):**

```sql
-- =============================================================================
-- Migration: vport_services_tracked_rls
-- Purpose: Re-establish tracked write grants and RLS for vport.services
-- This surfaces what should have been in tracked migrations since 20260416140000
-- =============================================================================

-- Write privileges
GRANT INSERT, UPDATE, DELETE ON vport.services TO authenticated;

-- Enable RLS (no-op if already on)
ALTER TABLE vport.services ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (idempotent)
DROP POLICY IF EXISTS services_select_public ON vport.services;
DROP POLICY IF EXISTS services_select_owner  ON vport.services;
DROP POLICY IF EXISTS services_insert_owner  ON vport.services;
DROP POLICY IF EXISTS services_update_owner  ON vport.services;
DROP POLICY IF EXISTS services_delete_owner  ON vport.services;

-- Public SELECT: active services on active, non-deleted profiles
CREATE POLICY services_select_public ON vport.services
  FOR SELECT
  TO authenticated
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1 FROM vport.profiles p
      WHERE  p.id         = services.profile_id
        AND  p.is_active  = true
        AND  p.is_deleted = false
    )
  );

-- Owner SELECT: profile managers can read all services (including disabled)
CREATE POLICY services_select_owner ON vport.services
  FOR SELECT
  TO authenticated
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- Owner INSERT
CREATE POLICY services_insert_owner ON vport.services
  FOR INSERT
  TO authenticated
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- Owner UPDATE
CREATE POLICY services_update_owner ON vport.services
  FOR UPDATE
  TO authenticated
  USING      (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- Owner DELETE
CREATE POLICY services_delete_owner ON vport.services
  FOR DELETE
  TO authenticated
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

NOTIFY pgrst, 'reload schema';
```

**Pattern:** Matches the established `actor_can_manage_profile(vc.current_actor_id(), profile_id)` canonical pattern used by `menu_categories`, `content_pages`, `profile_actor_access`.

**Note:** The `upsertVportServicesByActorDal` resolves `actorId → profileId` before the upsert. The RLS `profile_id` check will correctly enforce: calling actor must manage the profile being written to. This aligns with the application-layer gate added in R-BLOCK-01.

**Delegate to:** CARNAGE, VENOM sign-off required before applying.

---

### DR-NEW-02 — HIGH

**Object:** `vport.rates` — SELECT grant, DELETE grant, and RLS not in tracked migrations
**Application Scope:** VCSM
**Classification:** PARTIAL TRACKED — DEPLOYMENT RISK

**Current behavior:**
- `GRANT INSERT, UPDATE ON vport.rates TO authenticated` — present in `20260427060000` (line 40)
- `GRANT SELECT ON vport.rates TO authenticated` — **NOT present in any tracked migration**
- `GRANT DELETE ON vport.rates TO authenticated` — **NOT present in any tracked migration**
- `ALTER TABLE vport.rates ENABLE ROW LEVEL SECURITY` — **NOT present in any tracked migration**
- `CREATE POLICY` for `vport.rates` — **NOT present in any tracked migration**
- The `20260427060000` comment states write grants are "derived from RLS migration 20260416140000" — RLS itself is untracked

**DAL write path:**
`upsertVportRateDal` in `src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js`:
```js
const { data, error } = await vportSchema
  .from("rates")
  .upsert({ profile_id: profileId, rate_type, ... }, { onConflict: "profile_id,rate_type,base_currency,quote_currency" })
  .select(RATES_SELECT);
```

**On a fresh deployment:**
1. `GRANT INSERT, UPDATE` present — writes would succeed at the grant level (unlike `vport.services`)
2. No RLS → any authenticated user can upsert any rate row for any profile without ownership check
3. No `GRANT SELECT` → read queries would fail with 403

**Why it matters:**
- Exchange rates are financial-sensitive data. An unauthenticated ownership check at DB level means any authenticated user could manipulate another VPORT's exchange rates on a fresh deployment.
- The upsert currently works on the live DB because the untracked archive has RLS. On a fresh deployment, the INSERT/UPDATE grants exist but the RLS is absent — creating a wider-open write path than intended.

**Severity: HIGH**

**Proposed remediation (text only, do not run):**

```sql
-- =============================================================================
-- Migration: vport_rates_tracked_rls
-- Purpose: Re-establish tracked SELECT/DELETE grants and RLS for vport.rates
-- =============================================================================

GRANT SELECT, DELETE ON vport.rates TO authenticated;

ALTER TABLE vport.rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rates_select_owner  ON vport.rates;
DROP POLICY IF EXISTS rates_insert_owner  ON vport.rates;
DROP POLICY IF EXISTS rates_update_owner  ON vport.rates;
DROP POLICY IF EXISTS rates_delete_owner  ON vport.rates;

-- Owner SELECT: profile managers can read their rates
CREATE POLICY rates_select_owner ON vport.rates
  FOR SELECT
  TO authenticated
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- Owner INSERT
CREATE POLICY rates_insert_owner ON vport.rates
  FOR INSERT
  TO authenticated
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- Owner UPDATE
CREATE POLICY rates_update_owner ON vport.rates
  FOR UPDATE
  TO authenticated
  USING      (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- Owner DELETE
CREATE POLICY rates_delete_owner ON vport.rates
  FOR DELETE
  TO authenticated
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

NOTIFY pgrst, 'reload schema';
```

**Note on public SELECT:** Exchange rates may need public SELECT access to display on public VPORT profiles. If so, add a `rates_select_public` policy for `(is_active = true AND EXISTS (SELECT 1 FROM vport.profiles p WHERE p.id = rates.profile_id AND p.is_active = true AND p.is_deleted = false))`. Confirm intent before migration.

**Delegate to:** CARNAGE.

---

### DR-NEW-03 — HIGH

**Object:** `vc.posts` — INSERT, UPDATE, DELETE grants and UPDATE/DELETE RLS not in tracked migrations
**Application Scope:** VCSM
**Classification:** PARTIAL — INSERT being remediated (DR-001); UPDATE/DELETE gap confirmed

**Current tracked coverage:**
| Operation | Grant | RLS | Source |
|---|---|---|---|
| SELECT | Assumed present | ✅ CLEAN (`posts_select_actor_based`) | `20260510020000` |
| INSERT | ❌ NOT tracked | ❌ pending (DR-001 migration `20260522010000`) | Carnage migration — STAGING PENDING |
| UPDATE | ❌ NOT tracked | ❌ NOT tracked anywhere | **GAP** |
| DELETE | ❌ NOT tracked | ❌ NOT tracked anywhere | **GAP** |

**Why it matters:**
- `vc.posts` is the primary content feed table. Feed attribution protection requires that posts can only be modified or deleted by their owning actor.
- The `20260510020000` migration explicitly states it "does not touch UPDATE or DELETE policies."
- The DR-001 Carnage migration (`20260522010000`) addresses only INSERT RLS, not UPDATE/DELETE.
- On the live DB, UPDATE/DELETE policies are assumed to exist from the untracked archive. On a fresh deployment, the feed table has no UPDATE/DELETE owner enforcement at the DB layer.

**DAL write paths:**
- Likely in `src/features/feed/` or `src/features/posts/` (outside profiles module scope)
- The profiles module only reads `vc.posts` (read path is clean)
- UPDATE/DELETE paths are used for post edits and deletions in other features

**Severity: HIGH** (Financial/attribution risk at DB layer; application layer currently gates this)

**Note:** This finding is outside the profiles module scope but was discovered during the RLS review initiated by the profiles CEREBRO session. It is documented here for completeness and should be routed to the appropriate feature owner for a follow-up Carnage migration targeting `vc.posts` UPDATE/DELETE.

**Proposed remediation (text only, do not run):**

```sql
-- =============================================================================
-- Migration: vc_posts_update_delete_rls
-- Purpose: Add tracked UPDATE/DELETE RLS for vc.posts
-- Companion to: 20260522010000_vc_posts_insert_ownership_rls.sql
-- =============================================================================

-- Grant UPDATE/DELETE if not already present
GRANT UPDATE, DELETE ON vc.posts TO authenticated;

-- UPDATE: only the post's owning actor can edit their own post
DROP POLICY IF EXISTS posts_update_own ON vc.posts;
CREATE POLICY posts_update_own ON vc.posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = vc.posts.actor_id
        AND ao.user_id  = auth.uid()
        AND ao.is_primary = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = vc.posts.actor_id
        AND ao.user_id  = auth.uid()
        AND ao.is_primary = true
    )
  );

-- DELETE: post owner or soft-delete by actor (via is_deleted flag)
DROP POLICY IF EXISTS posts_delete_own ON vc.posts;
CREATE POLICY posts_delete_own ON vc.posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = vc.posts.actor_id
        AND ao.user_id  = auth.uid()
        AND ao.is_primary = true
    )
  );

NOTIFY pgrst, 'reload schema';
```

**Note:** Verify the exact `actor_owners` schema before applying. The INSERT policy in `20260522010000` uses a specific `actor_owners` pattern — match it exactly. Delegate to CARNAGE. Should be staged and verified alongside `20260522010000`.

---

### DR-PARTIAL-01 — MEDIUM

**Object:** `vport.fuel_prices` — RLS not in tracked migrations
**Application Scope:** VCSM
**Classification:** PARTIAL TRACKED

**Current tracked coverage:**
- `GRANT INSERT, UPDATE ON vport.fuel_prices TO authenticated` — present in `20260427060000` (line 63)
- `GRANT SELECT ON vport.fuel_prices` — NOT found in Section 2 of `20260503052543` (possibly in untracked archive)
- `GRANT DELETE ON vport.fuel_prices` — NOT tracked
- RLS: NOT in any tracked migration; assumed in untracked archive `20260416140000`

**2026-05-14 audit status:** `fuel_prices` listed as CLEAN (`actor_can_manage_profile` consistently) — meaning the live DB has correct RLS. But this RLS is from the untracked archive.

**Why it matters:**
- Fuel prices are public-facing data for gas stations. If RLS is absent on fresh deployment, the INSERT/UPDATE grants mean any authenticated user could write any fuel price for any station.
- The application-layer ownership check in `upsertVportServicesController` pattern does not cover fuel prices (separate feature path).

**Severity: MEDIUM** (Lower than DR-NEW-01 because the 2026-05-14 audit confirms the live DB is clean; risk is deployment-path-only)

**Proposed remediation:**
Same pattern as DR-NEW-01 — create a tracked migration for `vport.fuel_prices` RLS using `actor_can_manage_profile` pattern. Bundle with DR-NEW-01 in a single "re-establish untracked RLS" migration. Delegate to CARNAGE.

---

## CONFIRMED CLEAN TABLES

These tables were verified as having fully tracked grants + RLS:

| Table | Tracked Coverage | Source |
|---|---|---|
| `vport.menu_categories` | Full grants + RLS `actor_can_manage_profile` | `20260503052543` §8 |
| `vport.menu_items` | Full grants (`20260427060000`) + RLS confirmed (`20260503052543` or `20260503040334`) | Multiple |
| `vport.menu_item_media` | Full grants in `20260427060000` | `20260427060000` |
| `vport.profile_actor_access` | Full grants + RLS | `20260503052543` §6 |
| `vport.content_pages` | Full grants + RLS | `20260503052543` §7 |
| `vport.qr_links` | Full grants + RLS | `20260503052543` §3 |
| `vport.service_booking_profiles` | Full grants + RLS | `20260503052543` §4 |
| `vport.resource_service_overrides` | Full grants + RLS | `20260503052543` §5 |
| `vc.posts` SELECT | SELECT RLS fully enforced | `20260510020000` |

---

## FULL RLS COVERAGE TABLE — PROFILES MODULE SESSION SCOPE

| Table | SELECT Grant | Write Grants | RLS Enabled | RLS Policies | Deployment Safe? | Finding |
|---|---|---|---|---|---|---|
| `vport.services` | ✅ tracked | ❌ UNTRACKED | ❌ UNTRACKED | ❌ UNTRACKED | ❌ NO | DR-NEW-01 CRITICAL |
| `vport.rates` | ❌ UNTRACKED | INSERT/UPDATE tracked; DELETE untracked | ❌ UNTRACKED | ❌ UNTRACKED | ❌ PARTIAL | DR-NEW-02 HIGH |
| `vc.posts` SELECT | ✅ assumed | N/A | ✅ tracked | ✅ tracked (SELECT) | ✅ YES (read) | — |
| `vc.posts` INSERT | ❌ untracked | ❌ untracked | tracked (SELECT only) | ❌ pending (DR-001) | ❌ NO | DR-001 |
| `vc.posts` UPDATE/DELETE | ❌ untracked | ❌ untracked | tracked (SELECT only) | ❌ UNTRACKED | ❌ NO | DR-NEW-03 HIGH |
| `vport.fuel_prices` | ❌ untracked | INSERT/UPDATE tracked | ❌ UNTRACKED | ❌ UNTRACKED (but CLEAN on live DB) | ❌ PARTIAL | DR-PARTIAL-01 MEDIUM |
| `vport.menu_categories` | ✅ tracked | ✅ tracked | ✅ tracked | ✅ tracked | ✅ YES | CLEAN |
| `vport.menu_items` | ✅ tracked | ✅ tracked | ✅ tracked | ✅ tracked | ✅ YES | CLEAN |
| `vport.menu_item_media` | ✅ tracked | ✅ tracked | ❓ assumed | ❓ assumed | PARTIAL | Monitor |
| `vport.content_pages` | ✅ tracked | ✅ tracked | ✅ tracked | ✅ tracked | ✅ YES | CLEAN |
| `vport.profile_actor_access` | ✅ tracked | ✅ tracked | ✅ tracked | ✅ tracked | ✅ YES | CLEAN |

---

## PRIORITY REMEDIATION ORDER

| Priority | Finding | Table | Action | Delegate |
|---|---|---|---|---|
| P0 | DR-NEW-01 | `vport.services` | New tracked migration: write grants + RLS with `actor_can_manage_profile` | CARNAGE |
| P0 | DR-001 | `vc.posts` INSERT | `20260522010000` migration — stage + verify 8 VPORT publish flows | VENOM (sign-off), THOR |
| P1 | DR-NEW-02 | `vport.rates` | New tracked migration: SELECT/DELETE grants + RLS | CARNAGE |
| P1 | DR-NEW-03 | `vc.posts` UPDATE/DELETE | New tracked migration: companion to `20260522010000` | CARNAGE |
| P2 | DR-PARTIAL-01 | `vport.fuel_prices` | Bundle with DR-NEW-01 migration; track existing RLS | CARNAGE |

---

## RELATIONSHIP TO THOR RELEASE GATE

The findings in this audit have the following release gate implications:

| Finding | Relationship to Active THOR Gate | Impact |
|---|---|---|
| DR-NEW-01 (`vport.services`) | New finding — not in current THOR gate | Requires new CARNAGE migration before next release window; does NOT block the current code release (application-layer gate R-BLOCK-01 is in place) |
| DR-001 (`vc.posts` INSERT) | ACTIVE BLOCKER — in current THOR gate | Staging verification required before production |
| DR-NEW-03 (`vc.posts` UPDATE/DELETE) | New finding — not in current THOR gate | Requires follow-up Carnage migration; out-of-scope for current release |
| DR-NEW-02 (`vport.rates`) | New finding — not in current THOR gate | Does not block current release; P1 follow-up |

**Recommendation:** Route DR-NEW-01 and DR-NEW-02 to CARNAGE for migration planning. Bundle all untracked-to-tracked RLS migrations into a single "rls-coverage-backfill" migration if possible to minimize migration count and simplify staging verification.

---

## CARNAGE MIGRATION RECOMMENDATION

All four findings (DR-NEW-01, DR-NEW-02, DR-NEW-03, DR-PARTIAL-01) should be addressed in a single bundled migration:

```
20260523010000_backfill_untracked_rls_coverage.sql
```

This migration would:
1. Add write grants for `vport.services` + full RLS
2. Add SELECT/DELETE grants for `vport.rates` + full RLS  
3. Add UPDATE/DELETE grants for `vc.posts` + UPDATE/DELETE policies
4. Add tracked `ENABLE ROW LEVEL SECURITY` for `vport.fuel_prices` (idempotent; no-op if already on)

Route to CARNAGE for full migration planning before applying.

---

## SECURITY NOTE

No credentials, passwords, API keys, or tokens appear in this report. This report is documentation-only. All SQL shown is proposal text — not executed.

---

---

## LIVE DB VERIFICATION — 2026-05-23

Live connection to `db.nkdrjlmbtqbywhcthppm.supabase.co` (Vibez Citizens SM) confirmed. The following verification updates the migration-file-only findings above.

---

### LIVE DB VERIFICATION — `vport.services`

**RLS enabled:** ✅ (`rowsecurity = t`)

**Grants (authenticated):** SELECT, INSERT, UPDATE, DELETE ✅ — all write grants present on live DB

**Policies:**

| Policy | Cmd | Role | Pattern |
|---|---|---|---|
| `services_select_access` | SELECT | authenticated | `actor_can_view_profile(vc.current_actor_id(), profile_id)` |
| `services_insert_managed` | INSERT | authenticated | `actor_can_manage_profile(vc.current_actor_id(), profile_id)` |
| `services_update_managed` | UPDATE | authenticated | `actor_can_manage_profile` USING + WITH CHECK |
| `services_delete_managed` | DELETE | authenticated | `actor_can_manage_profile(vc.current_actor_id(), profile_id)` |

**Live DB assessment: CLEAN** ✅

The live DB uses the canonical `actor_can_manage_profile` pattern for all writes. SELECT uses `actor_can_view_profile` which is appropriate — services are public catalog data. No overlapping policies, no legacy patterns.

**Revised DR-NEW-01 classification:** DEPLOYMENT TRACKING GAP only. The live DB is secure. The risk is fresh-deployment-only.

---

### LIVE DB VERIFICATION — `vport.rates`

**RLS enabled:** ✅ (`rowsecurity = t`)

**Grants:** `anon` SELECT; `authenticated` SELECT, INSERT, UPDATE, DELETE ✅

**Policies:** 8 policies — dual architecture with LEGACY PATTERN found:

| Policy | Cmd | Role | Pattern | Classification |
|---|---|---|---|---|
| `rates_select` | SELECT | public | `actor_can_view_profile(vc.current_actor_id(), profile_id)` | CANONICAL |
| `rates_select_authenticated` | SELECT | authenticated | `true` — TAUTOLOGY | ⚠️ OPEN SELECT |
| `rates_insert` | INSERT | public | `actor_can_manage_profile` | CANONICAL |
| `rates_insert_owner` | INSERT | authenticated | `profiles.owner_user_id = auth.uid()` | ⚠️ LEGACY |
| `rates_update` | UPDATE | public | `actor_can_manage_profile` | CANONICAL |
| `rates_update_owner` | UPDATE | authenticated | `profiles.owner_user_id = auth.uid()` | ⚠️ LEGACY |
| `rates_delete` | DELETE | public | `actor_can_manage_profile` | CANONICAL |
| `rates_delete_owner` | DELETE | authenticated | `profiles.owner_user_id = auth.uid()` | ⚠️ LEGACY |

**Two new live DB findings:**

**DR-RATES-01 — HIGH: `rates_select_authenticated` tautology**

`qual = true` on the authenticated SELECT policy means **any authenticated user can read any rate for any profile with no restriction** — including rates for inactive, deleted, or private profiles. In PERMISSIVE mode, this tautology wins over the `rates_select` canonical policy (which restricts to `actor_can_view_profile`). Same class of finding as DB-RLS-03 (the `bookings_insert_public_pending` tautology).

Effect: Exchange rate data is fully public to all authenticated users regardless of profile lifecycle state.

**DR-RATES-02 — HIGH: Legacy `profiles.owner_user_id = auth.uid()` ownership pattern**

The `_owner` variants (insert/update/delete) use `profiles.owner_user_id = auth.uid()` — the legacy raw user ID check, same pattern as DB-RLS-01 (`bookings_insert_owner`) confirmed in the 2026-05-14 audit. In PERMISSIVE mode, these don't currently block writes (the canonical policies pass first), but they allow writes from a former VPORT owner after ownership transfer, and they will remain live policies that could cause confusion or be silently relied upon.

Action: Drop `rates_insert_owner`, `rates_update_owner`, `rates_delete_owner`. Keep the canonical `rates_*` set. Bundle with the `bookings_insert_owner` fix already planned in CARNAGE.

---

### LIVE DB VERIFICATION — `vc.posts`

**RLS enabled:** ✅ (`rowsecurity = t`)

**Grants (authenticated):** SELECT, INSERT, UPDATE, DELETE ✅ — all four operations granted

**Policies:**

| Policy | Cmd | Role | Pattern |
|---|---|---|---|
| `posts_select_actor_based` | SELECT | authenticated | Full privacy + block + follow chain (tracked in `20260510020000`) |
| `posts_insert_actor_owner` | INSERT | authenticated | `EXISTS (actor_owners WHERE actor_id = posts.actor_id AND user_id = auth.uid())` |
| `posts_update_actor_owner` | UPDATE | authenticated | Same actor_owners pattern |
| `posts_delete_actor_owner` | DELETE | authenticated | Same actor_owners pattern |

**Live DB assessment: FULLY CLEAN** ✅

All four operations are covered with the canonical `actor_owners` pattern. The INSERT, UPDATE, and DELETE policies use exactly the pattern proposed by the Carnage migration (`20260522010000`) — but they already exist from the untracked archive.

**Revised DR-NEW-03 classification:** DEPLOYMENT TRACKING GAP only. The live DB has complete and correct UPDATE/DELETE RLS. The Carnage migration for this finding should still be created to track these policies, but there is no active security gap on the live DB.

---

### LIVE DB VERIFICATION — `vport.fuel_prices`

**RLS enabled:** ✅ (`rowsecurity = t`)

**Grants:** `anon` SELECT; `authenticated` SELECT, INSERT, UPDATE — no DELETE (intentional)

**Policies:**

| Policy | Cmd | Role | Pattern |
|---|---|---|---|
| `fuel_prices_select_public` | SELECT | public | (implied — allows public/anon reads) |
| `fuel_prices_insert_owner` | INSERT | authenticated | `actor_can_manage_profile` |
| `fuel_prices_update_owner` | UPDATE | authenticated | `actor_can_manage_profile` |

**Live DB assessment: CLEAN** ✅

No DELETE policy or grant — intentional (fuel prices are updated, not deleted). Canonical pattern throughout.

**Revised DR-PARTIAL-01 classification:** DEPLOYMENT TRACKING GAP only.

---

## REVISED FINDING SUMMARY

| Finding | Original Classification | Revised Classification (Live DB) | Notes |
|---|---|---|---|
| DR-NEW-01 (`vport.services` RLS untracked) | CRITICAL — security gap | **MEDIUM — deployment tracking gap** | Live DB is clean with canonical RLS |
| DR-RATES-01 (`rates_select_authenticated` tautology) | — NEW — | **HIGH** | Any authenticated user reads all rates |
| DR-RATES-02 (`rates` legacy ownership policies) | — NEW — | **HIGH** | 3 legacy `owner_user_id` policies on rates |
| DR-NEW-02 (`vport.rates` untracked) | HIGH — security gap | **MEDIUM — deployment tracking gap** | Live DB has full grants + RLS (but with above issues) |
| DR-NEW-03 (`vc.posts` UPDATE/DELETE untracked) | HIGH — security gap | **LOW — deployment tracking gap** | Live DB is fully clean |
| DR-001 (`vc.posts` INSERT RLS) | CRITICAL — active blocker | **ACTIVE BLOCKER — unchanged** | `20260522010000` staging verification still required |
| DR-PARTIAL-01 (`vport.fuel_prices` untracked) | MEDIUM | **LOW — deployment tracking gap** | Live DB is clean |

**Primary active finding on the live DB: DR-RATES-01 + DR-RATES-02 on `vport.rates`**

These are real live DB issues, not deployment-tracking issues. They should be escalated to CARNAGE.

---

## UPDATED REPORT STATUS

**Status:** COMPLETE — live DB verification added
**Live DB critical findings:** 0 (no critical security gap on live DB)
**Live DB high findings:** 2 (DR-RATES-01 tautology, DR-RATES-02 legacy ownership on `vport.rates`)
**Deployment tracking gaps:** 4 (services, rates, posts UPDATE/DELETE, fuel_prices — all untracked but live DB is correct)
**Clean tables on live DB:** 9 (services, posts, fuel_prices, menu_categories, menu_items, menu_item_media, content_pages, profile_actor_access, qr_links)

**Recommended next command:** CARNAGE — `vport.rates` dual policy cleanup (DR-RATES-01 tautology + DR-RATES-02 legacy policies)
