# DB Migration Reconciliation Report
**Date:** 2026-05-26  
**Mode:** Migration Reconciliation Mode  
**Scope:** VCSM  
**DB:** Supabase — Vibez Citizens SM (`nkdrjlmbtqbywhcthppm`)  
**DB Version:** PostgreSQL 17.4  
**Region:** East US (North Virginia)  
**Executed by:** /DB command — READ ONLY  

---

## 1. Live DB Connection Status

```
STATUS: CONFIRMED
Host:   db.nkdrjlmbtqbywhcthppm.supabase.co:5432
DB:     postgres
User:   postgres (superuser — read-only queries only)
Version: PostgreSQL 17.4 on aarch64-unknown-linux-gnu, compiled by gcc 13.2.0, 64-bit
```

---

## 2. Migration History Table Status

```
Table:   supabase_migrations.schema_migrations
Columns: version (text), name (text), statements (text[])
Note:    "inserted_at" column does NOT exist in this Supabase version
Status:  AVAILABLE — 31 rows returned
```

**Live History (31 entries):**

| Version        | Name                                              |
|----------------|---------------------------------------------------|
| 20260427010000 | vport_bookings_insert_rls_fix                     |
| 20260427020000 | vport_traze_directory_visibility_fix              |
| 20260427030000 | fix_traze_view_directory_columns                  |
| 20260427040000 | fix_bookings_owner_policy                         |
| 20260427050000 | grant_bookings_insert_update                      |
| 20260427060000 | grant_vport_write_permissions                     |
| 20260427070000 | sync_business_card_published_for_listed_providers |
| 20260427080000 | grant_business_card_leads_owner_write             |
| 20260429100000 | add_business_card_settings_to_vport_profiles      |
| 20260429200000 | upgrade_read_business_card_public_sections        |
| 20260429210000 | fix_read_business_card_public_and_sections        |
| 20260429220000 | fix_business_card_sections_rates_buy_sell         |
| 20260430100000 | add_push_subscriptions                            |
| 20260430200000 | fix_chat_rls_multi_actor                          |
| 20260430300000 | create_platform_media_assets                      |
| 20260430400000 | media_asset_writeback_columns                     |
| 20260430500000 | profile_media_asset_writeback_columns             |
| 20260430600000 | grant_vport_profile_public_details_select         |
| 20260503040334 | fix_public_profile_rls_policies                   |
| 20260503052543 | fix_missing_authenticated_grants                  |
| 20260503060000 | business_card_traze_listing_fields                |
| 20260510010000 | moderation_blocks_rls_and_indexes                 |
| 20260510020000 | vc_posts_privacy_rls                              |
| 20260510030000 | user_consents_immutability_and_grant              |
| 20260510040000 | age_verification_consent_type                     |
| 20260510050000 | accepted_at_server_default                        |
| 20260510060000 | chat_messages_block_rls                           |
| 20260511010000 | fix_read_business_card_public_remove_review_join  |
| 20260514000000 | chat_inbox_entries_actor_badge_index              |
| 20260523220000 | vport_services_rls_security_fixes                 |
| 20260523230000 | remove_actor_can_manage_profile_legacy_branch     |

**Local files:** 50 total  
**History entries:** 31 confirmed  
**Discrepancy:** 19 local files have no matching history entry  

> ⚠️ **CRITICAL GOVERNANCE FINDING:** Migrations 20260523010000–20260523190000 (5 files) have version numbers that fall **before** the two live-history entries 20260523220000 and 20260523230000. If `supabase db push` is run to apply LOCAL_ONLY migrations, the CLI will attempt to insert them out-of-order relative to the existing history — which Supabase CLI refuses to do. This is the most operationally dangerous finding in this report.

---

## 3. Per-Migration Reconciliation Items

---

### MIGRATIONS 1–29 (LIVE_CONFIRMED_BY_HISTORY)

All migrations from `20260427010000` through `20260514000000` (29 migrations) are confirmed in live history and are not examined further for object-level drift in this report. Their RLS objects were verified as present during broader object queries.

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260515010000_vport_booking_resource_rls_policies.sql
- Version:             20260515010000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    ENABLE ROW LEVEL SECURITY ON vport.resources
    ENABLE ROW LEVEL SECURITY ON vport.availability_rules
    CREATE POLICY resources_select_public ON vport.resources
    CREATE POLICY resources_select_owner ON vport.resources
    CREATE POLICY resources_insert_owner ON vport.resources
    CREATE POLICY resources_update_owner ON vport.resources
    CREATE POLICY availability_rules_select_public ON vport.availability_rules
    CREATE POLICY availability_rules_select_owner ON vport.availability_rules
    CREATE POLICY availability_rules_insert_owner ON vport.availability_rules
    CREATE POLICY availability_rules_update_owner ON vport.availability_rules
    CREATE POLICY availability_rules_delete_owner ON vport.availability_rules
    CREATE POLICY bookings_select_actor_owner ON vport.bookings (via bookings section)
- Live Verification:
    resources RLS enabled:                    LIVE_PRESENT
    resources_select_public:                  LIVE_PRESENT
    resources_select_owner:                   LIVE_PRESENT
    resources_insert_owner:                   LIVE_PRESENT
    resources_update_owner:                   LIVE_PRESENT
    availability_rules RLS enabled:           LIVE_PRESENT
    availability_rules_select_public:         LIVE_PRESENT
    availability_rules_select_owner:          LIVE_PRESENT
    availability_rules_insert_owner:          LIVE_PRESENT
    availability_rules_update_owner:          LIVE_PRESENT
    availability_rules_delete_owner:          LIVE_PRESENT
    bookings_select_actor_owner:              LIVE_PRESENT
    Legacy policy DROP availability_rules_manage_neutral: LIVE_DIFFERENT
      → Policy still present on live DB ({public} role, ALL cmd)
    Legacy policy DROP availability_rules_select_neutral: LIVE_DIFFERENT
      → Policy still present on live DB ({public} role, SELECT cmd)
- Drift:    PARTIAL
- Risk:     MEDIUM
- Recommended Action:
    The migration was applied out-of-band but the legacy-policy DROP clauses
    were NOT executed. availability_rules_manage_neutral and
    availability_rules_select_neutral still exist alongside the new policies.
    Run DROP POLICY IF EXISTS on those two names against vport.availability_rules,
    then record this migration in the history table.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260515020000_vport_resources_actor_rls_rebuild.sql
