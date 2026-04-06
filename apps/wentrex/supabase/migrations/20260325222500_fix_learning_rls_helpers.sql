-- Fix Learning Center RLS helper recursion / 500s
-- Purpose:
-- - keep the existing manual actor_access gate
-- - keep school scoping intact
-- - replace SQL helper functions with plpgsql security-definer helpers
--   so policy evaluation does not recurse into the same protected tables
-- - route membership select policies through dedicated helper functions

begin;

-- ---------------------------------------------------------------------------
-- 1. Core identity helpers
-- ---------------------------------------------------------------------------

create or replace function learning.current_actor_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_actor_id uuid;
begin
  select ao.actor_id
    into v_actor_id
  from vc.actor_owners ao
  where ao.user_id = auth.uid()
    and coalesce(ao.is_void, false) = false
    and coalesce(ao.is_primary, false) = true
  order by ao.actor_id
  limit 1;

  return v_actor_id;
end;
$$;

create or replace function learning.can_current_user_access_learning_center()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_can_access boolean := false;
begin
  select exists (
    select 1
    from vc.actor_owners ao
    join learning.actor_access aa
      on aa.actor_id = ao.actor_id
    where ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
      and coalesce(ao.is_primary, false) = true
      and aa.can_access_learning_center = true
      and aa.revoked_at is null
  )
  into v_can_access;

  return coalesce(v_can_access, false);
end;
$$;

create or replace function learning.is_current_user_platform_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_actor_id uuid;
  v_is_admin boolean := false;
begin
  v_actor_id := learning.current_actor_id();

  if v_actor_id is null then
    return false;
  end if;

  select exists (
    select 1
    from learning.platform_admins pa
    where pa.actor_id = v_actor_id
  )
  into v_is_admin;

  return coalesce(v_is_admin, false);
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Organization / course scope helpers
-- ---------------------------------------------------------------------------

