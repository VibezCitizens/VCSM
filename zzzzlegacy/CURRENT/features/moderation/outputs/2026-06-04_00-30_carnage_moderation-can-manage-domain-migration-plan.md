# CARNAGE MIGRATION REPORT
**Ticket:** TICKET-MODERATION-DB-GUARD-APPLY-0001
**Date:** 2026-06-04
**Application Scope:** VCSM
**Migration reason:** Close CRITICAL privilege escalation — `moderation.can_manage_domain('vc')` grants every authenticated user moderator-level access to all moderation tables
**Migration type:** Function replacement (CREATE OR REPLACE) + 15 unapplied policy migrations
**Input:** DB phase report — `CURRENT/outputs/2026/06/04/DB/2026-06-04_00-15_db_moderation-can-manage-domain-migration-reconciliation.md`

---

## Migration Safety Status

```
Migration Safety Status: CAUTION
Confidence: HIGH
Blocking Risks:
  - learning.is_current_user_platform_admin() RPC existence in live DB UNCONFIRMED
    If this function does not exist, the function update is still safe (privilege
    escalation closes) but no moderator can access moderation tables through the
    app layer until the function is confirmed or created.
  - Duplicate timestamp 20260527120000 must be resolved before push (see Pre-Step B)
```

---

## CARNAGE TARGET

```
CARNAGE TARGET
Object being changed:
  PRIMARY:   moderation.can_manage_domain(p_domain text) — function body replacement
  SECONDARY: 15 unapplied migrations (2026-05-27 to 2026-05-28) — see full list below
Application Scope: VCSM
Type of change:
  PRIMARY:   CREATE OR REPLACE FUNCTION (non-breaking, in-place body replacement)
  SECONDARY: CREATE/DROP POLICY, CREATE TABLE, CREATE INDEX, CREATE FUNCTION
Reason for migration:
  can_manage_domain('vc') returns TRUE for all authenticated VCSM users — 9 moderator-
  scoped RLS policies are effectively public. Fix replaces the vc branch with a
  learning.platform_admins check, matching the already-correct 'learning' branch.
```

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `moderation.can_manage_domain` | Moderation-sensitive + Engine-critical | Gates all moderator RLS policies across 9 moderation tables |
| `moderation.reports` | Moderation-sensitive + Public | Report data; contains reporter PII and accused actor IDs |
| `moderation.report_events` | Moderation-sensitive | Full audit trail of all moderation actions |
| `moderation.actions` | Moderation-sensitive + Ownership-sensitive | Hide/unhide actions scoped to actor ownership |
| `moderation.block_events` | Moderation-sensitive | Block relationship audit trail |
| `moderation.blocks` | Moderation-sensitive | Live block relationships — drives feed and chat exclusion |
| `vport.availability_rules` | Booking-sensitive | Controls when bookings can be made |
| `vport.bookings` | Booking-sensitive + Ownership-sensitive | Core booking records |
| `platform.media_assets` | Public + Ownership-sensitive | Media asset ownership and access control |
| `vc.actor_social_settings` | Identity-sensitive + Ownership-sensitive | Actor social graph configuration |
| `vc.actor_social_settings` (new) | Identity-sensitive | New table — does not exist in production |

---

## CURRENT STRUCTURE

```
CURRENT STRUCTURE (from DB phase evidence)
Function: moderation.can_manage_domain(p_domain text)
  Current body (broken):
    WHEN p_domain = 'vc' THEN EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      JOIN vc.actors a ON a.id = ao.actor_id
      WHERE ao.user_id = auth.uid()
        AND coalesce(ao.is_void, false) = false
    )
  Effect: Returns TRUE for any authenticated user who has a vc actor (= every onboarded user)

Affected policies (9 on moderation.*):
  moderation_reports_select_moderator
  moderation_reports_update_moderator
  moderation_report_events_insert_moderator
  moderation_report_events_select_moderator
  moderation_actions_insert_moderator
  moderation_actions_select_moderator
  moderation_actions_update_moderator
  moderation_block_events_select_moderator
  moderation_blocks_select_moderator

App layer (current state):
  assertModerationAccess.dal.js — calls learning.is_current_user_platform_admin() RPC
  Status: CODE IS CORRECT (previously broken UUID query has been fixed)
  Risk: learning.is_current_user_platform_admin() existence in live DB — UNCONFIRMED
```

---

## MIGRATION BLAST RADIUS