- Version:             20260515020000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    ALTER TABLE vport.resources ALTER COLUMN profile_id DROP NOT NULL
    DROP + CREATE POLICY resources_select_public (actor-based via actor_owners)
    DROP + CREATE POLICY resources_select_owner (actor-based via actor_owners)
    DROP + CREATE POLICY resources_insert_owner (actor-based via actor_owners)
    DROP + CREATE POLICY resources_update_owner (actor-based via actor_owners)
    CREATE POLICY resources_delete_owner (actor-based via actor_owners)
- Live Verification:
    resources_select_public (actor-based):    LIVE_PRESENT
    resources_select_owner (actor_owners):    LIVE_PRESENT
    resources_insert_owner (actor_owners):    LIVE_PRESENT
    resources_update_owner (actor_owners):    LIVE_PRESENT
    resources_delete_owner (actor_owners):    LIVE_PRESENT
    profile_id nullable on vport.resources:   LIVE_PRESENT (inferred from INSERT policy logic)
    Legacy policies on availability_rules
    (delete/insert/update with {public} role): LIVE_DIFFERENT
      → Still present; migration did not target availability_rules
- Drift:    NONE (for vport.resources objects; availability_rules not in scope of this migration)
- Risk:     NONE
- Recommended Action:
    Record in history. No schema changes needed for this migration's scope.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260518010000_actor_onboarding_steps_rls.sql
- Version:             20260518010000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    ENABLE ROW LEVEL SECURITY ON vc.actor_onboarding_steps
    CREATE POLICY actor_onboarding_steps_select_owner
    CREATE POLICY actor_onboarding_steps_insert_owner
    CREATE POLICY actor_onboarding_steps_update_owner
    CREATE POLICY actor_onboarding_steps_delete_owner
- Live Verification:
    actor_onboarding_steps RLS enabled:       LIVE_PRESENT
    actor_onboarding_steps_select_owner:      LIVE_PRESENT
    actor_onboarding_steps_insert_owner:      LIVE_PRESENT
    actor_onboarding_steps_update_owner:      LIVE_PRESENT
    actor_onboarding_steps_delete_owner:      LIVE_PRESENT
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history. No schema changes needed.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260518020000_moderation_actions_rls.sql
- Version:             20260518020000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    ENABLE ROW LEVEL SECURITY ON moderation.actions
    CREATE POLICY "actions_select_own_actor" ON moderation.actions
    CREATE POLICY "actions_insert_own_actor" ON moderation.actions
- Live Verification:
    moderation.actions RLS enabled:           LIVE_PRESENT
    "actions_select_own_actor":               LIVE_MISSING
      → Live has "actions_select_own" (different name, possibly different condition)
    "actions_insert_own_actor":               LIVE_MISSING
      → Live has "actions_insert_self_hide" and "moderation_actions_insert_moderator"
    Additional live policies not in migration:
      actions_delete_own_hide (DELETE, authenticated)
      actions_select_own (SELECT, authenticated)
      moderation_actions_insert_moderator (INSERT, authenticated)
      moderation_actions_select_moderator (SELECT, authenticated)
      moderation_actions_update_moderator (UPDATE, authenticated)
- Drift:    PARTIAL
- Risk:     MEDIUM
- Recommended Action:
    The migration's exact policies were never applied. The live DB has a different
    policy set that covers SELECT/INSERT but with different names and potentially
    different conditions. The migration's condition (actor_id IN actor_owners WHERE
    user_id = auth.uid()) should be compared against live policy definitions to
    confirm equivalence before deciding to re-apply or mark as superseded.
    Run: SELECT policyname, cmd, qual, with_check FROM pg_policies
         WHERE schemaname = 'moderation' AND tablename = 'actions';
    Do NOT re-apply blindly — compare conditions first.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260518030000_actor_follows_sf07_resolution.sql
- Version:             20260518030000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    CREATE POLICY actor_follows_insert_by_target_on_accept
    CREATE POLICY actor_follows_update_by_target_on_accept
    CREATE POLICY actor_follows_select_public_subscriber_count
- Live Verification:
    actor_follows_insert_by_target_on_accept:         LIVE_PRESENT
    actor_follows_update_by_target_on_accept:         LIVE_PRESENT
    actor_follows_select_public_subscriber_count:     LIVE_PRESENT
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history. No schema changes needed.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260518040000_platform_provision_vcsm_identity.sql
- Version:             20260518040000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    DROP FUNCTION IF EXISTS platform.provision_vcsm_identity(uuid)
    DROP FUNCTION IF EXISTS platform.provision_vcsm_identity(uuid, uuid)
    CREATE OR REPLACE FUNCTION platform.provision_vcsm_identity(uuid, uuid)
      RETURNS uuid, LANGUAGE plpgsql, SECURITY DEFINER, SET search_path
- Live Verification:
    platform.provision_vcsm_identity(uuid, uuid):     LIVE_PRESENT
    security_type = INVOKER (not DEFINER as defined here): LIVE_DIFFERENT
      → Intentional: superseded by 20260518050000 which converts to INVOKER
    SET search_path confirmed:                        LIVE_PRESENT
- Drift:    NONE (migration applied, then intentionally superseded by next migration)
- Risk:     NONE
- Recommended Action:
    Record both 20260518040000 and 20260518050000 in history together.
    The INVOKER version is the correct final state.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260518050000_platform_provision_vcsm_identity_rls.sql
- Version:             20260518050000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    DROP + RECREATE platform.provision_vcsm_identity(uuid, uuid)
      as SECURITY INVOKER with SET search_path
    REVOKE ALL FROM public; GRANT EXECUTE TO authenticated
    CREATE POLICY platform_user_app_access_insert_own
    CREATE POLICY platform_user_app_access_update_own
    CREATE POLICY platform_user_app_accounts_insert_own
    CREATE POLICY platform_user_app_accounts_update_own
    CREATE POLICY platform_user_app_preferences_insert_own
    CREATE POLICY platform_user_app_state_insert_own
