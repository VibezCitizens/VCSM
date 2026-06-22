# CARNAGE — Team/Settings RLS Audit

**Date:** 2026-05-27
**Trigger:** TICKET-0003 Phase 3, Step 3 — RLS verification for team card (VENOM-TEAM-003) and settings card (VENOM-SETTINGS-002)
**Scope:** `vport.resources` + `vport.profile_public_details`
**Migration evidence base:** `apps/VCSM/supabase/migrations/`

---

## SECTION 1: vport.resources — VERIFIED ✓

### Finding Summary
**VENOM-TEAM-003 STATUS: RESOLVED**

`vport.resources` has a complete, actor-based RLS policy set. No migration is required.

### Policy Evidence

| Migration | Date | Action |
|---|---|---|
| `20260515010000_vport_booking_resource_rls_policies.sql` | 2026-05-15 | Initial RLS: SELECT (public + owner via `owner_user_id`), INSERT owner, UPDATE owner |
| `20260515020000_vport_resources_actor_rls_rebuild.sql` | 2026-05-15 | **Full rebuild**: replaced 15 overlapping legacy policies with 5 clean actor-based policies via `vc.actor_owners` |
| `20260527020000_vport_resources_update_member_policy.sql` | 2026-05-27 | Added member UPDATE path for barber acceptance flows |

### Current Policy Set (post-rebuild)

| Policy Name | Operation | Ownership Check |
|---|---|---|
| `resources_select_public` | SELECT | `is_active = true` + active non-deleted profile (via `owner_actor_id → vport.profiles`) |
| `resources_select_owner` | SELECT | `vc.actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND NOT is_void` |
| `resources_insert_owner` | INSERT | `vc.actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND NOT is_void` |
| `resources_update_owner` | UPDATE | `vc.actor_owners` (USING + WITH CHECK) |
| `resources_delete_owner` | DELETE | `vc.actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND NOT is_void` |
| `resources_update_member` | UPDATE | `vc.actor_owners WHERE actor_id = member_actor_id AND user_id = auth.uid() AND NOT is_void` |

### Architecture Contract Compliance

- Uses `vc.actor_owners` — canonical ownership model ✓
- No `owner_user_id` in auth checks ✓ (legacy path removed in rebuild)
- No SECURITY DEFINER functions ✓
- `profile_id` made nullable (no longer RLS anchor) ✓
- RLS ENABLED ✓

### Open Issue: Hard DELETE Policy Exists

`resources_delete_owner` allows hard DELETE via actor ownership. VENOM-TEAM-004 (hard delete, no audit trail) is still open as an application design concern — the RLS correctly restricts who can delete, but the deletion is permanent with no `deleted_at` trail. This is a data governance issue, not an RLS issue. Recommending soft-delete migration tracked separately.

### Verdict

VENOM-TEAM-003 is RESOLVED. `vport.resources` RLS is comprehensive, actor-based, and architecture-compliant. The policy set covers SELECT (public + owner), INSERT, UPDATE (owner + member), and DELETE. No CARNAGE migration required for this table.

---

## SECTION 2: vport.profile_public_details — MISSING RLS ⚠

### Finding Summary
**VENOM-SETTINGS-002 STATUS: CONFIRMED — RLS migration required**

No RLS policies exist in any tracked migration for `vport.profile_public_details`. The table has only grants.

### Grant Evidence

| Migration | Date | Action |
|---|---|---|
| `20260427060000_grant_vport_write_permissions.sql` | 2026-04-27 | `GRANT INSERT, UPDATE ON vport.profile_public_details TO authenticated` |
| `20260430600000_grant_vport_profile_public_details_select.sql` | 2026-04-30 | `GRANT SELECT ON vport.profile_public_details TO authenticated, anon` |

### RLS Policy Evidence

**None.** Searching all 52 tracked migrations: no migration contains `ALTER TABLE vport.profile_public_details ENABLE ROW LEVEL SECURITY` or `CREATE POLICY ... ON vport.profile_public_details`. This table has been operating with grants-only protection since 2026-04-27.

### Table Schema (inferred from DAL + migrations)

```
profile_id        — FK to vport.profiles(id), ON CONFLICT anchor
city_id           — FK to cities
website_url       — public
booking_url       — public
email_public      — PII (business email)
phone_public      — PII (business phone)
location_text     — public
address           — JSONB (line1, city, state, zip, country) — PII
lat / lng         — geolocation
hours             — JSONB
highlights        — ARRAY
languages         — ARRAY
payment_methods   — ARRAY
social_links      — JSONB
price_tier        — public
directory_visible — TRAZE visibility flag
directory_status  — TRAZE status (includes 'suspended')
updated_at        — timestamp
```

### Risk Assessment

Without RLS, any authenticated user with a known `profile_id` can:
- **READ:** Any VPORT's `email_public`, `phone_public`, `address`, `lat`/`lng` — but SELECT is granted to `anon` already (data is designed to be public)
- **WRITE:** Overwrite any VPORT's public contact info, address, geolocation, hours, payment methods — no ownership check at DB layer

The write risk is the critical gap. The only protection is the application-layer `assertActorOwnsVportActorController` in `saveVportPublicDetailsByActorIdController`. If that gate is bypassed or the DAL is called directly, the DB has no second line of defense.

Compound risk with VENOM-SETTINGS-001: `upsertVportPublicDetailsDAL` is exported from the module's `index.js` — making the unguarded DAL callable without going through the controller.