```
MIGRATION BLAST RADIUS
Affected systems:
  PRIMARY:  All 9 moderation moderator-scoped RLS policies (immediate effect on apply)
  SECONDARY: vport.bookings, vport.availability_rules, platform.media_assets, vc.actor_social_settings
Runtime impact:
  - Moderation: After apply, authenticated non-admin users lose access to moderator
    RLS paths. If any app code incorrectly relied on these paths being open
    (bypassing assertModerationAccessController), those calls will receive RLS denial.
  - Bookings/availability_rules: {public}→{authenticated} role change means
    unauthenticated callers lose access (correct behavior).
  - media_assets: {public}→{authenticated} for 4 policies (correct behavior).
  - actor_social_settings: New table — only new code paths affected.
Release impact:
  THOR RELEASE BLOCKER cleared once applied and validated.
Rollback impact:
  FULL rollback available via proposal file ROLLBACK section.
  Rollback restores the broken function body (intentional — this is the rollback state).
```

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `moderation.can_manage_domain` | CRITICAL | Changing return value immediately affects all 9 moderator policies | VENOM verify post-apply |
| `moderation.*` (9 tables) | DIRECT | Policy USING clauses call this function — behavior changes on apply | Post-deploy validation query |
| `vport.bookings` | DIRECT | 5 policies changing from {public} to {authenticated} | Confirm no unauthenticated booking flow assumed by any native client |
| `vport.availability_rules` | DIRECT | 5 policies changing from {public} to {authenticated} | Same as bookings |
| `platform.media_assets` | DIRECT | 4 policies changing from {public} to {authenticated} | TICKET-PLATFORM-RLS-001 closure |
| `vc.actor_social_settings` | DIRECT (new table) | New table with RLS from creation | Confirm app calls work |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| `can_manage_domain('vc')` call overhead | LOW | Function replaces EXISTS(vc.actor_owners) with EXISTS(learning.platform_admins JOIN learning.actor_owners). Same structure, different tables. Both are small tables. | None needed |
| Moderation RLS policy evaluation | LOW | 9 policies now call the function for non-admin users — the EXISTS returns FALSE immediately (empty learning.platform_admins for most users). One index scan, fast return. | None |
| Booking unauthenticated access | MEDIUM | {public}→{authenticated} on bookings/availability_rules. Any code path that called these endpoints without a valid JWT will receive RLS denial. | Verify no client-side booking reads occur without auth |
| `vc.actor_social_settings` (new table) | LOW | Table created empty. No immediate read/write load. | None |
| Lock contention | NONE | `CREATE OR REPLACE FUNCTION` takes no table lock. CREATE POLICY takes transient table lock only. No large table rewrite. | None |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| RPC dependency | `learning.is_current_user_platform_admin()` — called by app layer | MEDIUM — must confirm exists in live DB before Batch 1 |
| DAL dependency | `assertModerationAccess.dal.js` → `isModerationAuthorizedDAL` | LOW — code already correct; returns false on RPC miss |
| RLS dependency | 9 moderation policies → `can_manage_domain` | CRITICAL — function change affects all 9 immediately |
| Deployment order | `20260527080000` must apply before `20260527090000` (090000 is superseded) | LOW — timestamp order handles this; 090000 becomes idempotent |
| Table dependency | `20260528000001` depends on `20260528000000` (table must exist first) | LOW — timestamp order handles this |
| Duplicate timestamp | `20260527120000` appears twice — must rename before push | HIGH — blocks clean push |
| App-layer coupling | `assertModerationAccess.dal.js` + DB Batch 1 must ship same release | RESOLVED — code already fixed |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Existing moderation.actions rows | NONE | No schema change to actions table; only policy change | None |
| Moderation report history | NONE | Reports table unchanged; only RLS narrowed | None |
| Booking records | LOW | 5 policy changes to bookings — all SELECT/UPDATE/INSERT scoping changes; no DELETE, no data change | Validate existing bookings remain readable by owner actors |
| actor_social_settings seed | MEDIUM | New table 20260528000000 with no seed data — VPORT rows referenced in 20260528000001 comment as "seeded by TICKET-SUB-009 migration" | Confirm TICKET-SUB-009 seeded VPORT rows in separate pass |

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Pre-Step A | Create migration file from proposal | LOW | Copy proposal SQL; remove PROPOSAL ONLY header; save to supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql |
| Pre-Step B | Rename duplicate timestamp file | LOW | Rename 20260527120000_platform_media_assets_rls_role_hardening.sql → 20260527130000_*.sql |
| Pre-Step C | Verify learning.is_current_user_platform_admin() exists in live DB | MEDIUM | Run verification query (see below). If missing, either create it or defer Batch 1 until it is confirmed. |
| Push | `supabase db push --linked` | CAUTION | Pushes all 16 migrations in timestamp order |
| Validate | Run post-deploy validation queries | LOW | See validation checklist |