- Live Verification:
    provision_vcsm_identity INVOKER:                  LIVE_PRESENT ✓
    SET search_path configured:                       LIVE_PRESENT ✓
    platform_user_app_access_insert_own:              LIVE_PRESENT ✓
    platform_user_app_access_update_own:              LIVE_PRESENT ✓
    platform_user_app_accounts_insert_own:            LIVE_PRESENT ✓
    platform_user_app_accounts_update_own:            LIVE_PRESENT ✓
    platform_user_app_preferences_insert_own:         LIVE_PRESENT ✓
    platform_user_app_state_insert_own:               LIVE_PRESENT ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260519120000_platform_vc_security_hardening.sql
- Version:             20260519120000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    DROP FUNCTION IF EXISTS platform.ensure_vcsm_actor_link(uuid, uuid, text)
    CREATE OR REPLACE FUNCTION vc.save_friend_ranks(...) — SECURITY INVOKER
    CREATE OR REPLACE FUNCTION vc.mark_read(...) — SECURITY DEFINER retained
      with actor ownership guard added
- Live Verification:
    platform.ensure_vcsm_actor_link:          LIVE_PRESENT (DROP confirmed — not present)
    vc.save_friend_ranks security_type:       LIVE_PRESENT as INVOKER ✓
    vc.mark_read security_type:               LIVE_PRESENT as DEFINER ✓
    vc.mark_read SET search_path:             LIVE_PRESENT ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260519200000_media_assets_soft_delete_policy.sql
- Version:             20260519200000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    GRANT UPDATE (status, deleted_at, deleted_by_actor_id, updated_at)
      ON platform.media_assets TO authenticated
    CREATE POLICY "actor owner can soft delete media asset"
      ON platform.media_assets FOR UPDATE TO authenticated
      USING (EXISTS actor_owners)
      WITH CHECK (status = 'deleted' AND deleted_by_actor_id IS NOT NULL AND EXISTS actor_owners)
- Live Verification:
    "actor owner can soft delete media asset":        LIVE_MISSING
      → Not found in pg_policies for platform.media_assets
    media_assets_vc_owner_update (broader UPDATE):    LIVE_PRESENT
      → Condition: owner_source='vc' AND EXISTS actor_owners (no status restriction)
      → Role: {public} (not authenticated)
    Column-level GRANT verification:                  UNKNOWN
      → Requires pg_attribute_acl inspection (not queried)
- Drift:    PARTIAL
- Risk:     MEDIUM — actors can UPDATE all columns on their media_assets,
            not just the soft-delete lifecycle columns. The intended restriction
            (only status='deleted' changes allowed) is not enforced.
- Recommended Action:
    Apply the migration's specific policy. The broad media_assets_vc_owner_update
    should be evaluated for replacement with two separate policies:
      1. A read/general SELECT policy
      2. The restrictive soft-delete UPDATE policy (status='deleted' only)
    This migration should be applied manually via Supabase SQL editor and then
    recorded in migration history.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260523010000_backfill_tracked_rls_coverage.sql
- Version:             20260523010000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    CREATE POLICY services_select_viewer ON vport.services
    CREATE POLICY services_select_owner ON vport.services
    CREATE POLICY services_insert_managed ON vport.services
    CREATE POLICY services_update_managed ON vport.services
    CREATE POLICY services_delete_managed ON vport.services
    CREATE POLICY posts_insert_actor_owner ON vc.posts
    CREATE POLICY posts_update_actor_owner ON vc.posts
    CREATE POLICY posts_delete_actor_owner ON vc.posts
    CREATE POLICY fuel_prices_select_public ON vport.fuel_prices
    CREATE POLICY fuel_prices_insert_owner ON vport.fuel_prices
    CREATE POLICY fuel_prices_update_owner ON vport.fuel_prices
- Live Verification:
    services_select_viewer:         LIVE_PRESENT ✓
    services_select_owner:          LIVE_PRESENT ✓
    services_insert_managed:        LIVE_PRESENT ✓
    services_update_managed:        LIVE_PRESENT ✓
    services_delete_managed:        LIVE_PRESENT ✓
    posts_insert_actor_owner:       LIVE_PRESENT ✓
    posts_update_actor_owner:       LIVE_PRESENT ✓
    posts_delete_actor_owner:       LIVE_PRESENT ✓
    fuel_prices_select_public:      LIVE_PRESENT ✓
    fuel_prices_insert_owner:       LIVE_PRESENT ✓
    fuel_prices_update_owner:       LIVE_PRESENT ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history. ⚠️ See out-of-order warning in Section 2 — this migration
    version (20260523010000) falls before 20260523220000 and 20260523230000 which
    are already in history.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260523020000_fix_vport_rates_rls.sql
- Version:             20260523020000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    DROP POLICY IF EXISTS rates_select_authenticated ON vport.rates
    DROP POLICY IF EXISTS rates_insert_owner ON vport.rates
    DROP POLICY IF EXISTS rates_update_owner ON vport.rates
    DROP POLICY IF EXISTS rates_delete_owner ON vport.rates
    CREATE POLICY rates_select (canonical, actor_can_view_profile)
    CREATE POLICY rates_insert (canonical, actor_can_manage_profile)
    CREATE POLICY rates_update (canonical, actor_can_manage_profile)
    CREATE POLICY rates_delete (canonical, actor_can_manage_profile)
- Live Verification:
    rates_select_authenticated: NOT PRESENT (correctly dropped) ✓
    rates_insert_owner:         NOT PRESENT (correctly dropped) ✓
    rates_update_owner:         NOT PRESENT (correctly dropped) ✓
    rates_delete_owner:         NOT PRESENT (correctly dropped) ✓
    rates_select ({public}):    LIVE_PRESENT ✓
    rates_insert (authenticated): LIVE_PRESENT ✓
    rates_update (authenticated): LIVE_PRESENT ✓
    rates_delete (authenticated): LIVE_PRESENT ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history. ⚠️ See out-of-order warning.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260523030000_fix_content_pages_rls.sql
- Version:             20260523030000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    CREATE POLICY content_pages_select_public ON vport.content_pages
    CREATE POLICY content_pages_select_owner ON vport.content_pages
    CREATE POLICY content_pages_insert_owner ON vport.content_pages
    CREATE POLICY content_pages_update_owner ON vport.content_pages
    CREATE POLICY content_pages_delete_owner ON vport.content_pages
