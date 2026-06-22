# CARNAGE Migration Report — TICKET-0005: bookings_select_actor_owner Live RLS Verification

**Date:** 2026-05-27
**Reviewer:** CARNAGE
**Ticket:** TICKET-0005 — Verify bookings_select_actor_owner Live RLS
**Application Scope:** VCSM
**Mode:** READ-ONLY INVESTIGATION — no schema modifications applied
**Trigger:** TICKET-0004 close-out; migration `20260523040000` drops `bookings_select_owner` and references `bookings_select_actor_owner` as pre-existing but no tracked migration creates it. Investigating whether the policy exists on the live DB, what it contains, and what repair is needed.

---

## CARNAGE MIGRATION REPORT

**Application Scope:** VCSM
**Migration reason:** Verify that `bookings_select_actor_owner` (and related booking SELECT/UPDATE policies) exist on the live DB and use the canonical `actor_owners`-based ownership check. Confirm whether migration drift requires a repair migration.
**Migration type:** Verification-only — potential repair migration proposal if policies are missing or non-canonical
**Migration Safety Status:** CAUTION
**Confidence:** HIGH (live DB state confirmed via 2026-05-26 migration reconciliation snapshot and 2026-05-14 full schema audit)

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vport.bookings` SELECT policies | Booking-sensitive + Identity-sensitive | Governs which actors can read booking records. Missing or weak policy → any authenticated user can read all bookings for any resource. |
| `vc.actor_owners` | Identity-sensitive + Ownership-sensitive | Authority table referenced in ownership subqueries |
| `vport.resources` | Ownership-sensitive | JOIN target for owner policy subqueries |

---

## INVESTIGATION TIMELINE

Sources used for live DB state reconstruction (direct psql unavailable — no service role credentials in env):

| Source | Date | Relevance |
|---|---|---|
| `2026-05-26_18-00_db_migration-reconciliation.md` | 2026-05-26 | Live DB connection confirmed; per-policy LIVE_PRESENT/LIVE_MISSING verification for all 50 migrations |
| `2026-05-14_18-45_db_vport-rls-full-schema-audit.md` | 2026-05-14 | Full schema dump with exact policy USING clauses for booking policies |
| `2026-05-14_thor_booking-postfix-release-gate.md` | 2026-05-14 | THOR confirmed booking SELECT policies live before release gate |
| Migration file inspection (20260415010000–20260527040000) | Various | Migration source inventory for all `vport.bookings` policy changes |

---

## CURRENT STRUCTURE

### vport.bookings — confirmed live policy inventory

| Policy Name | Command | Role | Confirmed Live | Source |
|---|---|---|---|---|
| `bookings_select_customer` | SELECT | authenticated | **LIVE_PRESENT** | Created in `20260515010000` (LOCAL_ONLY; object confirmed by reconciliation) |
| `bookings_select_actor_owner` | SELECT | authenticated | **LIVE_PRESENT** | Applied out-of-band; confirmed by reconciliation (line: `bookings_select_actor_owner: LIVE_PRESENT`) |
| `bookings_select_resource_neutral` | SELECT | (see note) | **LIVE_PRESENT** | Confirmed by 2026-05-14 full schema audit; USING clause captured |
| `bookings_insert_public_pending` | INSERT | PUBLIC | **LIVE_PRESENT** | Dropped + recreated in `20260523040000`; tautology fix confirmed live |
| `bookings_insert_actor_owner` | INSERT | authenticated | **LIVE_PRESENT** | Confirmed by 2026-05-14 audit and CARNAGE insert-owner report |
| `bookings_update_customer` | UPDATE | authenticated | **LIVE_PRESENT** | Confirmed by 2026-05-14 full schema audit |
| `bookings_update_vport_owner` | UPDATE | authenticated | **LIVE_PRESENT** | Confirmed by 2026-05-14 full schema audit |
| `bookings_update_resource_neutral` | UPDATE | authenticated | **LIVE_PRESENT** | Confirmed by 2026-05-14 full schema audit |
| `bookings_select_owner` (LEGACY) | SELECT | authenticated | **NOT PRESENT** | Dropped by `20260523040000`; absence confirmed by reconciliation |
| `bookings_insert_owner` (LEGACY) | INSERT | PUBLIC | **NOT PRESENT** | Dropped by `20260523040000`; absence confirmed by reconciliation |

**Note on `bookings_select_resource_neutral`:** The 2026-05-14 schema audit captured its USING clause as:
```
current_actor_can_manage_resource(resource_id)
OR customer_actor_id = current_actor_id()
OR created_by_actor_id = current_actor_id()
```
This is a PERMISSIVE policy covering owner, customer, and creator paths in one. Combined with `bookings_select_customer` and `bookings_select_actor_owner`, there is full read coverage for all booking parties.

### bookings_select_actor_owner — USING clause status

**Exact USING clause: NOT CAPTURED IN ANY TRACKED MIGRATION FILE**

This is the core audit gap. The policy name and live presence are confirmed. Its exact SQL was applied out-of-band (before `20260515010000` was finalized) and was not captured in the migration's current source. The 2026-05-14 CARNAGE design doc proposed `bookings_select_party_only` (three-branch policy covering customer, owner, member). The live policy was renamed/replaced with the actor_owners-based pattern.

Based on the policy name, the schema audit report's description ("resources JOIN actor_owners"), and the canonical pattern established by `20260515020000` and `20260523040000`, the expected USING clause is:

```sql
-- INFERRED — must be verified via pg_policies before repair migration is written
resource_id IN (
  SELECT r.id FROM vport.resources r
  WHERE r.owner_actor_id IN (
    SELECT ao.actor_id FROM vc.actor_owners ao
    WHERE ao.user_id = auth.uid()
      AND COALESCE(ao.is_void, false) = false
  )
)
```

---

## MIGRATION BLAST RADIUS

**Affected systems:** `vport.bookings` SELECT paths (all booking reads)
**Runtime impact:** NONE on current live DB — all policies are present and functional
**Release impact:** LOW — no code changes required; this is a tracking/governance issue
**Rollback impact:** N/A — no migration to roll back; investigation is read-only

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vport.bookings` SELECT | CRITICAL — booking data is PII-sensitive | CAUTION — policies present on live DB but not canonically tracked | Repair migration to capture `bookings_select_actor_owner` SQL idempotently |
| `vport.bookings` UPDATE | DIRECT | LOW — update policies confirmed live by 2026-05-14 audit | Verify in repair migration scope |
| `vport.bookings` INSERT | DIRECT | LOW — `bookings_insert_public_pending` (fixed), `bookings_insert_actor_owner` both confirmed | No action needed |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| All booking reads (dashboard, schedule, history, customer view) | NONE (current) | Policies exist on live DB — reads work | N/A — live state is functional |
| Fresh deployment / DB reset | HIGH | `bookings_select_actor_owner` is not in any current tracked migration file. A fresh deployment would create `bookings_select_owner` (legacy, from `20260515010000`) but NOT `bookings_select_actor_owner` | Repair migration required |
| `supabase db push` risk | HIGH | `20260515010000` through `20260523040000` are LOCAL_ONLY + OUT-OF-ORDER (see reconciliation §2). CLI would refuse to apply them due to version ordering conflict | Migration history registration plan required |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| Migration source vs live state | `20260515010000` — source shows `bookings_select_owner` (legacy); live has `bookings_select_actor_owner` | File was modified after out-of-band application |
| Migration history gap | Migrations 20260515010000–20260523040000 are LOCAL_ONLY | 19 of 50 migrations unregistered; documented in 2026-05-26 reconciliation |
| Out-of-order conflict | 5 migrations (20260523010000–20260523190000) sort before two history-confirmed entries | CLI push blocked; requires history INSERT option |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Booking read isolation | LOW (currently) — policies cover all legitimate parties | pg_policies query | Repair migration captures exact policy SQL |
| Owner identity | LOW — `actor_owners` canonical pattern confirmed by name and schema audit | pg_policies USING clause | Must verify exact condition before repair |
| Fresh deployment gap | HIGH — no tracked SQL for `bookings_select_actor_owner` | `supabase db push` on fresh DB | Repair migration adds idempotent CREATE |

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Phase 0 — Verify USING clause | User runs pg_policies query in Supabase dashboard | NONE (read-only) | Required before repair migration can be written |
| Phase 1 — Repair migration | New idempotent migration: DROP IF EXISTS + CREATE bookings_select_actor_owner with verified SQL | LOW | Must use confirmed USING clause from Phase 0 |
| Phase 2 — History registration | Register LOCAL_ONLY migrations per 2026-05-26 reconciliation Priority 1+2 | MEDIUM | Out-of-order handling required; see reconciliation doc §8 |

