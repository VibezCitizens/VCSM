# DB Snapshot — Portfolio RLS Policies (Live Supabase)

**Date:** 2026-05-23  
**Time:** 17:30  
**Reviewer:** DB Command  
**Project Ref:** nkdrjlmbtqbywhcthppm  
**Source:** Live Supabase Management API — `pg_policies`, `pg_proc`  
**Trigger:** VENOM PORT-V-007 UNVERIFIED — need live confirmation  
**Application Scope:** VCSM  

---

## Scope

Tables reviewed:

| Schema | Table | RLS Enabled | RLS Forced |
|---|---|---|---|
| `vport` | `portfolio_items` | ✅ YES | ❌ NO |
| `vport` | `portfolio_media` | ✅ YES | ❌ NO |
| `vport` | `portfolio_tags` | ✅ YES | ❌ NO |
| `vport` | `barber_portfolio_details` | ✅ YES | ❌ NO |
| `vport` | `locksmith_portfolio_details` | ✅ YES | ❌ NO |
| `vport` | `profiles` | ✅ YES | ❌ NO |
| `vc` | `actors` | ✅ YES | ✅ YES |
| `vc` | `actor_owners` | ✅ YES | ✅ YES |
| `platform` | `media_assets` | ✅ YES | ❌ NO |

**All 9 tables have RLS enabled.** `vc.actors` and `vc.actor_owners` additionally have `rls_forced = true`, meaning even superusers cannot bypass their policies.

---

## PORT-V-007 Reclassification

**Previous status (VENOM):** UNVERIFIED (based on migration file search)  
**Live DB result:** VERIFIED — RLS enabled on `portfolio_items`, `portfolio_media`, `portfolio_tags` with active write-guard policies using `actor_can_manage_profile`.  
**New classification:** VERIFIED WITH CAVEATS (see findings DB-PORT-004, DB-PORT-005)

---

## Active Policy Inventory

### `vport.portfolio_items` (4 policies, roles: authenticated)

| Policy | CMD | Ownership Basis |
|---|---|---|
| `portfolio_items_select_access` | SELECT | `actor_can_manage_profile(current_actor_id(), profile_id)` OR `(actor_can_view_profile AND is_deleted=false)` |
| `portfolio_items_insert_managed` | INSERT | `actor_can_manage_profile(current_actor_id(), profile_id)` + `created_by_actor_id = current_actor_id()` |
| `portfolio_items_update_managed` | UPDATE | `actor_can_manage_profile(current_actor_id(), profile_id)` |
| `portfolio_items_delete_managed` | DELETE | `actor_can_manage_profile(current_actor_id(), profile_id)` |

**Coverage:** Full CRUD protected. Write operations gated by `actor_can_manage_profile`. Read includes public-access path for active profiles.

---

### `vport.portfolio_media` (4 policies, roles: public)

| Policy | CMD | Ownership Basis |
|---|---|---|
| `portfolio_media_select` | SELECT | `actor_can_manage_profile(current_actor_id(), profile_id)` OR `(actor_can_view_profile AND is_active=true)` |
| `portfolio_media_insert` | INSERT | `actor_can_manage_profile(current_actor_id(), profile_id)` |
| `portfolio_media_update` | UPDATE | `actor_can_manage_profile(current_actor_id(), profile_id)` |
| `portfolio_media_delete` | DELETE | `actor_can_manage_profile(current_actor_id(), profile_id)` |

**Note:** Policies are on the `{public}` role (not `{authenticated}`). When `auth.uid()` is NULL (anon), `actor_can_manage_profile` returns FALSE — writes blocked. SELECT allows anon viewers to read media of active profiles (intentional public display). Write path is properly guarded.

---

### `vport.portfolio_tags` (3 policies, mixed roles)

| Policy | CMD | Ownership Basis |
|---|---|---|
| `portfolio_tags_select` | SELECT | `actor_can_view_profile(current_actor_id(), pi.profile_id) AND pi.is_deleted = false` |
| `portfolio_tags_insert` | INSERT | `p.owner_user_id = auth.uid() OR EXISTS (actor_owners ao WHERE ao.is_void = false)` |
| `portfolio_tags_delete` | DELETE | Same as INSERT |