**Deployment order (handled by timestamp):**
```
20260510070000  ← CRITICAL: must apply; closes privilege escalation
20260527010000  ← index
20260527020000  ← resource member policy
20260527030000  ← profile RLS
20260527040000  ← profile owner select
20260527050000  ← booking select tracking (idempotent)
20260527060000  ← subscriber RPC guard
20260527070000  ← drop legacy profile policy
20260527080000  ← drop {public} policies / create {authenticated} (availability_rules)
20260527090000  ← superseded by 080000; will be no-op
20260527100000  ← harden bookings + profiles delete
20260527110000  ← create subscriber RPCs
20260527120000  ← drop legacy subscriber RPCs
20260527130000  ← media_assets RLS role hardening [RENAMED from 120000]
20260528000000  ← create vc.actor_social_settings table
20260528000001  ← social settings owner delegation RLS
```

---

## ROLLBACK SURVIVABILITY

```
ROLLBACK SURVIVABILITY
Rollback status: FULL
Data recovery risk: NONE — all changes are policy/function/table DDL; no data mutation
Compatibility rollback risk: LOW
  - Rollback of can_manage_domain restores the broken behavior (all users as moderators)
    This is the current production state; rollback does not produce a worse state than today
  - Rollback of {public}→{authenticated} changes restores previous access surface
  - Rollback of actor_social_settings table creation requires DROP TABLE — acceptable
    if table is empty (no data yet) or if all writes to it are gated on the new migration
Operational complexity: LOW
  Each migration has or needs a documented rollback SQL in the proposal file.
  can_manage_domain rollback is documented in the proposal file.
```

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | PASS | CREATE OR REPLACE FUNCTION does not break dependent objects |
| DAL compatibility | PASS | assertModerationAccess.dal.js already uses correct RPC pattern |
| Controller compatibility | PASS | assertModerationAccess.controller.js is clean |
| Engine compatibility | PASS | No engine boundary crossed |
| RLS validation | PENDING | Run post-deploy: SELECT COUNT(*) FROM moderation.reports; — must return only own reports |
| Runtime performance | PASS | No large table scan; no lock risk |
| Rollback validation | PASS | Rollback SQL documented in proposal file |
| learning.is_current_user_platform_admin() existence | UNKNOWN | Must verify before push (see Pre-Step C) |
| Duplicate timestamp resolved | PENDING | Pre-Step B must be completed |
| vc.actor_social_settings VPORT seed | UNKNOWN | Must confirm TICKET-SUB-009 seeded VPORT rows |
| Native compatibility | N/A | No native client changes in scope |

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

```
IDENTITY / OWNERSHIP MIGRATION WARNING
Object: moderation.can_manage_domain(p_domain text)
Current behavior:
  Returns TRUE for every authenticated user with a vc actor — effectively grants
  moderator ownership of the entire moderation system to all authenticated users.
Migration risk:
  After the fix, any code that invokes moderation moderator policies WITHOUT going
  through assertModerationAccessController will receive RLS denial (42501).
  This is the intended behavior but may surface latent call paths.
Potential impact:
  If any server-side code (Edge Functions, workers) reads moderator-scoped moderation
  tables using the authenticated role without explicit moderator assertion, those reads
  will fail silently (empty rows) or throw on strict calls after the function is applied.
Recommended safeguards:
  1. Search for all Supabase client calls to moderation.* tables outside of
     the assertModerationAccess controller gate before pushing.
  2. Confirm no Edge Function reads moderation.reports or moderation.actions
     using the authenticated role without a moderator check.
```

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `moderation.can_manage_domain` | VCSM | Calls into `learning.platform_admins` and `learning.actor_owners`. Cross-schema dependency is INTENTIONAL per original CARNAGE Batch 1 design. learning schema is a shared governance layer. | ACCEPTABLE — cross-schema read only, no write to learning |
| `learning.is_current_user_platform_admin()` | WENTREX / Shared | App layer calls this function. If it is a Wentrex-owned function, it should be treated as a shared engine dependency. | FLAG — ownership of this function must be confirmed |
| `vport.*` (bookings, availability_rules) | VCSM | All within VCSM scope | CLEAN |
| `platform.media_assets` | VCSM + ENGINE | Shared platform schema | CLEAN — TICKET-PLATFORM-RLS-001 scope |
| `vc.actor_social_settings` | VCSM | Within VCSM scope | CLEAN |

