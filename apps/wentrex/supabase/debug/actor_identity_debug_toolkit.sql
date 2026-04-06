-- ============================================================================
-- LMS Actor Identity Debugging Toolkit
-- Supabase + Postgres RLS Debugging Utilities
-- ============================================================================
-- Usage: Run these in the Supabase SQL Editor.
-- For RLS-bypassed queries, use service_role connection.
-- For simulated user queries, use the anon/authenticated connection.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1️⃣ ACTOR IDENTITY VISIBILITY DEBUGGER
-- Takes an auth user UUID and shows what the system sees
-- ────────────────────────────────────────────────────────────────────────────

create or replace function debug.actor_identity_visibility(p_auth_user_id uuid)
returns table (
  actor_id uuid,
  user_id uuid,
  login_id text,
  must_change_password boolean,
  is_school_managed boolean,
  identity_organization_id uuid,
  actor_organization_id uuid,
  org_match boolean,
  actor_active boolean,
  identity_exists boolean
)
language sql
security definer
as $$
  select
    a.id as actor_id,
    a.user_id,
    ai.login_id,
    ai.must_change_password,
    ai.is_school_managed,
    ai.organization_id as identity_organization_id,
    a.organization_id as actor_organization_id,
    (ai.organization_id = a.organization_id) as org_match,
    a.is_active as actor_active,
    (ai.actor_id is not null) as identity_exists
  from learning.actors a
  left join learning.actor_identities ai on ai.actor_id = a.id
  where a.user_id = p_auth_user_id;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 2️⃣ RLS POLICY INSPECTOR
-- Shows all RLS policies on actor_identities
-- ────────────────────────────────────────────────────────────────────────────

-- Run this directly (not a function):
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'learning'
  AND tablename = 'actor_identities'
ORDER BY policyname;
*/

create or replace function debug.rls_policies_for_table(p_schema text, p_table text)
returns table (
  policy_name name,
  permissive text,
  roles name[],
  command text,
  qual text,
  with_check text
)
language sql
security definer
as $$
  select
    policyname,
    permissive,
    roles,
    cmd,
    qual::text,
    with_check::text
  from pg_policies
  where schemaname = p_schema
    and tablename = p_table
  order by policyname;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 3️⃣ AUTHENTICATION CONTEXT TESTER
-- Verifies who Postgres thinks you are right now
-- ────────────────────────────────────────────────────────────────────────────

/*
Run this in the SQL editor to check your current auth context:

SELECT
  auth.uid()        AS auth_user_id,
  auth.role()       AS auth_role,
  current_user      AS pg_current_user,
  session_user      AS pg_session_user,
  current_setting('request.jwt.claims', true) AS jwt_claims;

-- If auth.uid() is NULL:
--   You are running as service_role or anon without a JWT.
--   RLS policies that use auth.uid() will return no rows.
--   This is the #1 cause of "data exists but frontend sees nothing".
*/

create or replace function debug.auth_context()
returns table (
  auth_uid uuid,
  auth_role text,
  pg_user text,
  pg_session text,
  has_auth_context boolean
)
language sql
security definer
as $$
  select
    auth.uid(),
    auth.role()::text,
    current_user::text,
    session_user::text,
    (auth.uid() is not null) as has_auth_context;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 4️⃣ IDENTITY OWNERSHIP VALIDATOR
-- Checks if actor_identity belongs to the authenticated user
-- ────────────────────────────────────────────────────────────────────────────

create or replace function debug.identity_ownership(p_auth_user_id uuid)
returns table (
  actor_id uuid,
  actor_user_id uuid,
  auth_uid uuid,
  ownership_match boolean,
  has_identity boolean,
  has_actor boolean
)
language sql
security definer
as $$
  select
    a.id as actor_id,
    a.user_id as actor_user_id,
    p_auth_user_id as auth_uid,
    (a.user_id = p_auth_user_id) as ownership_match,
    exists(select 1 from learning.actor_identities ai where ai.actor_id = a.id) as has_identity,
    true as has_actor
  from learning.actors a
  where a.user_id = p_auth_user_id

  union all

  -- Case: no actor found
  select
    null, null, p_auth_user_id, false, false, false
  where not exists (
    select 1 from learning.actors where user_id = p_auth_user_id
  );
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 5️⃣ ORGANIZATION SCOPE VALIDATOR
-- Detects org_id mismatches between actor and identity
-- ────────────────────────────────────────────────────────────────────────────