⚠️ **No UPDATE policy** (consistent with delete/re-insert pattern for tags).  
⚠️ **INSERT/DELETE use a direct ownership check that differs from other portfolio tables** — does NOT call `actor_can_manage_profile`. Importantly, this path does NOT include `profile_actor_access` team member access. A team member added via `profile_actor_access` can manage portfolio items and media but CANNOT insert or delete tags. See DB-PORT-004.

---

### `vport.barber_portfolio_details` (4 policies, roles: public)

| Policy | CMD | Ownership Basis |
|---|---|---|
| `barber_portfolio_details_select` | SELECT | `actor_can_view_profile` via portfolio_items join |
| `barber_portfolio_details_insert` | INSERT | `actor_can_manage_profile` via portfolio_items join |
| `barber_portfolio_details_update` | UPDATE | `actor_can_manage_profile` via portfolio_items join |
| `barber_portfolio_details_delete` | DELETE | `actor_can_manage_profile` via portfolio_items join |

**Coverage:** Full CRUD. Ownership derived indirectly via `portfolio_items.profile_id` join — consistent with `portfolio_items` policies.

---

### `vport.locksmith_portfolio_details` (5 policies — REDUNDANT)

| Policy | CMD | Ownership Basis |
|---|---|---|
| `owner_all` | ALL | Direct `actor_owners` join via `portfolio_items → profiles → actor_owners` |
| `locksmith_portfolio_details_select` | SELECT | `actor_can_view_profile` via portfolio_items join |
| `locksmith_portfolio_details_insert` | INSERT | `actor_can_manage_profile` via portfolio_items join |
| `locksmith_portfolio_details_update` | UPDATE | `actor_can_manage_profile` via portfolio_items join |
| `locksmith_portfolio_details_delete` | DELETE | `actor_can_manage_profile` via portfolio_items join |

⚠️ **`owner_all` is redundant** — a catch-all ALL policy plus 4 per-command policies. Because all policies are PERMISSIVE, any one passing grants access. The `owner_all` uses a stricter direct `actor_owners` join while the per-command policies use `actor_can_manage_profile` (which includes the `profile_actor_access` team path). This inconsistency means ALL operations on this table pass if EITHER the owner_all OR the per-command policy allows it. See DB-PORT-005.

---

### `vport.profiles` (5 policies)

| Policy | CMD | Ownership Basis |
|---|---|---|
| `Public can read listed VPORT profiles` | SELECT | `is_active=true AND is_deleted=false AND directory_visible=true AND directory_status='listed'` (anon + authenticated) |
| `profiles_select_by_owner_user` | SELECT | `owner_user_id = auth.uid()` |
| `profiles_update_by_actor_owner` | UPDATE | `actor_owners` join with `is_void=false` |
| `profiles_update_owner` | UPDATE | Same as above (DUPLICATE — two identical UPDATE policies) |
| `profiles_delete_owner` | DELETE | `actor_owners` join with `is_void=false` |
| `profiles_insert_service_role` | INSERT | `current_setting('role') = 'service_role'` |

**Note:** INSERT is service-role only (VPORTs are provisioned server-side). Two identical UPDATE policies exist — this is a potential hygiene issue but not a security risk (duplicate PERMISSIVE policies with same condition are functionally equivalent). See DB-PORT-006.

---

### `vc.actor_owners` (2 policies, roles: authenticated)

| Policy | CMD | Ownership Basis |
|---|---|---|
| `actor_owners_read_own` | SELECT | `user_id = auth.uid()` |
| `actor_owners_insert_self` | INSERT | `user_id = auth.uid()` |

**Note:** No UPDATE or DELETE policy — actor_owners rows appear to be immutable from the client side. Deletions would require service-role.

---

### `platform.media_assets` (10 policies)

Key write-path policies for portfolio:

| Policy | CMD | Role | Ownership Basis |
|---|---|---|---|
| `media_assets_vc_owner_insert` | INSERT | public | Both `owner_actor_id` AND `created_by_actor_id` in `actor_owners` with `is_void=false`, `owner_source='vc'` |
| `media_assets_vc_owner_update` | UPDATE | public | `actor_owners` join with `is_void=false`, `owner_source='vc'` |
| `media_assets_vc_owner_select` | SELECT | public | `actor_owners` join with `is_void=false`, `owner_source='vc'` |
| `media_assets_public_ready_read` | SELECT | public | `status='ready' AND deleted_at IS NULL AND meta->>'is_public'=true` |
| `media_assets_deny_all` | ALL | authenticated | `qual = false` — never grants (see DB-PORT-007) |

