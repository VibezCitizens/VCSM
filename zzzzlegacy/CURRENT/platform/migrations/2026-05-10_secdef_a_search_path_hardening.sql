-- ============================================================
-- PROPOSAL ONLY — review before applying
-- File: secdef_a — SECURITY DEFINER search_path hardening
-- Date: 2026-05-10
-- Risk: LOW — ALTER FUNCTION only changes the search_path config.
--   No function body, signature, return type, or behavior changes.
--   Safe to run in production. Idempotent.
-- Deploy order: Independent — run any time.
-- Fixes: CVE-2018-1058 (search_path injection on SECURITY DEFINER)
--
-- Generated using pg_get_function_identity_arguments(oid) — no DEFAULT
-- clauses, correct for ALTER FUNCTION syntax.
--
-- Source: all_security_definer_functions_2026-05-10.csv
-- Verified: 33 statements covering all SECURITY DEFINER functions
--   that were missing SET search_path as of 2026-05-10.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- identity schema
-- ─────────────────────────────────────────────────────────────

ALTER FUNCTION identity.refresh_actor_directory_all()
  SET search_path = 'identity', 'vc', 'learning', 'public', 'pg_temp';

-- references: identity.actor_directory, vc.actors, vc.actor_owners,
-- vc.actor_privacy_settings, vport.profiles, learning.actors,
-- learning.actor_owners, learning.actor_profiles, public.profiles
ALTER FUNCTION identity.refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)
  SET search_path = 'identity', 'vc', 'learning', 'vport', 'public', 'pg_temp';


-- ─────────────────────────────────────────────────────────────
-- learning schema
-- ─────────────────────────────────────────────────────────────

-- references: platform.platform_owners, auth.users, learning.*
ALTER FUNCTION learning.create_tenant_bootstrap(p_caller_user_id uuid, p_principal_user_id uuid, p_realm_slug text, p_realm_name text, p_org_slug text, p_org_name text, p_primary_color text)
  SET search_path = 'learning', 'platform', 'public', 'auth', 'pg_temp';

ALTER FUNCTION learning.generate_student_login_id(p_year integer)
  SET search_path = 'learning', 'public', 'pg_temp';

ALTER FUNCTION learning.generate_unique_tenant_slug(base_name text)
  SET search_path = 'learning', 'public', 'pg_temp';


-- ─────────────────────────────────────────────────────────────
-- omd schema
-- ─────────────────────────────────────────────────────────────

ALTER FUNCTION omd.get_photos_count(uid uuid)
  SET search_path = 'omd', 'public', 'pg_temp';

ALTER FUNCTION omd.get_user_trips_count(uid uuid)
  SET search_path = 'omd', 'public', 'pg_temp';


-- ─────────────────────────────────────────────────────────────
-- public schema
-- ─────────────────────────────────────────────────────────────

-- references: learning.*, platform.*, public.profiles, auth.users
-- NOTE: Step 5 adds the admin guard — this only adds search_path
ALTER FUNCTION public.admin_delete_user_everywhere(p_user_id uuid)
  SET search_path = 'public', 'learning', 'platform', 'auth', 'pg_temp';

-- uses auth.uid() internally
ALTER FUNCTION public.unfollow_user(target uuid)
  SET search_path = 'public', 'auth', 'pg_temp';

-- no auth.uid() usage
ALTER FUNCTION public.unfollow_user(follower uuid, followed uuid)
  SET search_path = 'public', 'pg_temp';

-- references: public.norm_pair, public.friends
ALTER FUNCTION public.unfriend(a uuid, b uuid)
  SET search_path = 'public', 'pg_temp';


-- ─────────────────────────────────────────────────────────────
-- vc schema
-- ─────────────────────────────────────────────────────────────

-- references: vc.actors, vc.create_vport, auth.uid()
ALTER FUNCTION vc.create_vport_self(p_name text, p_slug text, p_vport_type text, p_bio text, p_avatar_url text, p_banner_url text, p_meta jsonb)
  SET search_path = 'vc', 'public', 'auth', 'pg_temp';

-- references: vc.actors, platform.user_app_accounts, auth.uid()
ALTER FUNCTION vc.current_actor_id()
  SET search_path = 'vc', 'platform', 'public', 'auth', 'pg_temp';


-- ─────────────────────────────────────────────────────────────
-- vport schema
-- ─────────────────────────────────────────────────────────────