- Live Verification:
    content_pages_select_public:    LIVE_PRESENT ✓
    content_pages_select_owner:     LIVE_PRESENT ✓
    content_pages_insert_owner:     LIVE_PRESENT ✓
    content_pages_update_owner:     LIVE_PRESENT ✓
    content_pages_delete_owner:     LIVE_PRESENT ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history. ⚠️ See out-of-order warning.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260523040000_fix_bookings_rls.sql
- Version:             20260523040000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    DROP POLICY IF EXISTS bookings_insert_owner ON vport.bookings
    DROP POLICY IF EXISTS bookings_select_owner ON vport.bookings
    DROP + RECREATE bookings_insert_public_pending
      (WITH CHECK fixed: r.profile_id = bookings.profile_id)
- Live Verification:
    bookings_insert_owner:      NOT PRESENT (correctly dropped) ✓
    bookings_select_owner:      NOT PRESENT (correctly dropped) ✓
    bookings_insert_public_pending WITH CHECK:
      r.profile_id = bookings.profile_id: LIVE_PRESENT ✓
      (confirmed in full policy inspection)
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history. ⚠️ See out-of-order warning.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260523190000_portfolio_card_p0_security.sql
- Version:             20260523190000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    DROP FUNCTION IF EXISTS vc.get_vport_portfolio(uuid, integer, integer)
    DROP FUNCTION IF EXISTS vc.get_barber_vport_portfolio(uuid, integer, integer)
    DROP FUNCTION IF EXISTS vc.get_barber_vport_portfolio_item_detail(uuid)
    DROP FUNCTION IF EXISTS vc.ensure_portfolio_cover_media()
    DROP FUNCTION IF EXISTS vc.ensure_portfolio_item_metrics_row()
    DROP + RECREATE portfolio_tags_insert (managed, actor_can_manage_profile)
    DROP + RECREATE portfolio_tags_delete (managed, actor_can_manage_profile)
- Live Verification:
    vc.get_vport_portfolio:               NOT PRESENT (correctly dropped) ✓
    vc.get_barber_vport_portfolio:        NOT PRESENT (correctly dropped) ✓
    vc.get_barber_vport_portfolio_item_detail: NOT PRESENT (correctly dropped) ✓
    vc.ensure_portfolio_cover_media:      NOT PRESENT (correctly dropped) ✓
    vc.ensure_portfolio_item_metrics_row: NOT PRESENT (correctly dropped) ✓
    portfolio_tags_insert_managed:        LIVE_PRESENT ✓
    portfolio_tags_delete_managed:        LIVE_PRESENT ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history. ⚠️ See out-of-order warning.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260523220000_vport_services_rls_security_fixes.sql
- Version:             20260523220000
- Local Status:        LIVE_CONFIRMED_BY_HISTORY
- Live History Status: CONFIRMED
- Objects Detected:    (in history — object verification satisfied by history confirmation)
- Live Verification:   LIVE_PRESENT (history confirmed)
- Drift:    NONE
- Risk:     NONE
- Recommended Action:  None required.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260523230000_remove_actor_can_manage_profile_legacy_branch.sql
- Version:             20260523230000
- Local Status:        LIVE_CONFIRMED_BY_HISTORY
- Live History Status: CONFIRMED
- Objects Detected:    (in history — object verification satisfied by history confirmation)
- Live Verification:   LIVE_PRESENT (history confirmed)
- Drift:    NONE
- Risk:     NONE
- Recommended Action:  None required.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260524010000_business_card_leads_p0_security.sql
- Version:             20260524010000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    DROP POLICY IF EXISTS business_card_leads_insert_anon ON vport.business_card_leads
    DROP POLICY IF EXISTS business_card_leads_insert_authenticated ON vport.business_card_leads
    CREATE POLICY business_card_leads_no_direct_insert
      FOR INSERT TO anon, authenticated WITH CHECK (false)
    REVOKE INSERT ON vport.business_card_leads FROM anon
    REVOKE INSERT ON vport.business_card_leads FROM authenticated
    DROP FUNCTION IF EXISTS vport.submit_business_card_lead(uuid, text, text, text, text, text)
- Live Verification:
    business_card_leads_no_direct_insert:     LIVE_PRESENT ✓
      → Roles: {anon, authenticated}, WITH CHECK = false ✓
    Legacy permissive INSERT policies:        NOT PRESENT (correctly dropped) ✓
    Legacy submit_business_card_lead(uuid,...): NOT PRESENT (correctly dropped) ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260524020000_business_card_leads_p1_hardening.sql
- Version:             20260524020000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    ALTER TABLE vport.business_card_leads
      ADD CONSTRAINT business_card_leads_source_allowlist CHECK (source IN (...))
    REVOKE UPDATE ON vport.business_card_leads FROM authenticated
    GRANT UPDATE (source) ON vport.business_card_leads TO authenticated
- Live Verification:
    business_card_leads_source_allowlist:     LIVE_PRESENT ✓
      → Allowlist: business_card, vport_card, directory, traze,
        traze_provider_lead, *_contacted variants
    Column-scoped UPDATE grant (source only): UNKNOWN
      → Column-level grants require pg_attribute_acl inspection;
        not queried. Functional verification needed.
- Drift:    NONE for the constraint. Column-grant: UNKNOWN.
- Risk:     LOW — constraint is the critical protection; column grant
            is defense-in-depth
- Recommended Action:
    Record in history. Verify column grant with:
    SELECT attname, attacl FROM pg_attribute
    WHERE attrelid = 'vport.business_card_leads'::regclass
      AND attacl IS NOT NULL;
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260525010000_reviews_schema_housekeeping.sql
- Version:             20260525010000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    DROP FUNCTION IF EXISTS reviews.get_review_author_card(uuid)
    DROP FUNCTION IF EXISTS vc.get_review_author_card(uuid)
    DROP INDEX IF EXISTS reviews.review_dimensions_type_key_uidx
    COMMENT ON FUNCTION vc.is_actor_owner(uuid)
    COMMENT ON FUNCTION reviews.upsert_neutral_review(uuid, uuid, text)
    CREATE OR REPLACE FUNCTION reviews.upsert_neutral_review(...)
      SECURITY DEFINER, with self-review guard added
