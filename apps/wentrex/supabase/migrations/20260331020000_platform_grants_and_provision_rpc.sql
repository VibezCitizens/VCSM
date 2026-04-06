-- Platform schema: grants + secure provisioning RPC
-- ============================================================
--
-- GRANTS
-- ------
-- Give the authenticated role what it needs to read its own
-- platform rows (via existing SELECT RLS policies) and update
-- the two safe self-service tables (state + preferences).
--
-- Do NOT grant INSERT on provisioning tables (user_app_access,
-- user_app_accounts, user_app_actor_links). Those writes go
-- through the provision_wentrex_identity() RPC which is
-- SECURITY DEFINER and performs them internally.
--
-- PROVISIONING RPC
-- ----------------
-- provision_wentrex_identity() replaces the 5 separate direct
-- table inserts the browser identity engine was doing. Moving
-- these into a SECURITY DEFINER function:
--   1. Removes the need for client-side INSERT grants on
--      provisioning tables (fixing the 403 regression).
--   2. Enforces user_id = auth.uid() at the DB layer — callers
--      cannot provision rows for other users.
--   3. Uses DO UPDATE (not DO NOTHING) so re-login refreshes
--      last_seen_at, last_login_at, and actor link status.

begin;

-- ============================================================
-- 1. Schema-level access
-- ============================================================

grant usage on schema platform to authenticated, anon;

-- ============================================================
-- 2. Read access — all platform tables
-- ============================================================
-- RLS policies enforce row-level filtering.
-- This only grants the table-level permission; rows are still
-- restricted to the current user by the SELECT policies.

grant select on
  platform.apps,
  platform.app_roles,
  platform.capabilities,
  platform.role_capabilities,
  platform.user_app_access,
  platform.user_app_accounts,
  platform.user_app_actor_links,
  platform.user_app_preferences,
  platform.user_app_state,
  platform.user_app_account_roles,
  platform.user_capabilities
to authenticated;

-- ============================================================
-- 3. Self-service write access — state + preferences only
-- ============================================================
-- These two tables receive browser-side UPSERTs after
-- provisioning: login timestamps and active actor selection.
-- All other provisioning inserts go through the RPC below.

grant insert, update on platform.user_app_state       to authenticated;
grant insert, update on platform.user_app_preferences to authenticated;

-- ============================================================
-- 4. Unique indexes for idempotent upserts
-- ============================================================

create unique index if not exists platform_user_app_accounts_user_app_uidx
  on platform.user_app_accounts (user_id, app_id);

create unique index if not exists platform_user_app_actor_links_account_actor_uidx
  on platform.user_app_actor_links (user_app_account_id, actor_source, actor_id);

create unique index if not exists platform_user_app_actor_links_primary_uidx
  on platform.user_app_actor_links (user_app_account_id)
  where is_primary = true and status = 'active';

-- ============================================================
-- 5. Drop old single-arg overload if it exists
-- ============================================================

drop function if exists platform.provision_wentrex_identity(uuid);
drop function if exists platform.provision_wentrex_identity(uuid, uuid);

-- ============================================================
-- 6. Provisioning RPC
-- ============================================================
-- Called by the identity engine as:
--   supabase.schema('platform').rpc('provision_wentrex_identity', {
--     p_actor_id:        actorId,
--     p_organization_id: organizationId,
--   })
--
-- The RPC:
--   - Uses auth.uid() for user_id (cannot be spoofed by caller)
--   - Validates actor ownership before writing anything
--   - Upserts all 5 platform rows in a single transaction
--   - Returns { ok, user_id, app_id, user_app_account_id, actor_link_id,
--               actor_id, organization_id }
--
-- The engine ignores the return value and calls
-- resolveAuthenticatedContext afterward.