---

## SECURITY DEFINER Function Inventory

### Functions With `SET row_security TO 'off'` + Portfolio Scope

| Schema | Function | SECDEF | row_security off | Purpose |
|---|---|---|---|---|
| `vc` | `get_vport_portfolio` | ✅ | ✅ | Public read — `vc.vport_portfolio_*` schema (legacy) |
| `vc` | `get_barber_vport_portfolio` | ✅ | ✅ | Public read — `vc.vport_portfolio_*` schema (legacy) |
| `vc` | `get_barber_vport_portfolio_item_detail` | ✅ | ✅ | Public read — `vc.vport_portfolio_*` schema (legacy) |
| `vc` | `is_actor_portfolio_owner` | ✅ | ✅ | Delegate to `vc.is_actor_owner` |
| `vc` | `ensure_portfolio_cover_media` | ✅ | ✅ | Trigger — updates `vc.vport_portfolio_items` |
| `vc` | `ensure_portfolio_item_metrics_row` | ✅ | ✅ | Trigger — inserts `vc.vport_portfolio_item_metrics` |
| `vc` | `validate_portfolio_barber_actor_match` | ✅ | ✅ | Trigger — validates actor ownership |
| `vc` | `validate_portfolio_item_actor_is_vport` | ✅ | ✅ | Trigger — enforces kind='vport' on actor |
| `vc` | `validate_portfolio_item_actor_match` | ✅ | ✅ | Trigger — cross-validates media actor_id |
| `vc` | `validate_portfolio_service_actor_match` | ✅ | ✅ | Trigger — validates service actor match |
| `vport` | `get_business_card_sections` | ✅ | ❌ | Public read — queries `vport.portfolio_items` |

**Public read RPCs** (`get_vport_portfolio`, `get_barber_vport_portfolio`, `get_barber_vport_portfolio_item_detail`) only expose `visibility='public' AND is_active=true AND is_deleted=false` rows — no ownership verification needed since they're read-only public functions.

**Trigger functions** (SECURITY DEFINER + `row_security=off`) are called by the database engine on DML operations — they cannot be directly invoked by a client and are appropriate for this privilege level.

---

## Helper Functions Used in Policies

### `vport.actor_can_manage_profile(p_profile_id uuid)` — 1-arg (the canonical version)

```sql
SELECT
  EXISTS (SELECT 1 FROM vport.profiles WHERE id = p_profile_id AND owner_user_id = auth.uid() AND is_deleted = false)
  OR
  EXISTS (
    SELECT 1 FROM vport.profile_actor_access paa
    JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
    WHERE paa.profile_id = p_profile_id AND ao.user_id = auth.uid()
      AND paa.status = 'active' AND COALESCE(ao.is_void, false) = false
  )
```

**Ownership paths:**
1. Direct owner via `profiles.owner_user_id = auth.uid()` (legacy user ownership)
2. Team member with active `profile_actor_access` + non-void `actor_owners` link

---

### `vport.actor_can_manage_profile(p_actor_id uuid, p_profile_id uuid)` — 2-arg (used in RLS policy expressions)

```sql
SELECT vport.actor_can_manage_profile(p_profile_id);
```

⚠️ **`p_actor_id` is silently discarded.** The 2-arg version is the one called by RLS policies as `actor_can_manage_profile(vc.current_actor_id(), profile_id)`, but `vc.current_actor_id()` result is thrown away. See DB-PORT-001.

---

### `vc.current_actor_id()` — Used in all portfolio RLS policies

```sql
SELECT a.id FROM vc.actors a JOIN platform.user_app_accounts uaa ON uaa.id = a.user_app_account_id
WHERE uaa.user_id = auth.uid() AND a.is_void = false AND a.is_deleted = false
LIMIT 1
```

⚠️ **No ORDER BY + LIMIT 1 = non-deterministic** when a user has multiple non-void actors. See DB-PORT-002.  
⚠️ **No `kind` filter** — could return a 'user'-kind actor when context requires 'vport'-kind.  
⚠️ **Result is discarded** by `actor_can_manage_profile` 2-arg call — see DB-PORT-001.