---

## ROLLBACK SURVIVABILITY

**Rollback status:** FULL — RLS policies are drop/recreate with no data loss
**Data recovery risk:** NONE
**Compatibility rollback risk:** LOW — if repair migration were dropped, live DB reverts to current state (no regression, just governance gap)
**Operational complexity:** LOW

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| bookings_select_actor_owner LIVE_PRESENT | **CONFIRMED** | 2026-05-26 reconciliation |
| bookings_select_resource_neutral LIVE_PRESENT | **CONFIRMED** | 2026-05-14 schema audit |
| bookings_select_customer LIVE_PRESENT | **CONFIRMED** | reconciliation + migration tracking |
| bookings_insert_public_pending (tautology fixed) LIVE_PRESENT | **CONFIRMED** | 20260523040000 applied out-of-band; reconciliation confirms |
| bookings_insert_actor_owner LIVE_PRESENT | **CONFIRMED** | 2026-05-14 schema audit |
| bookings_update_* policies LIVE_PRESENT | **CONFIRMED** | 2026-05-14 schema audit |
| Legacy bookings_select_owner DROPPED | **CONFIRMED** | reconciliation confirms NOT PRESENT |
| Legacy bookings_insert_owner DROPPED | **CONFIRMED** | reconciliation confirms NOT PRESENT |
| bookings_select_actor_owner exact USING clause captured | **PENDING** | Must query pg_policies (Phase 0) |
| Repair migration written and tracked | **PENDING** | Depends on Phase 0 |
| Migration history registration complete | **PENDING** | Depends on 2026-05-26 reconciliation Priority 1+2 plan |

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