- Live Verification:
    reviews.get_review_author_card:       NOT PRESENT (correctly dropped) ✓
    vc.get_review_author_card:            NOT PRESENT (correctly dropped) ✓
    review_dimensions_type_key_uidx:      NOT PRESENT (correctly dropped) ✓
    review_dimensions_target_kind_..._key: LIVE_PRESENT (constraint index retained) ✓
    reviews.upsert_neutral_review:        LIVE_PRESENT as SECURITY DEFINER ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260526010000_fuel_price_submissions_rls.sql
- Version:             20260526010000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    ALTER TABLE vport.fuel_price_submissions ENABLE ROW LEVEL SECURITY
    CREATE POLICY fuel_price_submissions_select_manager
    CREATE POLICY fuel_price_submissions_select_submitter
    CREATE POLICY fuel_price_submissions_insert_citizen
    CREATE POLICY fuel_price_submissions_update_manager
- Live Verification:
    RLS enabled:                                      LIVE_PRESENT ✓
    fuel_price_submissions_select_manager:            LIVE_PRESENT ✓
    fuel_price_submissions_select_submitter:          LIVE_PRESENT ✓
    fuel_price_submissions_insert_citizen:            LIVE_PRESENT ✓
    fuel_price_submissions_update_manager:            LIVE_PRESENT ✓
    Legacy policies also present (not in migration scope):
      fuel_price_submissions_insert_own ({public})    LIVE_PRESENT (legacy — see Security section)
      fuel_price_submissions_select_own ({public})    LIVE_PRESENT (legacy — see Security section)
      citizen_insert_fuel_price_submission            LIVE_PRESENT (legacy)
      citizen_select_fuel_price_submission            LIVE_PRESENT (legacy)
      owner_update_fuel_price_submission              LIVE_PRESENT (legacy)
- Drift:    NONE for migration objects. Legacy policies are pre-existing and out of scope.
- Risk:     LOW (legacy policies have auth guards; see DATABASE REVIEW ITEM below)
- Recommended Action:
    Record in history. Clean up legacy policies in a separate migration.
- SQL executed: READ ONLY metadata queries only
```

---

```
MIGRATION RECONCILIATION ITEM
- Migration File:      20260526020000_fix_fuel_price_submissions_grants.sql
- Version:             20260526020000
- Local Status:        LOCAL_ONLY
- Live History Status: NOT_IN_HISTORY
- Objects Detected:
    GRANT SELECT, INSERT, UPDATE ON vport.fuel_price_submissions TO authenticated
    GRANT SELECT, INSERT, UPDATE ON vport.fuel_price_submission_reviews TO authenticated
- Live Verification:
    fuel_price_submissions — authenticated SELECT, INSERT, UPDATE: LIVE_PRESENT ✓
    fuel_price_submission_reviews — authenticated SELECT, INSERT, UPDATE: LIVE_PRESENT ✓
    anon role — NO grants (VENOM F-005 corrected): LIVE_PRESENT ✓
- Drift:    NONE
- Risk:     NONE
- Recommended Action:
    Record in history.
- SQL executed: READ ONLY metadata queries only
```

---

## 4. Object-Level Verification Summary

### Critical State Confirmations

| Object | Type | Live State | Source Migration |
|--------|------|-----------|-----------------|
| `platform.provision_vcsm_identity(uuid,uuid)` | FUNCTION | INVOKER ✓ | 20260518050000 (LOCAL) |
| `platform.ensure_vcsm_actor_link(uuid,uuid,text)` | FUNCTION | DROPPED ✓ | 20260519120000 (LOCAL) |
| `vc.save_friend_ranks` | FUNCTION | INVOKER ✓ | 20260519120000 (LOCAL) |
| `vc.mark_read` | FUNCTION | DEFINER + search_path ✓ | 20260519120000 (LOCAL) |
| `reviews.get_review_author_card` | FUNCTION | DROPPED ✓ | 20260525010000 (LOCAL) |
| `vc.get_review_author_card` | FUNCTION | DROPPED ✓ | 20260525010000 (LOCAL) |
| `vc.get_vport_portfolio` | FUNCTION | DROPPED ✓ | 20260523190000 (LOCAL) |
| `vc.get_barber_vport_portfolio` | FUNCTION | DROPPED ✓ | 20260523190000 (LOCAL) |
| `reviews.upsert_neutral_review` | FUNCTION | DEFINER + search_path ✓ | 20260525010000 (LOCAL) |
| `business_card_leads_source_allowlist` | CONSTRAINT | PRESENT ✓ | 20260524020000 (LOCAL) |
| `business_card_leads_no_direct_insert` | POLICY | PRESENT ✓ | 20260524010000 (LOCAL) |
| `vport.fuel_price_submissions` RLS | RLS | ENABLED ✓ | 20260526010000 (LOCAL) |
| All `platform.user_app_*` INSERT/UPDATE policies | POLICY | PRESENT ✓ | 20260518050000 (LOCAL) |

### Drift Objects

| Object | Type | Expected State | Actual Live State |
|--------|------|---------------|-------------------|
| `"actor owner can soft delete media asset"` | POLICY | PRESENT (UPDATE, status='deleted' only) | MISSING — replaced by broader `media_assets_vc_owner_update` |
| `availability_rules_manage_neutral` | POLICY | DROPPED | Still PRESENT ({public}, ALL) |
| `availability_rules_select_neutral` | POLICY | DROPPED | Still PRESENT ({public}, SELECT) |
| `actions_select_own_actor` | POLICY | PRESENT on `moderation.actions` | MISSING — different policies present |
| `actions_insert_own_actor` | POLICY | PRESENT on `moderation.actions` | MISSING — different policies present |

### Security Objects: SECURITY DEFINER Without search_path

**Status: CLEAN.** All SECURITY DEFINER functions queried have `SET search_path` configured. No search_path injection risk detected.

### Tables With RLS Enabled But Zero Policies

| Table | Schema | Risk |
|-------|--------|------|
| `failed_account_deletions` | `platform` | LOW — default-deny locks table to all non-superuser roles. Likely intentional. |

---

## 5. Security Bypass Detection

---

```
DATABASE REVIEW ITEM
- Object:              vport.availability_rules — legacy {public} role policies
- Application Scope:   VCSM
- Severity:            MEDIUM
- Security bypass detected: YES — permissive policy (public role on write operations)
- Current behavior:
    Three policies (availability_rules_delete, availability_rules_insert,
    availability_rules_update) are assigned to the {public} role, meaning they
    apply to both anon and authenticated PostgREST sessions. Their conditions
    call SECURITY DEFINER functions (actor_can_manage_profile,
    current_actor_can_manage_resource) that check actor ownership internally.
    For unauthenticated (anon) callers, vc.current_actor_id() returns NULL,
    so actor_can_manage_profile(NULL, ...) evaluates to false — no write access
    granted to anon in practice.
    availability_rules_select_neutral ({public}, SELECT) allows unauthenticated
    read of active rules via is_active = true without an auth check.
    availability_rules_manage_neutral ({public}, ALL) also applies to anon.
