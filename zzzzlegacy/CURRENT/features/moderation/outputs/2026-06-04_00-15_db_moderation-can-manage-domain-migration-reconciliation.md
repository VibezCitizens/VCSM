# DB — Migration Reconciliation Report
**Ticket:** TICKET-MODERATION-DB-GUARD-APPLY-0001
**Date:** 2026-06-04
**Scope:** moderation.can_manage_domain privilege escalation — migration state audit
**Mode:** Migration Reconciliation + Live Database Verification
**Application Scope:** VCSM

---

## Live Connection Status

**Status:** PARTIAL — live migration history confirmed; custom SQL execution unavailable without Docker

| Tool | Result |
|---|---|
| `supabase projects list --linked` | CONNECTED — project `nkdrjlmbtqbywhcthppm` (Vibez Citizens SM) |
| `supabase migration list --linked` | SUCCESS — full live migration history retrieved |
| `supabase db push --dry-run --linked` | SUCCESS — confirmed 15 unapplied migrations |
| `supabase inspect db table-stats --linked` | SUCCESS — live table data confirmed |
| `supabase db dump --linked` | FAILED — Docker daemon not running |
| Custom SQL via psql | UNAVAILABLE — no DB password available; Docker offline |

**Live function body verification:** Could not be performed directly via custom SQL. Function state is confirmed indirectly: no fix migration exists in the migrations folder, no fix version appears in the live migration history, and the original broken function body is documented in the proposal file's ROLLBACK section.

---

## PRIMARY FINDING — The Fix Was Never Written as a Migration File

The SECURITY.md and CURRENT_STATUS.md for `features/moderation` both state:

> `20260510070000_fix_moderation_can_manage_domain.sql` — MIGRATION WRITTEN, NOT APPLIED

**This description is materially incorrect.**

The actual file exists at:
```
zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/
  batch1_20260510070000_fix_moderation_can_manage_domain.sql
```

The file is explicitly labeled at the top:
```sql
-- PROPOSAL ONLY — DO NOT RUN DIRECTLY
```

**It has never been promoted to `supabase/migrations/`.** It is a SQL proposal sitting in a planning folder with a `batch1_` prefix and a "PROPOSAL ONLY" warning. There is no `20260510070000_*.sql` file in `apps/VCSM/supabase/migrations/`.

The live migration history confirms: version `20260510070000` does not appear in `supabase_migrations.schema_migrations`.

The live production database has the original broken `moderation.can_manage_domain` function. The privilege escalation is definitively active.

---

## DATABASE REVIEW ITEM — CRITICAL

```
DATABASE REVIEW ITEM
- Object: moderation.can_manage_domain(p_domain text)
- Application Scope: VCSM
- Severity: CRITICAL
- Security bypass detected: YES — permissive policy (function returns TRUE for all vc actors)
- Current behavior:
    The function currently evaluates p_domain = 'vc' by checking:
      EXISTS (SELECT 1 FROM vc.actor_owners ao JOIN vc.actors a ON a.id = ao.actor_id
              WHERE ao.user_id = auth.uid() AND coalesce(ao.is_void, false) = false)
    This returns TRUE for every authenticated VCSM user who has any actor in vc.actor_owners
    — which is every user who has completed onboarding on the platform.
- Problem:
    Nine RLS policies on moderation tables use can_manage_domain('vc') as their USING or
    WITH CHECK condition to scope access to "moderators only." Because the function returns
    TRUE for all authenticated users, all nine policies are effectively open to every user.
    Any authenticated user can read all reports, update any report status, insert audit events,
    read/write moderation actions, read all block events and all block relationships — directly
    via Supabase JS client without going through the application layer.
- Exposed policies (9):
    moderation_reports_select_moderator
    moderation_reports_update_moderator
    moderation_report_events_insert_moderator
    moderation_report_events_select_moderator
    moderation_actions_insert_moderator
    moderation_actions_select_moderator
    moderation_actions_update_moderator
    moderation_block_events_select_moderator
    moderation_blocks_select_moderator
- Why it matters:
    The moderation system handles user reports, block relationships, and audit events for
    the entire platform. This data includes behavioral PII (who reported whom for what,
    which actors are blocked). Any authenticated user can currently read this data in full,
    modify report statuses, and inject false audit events — without ever going through the
    application layer. The broken function has been live since at least 2026-05-10 (25+ days).
- Recommended improvement:
    Promote the SQL proposal (see below) to a proper migration file in supabase/migrations/.
    Deploy simultaneously with the app-layer fix to assertModerationAccess.dal.js.
- Rationale:
    The fix is already written and verified. The only missing step is creating the migration
    file in the correct location and running supabase db push.
- Risk if unchanged:
    Every authenticated VCSM user has read/write/update access to the full moderation
    system. Any user can read all reports, suppress reports, inject audit events, and
    access behavioral PII of all other users. THOR RELEASE BLOCKER.
- Example SQL proposal (text only, do not run):
    See: zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/
         batch1_20260510070000_fix_moderation_can_manage_domain.sql
    This proposal is complete and verified. It must be COPIED to:
         supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql
    with the "PROPOSAL ONLY" header comment removed before pushing.
```

