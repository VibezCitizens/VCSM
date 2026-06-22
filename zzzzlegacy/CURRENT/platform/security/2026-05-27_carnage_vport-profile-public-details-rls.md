# CARNAGE MIGRATION REPORT — vport.profile_public_details RLS

**Date:** 2026-05-27
**Reviewer:** CARNAGE
**Ticket:** TICKET-0004 — Settings P0 / VENOM-SETTINGS-002
**Trigger:** ELEKTRA Batch 1 Settings P0 — code-level guards applied; DB-layer gap verified via live DB inspection.

**Application Scope:** VCSM
**Migration file:** `apps/VCSM/supabase/migrations/20260527030000_vport_profile_public_details_rls.sql`

---

## VENOM-SETTINGS-002 — Final Resolution Status

**Status: RESOLVED**

The original finding stated: "If RLS is absent on vport.profile_public_details, any authenticated user with a known profile_id can overwrite another VPORT's public identity data."

Live DB inspection confirmed:
- RLS was already enabled before this migration
- INSERT/UPDATE ownership policies already existed (owner_user_id pattern, partially redundant)
- The CARNAGE hypothesis (zero RLS) was wrong — RLS was on; the tracking gap was in the migration files

The migration `20260527030000` was revised to reflect the actual pre/post state rather than the assumed state.

---

## Live DB State — Pre-Migration (confirmed 2026-05-27)

**RLS:** ENABLED (`rls_enabled: true`, `rls_forced: false`)

**Policies (6 — messy state before cleanup):**

| Policy | Cmd | Roles | Gate | Issue |
|---|---|---|---|---|
| "Public can read details for listed VPORT profiles" | SELECT | anon, authenticated | `is_active AND is_deleted=false AND directory_visible=true AND directory_status='listed'` | None — functional |
| `ppd_insert_owner_only` | INSERT | authenticated | `owner_user_id = auth.uid()` | Legacy pattern (owner_user_id) |
| `ppd_update_owner_only` | UPDATE | authenticated | `owner_user_id = auth.uid()` | Legacy pattern (owner_user_id) |
| `profile_public_details_delete` | DELETE | public | `actor_can_manage_profile` | Dead — no DELETE grant for authenticated/anon |
| `profile_public_details_insert` | INSERT | public | `actor_can_manage_profile` | Redundant; TO public instead of TO authenticated |
| `profile_public_details_update` | UPDATE | public | `actor_can_manage_profile` | Redundant; TO public instead of TO authenticated |

**Grants (pre-migration):**

| Grantee | Privilege |
|---|---|
| anon | SELECT |
| authenticated | SELECT, INSERT, UPDATE |
| postgres | ALL (owner) |

---

## Live DB State — Post-Migration (verified 2026-05-27)

**RLS:** ENABLED

**Policies (3 — clean canonical state):**

| Policy | Cmd | Roles | Gate |
|---|---|---|---|
| `public_details_select_listed` | SELECT | anon, authenticated | `is_active AND is_deleted=false AND directory_visible=true AND directory_status='listed'` |
| `public_details_insert_managed` | INSERT | authenticated | `actor_can_manage_profile(profile_id)` |
| `public_details_update_managed` | UPDATE | authenticated | `actor_can_manage_profile(profile_id)` (USING + WITH CHECK) |

**Grants:** Unchanged.

---

## What Changed

| Action | Reason |
|---|---|
| Dropped `ppd_insert_owner_only` | Legacy `owner_user_id` pattern — replaced by canonical `actor_can_manage_profile` |
| Dropped `ppd_update_owner_only` | Same |
| Dropped `profile_public_details_insert` | Redundant with new canonical policy; `TO public` was wrong |
| Dropped `profile_public_details_update` | Same |
| Dropped `profile_public_details_delete` | Dead — no DELETE grant; confusingly named |
| Created `public_details_insert_managed` | Canonical `actor_can_manage_profile(profile_id)`, TO authenticated |
| Created `public_details_update_managed` | Same, with both USING and WITH CHECK |
| Renamed SELECT policy to `public_details_select_listed` | Descriptive name matching the filtering behavior |

---

## Owner SELECT Gap — RESOLVED

**Status: RESOLVED — migration 20260527040000 applied 2026-05-27**

The `public_details_select_listed` policy only shows rows for VPORTs where `directory_visible = true AND directory_status = 'listed'`. Owners of new or unlisted VPORTs could not read their own `profile_public_details` row — a "save works but load shows nothing" UX bug for unlisted/new VPORTs.

**Fix applied:**
```sql
CREATE POLICY public_details_select_owner ON vport.profile_public_details
  FOR SELECT
  TO authenticated
  USING (vport.actor_can_manage_profile(profile_id));
```

Migration file: `apps/VCSM/supabase/migrations/20260527040000_vport_profile_public_details_owner_select.sql`

Dual-SELECT PERMISSIVE pattern from `vport.services` (20260523220000) now applied here:
- `public_details_select_listed` — public/anon view, listed VPORTs only
- `public_details_select_owner` — manager view, any owned VPORT regardless of listing state

Combined PERMISSIVE OR effect:
- Anon / non-owner: sees only listed VPORT rows ✓
- Owner/manager: sees their own rows regardless of listing status ✓

---

## Migration Safety Classification

**FINAL CARNAGE STATUS: SAFE**

Policy cleanup only. No schema changes. No data touched. All reads via the existing SELECT policy continue working. Legitimate owner writes continue working via the new canonical policies. Idempotent via DROP IF EXISTS.

**Rollback:** Restore prior 6-policy state from pre-migration evidence. No data loss.

---

## Remaining Deferred Settings Findings (TICKET-0004 Context)

| Finding | Severity | Status |
|---|---|---|
| VENOM-SETTINGS-001 | HIGH | RESOLVED — Batch 1 (code) |
| VENOM-SETTINGS-002 | HIGH | RESOLVED — migration 20260527030000 applied |
| VENOM-SETTINGS-003 | MEDIUM | RESOLVED — Batch 1 (code) |
| Owner SELECT gap | INFO | RESOLVED — migration 20260527040000 applied |
| VENOM-SETTINGS-004 | MEDIUM | DEFERRED — awaiting ARCHITECT guidance |
| VENOM-SETTINGS-005 | LOW | DEFERRED — Batch 5 |
| VENOM-SETTINGS-006 | LOW | DEFERRED — Batch 5 |

---

## Recommended Handoffs

| Command | Reason | Status |
|---|---|---|
| THOR | VENOM-SETTINGS-002 resolved — update release gate | PENDING |
| VENOM | Update VENOM-SETTINGS-002 finding to RESOLVED | PENDING |
| SPIDER-MAN | No test files exist for settings card write path | PENDING |
