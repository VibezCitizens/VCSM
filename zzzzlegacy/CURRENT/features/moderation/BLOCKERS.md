# BLOCKERS — moderation

**Last updated:** 2026-06-04 (post-push)
**Source:** TICKET-MODERATION-DB-GUARD-APPLY-0001 + TICKET-MODERATION-MIGRATION-PROMOTION-0002

---

## BLOCKER-MOD-001 — CARNAGE Migration Pre-Step A — CLOSED ✓

**Status:** CLOSED — 2026-06-04
**Resolution:** `supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql` created and applied to live DB.
Live migration history confirms: `20260510070000 | 20260510070000` — APPLIED.

---

## BLOCKER-MOD-002 — Duplicate Migration Timestamp — CLOSED ✓

**Status:** CLOSED — 2026-06-04
**Resolution:** `20260527120000_platform_media_assets_rls_role_hardening.sql` renamed to `20260527130000_platform_media_assets_rls_role_hardening.sql`. No duplicate timestamp remains.

---

## BLOCKER-MOD-003 — learning.is_current_user_platform_admin() Unconfirmed — OPEN

**Blocking:** Moderator app-layer access confirmation
**Severity:** MEDIUM
**Type:** RPC existence unconfirmed — push has already occurred

Push proceeded safely. The DAL handles absence via 42P01 error code (returns false).
Post-push verification: run `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'learning' AND routine_name = 'is_current_user_platform_admin';`

---

## BLOCKER-MOD-004 — Migration 20260527080000 Policy Conflict — OPEN (NEW)

**Blocking:** 8 remaining security migrations (20260527080000 through 20260528000001)
**Severity:** HIGH
**Type:** Migration idempotency failure
**Ticket:** Requires new CARNAGE ticket

The push failed at migration `20260527080000_drop_public_role_policies_phase_a.sql` with:
```
ERROR: policy "availability_rules_delete_manager" for table "availability_rules" already exists (SQLSTATE 42710)
```

The migration's own comment states: "All drops and creates were executed together in a single SQL run on 2026-05-27." The policies were manually applied before migration tracking. The migration must be made idempotent (`CREATE POLICY IF NOT EXISTS` or `DROP POLICY IF EXISTS` before create) before the remaining 8 migrations can be pushed.

**Migrations still pending (8):**
- `20260527080000_drop_public_role_policies_phase_a.sql` (failed — needs idempotency fix)
- `20260527090000_drop_legacy_owner_availability_rules_policies.sql`
- `20260527100000_harden_bookings_and_profiles_delete_policies.sql`
- `20260527110000_create_vport_subscriber_rpcs.sql`
- `20260527120000_drop_legacy_subscriber_rpcs.sql`
- `20260527130000_platform_media_assets_rls_role_hardening.sql`
- `20260528000000_create_actor_social_settings.sql`
- `20260528000001_actor_social_settings_owner_delegation_rls.sql`

**Required resolution:** CARNAGE audit of `20260527080000` — determine which CREATE POLICY statements conflict with live DB state; add DROP IF EXISTS before each CREATE, or use CREATE POLICY IF NOT EXISTS. Then re-run push.

---

## BLOCKER-MOD-THOR-001 — THOR Release Gate — READY_FOR_RECHECK

**Status:** READY_FOR_RECHECK — 2026-06-04
**Previous status:** BLOCKED

VENOM-001 / BW-001 migration applied to live DB. Primary CRITICAL blocker resolved.
THOR gate cannot move to READY until user confirms validation queries.

**Remaining to close the gate:**
1. Run: `SELECT pg_get_functiondef('moderation.can_manage_domain(text)'::regprocedure);`
   — confirm vc branch now queries learning.platform_admins
2. Run: `SELECT moderation.can_manage_domain('vc');` as non-admin — must return FALSE
3. Run: `SELECT moderation.can_manage_domain('vc');` as platform admin — must return TRUE
4. Once confirmed: update VENOM-001 and BW-001 to RESOLVED/HARDENED

---

## Deployment order constraint (still active)

FORCE RLS migrations (Batch 5 / batch5_20260510110000_force_rls_moderation_tables.sql)
MUST NOT be pushed until validation queries confirm Batch 1 is functioning correctly.

---

*BLOCKERS.md updated: 2026-06-04 (post-push) | TICKET-MODERATION-MIGRATION-PROMOTION-0002*