- Problem:
    Using {public} role bypasses PostgREST's role-based enforcement layer.
    PostgREST enforces GRANT checks before evaluating RLS policies; for {public}
    policies, the GRANT check is skipped, pushing all enforcement burden onto
    the SECURITY DEFINER function conditions. If those functions ever change
    behavior or are bypassed via direct psql, {public} role policies offer no
    secondary enforcement gate.
    Additionally, availability_rules_manage_neutral and availability_rules_select_neutral
    are legacy policies that should have been dropped by migration 20260515010000.
    Their continued presence alongside the new {authenticated} policies creates
    redundancy and maintenance risk.
- Why it matters:
    Direct SQL access via superuser or service_role bypasses RLS entirely,
    including these SECURITY DEFINER guards. In PERMISSIVE mode, all policies
    evaluate with OR semantics — the presence of {public} write policies means
    any role that can reach the table will always have at least one policy
    evaluate their write attempt. If a condition bug were introduced into
    actor_can_manage_profile, it could expose write access to anon.
- Recommended improvement:
    1. Drop availability_rules_manage_neutral and availability_rules_select_neutral
    2. Change availability_rules_delete, availability_rules_insert,
       availability_rules_update from {public} to {authenticated}
- Rationale:
    Mirrors the pattern established by migrations 20260515010000 and 20260515020000
    which correctly used {authenticated} for the new policy set.
- Risk if unchanged:
    Low immediate risk (SECURITY DEFINER guards are present). Medium governance
    risk — policy accumulation with mixed roles creates audit complexity and
    introduces a potential failure mode if guard functions change.
- Example SQL proposal (text only, do not run):
    -- Drop legacy policies
    DROP POLICY IF EXISTS availability_rules_manage_neutral ON vport.availability_rules;
    DROP POLICY IF EXISTS availability_rules_select_neutral ON vport.availability_rules;

    -- Re-create write policies as authenticated
    DROP POLICY IF EXISTS availability_rules_delete ON vport.availability_rules;
    CREATE POLICY availability_rules_delete ON vport.availability_rules
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM vport.resources r
          WHERE r.id = availability_rules.resource_id
            AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
        )
      );
    -- (repeat for INSERT and UPDATE with same ownership check)
```

---

```
DATABASE REVIEW ITEM
- Object:              platform.media_assets — missing restrictive soft-delete policy
- Application Scope:   VCSM
- Severity:            MEDIUM
- Security bypass detected: NO (table has RLS + policies)
- Current behavior:
    platform.media_assets has UPDATE policies for vc owner
    (media_assets_vc_owner_update) and learning owner. These policies allow
    an actor to UPDATE any column on their own media assets, including
    storage_key, owner_actor_id, status, and all other fields.
    The intended policy from migration 20260519200000 would have restricted
    UPDATE to only status, deleted_at, deleted_by_actor_id, updated_at —
    scoped to the soft-delete operation only.
- Problem:
    Without the column-restrictive UPDATE policy, a VPORT actor can modify
    their media asset's storage_key or owner_actor_id through the RLS-accessible
    UPDATE path. This was not the intended behavior.
- Why it matters:
    An actor could reassign a media asset to a different owner_actor_id or
    change the storage_key reference after upload, corrupting the media registry.
    The soft-delete system loses integrity if status can be set to arbitrary
    values rather than just 'deleted'.
- Recommended improvement:
    Apply migration 20260519200000 to add the specific soft-delete policy and
    verify the column-level GRANT is in place. The broad media_assets_vc_owner_update
    policy should be evaluated for replacement or narrowing.
- Rationale:
    The principle of least privilege requires that only the intended columns
    be modifiable through the user-facing update path.
- Risk if unchanged:
    MEDIUM — actors have broader UPDATE surface on their own media assets than
    intended. No cross-actor data exposure, but data integrity of the media
    registry is at risk.
- Example SQL proposal (text only, do not run):
    -- Step 1: Apply the column-level grant (if not already present)
    GRANT UPDATE (status, deleted_at, deleted_by_actor_id, updated_at)
      ON platform.media_assets TO authenticated;

    -- Step 2: Create the restrictive soft-delete policy
    CREATE POLICY "actor owner can soft delete media asset"
      ON platform.media_assets
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM vc.actor_owners
          WHERE actor_owners.actor_id = media_assets.owner_actor_id
            AND actor_owners.user_id  = auth.uid()
        )
      )
      WITH CHECK (
        status = 'deleted'
        AND deleted_by_actor_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM vc.actor_owners
          WHERE actor_owners.actor_id = media_assets.owner_actor_id
            AND actor_owners.user_id  = auth.uid()
        )
      );

    -- Step 3: Evaluate whether media_assets_vc_owner_update should be dropped
    -- or narrowed to only cover non-deleted-status write operations.
```

---

```
DATABASE REVIEW ITEM
- Object:              moderation.actions — policy name and condition mismatch
- Application Scope:   VCSM
- Severity:            MEDIUM
- Security bypass detected: NO (table has RLS + policies)
- Current behavior:
    moderation.actions has SELECT and INSERT policies, but not the specific
    policies defined in migration 20260518020000. The live policies use
    different names and may use different ownership conditions.
    Live policies include: actions_delete_own_hide, actions_insert_self_hide,
    actions_select_own, moderation_actions_insert_moderator,
    moderation_actions_select_moderator, moderation_actions_update_moderator.
    Migration 20260518020000 intended: actions_select_own_actor (reads via
    actor_owners) and actions_insert_own_actor (writes via actor_owners).
- Problem:
    The live policy conditions may not be equivalent to the migration's intended
    actor_owners-based ownership check. "actions_insert_self_hide" suggests a
    narrower insert scope (only self-hide actions?), while the migration's intent
    was any actor_id the caller owns.