---

### `vc.is_actor_owner(p_actor_id uuid)` — Used by `actors_update_owner` and `is_actor_portfolio_owner`

```sql
SELECT EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = p_actor_id AND ao.user_id = auth.uid() AND ao.is_void = false)
```

✅ **Correct.** Checks `actor_owners` directly with `auth.uid()` and void guard.

---

## DATABASE REVIEW ITEMS

---

```
DATABASE REVIEW ITEM
- Object: vport.actor_can_manage_profile (2-arg overload) called from all portfolio RLS policies
- Application Scope: VCSM
- Current behavior: The 2-arg version `actor_can_manage_profile(p_actor_id uuid, p_profile_id uuid)` 
  is called in RLS policies as `actor_can_manage_profile(vc.current_actor_id(), profile_id)`.
  The function body is: SELECT vport.actor_can_manage_profile(p_profile_id) — the p_actor_id 
  argument is completely ignored.
- Problem: `vc.current_actor_id()` is computed and passed on every policy evaluation, incurring
  a full table scan + join against platform.user_app_accounts on EVERY DML operation on
  portfolio_items, portfolio_media, barber_portfolio_details, and locksmith_portfolio_details.
  The result is then silently discarded. This is both a performance waste and an architectural 
  confusion — the 2-arg API implies actor-scoped management but the implementation ignores it.
- Why it matters: (1) Performance: every INSERT/UPDATE/DELETE to portfolio tables runs 
  vc.current_actor_id() unnecessarily. With portfolio_media this could be called multiple times 
  in a batch upload. (2) Clarity: developers reading the policy see actor context being passed and 
  assume actor-level ownership enforcement. The actual check is only on owner_user_id / 
  profile_actor_access, not the actor-specific level.
- Recommended improvement: Either (a) update the 2-arg overload to actually use p_actor_id 
  for actor-level ownership verification, or (b) remove the 2-arg overload and update all 
  policy expressions to call the 1-arg version directly:
  vport.actor_can_manage_profile(profile_id) replacing actor_can_manage_profile(vc.current_actor_id(), profile_id).
- Rationale: Removes unnecessary join on every policy evaluation. Eliminates misleading API surface.
- Risk if unchanged: Ongoing performance overhead on every portfolio mutation. Developer confusion 
  about what the actor_id parameter does. Risk that a future developer adds actor-scoped logic to 
  the 2-arg version assuming it was already being used, breaking the 1-arg flow.
- Example SQL proposal (text only, do not run):
  -- Option B: Remove 2-arg overload entirely, update policies to call 1-arg version
  -- 1. Drop the 2-arg overload:
  -- DROP FUNCTION IF EXISTS vport.actor_can_manage_profile(uuid, uuid);
  -- 2. Update affected policies to remove vc.current_actor_id() call:
  -- For portfolio_items_insert_managed:
  -- ALTER POLICY portfolio_items_insert_managed ON vport.portfolio_items
  --   WITH CHECK (vport.actor_can_manage_profile(profile_id) 
  --     AND (created_by_actor_id IS NULL OR created_by_actor_id = vc.current_actor_id()));
  -- Repeat for _update_managed, _delete_managed, portfolio_media, barber_, locksmith_ policies.
  -- NOTE: created_by_actor_id checks still legitimately need vc.current_actor_id().
  -- Text only — do not execute.
```

---