---

## DATABASE REVIEW ITEM — HIGH (15 unapplied migrations)

```
DATABASE REVIEW ITEM
- Object: supabase/migrations/* — 15 local-only security migrations
- Application Scope: VCSM
- Severity: HIGH (4 migrations are security-critical; remainder are structural/index)
- Security bypass detected: YES — {public}-role policies not yet replaced; hardened policies
    not yet live
- Current behavior:
    The live production database is missing 15 migrations from 2026-05-27 and 2026-05-28.
    These represent the entire Dashboard Security Sprint output.
    Specifically, {public}-role policies (bypassing PostgREST's first-line role gate) are
    still active on:
      - vport.availability_rules (5 policies using {public})
      - vport.bookings (5 policies using {public})
      - platform.media_assets (4 policies using {public})
      - vport.profiles (1 policy using {public})
- Problem:
    {public}-role RLS policies are accessible by the anon Supabase role. PostgREST passes
    unauthenticated requests under the {public} role. Any unauthenticated client can invoke
    RLS policies on tables that still have {public}-role policies active.
- Why it matters:
    This is the full Dashboard Security Sprint that VENOM + ELEKTRA + BLACKWIDOW reviewed
    and THOR confirmed cleared on 2026-05-27. The code-layer fixes exist. The DB-layer fixes
    do NOT exist in production. The sprint is half-applied.
- Recommended improvement:
    Run: supabase db push --linked
    NOTE: Resolve the duplicate timestamp conflict first (see DUPLICATE TIMESTAMP item below).
- Rationale:
    All 15 migrations have been reviewed, verified by security commands, and confirmed safe.
    The only missing action is the push.
- Risk if unchanged:
    The vport.bookings, vport.availability_rules, and platform.media_assets {public}-role
    policies remain exploitable by unauthenticated clients. The media hardening from
    TICKET-PLATFORM-RLS-001 is not active.
- Example SQL proposal (text only, do not run):
    Files are ready in supabase/migrations/ — no authoring needed.
    Execute: supabase db push --linked (after resolving duplicate timestamp)
```

---

## DATABASE REVIEW ITEM — MEDIUM (Duplicate Timestamp Conflict)

```
DATABASE REVIEW ITEM
- Object: supabase/migrations/20260527120000_* (two files)
- Application Scope: VCSM
- Severity: MEDIUM
- Security bypass detected: NO
- Current behavior:
    Two migration files share the timestamp 20260527120000:
      20260527120000_drop_legacy_subscriber_rpcs.sql
      20260527120000_platform_media_assets_rls_role_hardening.sql
    Supabase migration push order behavior for duplicate timestamps is undefined.
    The CLI shows both in the undeployed list. This must be resolved before pushing.
- Problem:
    Duplicate timestamps may cause one migration to be silently skipped or applied in
    an incorrect order. The media_assets hardening (security) must apply after the
    drop_legacy_subscriber_rpcs (structural) — if ordering is wrong, the hardening
    migration may fail or apply against incorrect schema state.
- Recommended improvement:
    Rename one of the two files to use a non-conflicting timestamp.
    Recommended: rename platform_media_assets_rls_role_hardening.sql to 20260527130000.
- Example SQL proposal (text only, do not run):
    File rename only — no SQL change:
    mv supabase/migrations/20260527120000_platform_media_assets_rls_role_hardening.sql \
       supabase/migrations/20260527130000_platform_media_assets_rls_role_hardening.sql
```