**Object:** `bookings_select_actor_owner`
**Current behavior:** Policy exists on live DB and provides owner-level booking SELECT access via `actor_owners` canonical pattern (name confirms; exact USING clause unverified)
**Migration risk:** NONE to live DB. Risk is on fresh deployment: policy absent → any authenticated user can read all bookings if no SELECT policy restricts access (unless `bookings_select_resource_neutral` covers it — it does include the `current_actor_can_manage_resource` branch, which routes through `actor_owners` internally)
**Potential impact:** On fresh deployment without repair migration: owner dashboard would be protected by `bookings_select_resource_neutral` (which includes `current_actor_can_manage_resource`), but `bookings_select_actor_owner` (direct actor_owners check) would be absent. Whether this causes functional gaps depends on whether `bookings_select_resource_neutral` fully covers the owner path.
**Recommended safeguards:** Phase 0 verify + Phase 1 repair migration

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vport.bookings` | VCSM | NONE — vport schema is VCSM-exclusive | CLEAN |
| `vc.actor_owners` | VCSM (shared vc schema) | NONE — no Wentrex/Traffic involvement | CLEAN |

---

## PHASE 0 VERIFICATION QUERY

**Run in Supabase SQL editor (READ ONLY) before writing repair migration:**

```sql
-- Q1: All current policies on vport.bookings with full USING/WITH_CHECK clauses
SELECT
  policyname,
  roles,
  cmd,
  permissive,
  qual     AS using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'vport'
  AND tablename  = 'bookings'
ORDER BY cmd, policyname;

-- Q2: Verify RLS is enabled
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'bookings'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vport');

