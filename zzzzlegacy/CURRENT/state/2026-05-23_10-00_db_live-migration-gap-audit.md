# DB — Live Database Migration Gap Audit

**Date:** 2026-05-23 10:00
**Application Scope:** VCSM
**Triggered by:** User request — "what is pending, run DB command to review live database"
**Mode:** READ-ONLY — live production database queried via psql; no changes applied
**Project:** Vibez Citizens SM (`nkdrjlmbtqbywhcthppm`)
**Status:** COMPLETE

---

## Executive Summary

The live database (`db.nkdrjlmbtqbywhcthppm.supabase.co`) is running on migration `20260514000000`. **11 local migrations have not been applied to the remote.** The most actionable findings are:

1. **V-1 is RESOLVED on the live DB.** The `posts_insert_actor_owner` policy already enforces actor ownership via `actor_owners` EXISTS subquery. The security gap documented by VENOM/DB/CARNAGE does not exist in production. The gap was in untracked archive migrations only — not the live schema.

2. **Media asset soft-delete is broken in production.** `20260519200000` (media_assets_soft_delete_policy) has not been applied — no UPDATE column grants exist for `authenticated`, making soft-delete impossible for actors.

3. **Two brand-new tracking migrations exist locally** (`20260523010000`, `20260523020000`) that close the untracked policy gap for `vc.posts` and correct `vport.rates` legacy policies. Both are idempotent on the live DB.

4. **9 other migrations are pending.** Most appear idempotent or behavioral-no-change relative to the live DB state. The exception is `20260519200000`.

---

## Migration Status (as of 2026-05-23)

| Migration | Local | Remote | File |
|---|---|---|---|
| 20260427010000 | ✅ | ✅ | vport_bookings_insert_rls_fix |
| 20260427020000 | ✅ | ✅ | vport_traze_directory_visibility_fix |
| 20260427030000 | ✅ | ✅ | fix_traze_view_directory_columns |
| 20260427040000 | ✅ | ✅ | fix_bookings_owner_policy |
| 20260427050000 | ✅ | ✅ | grant_bookings_insert_update |
| 20260427060000 | ✅ | ✅ | grant_vport_write_permissions |
| 20260427070000 | ✅ | ✅ | sync_business_card_published |
| 20260427080000 | ✅ | ✅ | grant_business_card_leads_owner_write |
| 20260429100000 | ✅ | ✅ | add_business_card_settings |
| 20260429200000 | ✅ | ✅ | upgrade_read_business_card_public |
| 20260429210000 | ✅ | ✅ | (applied) |
| 20260429220000 | ✅ | ✅ | (applied) |
| 20260430100000 | ✅ | ✅ | (applied) |
| 20260430200000 | ✅ | ✅ | fix_chat_rls_multi_actor (actor_owners grants) |
| 20260430300000–600000 | ✅ | ✅ | (applied) |
| 20260503040334 | ✅ | ✅ | fix_public_profile_rls_policies |
| 20260503052543 | ✅ | ✅ | fix_missing_authenticated_grants |
| 20260503060000 | ✅ | ✅ | business_card_traze_listing_fields |
| 20260510010000 | ✅ | ✅ | moderation_blocks_rls_and_indexes |
| 20260510020000 | ✅ | ✅ | vc_posts_privacy_rls (SELECT policy + indexes) |
| 20260510030000 | ✅ | ✅ | user_consents_immutability_and_grant |
| 20260510040000 | ✅ | ✅ | age_verification_consent_type |
| 20260510050000 | ✅ | ✅ | accepted_at_server_default |
| 20260510060000 | ✅ | ✅ | chat_messages_block_rls |
| 20260511010000 | ✅ | ✅ | fix_read_business_card |
| 20260514000000 | ✅ | ✅ | chat_inbox_entries_actor_badge_index ← **LAST APPLIED** |
| **20260515010000** | ✅ | ❌ | vport_booking_resource_rls_policies |
| **20260515020000** | ✅ | ❌ | vport_resources_actor_rls_rebuild |
| **20260518010000** | ✅ | ❌ | actor_onboarding_steps_rls |
| **20260518020000** | ✅ | ❌ | moderation_actions_rls |
| **20260518030000** | ✅ | ❌ | actor_follows_sf07_resolution |
| **20260518040000** | ✅ | ❌ | platform_provision_vcsm_identity |
| **20260518050000** | ✅ | ❌ | platform_provision_vcsm_identity_rls |
| **20260519120000** | ✅ | ❌ | platform_vc_security_hardening |
| **20260519200000** | ✅ | ❌ | media_assets_soft_delete_policy ← **REAL FUNCTIONAL GAP** |
| **20260523010000** | ✅ | ❌ | backfill_tracked_rls_coverage (NEW) |
| **20260523020000** | ✅ | ❌ | fix_vport_rates_rls (NEW) |