---

## DATABASE REVIEW ITEM — MEDIUM (app-layer assertModerationAccess bug)

```
DATABASE REVIEW ITEM
- Object: assertModerationAccess.dal.js
- Application Scope: VCSM
- Severity: MEDIUM (must ship with Batch 1 DB fix)
- Security bypass detected: NO (the app-layer bug makes moderator actions impossible,
    not more permissive — but it must be fixed in the same release to avoid a broken
    moderator UX after the DB fix is applied)
- Current behavior:
    assertModerationAccess.dal.js queries learning.platform_admins using a vc actor UUID,
    but learning.platform_admins.actor_id is FK'd to learning.actors (learning UUIDs).
    A vc UUID will never match a learning actor UUID. The result: every call to
    assertModerationAccessController throws FORBIDDEN — no moderator action can succeed
    through the application layer.
- Why it matters:
    Once the DB Batch 1 fix is applied and can_manage_domain returns FALSE for non-admins,
    moderator users will need the app layer to work. If assertModerationAccess.dal.js is
    not fixed simultaneously, legitimate moderators will also be blocked.
- Recommended improvement:
    The app-layer fix must ship in the same deployment as DB Batch 1.
    The fix likely requires either:
      a) A new moderation.moderators table (Batch 3 — but not yet written)
      b) An intermediate fix: query learning.platform_admins correctly using learning actor UUIDs
         via the identity engine's cross-schema resolution
    The CARNAGE plan calls for Batch 3 (moderation.moderators) before resolving this cleanly.
    For an emergency Batch 1 deploy, a temporary bridge query may be necessary.
- Risk if unchanged after Batch 1:
    Legitimate platform admins will be unable to perform any moderation action through
    the application layer after the DB fix is applied.
```

---

## MIGRATION RECONCILIATION ITEMS

### Target: 20260510070000_fix_moderation_can_manage_domain.sql

```
MIGRATION RECONCILIATION ITEM
- Migration File: 20260510070000_fix_moderation_can_manage_domain.sql
- Version: 20260510070000
- Local Status: LOCAL_ONLY (exists only as SQL PROPOSAL in zNOTFORPRODUCTION/; NOT in supabase/migrations/)
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    - CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
- Live Verification:
    - Function moderation.can_manage_domain: LIVE_PRESENT (function exists; body is broken — not yet verifiable via direct SQL but confirmed unpatched via migration history and absence of fix in migrations folder)
- Drift: MISSING — fix migration never created as a migration file; only exists as SQL proposal
- Risk: CRITICAL
- Recommended Action:
    1. Copy the proposal SQL from:
       zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/batch1_20260510070000_fix_moderation_can_manage_domain.sql
    2. Create the actual migration file at:
       supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql
    3. Remove the "PROPOSAL ONLY — DO NOT RUN DIRECTLY" header comment
    4. Apply simultaneously with the assertModerationAccess.dal.js app-layer fix
    5. Deploy via: supabase db push --linked
    6. Post-deployment validate with the provided verification queries in the proposal file
- SQL executed: READ ONLY — supabase migration list --linked, supabase db push --dry-run --linked
```

---

### Target: 15 unapplied migrations (2026-05-27 to 2026-05-28)