create or replace function platform.provision_wentrex_identity(
  p_actor_id        uuid,
  p_organization_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = platform, learning, vc, auth, public
as $$
declare
  v_user_id             uuid := auth.uid();
  v_app_id              uuid;
  v_user_app_account_id uuid;
  v_actor_link_id       uuid;
  v_actor_org_id        uuid;
  v_actor_user_id       uuid;
  v_user_owns_actor     boolean := false;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- -------------------------------------------------------
  -- Resolve Wentrex app
  -- -------------------------------------------------------
  select a.id
  into v_app_id
  from platform.apps a
  where a.key = 'wentrex'
    and a.is_active = true
  limit 1;

  if v_app_id is null then
    raise exception 'platform.apps row for wentrex not found';
  end if;

  -- -------------------------------------------------------
  -- Resolve learning actor
  -- -------------------------------------------------------
  select
    a.organization_id,
    a.user_id
  into
    v_actor_org_id,
    v_actor_user_id
  from learning.actors a
  where a.id = p_actor_id
    and a.is_active = true
  limit 1;

  if v_actor_org_id is null then
    raise exception 'learning actor not found or inactive';
  end if;

  -- optional org validation
  if p_organization_id is not null and v_actor_org_id <> p_organization_id then
    raise exception 'actor does not belong to requested organization';
  end if;

  -- -------------------------------------------------------
  -- Validate actor ownership/control
  -- Accept direct actor.user_id match
  -- or learning.actor_owners
  -- or vc.actor_owners legacy path
  -- -------------------------------------------------------
  if v_actor_user_id = v_user_id then
    v_user_owns_actor := true;
  end if;

  if not v_user_owns_actor then
    select exists (
      select 1
      from learning.actor_owners ao
      where ao.actor_id = p_actor_id
        and ao.user_id  = v_user_id
        and coalesce(ao.is_void, false) = false
    )
    into v_user_owns_actor;
  end if;

  if not v_user_owns_actor then
    select exists (
      select 1
      from vc.actor_owners ao
      where ao.actor_id = p_actor_id
        and ao.user_id  = v_user_id
        and coalesce(ao.is_void, false) = false
    )
    into v_user_owns_actor;
  end if;

  if not v_user_owns_actor then
    raise exception 'current user does not own or control the requested actor';
  end if;

  -- -------------------------------------------------------
  -- Ensure platform.user_app_access
  -- -------------------------------------------------------
  insert into platform.user_app_access (
    user_id, app_id, status, granted_at, revoked_at, meta
  )
  values (
    v_user_id, v_app_id, 'granted', now(), null,
    jsonb_build_object(
      'source',          'platform.provision_wentrex_identity',
      'actor_id',        p_actor_id,
      'organization_id', v_actor_org_id
    )
  )
  on conflict (user_id, app_id)
  do update set
    status     = 'granted',
    revoked_at = null,
    updated_at = now(),
    granted_at = coalesce(platform.user_app_access.granted_at, now()),
    meta       = coalesce(platform.user_app_access.meta, '{}'::jsonb)
      || jsonb_build_object(
        'last_provision_source', 'platform.provision_wentrex_identity',
        'last_actor_id',         p_actor_id,
        'last_organization_id',  v_actor_org_id
      );

  -- -------------------------------------------------------
  -- Ensure platform.user_app_accounts
  -- -------------------------------------------------------
  insert into platform.user_app_accounts (
    user_id, app_id, status, activated_at, last_seen_at, meta
  )
  values (
    v_user_id, v_app_id, 'active', now(), now(),
    jsonb_build_object('source', 'platform.provision_wentrex_identity')
  )
  on conflict (user_id, app_id)
  do update set
    status       = 'active',
    activated_at = coalesce(platform.user_app_accounts.activated_at, now()),
    last_seen_at = now(),
    updated_at   = now(),
    meta         = coalesce(platform.user_app_accounts.meta, '{}'::jsonb)
      || jsonb_build_object(
        'last_provision_source', 'platform.provision_wentrex_identity'
      )
  returning id into v_user_app_account_id;

  -- -------------------------------------------------------
  -- Ensure platform.user_app_actor_links
  -- -------------------------------------------------------
  insert into platform.user_app_actor_links (
    user_app_account_id, app_id, actor_source, actor_id, actor_kind,
    is_primary, is_switchable, status, meta
  )
  values (
    v_user_app_account_id, v_app_id, 'learning', p_actor_id, 'learning_actor',
    true, false, 'active',
    jsonb_build_object(
      'organization_id', v_actor_org_id,
      'source',          'platform.provision_wentrex_identity'
    )
  )
  on conflict (user_app_account_id, actor_source, actor_id)
  do update set
    status     = 'active',
    is_primary = true,
    updated_at = now(),
    meta       = coalesce(platform.user_app_actor_links.meta, '{}'::jsonb)
      || jsonb_build_object(
        'organization_id',       v_actor_org_id,
        'last_provision_source', 'platform.provision_wentrex_identity'
      )
  returning id into v_actor_link_id;

  -- make this actor the only primary one for the account
  update platform.user_app_actor_links
  set
    is_primary = (id = v_actor_link_id),
    updated_at = now()
  where user_app_account_id = v_user_app_account_id;

  -- -------------------------------------------------------
  -- Ensure platform.user_app_preferences
  -- -------------------------------------------------------
  insert into platform.user_app_preferences (
    user_app_account_id, active_actor_link_id, last_actor_link_id, meta
  )
  values (
    v_user_app_account_id, v_actor_link_id, v_actor_link_id,
    jsonb_build_object('source', 'platform.provision_wentrex_identity')
  )
  on conflict (user_app_account_id)
  do update set
    active_actor_link_id = excluded.active_actor_link_id,
    last_actor_link_id   = excluded.last_actor_link_id,
    updated_at           = now(),
    meta                 = coalesce(platform.user_app_preferences.meta, '{}'::jsonb)
      || jsonb_build_object(
        'last_provision_source', 'platform.provision_wentrex_identity'
      );

  -- -------------------------------------------------------
  -- Ensure platform.user_app_state
  -- -------------------------------------------------------
  insert into platform.user_app_state (
    user_app_account_id, onboarding_status, account_status,
    default_destination_key, last_destination_key,
    last_actor_link_id, requires_actor_selection, requires_onboarding,
    first_login_at, last_login_at, meta
  )
  values (
    v_user_app_account_id, 'completed', 'active',
    'wentrex_dashboard', 'wentrex_dashboard',
    v_actor_link_id, false, false,
    now(), now(),
    jsonb_build_object(
      'source',          'platform.provision_wentrex_identity',
      'organization_id', v_actor_org_id
    )
  )
  on conflict (user_app_account_id)
  do update set
    account_status     = 'active',
    last_actor_link_id = excluded.last_actor_link_id,
    last_login_at      = now(),
    updated_at         = now(),
    meta               = coalesce(platform.user_app_state.meta, '{}'::jsonb)
      || jsonb_build_object(
        'last_provision_source', 'platform.provision_wentrex_identity',
        'last_organization_id',  v_actor_org_id
      );

  -- -------------------------------------------------------

  return jsonb_build_object(
    'ok',                  true,
    'user_id',             v_user_id,
    'app_id',              v_app_id,
    'user_app_account_id', v_user_app_account_id,
    'actor_link_id',       v_actor_link_id,
    'actor_id',            p_actor_id,
    'organization_id',     v_actor_org_id
  );
end;
$$;

-- Only authenticated users and service_role may call this.
revoke all on function platform.provision_wentrex_identity(uuid, uuid) from public;
grant execute on function platform.provision_wentrex_identity(uuid, uuid)
  to authenticated, service_role;

commit;