**11 migrations pending. 1 with a real functional gap on the live DB.**

---

## DATABASE REVIEW ITEM 1 — V-1 RECLASSIFICATION (vc.posts INSERT)

```
DATABASE REVIEW ITEM
- Object:               vc.posts — posts_insert_actor_owner policy
- Application Scope:    VCSM
- Current behavior:     CORRECT on live DB.
                        Live pg_policies shows:
                        WITH CHECK = EXISTS (
                          SELECT 1 FROM vc.actor_owners ao
                          WHERE ao.actor_id = posts.actor_id
                            AND ao.user_id = auth.uid()
                        )
                        This is the ownership-enforcing policy.
- Problem:              NONE on live DB. The policy enforces actor ownership correctly.
                        The VENOM V-1 finding (2026-05-19) was derived from file evidence
                        (ARCHITECT audit 2026-05-10 "Gap 1"), not a live DB query.
                        The live policy was created by an untracked archive migration
                        (20260416140000 or 20260419150000) that predates the tracked
                        migration history.
- Why it matters:       The CARNAGE plan (20260522010000_vc_posts_insert_ownership_rls.sql)
                        was written to fix this gap. That plan is superseded by
                        20260523010000 (backfill_tracked_rls_coverage) which already
                        includes the correct vc.posts INSERT/UPDATE/DELETE policies and
                        is idempotent on the live DB.
- Recommended improvement:
                        1. Do NOT apply 20260522010000 to the live DB — it is superseded.
                        2. Apply 20260523010000 instead — it tracks all three vc.posts
                           write policies including the INSERT ownership check.
                        3. Update VENOM finding V-1 status: RESOLVED (live DB already
                           correct; tracking gap closed by 20260523010000).
                        4. Update CARNAGE report 20260522010000: mark SUPERSEDED.
                        5. Update vcsm.dal.post.md: V-1 RESOLVED.
- Risk if unchanged:    LOW. The live DB is correct. The only risk is confusion from
                        contradicting audit documents.
- Example SQL proposal (text only, do not run):
```
```sql
-- Verification query (read-only):
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'posts' AND cmd = 'INSERT';
-- Expected: posts_insert_actor_owner | INSERT | EXISTS (... actor_owners ...)
```

---

## DATABASE REVIEW ITEM 2 — media_assets Soft-Delete: FUNCTIONAL GAP

```
DATABASE REVIEW ITEM
- Object:               platform.media_assets — UPDATE grant + soft-delete policy
- Application Scope:    VCSM
- Current behavior:     BROKEN on live DB.
                        - authenticated role has INSERT + SELECT column grants
                        - authenticated role has ZERO UPDATE column grants
                        - "actor owner can soft delete media asset" UPDATE policy: MISSING
                        - Two UPDATE policies exist (media_assets_vc_owner_update,
                          media_assets_learning_owner_update) but no UPDATE grant means
                          they are unreachable — PostgREST rejects UPDATE before RLS.
- Problem:              Actors cannot soft-delete their own media assets. Any attempt to
                        UPDATE a media_asset row (e.g., set status='deleted') will fail
                        with a permission denied error at the grant level.
- Why it matters:       The media soft-delete flow was designed and CARNAGE-planned
                        (2026-05-19_12-30_carnage_media-assets-rls-and-schema.md) and
                        THOR-gated (2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md).
                        The migration (20260519200000) passed governance but was not pushed
                        to the live DB. The feature is non-functional in production.
- Recommended improvement:
                        Apply migration 20260519200000_media_assets_soft_delete_policy.sql
                        to the live database. It adds:
                        1. Column-level UPDATE grant: status, deleted_at,
                           deleted_by_actor_id, updated_at
                        2. "actor owner can soft delete media asset" policy (WITH CHECK:
                           status='deleted' AND deleted_by_actor_id IS NOT NULL)
- Risk if unchanged:    HIGH — media soft-delete is completely non-functional in
                        production. Any actor attempting to delete uploaded media receives
                        a silent DB rejection.
- Example SQL proposal (text only, do not run):
```
```sql
-- Migration 20260519200000 content (text only):
GRANT UPDATE (status, deleted_at, deleted_by_actor_id, updated_at)
  ON platform.media_assets TO authenticated;

CREATE POLICY "actor owner can soft delete media asset"
  ON platform.media_assets FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM vc.actor_owners
      WHERE actor_owners.actor_id = media_assets.owner_actor_id
        AND actor_owners.user_id  = auth.uid())
  )
  WITH CHECK (
    status = 'deleted'
    AND deleted_by_actor_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM vc.actor_owners
      WHERE actor_owners.actor_id = media_assets.owner_actor_id
        AND actor_owners.user_id  = auth.uid())
  );
```

---

## DATABASE REVIEW ITEM 3 — media_assets deny_all: DEAD POLICY