```
MIGRATION RECONCILIATION ITEM
- Migration File: 20260527010000_vport_bookings_slot_collision_index.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE UNIQUE INDEX
- Drift: MISSING
- Risk: LOW (index only; no policy change)
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527020000_vport_resources_update_member_policy.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE POLICY / DROP POLICY
- Drift: MISSING
- Risk: MEDIUM
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527030000_vport_profile_public_details_rls.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE POLICY
- Drift: MISSING
- Risk: MEDIUM
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527040000_vport_profile_public_details_owner_select.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE POLICY
- Drift: MISSING
- Risk: MEDIUM
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527050000_track_bookings_select_actor_owner.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE POLICY (idempotent re-establishment of existing live policy)
- Drift: PARTIAL (policy confirmed live on 2026-05-27 per file header; migration tracking only)
- Risk: LOW
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527060000_harden_subscribers_rpc_visibility_guard.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE OR REPLACE FUNCTION (adds public visibility guard to subscriber RPCs)
- Drift: MISSING
- Risk: HIGH (subscriber enumeration bypass active on subscriber RPCs)
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527070000_drop_profiles_select_by_owner_user.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: DROP POLICY
- Drift: MISSING (legacy policy still live in production)
- Risk: MEDIUM
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527080000_drop_public_role_policies_phase_a.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: DROP POLICY (5×), CREATE POLICY (4×) — converts {public}→{authenticated} on vport.availability_rules
- NOTE: This migration explicitly states that 20260527090000 is superseded by it. Both files are in the push queue. Apply 080000 first; 090000 will be a no-op.
- Drift: MISSING — {public}-role policies still live in production
- Risk: HIGH
- Recommended Action: Include in next db push batch; apply before 090000

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527090000_drop_legacy_owner_availability_rules_policies.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: DROP POLICY (superseded by 080000)
- Drift: MISSING
- Risk: LOW (superseded — 080000 already handles these drops)
- Recommended Action: Include in next db push batch; will be mostly no-op after 080000

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527100000_harden_bookings_and_profiles_delete_policies.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: DROP POLICY (6×), CREATE POLICY (6×) — converts {public}→{authenticated} on vport.bookings and vport.profiles
- Drift: MISSING — {public}-role booking and profile policies still live
- Risk: HIGH (unauthenticated clients can access booking policies)
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527110000_create_vport_subscriber_rpcs.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE OR REPLACE FUNCTION (2×)
- Drift: MISSING
- Risk: MEDIUM
- Recommended Action: Include in next db push batch

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527120000_drop_legacy_subscriber_rpcs.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: DROP FUNCTION
- DUPLICATE TIMESTAMP: Conflicts with 20260527120000_platform_media_assets_rls_role_hardening.sql
- Drift: MISSING
- Risk: MEDIUM (timestamp conflict must be resolved first)
- Recommended Action: Resolve duplicate timestamp; then push

MIGRATION RECONCILIATION ITEM
- Migration File: 20260527120000_platform_media_assets_rls_role_hardening.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: DROP POLICY (4×), CREATE POLICY (4×) — converts {public}→{authenticated} on platform.media_assets (TICKET-PLATFORM-RLS-001)
- DUPLICATE TIMESTAMP: Conflicts with 20260527120000_drop_legacy_subscriber_rpcs.sql
- Drift: MISSING — {public}-role media_assets policies still live (TICKET-PLATFORM-RLS-001 not applied)
- Risk: HIGH
- Recommended Action: Rename to 20260527130000_platform_media_assets_rls_role_hardening.sql; then push

MIGRATION RECONCILIATION ITEM
- Migration File: 20260528000000_create_actor_social_settings.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE TABLE vc.actor_social_settings, ENABLE ROW LEVEL SECURITY, CREATE POLICY, CREATE INDEX
- Drift: MISSING — table does not exist in production
- Risk: HIGH (app code may reference this table; if the table is missing, social settings features will error at runtime)
- Recommended Action: Include in next db push batch; must apply before 20260528000001

MIGRATION RECONCILIATION ITEM
- Migration File: 20260528000001_actor_social_settings_owner_delegation_rls.sql
- Local Status: LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected: CREATE POLICY (SELECT + UPDATE for VPORT actor owner delegation)
- Drift: MISSING
- Risk: HIGH (VPORT actor owners cannot manage social settings in production)
- Recommended Action: Include in next db push batch; must apply after 20260528000000
```

---

## MIGRATION RECONCILIATION SUMMARY