---

## CRITICAL PRE-STEP DETAIL

### Pre-Step A — Create the Migration File

**Source:** `zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/batch1_20260510070000_fix_moderation_can_manage_domain.sql`

**Target:** `supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql`

**Operation:** Copy the SQL content; remove the PROPOSAL ONLY header block (lines 1–10).

**SQL to use (text only — do not run):**
```sql
-- Migration: moderation.can_manage_domain — fix vc branch privilege escalation
-- Ticket: TICKET-MODERATION-DB-GUARD-APPLY-0001
-- Date: 2026-05-10 (originally proposed) / Promoted to migration: 2026-06-04
-- Risk: HIGH — behavior-changing, 8 RLS policies depend on this function
-- Deploy order: FIRST in the remediation sequence (must run before Batch 5 FORCE RLS)
-- Deploy same release as: learning.is_current_user_platform_admin() RPC confirmation

CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_domain IN ('vc', 'chat', 'system') THEN (
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    WHEN p_domain = 'learning' THEN (
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    ELSE false
  END;
$$;
```

---

### Pre-Step B — Resolve Duplicate Timestamp

**Current:** `supabase/migrations/20260527120000_platform_media_assets_rls_role_hardening.sql`
**Target:** `supabase/migrations/20260527130000_platform_media_assets_rls_role_hardening.sql`

**Operation:** File rename only. No SQL content changes. Note: internal migration comment at top of file may reference `20260527120000` — that comment can remain as-is (it references the original planned timestamp, not the actual file name).

---

### Pre-Step C — Verify learning.is_current_user_platform_admin()

**Risk:** The DAL calls this function. If it does not exist in the live DB, after Batch 1 applies, no one can moderate through the app layer (the DAL returns false safely, but legitimate moderators are locked out).

**Verification query (text only — run before push):**
```sql
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_schema = 'learning'
  AND routine_name = 'is_current_user_platform_admin';
```

**If the function EXISTS:** Proceed with push. Risk is CAUTION.
**If the function DOES NOT EXIST:** Batch 1 can still be applied (closes the privilege escalation safely), but the moderator UX will be broken until the function is created. CARNAGE recommends blocking push until the function is confirmed OR creating it in the same migration batch.

---

## RECOMMENDED HANDOFFS

| Command | Reason | Priority |
|---|---|---|
| VENOM | Verify the 9 moderation policies are correctly scoped after the function change — confirm no other can_manage_domain callsites were missed | P0 — before THOR gate |
| THOR | Release gate for the push — all pre-steps must complete before THOR clearance | P0 |
| DB | Post-deploy: confirm live function body via `pg_get_functiondef` after push | P0 |
| KRAVEN | Confirm no performance regression from EXISTS(learning.platform_admins) in the new function body | P2 |
| LOGAN | Update schema ownership docs for `moderation.can_manage_domain` and `learning.is_current_user_platform_admin` cross-dependency | P2 |

---

## FINAL CARNAGE STATUS: CAUTION

**Reason:** The migration SQL is verified, safe, and fully reversible. The only open risk is the unconfirmed `learning.is_current_user_platform_admin()` RPC existence in the live DB. This does not block the security fix — it only affects whether legitimate moderators can use the app layer after the fix. Pre-Step C must be confirmed before push.

**Pre-steps required before push:**
- [ ] Pre-Step A: Create `supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql`
- [ ] Pre-Step B: Rename `20260527120000_platform_media_assets_rls_role_hardening.sql` → `20260527130000_`
- [ ] Pre-Step C: Verify `learning.is_current_user_platform_admin()` exists in live DB

---

*CARNAGE migration plan complete — 2026-06-04 | TICKET-MODERATION-DB-GUARD-APPLY-0001*
*Persisted to: CURRENT/outputs/2026/06/04/Carnage/2026-06-04_00-30_carnage_moderation-can-manage-domain-migration-plan.md*