-- Q3: Verify migration history for booking-related migrations
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version LIKE '202605%'
ORDER BY version;
```

---

## PROPOSED REPAIR MIGRATION (text only — do not run until Phase 0 complete)

```sql
-- =============================================================================
-- Migration: track_bookings_select_actor_owner
-- Date: 2026-05-27 (proposed)
-- Ticket: TICKET-0005
--
-- PURPOSE:
--   bookings_select_actor_owner exists on the live DB but is not defined in
--   any current tracked migration. This migration idempotently re-establishes
--   it with the canonical actor_owners-based USING clause.
--
--   The exact USING clause MUST be confirmed via Phase 0 pg_policies query
--   before this migration is finalized. Replace the placeholder below.
--
-- IDEMPOTENT: Yes — DROP IF EXISTS before CREATE
-- ROLLBACK:   DROP POLICY IF EXISTS bookings_select_actor_owner ON vport.bookings;
-- =============================================================================

DROP POLICY IF EXISTS bookings_select_actor_owner ON vport.bookings;

-- PLACEHOLDER — replace with exact USING clause from Phase 0 pg_policies query
-- Expected pattern based on schema audit and policy name:
CREATE POLICY bookings_select_actor_owner ON vport.bookings
  FOR SELECT
  TO authenticated
  USING (
    resource_id IN (
      SELECT r.id
      FROM   vport.resources r
      WHERE  r.owner_actor_id IN (
        SELECT ao.actor_id
        FROM   vc.actor_owners ao
        WHERE  ao.user_id = auth.uid()
          AND  COALESCE(ao.is_void, false) = false
      )
    )
  );

