-- Grant actor_access when provisioning an organization member
-- Purpose:
-- - The RLS policies for organization_memberships, organizations, courses, etc.
--   all require can_current_user_access_learning_center() = true
-- - That function checks learning.actor_access for can_access_learning_center = true
-- - Without this row, newly provisioned org members (teachers, staff, etc.)
--   cannot read their own memberships and get redirected to /unauthorized
-- - This migration updates ensure_org_member_account to also upsert actor_access

begin;

create or replace function learning.ensure_org_member_account(
  p_organization_id uuid,
  p_auth_user_id uuid,
  p_display_name text,
  p_email text,
  p_username text default null,
  p_role text default 'staff',
  p_status text default 'active',
  p_created_by_actor_id uuid default null
)
returns table (
  profile_id uuid,
  actor_id uuid,
  membership_id uuid,
  profile_created boolean,
  actor_created boolean,
  membership_created boolean
)
language plpgsql
security definer
set search_path = public, vc, learning
as $$
declare
  v_profile_id uuid;
  v_actor_id uuid;
  v_membership_id uuid;
  v_profile_created boolean := false;
  v_actor_created boolean := false;
  v_membership_created boolean := false;
begin
  p_display_name := nullif(btrim(p_display_name), '');
  p_email := nullif(lower(btrim(p_email)), '');
  p_username := nullif(btrim(p_username), '');
  p_role := lower(coalesce(nullif(btrim(p_role), ''), 'staff'));
  p_status := coalesce(nullif(btrim(p_status), ''), 'active');

  if p_organization_id is null then
    raise exception 'p_organization_id is required';
  end if;

  if p_auth_user_id is null then
    raise exception 'p_auth_user_id is required';
  end if;

  if p_display_name is null then
    raise exception 'p_display_name is required';
  end if;

  if p_email is null then
    raise exception 'p_email is required';
  end if;

  if p_role not in ('owner', 'admin', 'staff', 'teacher') then
    raise exception 'Invalid organization role: %', p_role;
  end if;

  perform 1
  from learning.organizations o
  where o.id = p_organization_id;

  if not found then
    raise exception 'Organization not found for id %', p_organization_id;
  end if;

  -- 1) Ensure the user-facing profile exists for auth.users.id and stays private.
  select p.id
    into v_profile_id
  from public.profiles p
  where p.id = p_auth_user_id
  limit 1;

  if v_profile_id is null then
    insert into public.profiles (
      id,
      display_name,
      username,
      email,
      discoverable,
      publish
    )
    values (
      p_auth_user_id,
      p_display_name,
      p_username,
      p_email,
      false,
      false
    )
    returning id into v_profile_id;

    v_profile_created := true;
  else
    update public.profiles
    set
      display_name = coalesce(p_display_name, display_name),
      username = coalesce(p_username, username),
      email = coalesce(p_email, email),
      discoverable = false,
      publish = false
    where id = v_profile_id;
  end if;

  -- 2) Reuse the current primary actor if one already exists for this auth user.
  select ao.actor_id
    into v_actor_id
  from vc.actor_owners ao
  where ao.user_id = p_auth_user_id
    and coalesce(ao.is_void, false) = false
    and ao.is_primary = true
  order by ao.actor_id
  limit 1;

  -- 3) Otherwise reuse a user actor already linked to the profile, or create one.
  if v_actor_id is null then
    select a.id
      into v_actor_id
    from vc.actors a
    where a.profile_id = v_profile_id
      and a.kind = 'user'
      and coalesce(a.is_void, false) = false
    order by a.id
    limit 1;

    if v_actor_id is null then
      insert into vc.actors (
        kind,
        profile_id,
        is_void
      )
      values (
        'user',
        v_profile_id,
        false
      )
      returning id into v_actor_id;

      v_actor_created := true;
    end if;
  end if;

  -- 4) Ensure the actor_owners bridge exists and is marked as the active primary
  --    link for this auth user and actor pair.
  if exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = v_actor_id
      and ao.user_id = p_auth_user_id
  ) then
    update vc.actor_owners
    set
      is_void = false,
      is_primary = true
    where actor_id = v_actor_id
      and user_id = p_auth_user_id;
  else
    insert into vc.actor_owners (
      actor_id,
      user_id,
      is_void,
      is_primary
    )
    values (
      v_actor_id,
      p_auth_user_id,
      false,
      true
    );
  end if;

  -- 5) Ensure the school membership exists for the actor. Memberships remain
  --    actor-based, never user-based.
  select om.id
    into v_membership_id
  from learning.organization_memberships om
  where om.organization_id = p_organization_id
    and om.actor_id = v_actor_id
  limit 1;

  if v_membership_id is null then
    insert into learning.organization_memberships (
      organization_id,
      actor_id,
      role,
      status,
      created_by_actor_id
    )
    values (
      p_organization_id,
      v_actor_id,
      p_role,
      p_status,
      p_created_by_actor_id
    )
    returning id into v_membership_id;

    v_membership_created := true;
  else
    update learning.organization_memberships
    set
      role = p_role,
      status = p_status,
      created_by_actor_id = coalesce(p_created_by_actor_id, created_by_actor_id)
    where id = v_membership_id;
  end if;

  -- 6) Grant learning center access so RLS policies allow the actor to read
  --    their own memberships, organizations, and courses.
  insert into learning.actor_access (
    actor_id,
    can_access_learning_center,
    granted_by_actor_id,
    granted_at
  )
  values (
    v_actor_id,
    true,
    p_created_by_actor_id,
    now()
  )
  on conflict (actor_id) do update
  set
    can_access_learning_center = true,
    revoked_at = null,
    granted_by_actor_id = coalesce(excluded.granted_by_actor_id, learning.actor_access.granted_by_actor_id),
    granted_at = now();

  return query
  select
    v_profile_id,
    v_actor_id,
    v_membership_id,
    v_profile_created,
    v_actor_created,
    v_membership_created;
end;
$$;

comment on function learning.ensure_org_member_account(uuid, uuid, text, text, text, text, text, uuid)
is 'Creates or reuses the profile, actor, actor_owner, organization_membership, and actor_access rows needed to enroll one organization member.';

-- This RPC is intended for server-side enrollment only.
revoke all on function learning.ensure_org_member_account(uuid, uuid, text, text, text, text, text, uuid) from public;
grant execute on function learning.ensure_org_member_account(uuid, uuid, text, text, text, text, text, uuid) to service_role;

commit;