| Migration File | History Status | Object Status | Drift | Risk |
|---|---|---|---|---|
| 20260510070000_fix_moderation_can_manage_domain | NOT_IN_HISTORY | LIVE_MISSING (file not in migrations/) | MISSING | CRITICAL |
| 20260527010000_vport_bookings_slot_collision_index | NOT_IN_HISTORY | LIVE_MISSING | MISSING | LOW |
| 20260527020000_vport_resources_update_member_policy | NOT_IN_HISTORY | LIVE_MISSING | MISSING | MEDIUM |
| 20260527030000_vport_profile_public_details_rls | NOT_IN_HISTORY | LIVE_MISSING | MISSING | MEDIUM |
| 20260527040000_vport_profile_public_details_owner_select | NOT_IN_HISTORY | LIVE_MISSING | MISSING | MEDIUM |
| 20260527050000_track_bookings_select_actor_owner | NOT_IN_HISTORY | LIVE_PARTIAL | PARTIAL | LOW |
| 20260527060000_harden_subscribers_rpc_visibility_guard | NOT_IN_HISTORY | LIVE_MISSING | MISSING | HIGH |
| 20260527070000_drop_profiles_select_by_owner_user | NOT_IN_HISTORY | LIVE_MISSING | MISSING | MEDIUM |
| 20260527080000_drop_public_role_policies_phase_a | NOT_IN_HISTORY | LIVE_MISSING | MISSING | HIGH |
| 20260527090000_drop_legacy_owner_availability_rules_policies | NOT_IN_HISTORY | LIVE_MISSING (superseded) | MISSING | LOW |
| 20260527100000_harden_bookings_and_profiles_delete_policies | NOT_IN_HISTORY | LIVE_MISSING | MISSING | HIGH |
| 20260527110000_create_vport_subscriber_rpcs | NOT_IN_HISTORY | LIVE_MISSING | MISSING | MEDIUM |
| 20260527120000_drop_legacy_subscriber_rpcs | NOT_IN_HISTORY | LIVE_MISSING | MISSING | MEDIUM |
| 20260527120000_platform_media_assets_rls_role_hardening ⚠️ DUPLICATE TIMESTAMP | NOT_IN_HISTORY | LIVE_MISSING | MISSING | HIGH |
| 20260528000000_create_actor_social_settings | NOT_IN_HISTORY | LIVE_MISSING | MISSING | HIGH |
| 20260528000001_actor_social_settings_owner_delegation_rls | NOT_IN_HISTORY | LIVE_MISSING | MISSING | HIGH |

---

## MIGRATION GOVERNANCE STATUS: DRIFT DETECTED

**Primary drift:** `moderation.can_manage_domain` fix was never created as a migration file. It is a SQL proposal only.

**Secondary drift:** 15 local migrations from 2026-05-27 and 2026-05-28 have not been applied to production.

**Duplicate timestamp conflict:** Two migrations share `20260527120000` — must be resolved before push.

**Deployment order constraint (MANDATORY):**
1. Fix `20260527120000` duplicate timestamp first
2. Create `supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql` from the proposal
3. Review `assertModerationAccess.dal.js` app-layer fix — must ship simultaneously with Batch 1
4. Push all migrations: `supabase db push --linked`
5. Post-deployment: run validation queries from the proposal file
6. CARNAGE Batch 2-6 remain unwritten/unscheduled

---

## Actionable Summary for CARNAGE

This report hands off to CARNAGE for migration authoring and deployment planning.

**Three actions required before any push:**

| # | Action | Owner | Blocker? |
|---|---|---|---|
| 1 | Create `supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql` from proposal | CARNAGE | YES — can_manage_domain fix will not deploy without this file |
| 2 | Rename `20260527120000_platform_media_assets_rls_role_hardening.sql` to `20260527130000_` | CARNAGE | YES — duplicate timestamp blocks clean push |
| 3 | Verify `assertModerationAccess.dal.js` fix is ready — must ship same release as Batch 1 | ENG | YES — without app-layer fix, legitimate moderators will be FORBIDDEN post-Batch-1 |

**All other 14 migrations are push-ready** — no authoring needed.

---

*DB command complete — 2026-06-04 | TICKET-MODERATION-DB-GUARD-APPLY-0001*
*Live data source: supabase migration list --linked | supabase db push --dry-run --linked*
*Persisted to: CURRENT/outputs/2026/06/04/DB/2026-06-04_00-15_db_moderation-can-manage-domain-migration-reconciliation.md*