NOTIFY pgrst, 'reload schema';
```

**CRITICAL NOTE:** Do not apply this migration until the Phase 0 query confirms the exact USING clause. If the live policy uses a different condition (e.g., `vport.current_actor_can_manage_resource(resource_id)` or includes a member branch), the migration must match what is live to avoid behavior regression.

---

## SCHEDULING IMPLICATIONS FOR TICKET-0006 AND TICKET-0007

| Ticket | Subject | Dependency on TICKET-0005 | Migration Window |
|---|---|---|---|
| TICKET-0006 | list_subscribers / count_subscribers RPC auth model | NONE — different schema area (vc.actor_follows, RPCs) | Can proceed immediately |
| TICKET-0007 | Drop legacy profiles_select_by_owner_user | NONE — targets vport.profiles SELECT policy | Can proceed in its own migration window after TICKET-0006 |

**TICKET-0005 does not block TICKET-0006 or TICKET-0007.** The booking policies are present on the live DB. The repair migration is a governance/deployment-safety task, not a live security gap.

**Recommended order:**
1. TICKET-0006 — can start immediately
2. TICKET-0007 — after TICKET-0006 analysis complete
3. TICKET-0005 repair migration — after Phase 0 pg_policies query

---

## RECOMMENDED HANDOFFS

| Command | Reason | Status |
|---|---|---|
| DB | Phase 0 pg_policies query — must be run by user in Supabase dashboard | PENDING USER ACTION |
| CARNAGE | Phase 1 repair migration — write after Phase 0 result confirmed | PENDING Phase 0 |
| THOR | Release gate — repair migration LOW priority; existing live DB is protected | INFORM after repair |

---

## FINAL CARNAGE STATUS: CAUTION

**Reason:** Live DB is protected — all booking SELECT/UPDATE/INSERT policies confirmed present and functional. Migration tracking gap means a fresh deployment would be missing `bookings_select_actor_owner`. Repair migration is required but is not blocking any current release. TICKET-0006 and TICKET-0007 can proceed immediately.

**Immediate action required from user:**
Run the Phase 0 pg_policies query in the Supabase dashboard to capture the exact `bookings_select_actor_owner` USING clause. Share the output so CARNAGE can write the final repair migration.

---

## PHASE 0 RESULTS — CONFIRMED 2026-05-27

Full `vport.bookings` policy dump retrieved from live DB. Complete inventory:

| Policy | CMD | Roles | USING | WITH CHECK | Status |
|---|---|---|---|---|---|
| `bookings_insert_actor_owner` | INSERT | {authenticated} | — | `source IN ('owner','admin','import','sync') AND EXISTS (resources r JOIN actor_owners ao ON ao.actor_id = r.owner_actor_id WHERE r.id = bookings.resource_id AND ao.user_id = auth.uid() AND NOT ao.is_void)` | CANONICAL ✓ |
| `bookings_insert_public_pending` | INSERT | {public} | — | Full public booking check; `r.profile_id = bookings.profile_id` tautology fix confirmed | CANONICAL ✓ |
| `bookings_select_actor_owner` | SELECT | {authenticated} | `EXISTS (resources r JOIN actor_owners ao ON ao.actor_id = r.owner_actor_id WHERE r.id = bookings.resource_id AND ao.user_id = auth.uid() AND NOT ao.is_void)` | — | CANONICAL ✓ — repair migration `20260527050000` captures this exactly |
| `bookings_select_customer` | SELECT | {authenticated} | `customer_actor_id = vc.current_actor_id()` | — | CANONICAL ✓ |
| `bookings_select_resource_neutral` | SELECT | **{public}** | `vport.current_actor_can_manage_resource(resource_id) OR customer_actor_id = vc.current_actor_id() OR created_by_actor_id = vc.current_actor_id()` | — | FUNCTIONAL — governance note: {public} role (see below) |
| `bookings_update_actor_owner` | UPDATE | {authenticated} | same as bookings_select_actor_owner | same | CANONICAL ✓ |
| `bookings_update_customer` | UPDATE | **{public}** | `customer_actor_id = vc.current_actor_id()` | same | FUNCTIONAL — governance note: {public} role |
| `bookings_update_resource_neutral` | UPDATE | **{public}** | `current_actor_can_manage_resource(resource_id) OR customer_actor_id = vc.current_actor_id()` | same | FUNCTIONAL — governance note: {public} role |
| `bookings_update_vport_owner` | UPDATE | **{public}** | `vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)` | same | FUNCTIONAL — governance note: {public} role |

### {public} role governance finding

Four UPDATE policies and one SELECT policy use `{public}` role instead of `{authenticated}`. This is the same pattern documented in the 2026-05-26 reconciliation for `availability_rules` (security bypass finding, rated MEDIUM). The SECURITY DEFINER guards (`current_actor_id()`, `current_actor_can_manage_resource`) return NULL for unauthenticated callers, blocking anon access at evaluation time. There is no immediate exploit path, but it bypasses PostgREST's role-based enforcement layer.

**Action:** Include these policies in the same role-hardening pass as `availability_rules` and `fuel_price_submissions` — change from {public} to {authenticated}. Track as a separate cleanup migration. Not blocking current release.

### Untracked policies

In addition to `bookings_select_actor_owner` (covered by repair migration `20260527050000`), the following confirmed-live policies are not in any tracked migration source: `bookings_insert_actor_owner`, `bookings_select_resource_neutral`, `bookings_update_actor_owner`, `bookings_update_customer`, `bookings_update_resource_neutral`, `bookings_update_vport_owner`. These should be tracked in a follow-up migration as part of the broader migration history registration plan from the 2026-05-26 reconciliation.

### Repair migration status

`20260527050000_track_bookings_select_actor_owner.sql` — USING clause confirmed exact match with live DB. Migration is correct and ready to register.

---

## FINAL TICKET-0005 STATUS: CLOSED

**`bookings_select_actor_owner`**: LIVE_PRESENT, CANONICAL, USING clause confirmed.
**Repair migration**: `20260527050000` written with verified SQL — ready to apply/register.
**Remaining governance work**: {public} role cleanup + untracked policy tracking — deferred to separate migration pass.
**TICKET-0006 and TICKET-0007**: UNBLOCKED.

---

*Report generated by CARNAGE — READ ONLY — 2026-05-27*
*Application scope: VCSM*
*No database changes were made during this analysis.*