```
DATABASE REVIEW ITEM
- Object: vc.current_actor_id() — LIMIT 1 without ORDER BY
- Application Scope: VCSM
- Current behavior: Returns the first non-void, non-deleted actor for auth.uid() with no ORDER BY.
  Called on every portfolio policy evaluation via the 2-arg actor_can_manage_profile wrapper.
- Problem: When a user has multiple non-void actors (e.g., one 'user'-kind and one 'vport'-kind),
  the function returns an arbitrary actor depending on the query planner's scan order. While
  currently harmless for portfolio policies (result is discarded by the 2-arg wrapper), 
  this non-determinism is a latent risk if the function is used in other security-sensitive
  policy expressions where actor kind matters.
- Why it matters: Non-deterministic identity resolution in a security function can cause 
  intermittent authorization failures or silent downgrades (e.g., returning a 'user'-kind 
  actor when a 'vport'-kind actor is required). Hard to reproduce in testing.
- Recommended improvement: Add ORDER BY to ensure deterministic actor selection.
  Option A — prefer vport-kind: ORDER BY (CASE WHEN a.kind = 'vport' THEN 0 ELSE 1 END), a.created_at
  Option B — prefer oldest: ORDER BY a.created_at ASC
  Option C — add kind filter: WHERE ... AND a.kind = 'vport' (if the function is exclusively 
  for vport context — but this would break user-context callers).
- Rationale: Deterministic selection prevents ghost failures in production under multi-actor 
  users. Low-cost change — adding ORDER BY to an existing query.
- Risk if unchanged: Latent non-determinism in all policy expressions that call current_actor_id().
  As more policies are added that actually use the actor_id result, this becomes a real failure path.
- Example SQL proposal (text only, do not run):
  -- CREATE OR REPLACE FUNCTION vc.current_actor_id()
  -- RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
  -- SET search_path TO 'vc', 'platform', 'public', 'auth', 'pg_temp'
  -- AS $$
  --   SELECT a.id FROM vc.actors a
  --   JOIN platform.user_app_accounts uaa ON uaa.id = a.user_app_account_id
  --   WHERE uaa.user_id = auth.uid() AND a.is_void = false AND a.is_deleted = false
  --   ORDER BY a.created_at ASC  -- deterministic: oldest actor
  --   LIMIT 1
  -- $$;
  -- Text only — do not execute.
```

---

```
DATABASE REVIEW ITEM
- Object: vport.portfolio_tags INSERT/DELETE policies — team member access gap
- Application Scope: VCSM
- Current behavior: portfolio_tags INSERT and DELETE policies use a direct ownership check:
  `p.owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM actor_owners ao WHERE ao.user_id = auth.uid() AND ao.is_void = false)`
  This does NOT call actor_can_manage_profile, which includes the profile_actor_access (team) path.
- Problem: A user added as a team member via vport.profile_actor_access (a barbershop employee,
  for example) CAN manage portfolio_items and portfolio_media (via actor_can_manage_profile), 
  but CANNOT insert or delete portfolio_tags on those same items. The tag policies have a 
  narrower ownership model that excludes the team access path.
- Why it matters: Creates an inconsistent permission surface. If team members are expected to 
  manage portfolio content (the actor_can_manage_profile policies imply they can), they should 
  also be able to manage tags. If team members should NOT manage tags, that should be 
  documented explicitly and the inconsistency should be intentional.
- Recommended improvement: If team access for tags is desired, update portfolio_tags INSERT/DELETE
  to use actor_can_manage_profile for consistency:
  WITH CHECK (EXISTS (
    SELECT 1 FROM vport.portfolio_items pi
    WHERE pi.id = portfolio_tags.portfolio_item_id
      AND vport.actor_can_manage_profile(pi.profile_id)
  ))
  If team access for tags is intentionally excluded, add a comment to the policy documenting 
  the deliberate restriction.
- Rationale: Policy consistency reduces cognitive load during security reviews. Inconsistent
  access models create hard-to-detect authorization gaps.
- Risk if unchanged: Team members can be blocked from completing portfolio workflows mid-flow
  (add item + add media OK, add tags FAILS) without a clear error boundary.
- Example SQL proposal (text only, do not run):
  -- ALTER POLICY portfolio_tags_insert ON vport.portfolio_tags
  --   WITH CHECK (
  --     EXISTS (
  --       SELECT 1 FROM vport.portfolio_items pi
  --       WHERE pi.id = portfolio_tags.portfolio_item_id
  --         AND vport.actor_can_manage_profile(pi.profile_id)
  --     )
  --   );
  -- ALTER POLICY portfolio_tags_delete ON vport.portfolio_tags
  --   USING (
  --     EXISTS (
  --       SELECT 1 FROM vport.portfolio_items pi
  --       WHERE pi.id = portfolio_tags.portfolio_item_id
  --         AND vport.actor_can_manage_profile(pi.profile_id)
  --     )
  --   );
  -- Text only — do not execute.
```

---