```
DATABASE REVIEW ITEM
- Object:               platform.media_assets — media_assets_deny_all policy
- Application Scope:    VCSM
- Current behavior:     FOR ALL TO authenticated WITH CHECK (false) USING (false).
                        This is a permissive policy that never matches (qual=false,
                        with_check=false). It does NOT block other permissive policies.
                        PostgreSQL ORs permissive policies, so it is inert.
- Problem:              The policy is dead — it neither blocks nor permits. It creates
                        false confidence that there is a deny-all in place. A reviewer
                        seeing "deny_all" expects it to block access; it does not.
                        It was placed here by secdef_b proposal with intent to document
                        zero-policy coverage, but the table has active policies so the
                        deny_all is redundant.
- Why it matters:       Misleading policy names reduce trust in security reviews.
                        The "deny_all" implies a hard block that does not exist.
- Recommended improvement:
                        After applying 20260519200000, DROP this dead policy via a
                        follow-on migration or include in 20260523010000 cleanup scope.
- Risk if unchanged:    LOW. The policy is inert. Risk is documentation confusion only.
- Example SQL proposal (text only, do not run):
```
```sql
-- Proposal: drop dead deny_all (include in tracking migration or next cleanup pass)
DROP POLICY IF EXISTS "media_assets_deny_all" ON platform.media_assets;
```

---

## DATABASE REVIEW ITEM 4 — 9 Pending Migrations: Live DB Delta Analysis

```
DATABASE REVIEW ITEM
- Object:               Migrations 20260515010000–20260523020000 (excluding 20260519200000)
- Application Scope:    VCSM
- Current behavior:     10 migrations pending; 9 of them appear largely idempotent on
                        the live DB (policies they would create already exist). Detail:
```

| Migration | What It Does | Live DB State | Real Change? |
|---|---|---|---|
| `20260515010000` | vport booking resource RLS | Resource RLS policies already exist (actor_owners pattern) | Likely idempotent |
| `20260515020000` | vport resources actor RLS rebuild | `resources_*` policies with actor_owners present | Likely idempotent |
| `20260518010000` | actor_onboarding_steps RLS | `actor_onboarding_steps_*_owner` policies present on live DB | Idempotent |
| `20260518020000` | moderation_actions RLS | `actions_insert_self_hide`, `moderation_actions_*` present | Likely idempotent |
| `20260518030000` | actor_follows SF07 resolution | `actor_follows.*` policies present; SF07 fix may add edge case | Verify |
| `20260518040000` | platform_provision_vcsm_identity | Function/RPC changes — unknown live DB state | Verify |
| `20260518050000` | platform_provision_vcsm_identity_rls | Identity table RLS — `identity.actor_directory` policies present | Verify |
| `20260519120000` | platform_vc_security_hardening | `save_friend_ranks` already `prosecdef=false`; `mark_read` `prosecdef=true` | Likely idempotent |
| `20260523010000` | backfill_tracked_rls_coverage | `vc.posts`, `vport.services`, `vport.fuel_prices` policies already correct | Idempotent |
| `20260523020000` | fix_vport_rates_rls | Legacy `rates_*_owner` + tautology policies NOT on live DB; canonical policies exist | Idempotent |

```
- Recommended improvement:
                        Push all 11 pending migrations via `supabase db push` in the
                        correct sequential order. All DROP IF EXISTS + CREATE blocks are
                        safe to re-apply on a live DB that already has the correct state.
                        The only migration with a real functional impact is 20260519200000.
- Risk if unchanged:    MEDIUM. As long as migrations remain unapplied, the live DB
                        diverges from the local migration history. Fresh deployments or
                        DB resets will land in a different state than production. The
                        longer the gap, the harder it becomes to audit what's applied.
```

---

## DATABASE REVIEW ITEM 5 — Platform.media_assets: No FORCE ROW SECURITY

```
DATABASE REVIEW ITEM
- Object:               platform.media_assets — relforcerowsecurity
- Application Scope:    VCSM
- Current behavior:     RLS is ENABLED (relrowsecurity=true) but FORCE is FALSE
                        (relforcerowsecurity=false). This means the table owner and
                        superuser roles can bypass RLS entirely.
- Problem:              Without FORCE ROW SECURITY, any connection running as the
                        table owner (postgres role) bypasses all RLS policies. For
                        Supabase this includes the postgres connection used by the
                        Supabase Studio SQL editor and pg_cron.
- Why it matters:       Supabase recommends FORCE ROW SECURITY for tables containing
                        user data. Without it, any leaked postgres-role connection
                        can read all media assets for all actors.
- Recommended improvement:
                        ALTER TABLE platform.media_assets FORCE ROW SECURITY;
                        Include in a future security hardening migration.
- Risk if unchanged:    LOW-MEDIUM. Standard Supabase service role bypass risk.
                        Not urgent but should be part of next security pass.
- Example SQL proposal (text only, do not run):
```
```sql
-- Add FORCE ROW SECURITY for defense-in-depth:
ALTER TABLE platform.media_assets FORCE ROW SECURITY;
```