-- references: vport.profile_actor_access, vc.actors, calls vport.actor_can_manage_profile
ALTER FUNCTION vport.add_profile_actor_access(p_actor_id uuid, p_profile_id uuid, p_target_actor_id uuid, p_role text, p_is_primary boolean)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- references: vport.availability_rules, vport.resources, calls vport.actor_can_manage_profile
ALTER FUNCTION vport.add_weekly_availability_rule_greenfield(p_actor_id uuid, p_profile_id uuid, p_resource_id uuid, p_weekday smallint, p_start_time time without time zone, p_end_time time without time zone, p_valid_from date, p_valid_until date)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- references: vport.*, vc.actors, platform.* (via vport.get_active_actor_context)
ALTER FUNCTION vport.create_profile_greenfield(p_user_id uuid, p_app_id uuid, p_owner_user_profile_id uuid, p_slug text, p_name text, p_primary_category_key text, p_bio text, p_avatar_url text, p_banner_url text, p_website_url text, p_email_public text, p_phone_public text, p_country_code text, p_locale text, p_timezone text, p_location_text text, p_address jsonb, p_lat double precision, p_lng double precision, p_hours jsonb, p_price_tier smallint, p_highlights text[], p_languages text[], p_payment_methods text[], p_social_links jsonb, p_booking_url text, p_logo_url text, p_accent_color text, p_meta jsonb)
  SET search_path = 'vport', 'vc', 'platform', 'public', 'auth', 'pg_temp';

-- 7-arg overload
ALTER FUNCTION vport.create_resource_greenfield(p_actor_id uuid, p_profile_id uuid, p_name text, p_resource_type text, p_description text, p_is_active boolean, p_meta jsonb)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- 8-arg overload (adds p_timezone, p_sort_order)
ALTER FUNCTION vport.create_resource_greenfield(p_actor_id uuid, p_profile_id uuid, p_name text, p_resource_type text, p_timezone text, p_sort_order integer, p_is_active boolean, p_meta jsonb)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- references: vport.*, vc.*
ALTER FUNCTION vport.create_service_for_vport_actor(p_vport_actor_id uuid, p_key text, p_label text, p_description text, p_service_group text, p_enabled boolean, p_sort_order integer, p_meta jsonb)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- 9-arg overload (price/currency/duration)
ALTER FUNCTION vport.create_service_greenfield(p_actor_id uuid, p_profile_id uuid, p_name text, p_description text, p_price_cents integer, p_currency_code text, p_duration_minutes integer, p_is_active boolean, p_meta jsonb)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- 9-arg overload (key/label/service_group)
ALTER FUNCTION vport.create_service_greenfield(p_actor_id uuid, p_profile_id uuid, p_key text, p_label text, p_description text, p_service_group text, p_enabled boolean, p_sort_order integer, p_meta jsonb)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- 8-arg overload
ALTER FUNCTION vport.create_vport_for_actor(p_actor_id uuid, p_owner_user_id uuid, p_slug text, p_name text, p_primary_category_key text, p_bio text, p_avatar_url text, p_banner_url text)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- 9-arg overload (adds p_directory_visible)
ALTER FUNCTION vport.create_vport_for_actor(p_actor_id uuid, p_owner_user_id uuid, p_slug text, p_name text, p_primary_category_key text, p_bio text, p_avatar_url text, p_banner_url text, p_directory_visible boolean)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

ALTER FUNCTION vport.current_actor_can_manage_location(p_location_id uuid)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

ALTER FUNCTION vport.current_actor_can_manage_organization(p_organization_id uuid)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

ALTER FUNCTION vport.current_actor_can_manage_resource(p_resource_id uuid)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

-- references: vport.*, vc.*, identity.actor_directory, platform.*
ALTER FUNCTION vport.hard_delete_vport(p_vport_id uuid)
  SET search_path = 'vport', 'vc', 'identity', 'platform', 'public', 'pg_temp';

ALTER FUNCTION vport.link_resource_service_greenfield(p_actor_id uuid, p_profile_id uuid, p_resource_id uuid, p_service_id uuid)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

ALTER FUNCTION vport.restore_vport(p_vport_id uuid)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';

ALTER FUNCTION vport.soft_delete_vport(p_vport_id uuid)
  SET search_path = 'vport', 'vc', 'public', 'pg_temp';


-- ─────────────────────────────────────────────────────────────
-- wanders schema
-- ─────────────────────────────────────────────────────────────

ALTER FUNCTION wanders.create_inbox_share_link(p_inbox_id uuid)
  SET search_path = 'wanders', 'public', 'pg_temp';

ALTER FUNCTION wanders.drop_send_card(p_drop_public_id text, p_client_key text, p_template_key text, p_message_text text, p_customization jsonb)
  SET search_path = 'wanders', 'public', 'pg_temp';

ALTER FUNCTION wanders.redeem_inbox_share_link(p_token text, p_pin text, p_client_key text)
  SET search_path = 'wanders', 'public', 'pg_temp';