```
DATABASE REVIEW ITEM
- Object: vport.locksmith_portfolio_details — redundant owner_all policy
- Application Scope: VCSM
- Current behavior: Table has 5 policies: one catch-all `owner_all` (ALL operations) plus four 
  per-command policies (SELECT/INSERT/UPDATE/DELETE). Both sets are PERMISSIVE.
  `owner_all` uses a direct actor_owners join.
  The per-command policies use actor_can_manage_profile.
  Any PERMISSIVE policy passing grants the operation — both sets grant access.
- Problem: The `owner_all` policy bypasses the `profile_actor_access` team path that 
  `actor_can_manage_profile` includes. This creates TWO effective ownership models on the 
  same table with different team access semantics. For ALL operations, `owner_all` fires first 
  and grants access to direct owners — the per-command policies are redundant for them. 
  For team members, the per-command policies grant access but `owner_all` does not.
  The effective result is: direct owners → both policy sets pass, team members → per-command 
  policies pass. No practical security gap, but significant policy confusion.
- Why it matters: Makes audit difficult. Future migrations may modify one policy without 
  updating the other, causing drift between the two ownership models. The `owner_all` policy
  was likely an early draft that wasn't removed when the per-command policies were added.
- Recommended improvement: Remove the redundant `owner_all` policy. Keep the four per-command
  policies which use the more complete actor_can_manage_profile path.
- Rationale: Fewer policies = easier audit, less drift risk, clearer intent.
- Risk if unchanged: Low — no security gap currently. Risk is future maintenance confusion and 
  accidental authorization drift.
- Example SQL proposal (text only, do not run):
  -- DROP POLICY IF EXISTS owner_all ON vport.locksmith_portfolio_details;
  -- Text only — do not execute.
```

---

```
DATABASE REVIEW ITEM
- Object: vport.profiles — duplicate UPDATE policies
- Application Scope: VCSM
- Current behavior: Two policies exist with identical USING and WITH CHECK expressions:
  `profiles_update_by_actor_owner` and `profiles_update_owner`.
  Both check: EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = profiles.actor_id 
    AND ao.user_id = auth.uid() AND COALESCE(ao.is_void, false) = false)
- Problem: Duplicate PERMISSIVE policies with identical conditions. Functionally equivalent 
  to having one policy (one passing is sufficient). No security impact. May have been created 
  when a policy was renamed during a migration without dropping the old one.
- Why it matters: Policy confusion, audit overhead.
- Recommended improvement: Drop one of the two duplicate UPDATE policies.
- Rationale: Clean policy set reduces cognitive load during RLS audits.
- Risk if unchanged: Low. No functional impact.
- Example SQL proposal (text only, do not run):
  -- DROP POLICY IF EXISTS profiles_update_owner ON vport.profiles;
  -- (keep profiles_update_by_actor_owner as the canonical name)
  -- Text only — do not execute.
```

---

```
DATABASE REVIEW ITEM
- Object: platform.media_assets — media_assets_deny_all policy name vs. PERMISSIVE behavior
- Application Scope: VCSM
- Current behavior: Policy `media_assets_deny_all` on `platform.media_assets` (authenticated role)
  has cmd=ALL, qual='false'. The name suggests a deny-all policy, but in Postgres RLS,
  PERMISSIVE policies with false simply never grant access — they do NOT deny access when
  other PERMISSIVE policies allow it.
- Problem: The policy name is misleading. A true "deny all unless explicitly allowed" model 
  requires RESTRICTIVE policies (not PERMISSIVE ones). The `media_assets_deny_all` policy 
  is a no-op — it neither grants nor denies anything. Developers reading the schema may 
  assume it implements security control when it does not.
- Why it matters: Misleading security control creates false confidence during audits.
  If a future developer removes "allow" policies believing the "deny_all" provides a fallback 
  floor, media assets would become fully unreadable (correct behavior accidentally). But if they 
  add new "allow" policies thinking the deny_all is a restrictive layer (it is not), they may 
  grant more access than intended.
- Recommended improvement: Either:
  (A) Rename the policy to `media_assets_base_deny_permissive` with a comment explaining it is 
      documentation-only and does not restrict access when other policies grant it.
  (B) Convert to a RESTRICTIVE policy if the intent is genuinely deny-all-unless-listed:
      `CREATE POLICY media_assets_restrict_all ON platform.media_assets AS RESTRICTIVE ...`
  (C) Drop the policy entirely if it provides no access control value.
- Rationale: Policy intent must match implementation. Misleading policy names undermine 
  security review confidence.
- Risk if unchanged: Medium — audit confusion and potential future misuse.
- Example SQL proposal (text only, do not run):
  -- Option A (rename + comment only):
  -- ALTER POLICY media_assets_deny_all ON platform.media_assets RENAME TO media_assets_base_noop;
  -- COMMENT ON POLICY media_assets_base_noop ON platform.media_assets IS 
  --   'PERMISSIVE false — never grants access but does NOT restrict other PERMISSIVE policies. 
  --    Not a security control. Present for intent documentation only.';
  -- Text only — do not execute.
```