create or replace function debug.org_scope_check(p_auth_user_id uuid)
returns table (
  actor_id uuid,
  actor_org_id uuid,
  identity_org_id uuid,
  org_match boolean,
  actor_org_name text,
  identity_org_name text,
  warning text
)
language sql
security definer
as $$
  select
    a.id,
    a.organization_id,
    ai.organization_id,
    (a.organization_id = ai.organization_id) as org_match,
    ao.name,
    io.name,
    case
      when ai.actor_id is null then 'NO_IDENTITY_ROW'
      when a.organization_id is null then 'ACTOR_ORG_NULL'
      when ai.organization_id is null then 'IDENTITY_ORG_NULL'
      when a.organization_id != ai.organization_id then 'ORG_MISMATCH'
      else 'OK'
    end as warning
  from learning.actors a
  left join learning.actor_identities ai on ai.actor_id = a.id
  left join learning.organizations ao on ao.id = a.organization_id
  left join learning.organizations io on io.id = ai.organization_id
  where a.user_id = p_auth_user_id;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 6️⃣ FULL IDENTITY DEBUG REPORT
-- Master diagnostic — returns JSON with probable issue detection
-- ────────────────────────────────────────────────────────────────────────────

create or replace function debug.actor_identity_report(p_auth_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor_id uuid;
  v_actor_active boolean;
  v_actor_org_id uuid;
  v_identity_exists boolean;
  v_identity_org_id uuid;
  v_identity_login_id text;
  v_access_enabled boolean;
  v_access_revoked boolean;
  v_org_match boolean;
  v_rls_policy_count int;
  v_has_org_membership boolean;
  v_has_parent_link boolean;
  v_has_student_membership boolean;
  v_issues text[];
begin
  -- Actor lookup
  select id, is_active, organization_id
  into v_actor_id, v_actor_active, v_actor_org_id
  from learning.actors
  where user_id = p_auth_user_id
  limit 1;

  if v_actor_id is null then
    return jsonb_build_object(
      'auth_user_id', p_auth_user_id,
      'actor_found', false,
      'identity_found', false,
      'probable_issue', 'NO_ACTOR_ROW — auth user has no learning.actors entry'
    );
  end if;

  -- Identity lookup
  select
    (ai.actor_id is not null),
    ai.organization_id,
    ai.login_id
  into v_identity_exists, v_identity_org_id, v_identity_login_id
  from learning.actor_identities ai
  where ai.actor_id = v_actor_id;

  if not found then
    v_identity_exists := false;
  end if;

  -- Org match
  v_org_match := coalesce(v_actor_org_id = v_identity_org_id, false);

  -- Access check
  select
    coalesce(can_access_learning_center, false),
    (revoked_at is not null)
  into v_access_enabled, v_access_revoked
  from learning.actor_access
  where actor_id = v_actor_id;

  if not found then
    v_access_enabled := false;
    v_access_revoked := false;
  end if;

  -- RLS policy count
  select count(*)
  into v_rls_policy_count
  from pg_policies
  where schemaname = 'learning'
    and tablename = 'actor_identities';

  -- Role checks
  v_has_org_membership := exists(
    select 1 from learning.organization_memberships
    where actor_id = v_actor_id and status = 'active'
  );

  v_has_parent_link := exists(
    select 1 from learning.parent_student_links
    where parent_actor_id = v_actor_id
  );

  v_has_student_membership := exists(
    select 1 from learning.course_memberships
    where actor_id = v_actor_id and role = 'student' and status = 'active'
  );

  -- Issue detection
  v_issues := array[]::text[];

  if not v_actor_active then
    v_issues := v_issues || 'ACTOR_INACTIVE — learning.actors.is_active = false';
  end if;

  if not v_identity_exists then
    v_issues := v_issues || 'NO_IDENTITY_ROW — no row in learning.actor_identities';
  end if;

  if v_identity_exists and not v_org_match then
    v_issues := v_issues || 'ORG_MISMATCH — actor.organization_id != identity.organization_id';
  end if;

  if not v_access_enabled then
    v_issues := v_issues || 'ACCESS_DISABLED — actor_access.can_access_learning_center = false or missing';
  end if;

  if v_access_revoked then
    v_issues := v_issues || 'ACCESS_REVOKED — actor_access.revoked_at is set';
  end if;

  if v_rls_policy_count > 0 and not v_access_enabled then
    v_issues := v_issues || 'RLS_BLOCKING — RLS policies exist and access gate is closed';
  end if;

  if not v_has_org_membership and not v_has_parent_link and not v_has_student_membership then
    v_issues := v_issues || 'NO_ROLE — no org membership, no parent link, no student enrollment';
  end if;

  if array_length(v_issues, 1) is null then
    v_issues := array['NONE — all checks passed'];
  end if;

  return jsonb_build_object(
    'auth_user_id', p_auth_user_id,
    'actor_id', v_actor_id,
    'actor_active', v_actor_active,
    'actor_org_id', v_actor_org_id,
    'identity_found', v_identity_exists,
    'identity_org_id', v_identity_org_id,
    'identity_login_id', v_identity_login_id,
    'organization_match', v_org_match,
    'access_enabled', v_access_enabled,
    'access_revoked', v_access_revoked,
    'rls_policy_count', v_rls_policy_count,
    'has_org_membership', v_has_org_membership,
    'has_parent_link', v_has_parent_link,
    'has_student_membership', v_has_student_membership,
    'issues', to_jsonb(v_issues)
  );
end;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 7️⃣ FRONTEND DEBUG QUERY
-- Simulates what the Supabase JS client would see
-- Run this as the authenticated user (not service_role)
-- ────────────────────────────────────────────────────────────────────────────

/*
-- Run this in the SQL editor with a user JWT:

SELECT
  a.id AS actor_id,
  a.user_id,
  a.organization_id,
  a.is_active,
  ai.login_id,
  ai.must_change_password,
  ai.is_school_managed,
  ai.organization_id AS identity_org_id,
  ai.parent_email,
  ai.parent_name
FROM learning.actors a
LEFT JOIN learning.actor_identities ai ON ai.actor_id = a.id
WHERE a.user_id = auth.uid();
*/


-- ────────────────────────────────────────────────────────────────────────────
-- 8️⃣ TEMPORARY RLS BYPASS TEST
-- Run with service_role to confirm data exists
-- If this returns rows but the frontend doesn't, RLS is the blocker
-- ────────────────────────────────────────────────────────────────────────────

create or replace function debug.bypass_rls_identity_check(p_auth_user_id uuid)
returns table (
  source text,
  actor_id uuid,
  user_id uuid,
  login_id text,
  is_school_managed boolean,
  actor_org_id uuid,
  identity_org_id uuid,
  access_enabled boolean
)
language sql
security definer
as $$
  select
    'SERVICE_ROLE_BYPASS'::text as source,
    a.id,
    a.user_id,
    ai.login_id,
    ai.is_school_managed,
    a.organization_id,
    ai.organization_id,
    coalesce(aa.can_access_learning_center, false)
  from learning.actors a
  left join learning.actor_identities ai on ai.actor_id = a.id
  left join learning.actor_access aa on aa.actor_id = a.id
  where a.user_id = p_auth_user_id;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 9️⃣ POLICY SIMULATION HELPER
-- Simulates whether the current RLS SELECT policy would pass
-- ────────────────────────────────────────────────────────────────────────────

create or replace function debug.simulate_rls_access(p_auth_user_id uuid)
returns table (
  actor_id uuid,
  would_pass_self_select boolean,
  would_pass_platform_admin boolean,
  current_actor_id uuid,
  is_platform_admin boolean
)
language plpgsql
security definer
as $$
declare
  v_actor_id uuid;
  v_current_actor uuid;
  v_is_admin boolean;
begin
  -- Target actor
  select id into v_actor_id
  from learning.actors
  where user_id = p_auth_user_id
  limit 1;

  -- Simulated current_actor_id (what RLS would resolve)
  select ao.actor_id into v_current_actor
  from vc.actor_owners ao
  where ao.user_id = p_auth_user_id
    and coalesce(ao.is_void, false) = false
  order by ao.actor_id
  limit 1;

  -- Platform admin check
  v_is_admin := exists(
    select 1 from learning.platform_admins
    where actor_id = v_current_actor
  );

  return query
  select
    v_actor_id,
    (v_actor_id = v_current_actor) as would_pass_self_select,
    v_is_admin as would_pass_platform_admin,
    v_current_actor,
    v_is_admin;
end;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 🔟 CONVENIENCE: Quick debug for a specific email
-- ────────────────────────────────────────────────────────────────────────────

create or replace function debug.debug_by_email(p_email text)
returns jsonb
language sql
security definer
as $$
  select debug.actor_identity_report(
    (select id from auth.users where email = lower(trim(p_email)) limit 1)
  );
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- SCHEMA + GRANTS
-- ────────────────────────────────────────────────────────────────────────────

-- Create debug schema if not exists
create schema if not exists debug;

-- Grant execute to service_role (these are admin-only tools)
grant usage on schema debug to service_role;
grant execute on all functions in schema debug to service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- USAGE EXAMPLES
-- ────────────────────────────────────────────────────────────────────────────

/*

-- Quick debug by email (easiest):
SELECT debug.debug_by_email('troyteam2026@outlook.com');

-- Full report by auth user ID:
SELECT debug.actor_identity_report('94289521-130a-4bf6-a561-690315b729a4');

-- Check what frontend would see:
SELECT * FROM debug.actor_identity_visibility('94289521-130a-4bf6-a561-690315b729a4');

-- Check org mismatches:
SELECT * FROM debug.org_scope_check('94289521-130a-4bf6-a561-690315b729a4');

-- Check ownership:
SELECT * FROM debug.identity_ownership('94289521-130a-4bf6-a561-690315b729a4');

-- Bypass RLS to confirm data exists:
SELECT * FROM debug.bypass_rls_identity_check('94289521-130a-4bf6-a561-690315b729a4');

-- List RLS policies on actor_identities:
SELECT * FROM debug.rls_policies_for_table('learning', 'actor_identities');

-- Simulate RLS access:
SELECT * FROM debug.simulate_rls_access('94289521-130a-4bf6-a561-690315b729a4');

-- Check auth context:
SELECT * FROM debug.auth_context();

*/