create or replace function learning.can_current_user_manage_organization(_organization_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_actor_id uuid;
  v_can_manage boolean := false;
begin
  if _organization_id is null then
    return false;
  end if;

  if not learning.can_current_user_access_learning_center() then
    return false;
  end if;

  v_actor_id := learning.current_actor_id();

  if v_actor_id is null then
    return false;
  end if;

  if learning.is_current_user_platform_admin() then
    return true;
  end if;

  select exists (
    select 1
    from learning.organizations o
    where o.id = _organization_id
      and o.owner_actor_id = v_actor_id
  )
  into v_can_manage;

  if v_can_manage then
    return true;
  end if;

  select exists (
    select 1
    from learning.organization_memberships om
    where om.organization_id = _organization_id
      and om.actor_id = v_actor_id
      and om.status = 'active'
      and om.role = any (array['owner'::text, 'admin'::text, 'staff'::text])
  )
  into v_can_manage;

  return coalesce(v_can_manage, false);
end;
$$;

create or replace function learning.can_current_user_access_organization(_organization_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_actor_id uuid;
  v_can_access boolean := false;
begin
  if _organization_id is null then
    return false;
  end if;

  if not learning.can_current_user_access_learning_center() then
    return false;
  end if;

  if learning.can_current_user_manage_organization(_organization_id) then
    return true;
  end if;

  v_actor_id := learning.current_actor_id();

  if v_actor_id is null then
    return false;
  end if;

  select exists (
    select 1
    from learning.organization_memberships om
    where om.organization_id = _organization_id
      and om.actor_id = v_actor_id
      and om.status = any (
        array['invited'::text, 'active'::text, 'completed'::text, 'dropped'::text]
      )
  )
  into v_can_access;

  if v_can_access then
    return true;
  end if;

  select exists (
    select 1
    from learning.courses c
    join learning.course_memberships cm
      on cm.course_id = c.id
    where c.organization_id = _organization_id
      and cm.actor_id = v_actor_id
      and cm.status = any (
        array['invited'::text, 'active'::text, 'completed'::text, 'dropped'::text]
      )
  )
  into v_can_access;

  return coalesce(v_can_access, false);
end;
$$;

create or replace function learning.can_current_user_manage_course(_course_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_organization_id uuid;
begin
  if _course_id is null then
    return false;
  end if;

  if not learning.can_current_user_access_learning_center() then
    return false;
  end if;

  select c.organization_id
    into v_organization_id
  from learning.courses c
  where c.id = _course_id
  limit 1;

  if v_organization_id is null then
    return false;
  end if;

  return learning.can_current_user_manage_organization(v_organization_id);
end;
$$;

create or replace function learning.can_current_user_access_course(_course_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_actor_id uuid;
  v_can_access boolean := false;
begin
  if _course_id is null then
    return false;
  end if;

  if not learning.can_current_user_access_learning_center() then
    return false;
  end if;

  if learning.can_current_user_manage_course(_course_id) then
    return true;
  end if;

  v_actor_id := learning.current_actor_id();

  if v_actor_id is null then
    return false;
  end if;

  select exists (
    select 1
    from learning.course_memberships cm
    where cm.course_id = _course_id
      and cm.actor_id = v_actor_id
      and cm.status = any (
        array['invited'::text, 'active'::text, 'completed'::text, 'dropped'::text]
      )
  )
  into v_can_access;

  return coalesce(v_can_access, false);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Dedicated membership read helpers
-- ---------------------------------------------------------------------------

create or replace function learning.can_current_user_select_organization_membership(
  _organization_id uuid,
  _member_actor_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_actor_id uuid;
begin
  if _organization_id is null then
    return false;
  end if;

  if not learning.can_current_user_access_learning_center() then
    return false;
  end if;

  v_actor_id := learning.current_actor_id();

  if v_actor_id is null then
    return false;
  end if;

  if _member_actor_id = v_actor_id then
    return true;
  end if;

  return learning.can_current_user_manage_organization(_organization_id);
end;
$$;

create or replace function learning.can_current_user_select_course_membership(
  _course_id uuid,
  _member_actor_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, vc, learning, pg_temp
as $$
declare
  v_actor_id uuid;
begin
  if _course_id is null then
    return false;
  end if;

  if not learning.can_current_user_access_learning_center() then
    return false;
  end if;

  v_actor_id := learning.current_actor_id();

  if v_actor_id is null then
    return false;
  end if;

  if _member_actor_id = v_actor_id then
    return true;
  end if;

  return learning.can_current_user_manage_course(_course_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Function permissions
-- ---------------------------------------------------------------------------

revoke all on function learning.current_actor_id() from public;
revoke all on function learning.can_current_user_access_learning_center() from public;
revoke all on function learning.is_current_user_platform_admin() from public;
revoke all on function learning.can_current_user_manage_organization(uuid) from public;
revoke all on function learning.can_current_user_access_organization(uuid) from public;
revoke all on function learning.can_current_user_manage_course(uuid) from public;
revoke all on function learning.can_current_user_access_course(uuid) from public;
revoke all on function learning.can_current_user_select_organization_membership(uuid, uuid) from public;
revoke all on function learning.can_current_user_select_course_membership(uuid, uuid) from public;

grant execute on function learning.current_actor_id() to authenticated, service_role;
grant execute on function learning.can_current_user_access_learning_center() to authenticated, service_role;
grant execute on function learning.is_current_user_platform_admin() to authenticated, service_role;
grant execute on function learning.can_current_user_manage_organization(uuid) to authenticated, service_role;
grant execute on function learning.can_current_user_access_organization(uuid) to authenticated, service_role;
grant execute on function learning.can_current_user_manage_course(uuid) to authenticated, service_role;
grant execute on function learning.can_current_user_access_course(uuid) to authenticated, service_role;
grant execute on function learning.can_current_user_select_organization_membership(uuid, uuid) to authenticated, service_role;
grant execute on function learning.can_current_user_select_course_membership(uuid, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Replace the membership select policies with helper-based checks
-- ---------------------------------------------------------------------------

drop policy if exists organization_memberships_select_scoped_access on learning.organization_memberships;
create policy organization_memberships_select_scoped_access
on learning.organization_memberships
for select
to authenticated
using (
  learning.can_current_user_select_organization_membership(
    organization_id,
    actor_id
  )
);

drop policy if exists course_memberships_select_scoped_access on learning.course_memberships;
create policy course_memberships_select_scoped_access
on learning.course_memberships
for select
to authenticated
using (
  learning.can_current_user_select_course_membership(
    course_id,
    actor_id
  )
);

commit;