---

```
DATABASE REVIEW ITEM ⚠️ CONFIRMED BROKEN
- Object: vc.get_vport_portfolio, vc.get_barber_vport_portfolio, vc.get_barber_vport_portfolio_item_detail
  — reference vc.vport_portfolio_* tables that DO NOT EXIST in the database
- Application Scope: VCSM
- Current behavior: These three SECURITY DEFINER RPCs reference:
    vc.vport_portfolio_items, vc.vport_portfolio_media, vc.vport_portfolio_tags,
    vc.vport_barber_portfolio_details, vc.vport_portfolio_item_metrics, vc.vport_portfolio_item_services
  LIVE DB VERIFICATION: `SELECT table_schema, table_name, table_type FROM information_schema.tables 
    WHERE table_schema = 'vc' AND table_name IN ('vport_portfolio_items', ...)` returned EMPTY — 
  none of these tables exist as either base tables or views.
  The active application tables are in the `vport` schema (vport.portfolio_items etc. — confirmed 
  via RLS policy presence above).
  The newer vport.get_business_card_sections RPC correctly references vport.portfolio_items.
- Problem: All three RPCs will throw "relation vc.vport_portfolio_items does not exist" 
  if invoked. They are completely broken. The schema was migrated from vc.vport_portfolio_* 
  to vport.portfolio_* but these legacy RPC bodies were not updated.
- Why it matters: If vc.get_vport_portfolio or vc.get_barber_vport_portfolio are called by 
  any DAL in the application (confirmed by prior ARCHITECT review: 
  engines/portfolio/src/dal/portfolio.read.dal.js), those calls will fail with a 
  "relation does not exist" runtime error. Any public portfolio display path using these RPCs 
  is completely broken in production.
- Recommended improvement: Update the three RPCs to reference the correct vport.* schema:
  vc.vport_portfolio_items → vport.portfolio_items
  vc.vport_portfolio_media → vport.portfolio_media  
  vc.vport_portfolio_tags → vport.portfolio_tags
  vc.vport_barber_portfolio_details → vport.barber_portfolio_details
  vc.vport_portfolio_item_metrics → vport.portfolio_item_metrics
  vc.vport_portfolio_item_services → vport.portfolio_item_services
  Also update SET search_path to include 'vport'.
  NOTE: Column structure may differ (vc.vport_portfolio_items used actor_id; 
  vport.portfolio_items uses profile_id) — the RPC bodies may need column name updates too.
- Rationale: These RPCs are currently non-functional. All public portfolio display paths 
  calling them will throw at runtime.
- Risk if unchanged: CRITICAL — any call to these RPCs will fail with a database error.
  Public portfolio display for all VPORT types that use these read paths is broken.
- Example SQL proposal (text only, do not run):
  -- UPDATE get_vport_portfolio to reference vport.* schema:
  -- CREATE OR REPLACE FUNCTION vc.get_vport_portfolio(p_actor_id uuid, p_limit integer DEFAULT 24, p_offset integer DEFAULT 0)
  -- RETURNS TABLE(...)
  -- LANGUAGE sql STABLE SECURITY DEFINER
  -- SET search_path TO 'vport', 'vc', 'public'
  -- SET row_security TO 'off'
  -- AS $$
  --   SELECT ... FROM vport.portfolio_items i  -- was: vc.vport_portfolio_items
  --   LEFT JOIN vport.portfolio_media cm ... -- was: vc.vport_portfolio_media
  --   WHERE i.profile_id IN (            -- was: i.actor_id = p_actor_id (column name changed!)
  --     SELECT id FROM vport.profiles WHERE actor_id = p_actor_id
  --   ) ...
  -- $$;
  -- NOTE: column schema may differ between old vc.* and new vport.* tables — 
  --       inspect vport.portfolio_items column list before writing the replacement.
  -- Text only — do not execute. Delegate to Carnage for full migration plan.
```