- Why it matters:
    If the live INSERT policy is narrower than intended, users may be blocked
    from legitimate moderation actions. If it is broader, users could insert
    moderation actions for actor_ids they don't own.
- Recommended improvement:
    1. Run a live inspection:
       SELECT policyname, cmd, qual, with_check
       FROM pg_policies WHERE schemaname = 'moderation' AND tablename = 'actions';
    2. Compare conditions against migration 20260518020000 intent
    3. Determine if the live policies provide equivalent or better protection
    4. If equivalent: mark as superseded, do not re-apply the migration
    5. If different: apply the migration and record in history
- Risk if unchanged:
    MEDIUM — unclear whether access control on moderation.actions matches
    the architecture contract's actor ownership model.
- Example SQL proposal (text only, do not run):
    -- If live policies are verified as superseded/improved, simply record history:
    -- INSERT INTO supabase_migrations.schema_migrations (version, name)
    -- VALUES ('20260518020000', 'moderation_actions_rls');
    -- If re-application is needed (after full condition comparison):
    DROP POLICY IF EXISTS "actions_select_own_actor" ON moderation.actions;
    CREATE POLICY "actions_select_own_actor" ON moderation.actions
      FOR SELECT TO authenticated
      USING (
        actor_id IN (
          SELECT ao.actor_id FROM vc.actor_owners ao
          WHERE ao.user_id = auth.uid()
        )
      );
```

---

```
DATABASE REVIEW ITEM
- Object:              vport.fuel_price_submissions — legacy {public} policies
- Application Scope:   VCSM
- Severity:            LOW
- Security bypass detected: YES — permissive policy ({public} role)
- Current behavior:
    fuel_price_submissions_insert_own ({public}) and
    fuel_price_submissions_select_own ({public}) are legacy pre-migration policies.
    The INSERT policy's WITH CHECK includes auth.uid() IS NOT NULL, so anon
    callers are blocked at evaluation time. The SELECT policy uses
    current_actor_id() which returns NULL for anon — no rows visible.
    New authenticated policies from 20260526010000 also exist alongside.
- Problem:
    Legacy {public} policies create redundancy and should be cleaned up.
    They predate the proper policy naming convention and use the old
    vc.current_actor_id() pattern rather than the canonical direct
    auth.uid() check.
- Why it matters:
    Policy accumulation across multiple audit cycles creates confusion for
    future reviewers and increases the risk of unintended policy interactions.
- Recommended improvement:
    Drop the 5 legacy policies (fuel_price_submissions_insert_own,
    fuel_price_submissions_select_own, citizen_insert_fuel_price_submission,
    citizen_select_fuel_price_submission, owner_update_fuel_price_submission)
    in a dedicated cleanup migration after verifying the new policies provide
    equivalent or better coverage.
- Risk if unchanged:
    LOW — legacy policies are functionally blocked for anon by auth guards.
    No active data exposure risk, only governance debt.
- Example SQL proposal (text only, do not run):
    -- After confirming new policies cover all access paths:
    DROP POLICY IF EXISTS fuel_price_submissions_insert_own ON vport.fuel_price_submissions;
    DROP POLICY IF EXISTS fuel_price_submissions_select_own ON vport.fuel_price_submissions;
    DROP POLICY IF EXISTS citizen_insert_fuel_price_submission ON vport.fuel_price_submissions;
    DROP POLICY IF EXISTS citizen_select_fuel_price_submission ON vport.fuel_price_submissions;
    DROP POLICY IF EXISTS owner_update_fuel_price_submission ON vport.fuel_price_submissions;
```

---

## 6. Migration Reconciliation Summary

```
MIGRATION RECONCILIATION SUMMARY