### Ownership Model Analysis

`vport.profile_public_details` has no `owner_user_id` column directly. Ownership is established through the FK chain:

```
profile_public_details.profile_id → vport.profiles.id → vport.profiles.owner_user_id
```

For an INSERT/UPDATE RLS policy, the canonical approach is:
```sql
EXISTS (
  SELECT 1 FROM vport.profiles p
  WHERE p.id            = profile_public_details.profile_id
    AND p.owner_user_id = auth.uid()
    AND p.is_active     = true
    AND p.is_deleted    = false
)
```

Or via `actor_owners` (architecture-contract-compliant, preferred):
```sql
EXISTS (
  SELECT 1
  FROM   vport.profiles p
  JOIN   vc.actor_owners ao ON ao.actor_id = p.actor_id
  WHERE  p.id          = profile_public_details.profile_id
    AND  ao.user_id    = auth.uid()
    AND  NOT ao.is_void
)
```

---

## CARNAGE MIGRATION PLAN

### Migration: `vport_profile_public_details_write_rls`

**Filename:** `YYYYMMDD000000_vport_profile_public_details_write_rls.sql`
**Priority:** HIGH — release blocker per VENOM-SETTINGS-002
**Blocking:** Settings card production release

**Proposed policy set:**

```sql
-- Enable RLS (idempotent)
ALTER TABLE vport.profile_public_details ENABLE ROW LEVEL SECURITY;

-- DROP any existing policies (safety — currently none exist)
DROP POLICY IF EXISTS ppd_select_public   ON vport.profile_public_details;
DROP POLICY IF EXISTS ppd_insert_owner    ON vport.profile_public_details;
DROP POLICY IF EXISTS ppd_update_owner    ON vport.profile_public_details;
DROP POLICY IF EXISTS ppd_delete_blocked  ON vport.profile_public_details;

-- SELECT: public — data is designed to be publicly visible
-- SELECT grant to anon already issued in 20260430600000
-- This policy is a no-op gate (all rows visible) consistent with public intent
CREATE POLICY ppd_select_public ON vport.profile_public_details
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- INSERT: owner only — via actor_owners (architecture-contract-compliant)
-- Requires that the caller's user_id owns the VPORT actor linked to the profile
CREATE POLICY ppd_insert_owner ON vport.profile_public_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   vport.profiles p
      JOIN   vc.actor_owners ao ON ao.actor_id = p.actor_id
      WHERE  p.id          = profile_public_details.profile_id
        AND  ao.user_id    = auth.uid()
        AND  NOT ao.is_void
    )
  );

-- UPDATE: owner only — same actor_owners chain
CREATE POLICY ppd_update_owner ON vport.profile_public_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   vport.profiles p
      JOIN   vc.actor_owners ao ON ao.actor_id = p.actor_id
      WHERE  p.id          = profile_public_details.profile_id
        AND  ao.user_id    = auth.uid()
        AND  NOT ao.is_void
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   vport.profiles p
      JOIN   vc.actor_owners ao ON ao.actor_id = p.actor_id
      WHERE  p.id          = profile_public_details.profile_id
        AND  ao.user_id    = auth.uid()
        AND  NOT ao.is_void
    )
  );

-- DELETE: blocked at DB level — no delete path exists in the application
-- Upsert on conflict (INSERT + UPDATE) is the only write pattern
-- This policy makes accidental or malicious DELETE a no-op
CREATE POLICY ppd_delete_blocked ON vport.profile_public_details
  FOR DELETE
  TO authenticated
  USING (false);

NOTIFY pgrst, 'reload schema';
```

### Migration Notes

1. **SELECT policy:** `profile_public_details` is explicitly public-facing data. The `anon` grant already exists. The RLS SELECT policy should not restrict reads.
2. **actor_owners join:** Preferred over `profiles.owner_user_id = auth.uid()` per architecture contract. Uses the `actor_id` FK on `vport.profiles` to route through `vc.actor_owners`.
3. **DELETE blocked:** The application never deletes rows from this table (only upserts on conflict). Blocking DELETE at DB level prevents accidental or adversarial record destruction.
4. **`syncDirectoryVisibleToPublicDetailsDAL`:** The secondary sync DAL uses a bare UPDATE with no `owner_user_id` filter. After RLS is enabled, this UPDATE will also be restricted by the `ppd_update_owner` policy — which enforces `actor_owners`. This means the sync UPDATE will succeed only if the calling session owns the VPORT profile. This is correct behavior and an additional benefit of adding RLS.

### Pre-Migration Testing

Before applying:
1. Verify `vport.profiles.actor_id` is never null for active profiles (the `actor_owners` join requires this to resolve)
2. Verify `vc.actor_owners` has rows for all VPORT actors (scan for orphaned profiles)
3. Test with: owner caller should be able to INSERT/UPDATE; non-owner caller should be rejected; anon should be able to SELECT

---

## SUMMARY

| Table | RLS Status | Action Required |
|---|---|---|
| `vport.resources` | COMPLETE — 6 actor-based policies via `vc.actor_owners` | None — VENOM-TEAM-003 RESOLVED |
| `vport.profile_public_details` | MISSING — grants only, no RLS policies | CREATE migration `vport_profile_public_details_write_rls` |

**CARNAGE verdict:** One migration required. `vport.resources` is fully protected. `vport.profile_public_details` needs an INSERT + UPDATE + DELETE policy set before production release of the settings card.