---

## Summary of Policy Coverage

| Table | SELECT Protected | INSERT Protected | UPDATE Protected | DELETE Protected | Ownership Basis |
|---|---|---|---|---|---|
| `vport.portfolio_items` | ✅ | ✅ | ✅ | ✅ | `actor_can_manage_profile` → `owner_user_id` + `profile_actor_access` |
| `vport.portfolio_media` | ✅ | ✅ | ✅ | ✅ | `actor_can_manage_profile` → `owner_user_id` + `profile_actor_access` |
| `vport.portfolio_tags` | ✅ | ✅ | N/A | ✅ | Direct: `owner_user_id` + `actor_owners` (no team path) |
| `vport.barber_portfolio_details` | ✅ | ✅ | ✅ | ✅ | `actor_can_manage_profile` via `portfolio_items` join |
| `vport.locksmith_portfolio_details` | ✅ | ✅ | ✅ | ✅ | `actor_can_manage_profile` via `portfolio_items` join + redundant `owner_all` |
| `vport.profiles` | ✅ | service-role only | ✅ | ✅ | `actor_owners` join |
| `vc.actors` | ✅ | — | ✅ | — | `vc.is_actor_owner` (actor_owners) |
| `vc.actor_owners` | ✅ (own rows) | ✅ (self) | — | — | `user_id = auth.uid()` |
| `platform.media_assets` | ✅ | ✅ | ✅ | — | `actor_owners` join with `is_void=false` |

## PORT-V-007 Final Status

| Finding | Previous Status | Live DB Evidence | New Status |
|---|---|---|---|
| PORT-V-007: `vport.portfolio_items` RLS | UNVERIFIED | rls_enabled=true, 4 policies present using actor_can_manage_profile | ✅ VERIFIED |
| PORT-V-007: `vport.portfolio_media` RLS | UNVERIFIED | rls_enabled=true, 4 policies present | ✅ VERIFIED |
| PORT-V-007: `vport.portfolio_tags` RLS | UNVERIFIED | rls_enabled=true, 3 policies (team path missing) | ✅ VERIFIED WITH CAVEAT (DB-PORT-004) |

**VENOM portfolio card report (`2026-05-23_17-00_venom_portfolio-card.md`) PORT-V-007 should be updated:**  
- Severity: downgrade from HIGH to LOW/INFO for the "RLS absent" concern  
- Note: RLS IS present and using actor_can_manage_profile correctly for portfolio_items/media  
- Remaining concern: portfolio_tags team path gap (DB-PORT-004 — LOW risk)  
- NEW CRITICAL: `vc.get_vport_portfolio` + 2 related RPCs reference `vc.vport_portfolio_*` tables  
  that DO NOT EXIST — these RPCs fail at runtime with "relation does not exist" errors.  
  Any public portfolio read path using these RPCs is completely broken in production. (DB-PORT-007)

---

## Items Requiring Follow-up

| ID | Area | Follow-up Needed | Command |
|---|---|---|---|
| DB-PORT-001 | `actor_can_manage_profile` 2-arg ignores actor_id | Decide: remove 2-arg or fix it to use actor_id | Carnage |
| DB-PORT-002 | `current_actor_id()` non-deterministic | Add ORDER BY to function | Carnage |
| DB-PORT-003 | `portfolio_tags` team path gap | Align with `actor_can_manage_profile` or document intent | Carnage |
| DB-PORT-004 | `locksmith_portfolio_details` redundant policy | Drop `owner_all` | Carnage |
| DB-PORT-005 | `profiles` duplicate UPDATE policies | Drop one | Carnage |
| DB-PORT-006 | `media_assets_deny_all` misleading name | Rename or convert to RESTRICTIVE | Carnage |
| DB-PORT-007 | `vc.get_vport_portfolio` + 2 other RPCs reference non-existent tables | **CONFIRMED BROKEN** — tables don't exist; RPCs fail at runtime; update to `vport.*` schema | Carnage |

---

*Report generated from live Supabase instance. All findings are read-only analysis. No database objects were modified. All SQL proposals are text-only and must not be executed automatically.*