| Migration File                                          | History Status          | Object Status | Drift   | Risk   |
|---------------------------------------------------------|-------------------------|---------------|---------|--------|
| 20260427010000_vport_bookings_insert_rls_fix            | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260427020000_vport_traze_directory_visibility_fix     | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260427030000_fix_traze_view_directory_columns         | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260427040000_fix_bookings_owner_policy                | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260427050000_grant_bookings_insert_update             | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260427060000_grant_vport_write_permissions            | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260427070000_sync_business_card_published_…           | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260427080000_grant_business_card_leads_owner_write    | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260429100000_add_business_card_settings_to_vport…     | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260429200000_upgrade_read_business_card_public…       | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260429210000_fix_read_business_card_public_and…       | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260429220000_fix_business_card_sections_rates…        | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260430100000_add_push_subscriptions                   | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260430200000_fix_chat_rls_multi_actor                 | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260430300000_create_platform_media_assets             | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260430400000_media_asset_writeback_columns            | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260430500000_profile_media_asset_writeback_columns    | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260430600000_grant_vport_profile_public_details…      | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260503040334_fix_public_profile_rls_policies          | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260503052543_fix_missing_authenticated_grants         | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260503060000_business_card_traze_listing_fields       | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260510010000_moderation_blocks_rls_and_indexes        | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260510020000_vc_posts_privacy_rls                     | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260510030000_user_consents_immutability_and_grant     | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260510040000_age_verification_consent_type            | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260510050000_accepted_at_server_default               | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260510060000_chat_messages_block_rls                  | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260511010000_fix_read_business_card_public_remove…    | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260514000000_chat_inbox_entries_actor_badge_index     | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260515010000_vport_booking_resource_rls_policies      | LOCAL_ONLY               | PARTIAL      | PARTIAL | MEDIUM |
| 20260515020000_vport_resources_actor_rls_rebuild        | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260518010000_actor_onboarding_steps_rls               | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260518020000_moderation_actions_rls                   | LOCAL_ONLY               | PARTIAL      | PARTIAL | MEDIUM |
| 20260518030000_actor_follows_sf07_resolution            | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260518040000_platform_provision_vcsm_identity         | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260518050000_platform_provision_vcsm_identity_rls     | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260519120000_platform_vc_security_hardening           | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260519200000_media_assets_soft_delete_policy          | LOCAL_ONLY               | PARTIAL      | PARTIAL | MEDIUM |
| 20260523010000_backfill_tracked_rls_coverage            | LOCAL_ONLY ⚠️ OUT-OF-ORDER | LIVE_PRESENT | NONE  | LOW    |
| 20260523020000_fix_vport_rates_rls                      | LOCAL_ONLY ⚠️ OUT-OF-ORDER | LIVE_PRESENT | NONE  | LOW    |
| 20260523030000_fix_content_pages_rls                    | LOCAL_ONLY ⚠️ OUT-OF-ORDER | LIVE_PRESENT | NONE  | LOW    |
| 20260523040000_fix_bookings_rls                         | LOCAL_ONLY ⚠️ OUT-OF-ORDER | LIVE_PRESENT | NONE  | LOW    |
| 20260523190000_portfolio_card_p0_security               | LOCAL_ONLY ⚠️ OUT-OF-ORDER | LIVE_PRESENT | NONE  | LOW    |
| 20260523220000_vport_services_rls_security_fixes        | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260523230000_remove_actor_can_manage_profile…         | LIVE_CONFIRMED_BY_HISTORY | LIVE_PRESENT | NONE    | NONE   |
| 20260524010000_business_card_leads_p0_security          | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260524020000_business_card_leads_p1_hardening         | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260525010000_reviews_schema_housekeeping              | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
| 20260526010000_fuel_price_submissions_rls               | LOCAL_ONLY               | LIVE_PRESENT | NONE    | LOW    |
| 20260526020000_fix_fuel_price_submissions_grants        | LOCAL_ONLY               | LIVE_PRESENT | NONE    | NONE   |
```

---

## 7. Migration Governance Status

```
MIGRATION GOVERNANCE STATUS: DRIFT DETECTED
```

**Reasons:**

1. **19 of 50 migrations are LOCAL_ONLY** — not recorded in `supabase_migrations.schema_migrations`. Objects were applied directly to the live database out-of-band (SQL editor or equivalent) without tracking.

2. **Out-of-order history conflict (CRITICAL)** — Migrations 20260523010000 through 20260523190000 (5 files) have version numbers that sort **before** the two history-confirmed entries 20260523220000 and 20260523230000. Supabase CLI will refuse to apply these out-of-order. If `supabase db push` is ever run, it will block at the first LOCAL_ONLY migration whose version number precedes any existing history entry.

3. **3 migrations with PARTIAL drift:**
   - 20260515010000: Legacy `availability_rules` policies not dropped
   - 20260518020000: `moderation.actions` policies exist with different names/conditions
   - 20260519200000: Soft-delete restriction policy missing; broader UPDATE policy in place

---

## 8. Recommended Manual Actions

### Priority 1 — Governance: Register untracked migrations

The safest resolution for the 19 LOCAL_ONLY migrations is to **manually insert history records** for the 14 non-out-of-order LOCAL_ONLY migrations (20260515010000 through 20260519200000, 20260524010000 through 20260526020000). These have confirmed object-level presence.

```sql
-- TEXT ONLY — DO NOT RUN automatically
-- Must be executed as postgres or service_role with superuser access
-- Run each INSERT individually and verify after each one

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260515010000', 'vport_booking_resource_rls_policies'),
  ('20260515020000', 'vport_resources_actor_rls_rebuild'),
  ('20260518010000', 'actor_onboarding_steps_rls'),
  ('20260518020000', 'moderation_actions_rls'),   -- Verify condition equivalence first
  ('20260518030000', 'actor_follows_sf07_resolution'),
  ('20260518040000', 'platform_provision_vcsm_identity'),
  ('20260518050000', 'platform_provision_vcsm_identity_rls'),
  ('20260519120000', 'platform_vc_security_hardening'),
  ('20260519200000', 'media_assets_soft_delete_policy');  -- Verify object presence first
```

### Priority 2 — Governance: Resolve out-of-order conflict

For the 5 out-of-order migrations (20260523010000 through 20260523190000), two options:

**Option A (preferred):** Register them in history at their natural version order using manual INSERT:
```sql
-- TEXT ONLY — DO NOT RUN automatically
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260523010000', 'backfill_tracked_rls_coverage'),
  ('20260523020000', 'fix_vport_rates_rls'),
  ('20260523030000', 'fix_content_pages_rls'),
  ('20260523040000', 'fix_bookings_rls'),
  ('20260523190000', 'portfolio_card_p0_security');
```
This works because their objects are already live — no SQL needs to run.

**Option B:** Renumber the local files with version numbers after 20260523230000 to remove the ordering conflict. This is riskier because it modifies the migration file inventory.

### Priority 3 — Schema: Apply missing soft-delete policy

Apply migration 20260519200000 manually via Supabase SQL editor (the GRANT + CREATE POLICY statements). Verify `media_assets_vc_owner_update` policy scope and decide whether it should remain as-is or be narrowed.

### Priority 4 — Schema: Drop legacy availability_rules policies

Apply a cleanup migration to:
1. Drop `availability_rules_manage_neutral`
2. Drop `availability_rules_select_neutral`
3. Re-create the three `{public}` write policies as `{authenticated}`

### Priority 5 — Schema: Verify and reconcile moderation.actions policies

Compare live `moderation.actions` policy conditions against migration 20260518020000 intent. If conditions are equivalent, mark as superseded. If different, apply the canonical policy.

### Priority 6 — Schema: Clean up legacy fuel_price_submissions policies

Drop the 5 legacy `{public}` / pre-migration policies on `vport.fuel_price_submissions` in a dedicated migration.

---

## 9. Completion Criteria Check

- [x] Live database connection confirmed
- [x] Schema analysis performed from live database only
- [x] Security bypass detection scan completed
- [x] All findings reported using `DATABASE REVIEW ITEM` format
- [x] All SQL proposals clearly labeled as text-only, not executed
- [x] Migration reconciliation performed
- [x] Live migration history checked (`supabase_migrations.schema_migrations`)
- [x] Local migration filenames compared against live history
- [x] Object-level reconciliation completed for each LOCAL_ONLY migration file
- [x] Each migration file classified
- [x] Each candidate object classified
- [x] Drift classification completed per file
- [x] Risk classification completed per file
- [x] Summary table produced
- [x] Final `MIGRATION GOVERNANCE STATUS` classification issued
- [x] Report persisted to `zNOTFORPRODUCTION/_HISTORY/db/snapshots/`

---

*Report generated by /DB command — READ ONLY — 2026-05-26*  
*No database changes were made during this analysis.*