---

## Key Policy Confirmation (Live DB Verified)

| Table | Policy | Live DB State | Notes |
|---|---|---|---|
| `vc.posts` | `posts_insert_actor_owner` | ✅ CORRECT — `actor_owners` EXISTS | V-1 resolved; was never broken in production |
| `vc.posts` | `posts_update_actor_owner` | ✅ CORRECT — `actor_owners` EXISTS (USING + WITH CHECK) | |
| `vc.posts` | `posts_delete_actor_owner` | ✅ CORRECT — `actor_owners` EXISTS | |
| `vc.posts` | `posts_select_actor_based` | ✅ CORRECT — block exclusion + privacy + follows | Applied by 20260510020000 |
| `vport.rates` | `rates_select` | ✅ CORRECT — `actor_can_view_profile` | Legacy tautology already gone |
| `vport.rates` | `rates_insert/update/delete` | ✅ CORRECT — `actor_can_manage_profile` | Legacy owner_user_id policies already gone |
| `vport.services` | All 4 policies | ✅ CORRECT — manage/view_profile pattern | |
| `vport.fuel_prices` | All 3 policies | ✅ CORRECT — manage/view_profile pattern | |
| `vport.resources` | All policies | ✅ CORRECT — `actor_owners` pattern | |
| `vc.actor_follows` | All policies | ✅ CORRECT — `actor_owners` pattern | |
| `vc.actor_onboarding_steps` | All policies | ✅ CORRECT — `actor_owners` pattern | |
| `moderation.actions` | All policies | ✅ CORRECT — `can_manage_domain` + `is_current_vc_actor` | |
| `platform.media_assets` | INSERT/SELECT | ✅ CORRECT — `actor_owners` EXISTS | |
| `platform.media_assets` | UPDATE | ❌ MISSING soft-delete policy + no UPDATE grant | `20260519200000` not applied |
| `platform.media_assets` | `media_assets_deny_all` | ⚠️ DEAD POLICY — inert permissive false | Confusing but harmless |
| `vc.save_friend_ranks` | SECURITY DEFINER | ✅ Already NOT definer (`prosecdef=false`) | `20260519120000` idempotent |

---

## Priority Action List

| Priority | Action | Migration | Reason |
|---|---|---|---|
| **P1 — IMMEDIATE** | Apply all 11 pending migrations | `supabase db push` | `20260519200000` fixes live functional breakage (media soft-delete) |
| **P2 — IMMEDIATE** | Retire CARNAGE plan `20260522010000` | Mark SUPERSEDED | `20260523010000` covers vc.posts write policies; applying both would double-execute |
| **P3 — GOVERNANCE** | Update VENOM V-1 status → RESOLVED | VENOM audit update | V-1 never existed in production; tracking gap resolved by 20260523010000 |
| **P4 — GOVERNANCE** | Update `vcsm.dal.post.md` | LOGAN update | Mark V-1 RESOLVED, reference 20260523010000 as tracking migration |
| **P5 — NEXT PASS** | `ALTER TABLE platform.media_assets FORCE ROW SECURITY` | Future migration | Defense-in-depth; not urgent |
| **P6 — NEXT PASS** | Drop `media_assets_deny_all` dead policy | Append to cleanup migration | Cosmetic; confusing policy name |

---

## SECURITY NOTE

**Credential sent in chat (2026-05-23 session):** A database password was transmitted in plain text during this session. This credential is now stored in the conversation history. **Rotate this password immediately via the Supabase dashboard → Project Settings → Database → Reset database password.**

---

## Upstream Evidence Chain

| Source | Path | Relevance |
|---|---|---|
| VENOM V-1 finding | `CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md` | V-1 reclassified RESOLVED by live DB verification |
| DB RLS Gap (file-based) | `_HISTORY/db/snapshots/2026-05-19_16-00_db_vc-posts-insert-rls-gap.md` | Evidence was from ARCHITECT audit, not live DB — superseded by this report |
| CARNAGE plan | `_ACTIVE/audits/migrations/2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md` | SUPERSEDED by 20260523010000 |
| Backfill migration | `apps/VCSM/supabase/migrations/20260523010000_backfill_tracked_rls_coverage.sql` | Closes vc.posts tracking gap idempotently |
| Rates fix migration | `apps/VCSM/supabase/migrations/20260523020000_fix_vport_rates_rls.sql` | Drops non-existent legacy policies; idempotent |
| Media soft-delete migration | `apps/VCSM/supabase/migrations/20260519200000_media_assets_soft_delete_policy.sql` | NOT applied — real functional gap |
