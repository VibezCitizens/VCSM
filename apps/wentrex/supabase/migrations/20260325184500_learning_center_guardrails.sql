-- Learning Center production guardrails
-- Scope:
-- - preserve the existing actor_access manual allowlist model
-- - add integrity constraints for org and course membership rows
-- - add reusable helper functions for auth -> actor -> access resolution
-- - enable RLS on the core tenancy and access-control tables
-- - scope organization and course administration to the current school only

begin;

-- -----------------------------------------------------------------------------
-- 1. Integrity guardrails
-- -----------------------------------------------------------------------------

-- organization_memberships.role must stay inside the supported school-level roles.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_memberships_role_guardrail_check'
      and conrelid = 'learning.organization_memberships'::regclass
  ) then
    alter table learning.organization_memberships
      add constraint organization_memberships_role_guardrail_check
      check (
        role = any (
          array['owner'::text, 'admin'::text, 'staff'::text, 'teacher'::text]
        )
      );
  end if;
end
$$;

-- One organization membership row per actor per school.
create unique index if not exists organization_memberships_organization_actor_uidx
  on learning.organization_memberships (organization_id, actor_id);

-- One course membership row per actor per course.
create unique index if not exists course_memberships_course_actor_uidx
  on learning.course_memberships (course_id, actor_id);

-- -----------------------------------------------------------------------------
-- 2. Helper functions used by the app gate and by RLS policies
-- -----------------------------------------------------------------------------

-- Resolve the current authenticated actor through vc.actor_owners.
create or replace function learning.current_actor_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  select ao.actor_id
  from vc.actor_owners ao
  where ao.user_id = auth.uid()
    and coalesce(ao.is_void, false) = false
  order by ao.actor_id
  limit 1;
$$;

-- Manual allowlist gate for the Learning Center.
create or replace function learning.can_current_user_access_learning_center()
returns boolean
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  select exists (
    select 1
    from vc.actor_owners ao
    join learning.actor_access aa
      on aa.actor_id = ao.actor_id
    where ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
      and aa.can_access_learning_center = true
      and aa.revoked_at is null
  );
$$;

-- Global platform admin bypass. Keep this separate from school-level access.
create or replace function learning.is_current_user_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  select exists (
    select 1
    from learning.platform_admins pa
    where pa.actor_id = learning.current_actor_id()
  );
$$;

-- Read scope for one organization.
create or replace function learning.can_current_user_access_organization(_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  select
    learning.can_current_user_access_learning_center()
    and (
      learning.is_current_user_platform_admin()
      or exists (
        select 1
        from learning.organizations o
        where o.id = _organization_id
          and o.owner_actor_id = learning.current_actor_id()
      )
      or exists (
        select 1
        from learning.organization_memberships om
        where om.organization_id = _organization_id
          and om.actor_id = learning.current_actor_id()
          and om.status = 'active'
      )
      or exists (
        select 1
        from learning.courses c
        join learning.course_memberships cm
          on cm.course_id = c.id
        where c.organization_id = _organization_id
          and cm.actor_id = learning.current_actor_id()
          and cm.status = 'active'
      )
    );
$$;

-- Write scope for one organization. School admins stay locked to their school.
create or replace function learning.can_current_user_manage_organization(_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  select
    learning.can_current_user_access_learning_center()
    and (
      learning.is_current_user_platform_admin()
      or exists (
        select 1
        from learning.organizations o
        where o.id = _organization_id
          and o.owner_actor_id = learning.current_actor_id()
      )
      or exists (
        select 1
        from learning.organization_memberships om
        where om.organization_id = _organization_id
          and om.actor_id = learning.current_actor_id()
          and om.status = 'active'
          and om.role = any (array['owner'::text, 'admin'::text, 'staff'::text])
      )
    );
$$;

-- Read scope for one course.
create or replace function learning.can_current_user_access_course(_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  select
    learning.can_current_user_access_learning_center()
    and exists (
      select 1
      from learning.courses c
      where c.id = _course_id
        and (
          learning.can_current_user_manage_organization(c.organization_id)
          or exists (
            select 1
            from learning.course_memberships cm
            where cm.course_id = c.id
              and cm.actor_id = learning.current_actor_id()
              and cm.status = 'active'
          )
        )
    );
$$;

-- Write scope for one course. Only platform admins or school admins for that
-- course's organization can manage the course.
create or replace function learning.can_current_user_manage_course(_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  select
    learning.can_current_user_access_learning_center()
    and exists (
      select 1
      from learning.courses c
      where c.id = _course_id
        and learning.can_current_user_manage_organization(c.organization_id)
    );
$$;

-- Lock direct function execution down to authenticated users and service_role.
revoke all on function learning.current_actor_id() from public;
revoke all on function learning.can_current_user_access_learning_center() from public;
revoke all on function learning.is_current_user_platform_admin() from public;
revoke all on function learning.can_current_user_access_organization(uuid) from public;
revoke all on function learning.can_current_user_manage_organization(uuid) from public;
revoke all on function learning.can_current_user_access_course(uuid) from public;
revoke all on function learning.can_current_user_manage_course(uuid) from public;

grant execute on function learning.current_actor_id() to authenticated, service_role;
grant execute on function learning.can_current_user_access_learning_center() to authenticated, service_role;
grant execute on function learning.is_current_user_platform_admin() to authenticated, service_role;
grant execute on function learning.can_current_user_access_organization(uuid) to authenticated, service_role;
grant execute on function learning.can_current_user_manage_organization(uuid) to authenticated, service_role;
grant execute on function learning.can_current_user_access_course(uuid) to authenticated, service_role;
grant execute on function learning.can_current_user_manage_course(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. Enable RLS on the access-control and tenancy boundary tables
-- -----------------------------------------------------------------------------

alter table learning.actor_access enable row level security;
alter table learning.platform_admins enable row level security;
alter table learning.organizations enable row level security;
alter table learning.organization_memberships enable row level security;
alter table learning.course_terms enable row level security;
alter table learning.courses enable row level security;
alter table learning.course_memberships enable row level security;

-- -----------------------------------------------------------------------------
-- 4. Policies: actor_access
-- -----------------------------------------------------------------------------

drop policy if exists actor_access_select_platform_admin on learning.actor_access;
create policy actor_access_select_platform_admin
on learning.actor_access
for select
to authenticated
using (learning.is_current_user_platform_admin());

drop policy if exists actor_access_insert_platform_admin on learning.actor_access;
create policy actor_access_insert_platform_admin
on learning.actor_access
for insert
to authenticated
with check (learning.is_current_user_platform_admin());

drop policy if exists actor_access_update_platform_admin on learning.actor_access;
create policy actor_access_update_platform_admin
on learning.actor_access
for update
to authenticated
using (learning.is_current_user_platform_admin())
with check (learning.is_current_user_platform_admin());

drop policy if exists actor_access_delete_platform_admin on learning.actor_access;
create policy actor_access_delete_platform_admin
on learning.actor_access
for delete
to authenticated
using (learning.is_current_user_platform_admin());

-- -----------------------------------------------------------------------------
-- 5. Policies: platform_admins
-- -----------------------------------------------------------------------------

drop policy if exists platform_admins_select_self_or_platform_admin on learning.platform_admins;
create policy platform_admins_select_self_or_platform_admin
on learning.platform_admins
for select
to authenticated
using (
  actor_id = learning.current_actor_id()
  or learning.is_current_user_platform_admin()
);

drop policy if exists platform_admins_insert_platform_admin on learning.platform_admins;
create policy platform_admins_insert_platform_admin
on learning.platform_admins
for insert
to authenticated
with check (learning.is_current_user_platform_admin());

drop policy if exists platform_admins_update_platform_admin on learning.platform_admins;
create policy platform_admins_update_platform_admin
on learning.platform_admins
for update
to authenticated
using (learning.is_current_user_platform_admin())
with check (learning.is_current_user_platform_admin());

drop policy if exists platform_admins_delete_platform_admin on learning.platform_admins;
create policy platform_admins_delete_platform_admin
on learning.platform_admins
for delete
to authenticated
using (learning.is_current_user_platform_admin());

-- -----------------------------------------------------------------------------
-- 6. Policies: organizations
-- -----------------------------------------------------------------------------

drop policy if exists organizations_select_scoped_access on learning.organizations;
create policy organizations_select_scoped_access
on learning.organizations
for select
to authenticated
using (learning.can_current_user_access_organization(id));

drop policy if exists organizations_insert_platform_admin on learning.organizations;
create policy organizations_insert_platform_admin
on learning.organizations
for insert
to authenticated
with check (learning.is_current_user_platform_admin());

drop policy if exists organizations_update_scoped_admin on learning.organizations;
create policy organizations_update_scoped_admin
on learning.organizations
for update
to authenticated
using (learning.can_current_user_manage_organization(id))
with check (learning.can_current_user_manage_organization(id));

drop policy if exists organizations_delete_platform_admin on learning.organizations;
create policy organizations_delete_platform_admin
on learning.organizations
for delete
to authenticated
using (learning.is_current_user_platform_admin());

-- -----------------------------------------------------------------------------
-- 7. Policies: organization_memberships
-- -----------------------------------------------------------------------------

drop policy if exists organization_memberships_select_scoped_access on learning.organization_memberships;
create policy organization_memberships_select_scoped_access
on learning.organization_memberships
for select
to authenticated
using (
  learning.can_current_user_access_learning_center()
  and (
    learning.can_current_user_manage_organization(organization_id)
    or actor_id = learning.current_actor_id()
  )
);

drop policy if exists organization_memberships_insert_scoped_admin on learning.organization_memberships;
create policy organization_memberships_insert_scoped_admin
on learning.organization_memberships
for insert
to authenticated
with check (learning.can_current_user_manage_organization(organization_id));

drop policy if exists organization_memberships_update_scoped_admin on learning.organization_memberships;
create policy organization_memberships_update_scoped_admin
on learning.organization_memberships
for update
to authenticated
using (learning.can_current_user_manage_organization(organization_id))
with check (learning.can_current_user_manage_organization(organization_id));

drop policy if exists organization_memberships_delete_scoped_admin on learning.organization_memberships;
create policy organization_memberships_delete_scoped_admin
on learning.organization_memberships
for delete
to authenticated
using (learning.can_current_user_manage_organization(organization_id));

-- -----------------------------------------------------------------------------
-- 8. Policies: course_terms
-- -----------------------------------------------------------------------------

drop policy if exists course_terms_select_scoped_access on learning.course_terms;
create policy course_terms_select_scoped_access
on learning.course_terms
for select
to authenticated
using (learning.can_current_user_access_organization(organization_id));

drop policy if exists course_terms_insert_scoped_admin on learning.course_terms;
create policy course_terms_insert_scoped_admin
on learning.course_terms
for insert
to authenticated
with check (learning.can_current_user_manage_organization(organization_id));

drop policy if exists course_terms_update_scoped_admin on learning.course_terms;
create policy course_terms_update_scoped_admin
on learning.course_terms
for update
to authenticated
using (learning.can_current_user_manage_organization(organization_id))
with check (learning.can_current_user_manage_organization(organization_id));

drop policy if exists course_terms_delete_scoped_admin on learning.course_terms;
create policy course_terms_delete_scoped_admin
on learning.course_terms
for delete
to authenticated
using (learning.can_current_user_manage_organization(organization_id));

-- -----------------------------------------------------------------------------
-- 9. Policies: courses
-- -----------------------------------------------------------------------------

drop policy if exists courses_select_scoped_access on learning.courses;
create policy courses_select_scoped_access
on learning.courses
for select
to authenticated
using (learning.can_current_user_access_course(id));

drop policy if exists courses_insert_scoped_admin on learning.courses;
create policy courses_insert_scoped_admin
on learning.courses
for insert
to authenticated
with check (learning.can_current_user_manage_organization(organization_id));

drop policy if exists courses_update_scoped_admin on learning.courses;
create policy courses_update_scoped_admin
on learning.courses
for update
to authenticated
using (learning.can_current_user_manage_course(id))
with check (learning.can_current_user_manage_organization(organization_id));

drop policy if exists courses_delete_scoped_admin on learning.courses;
create policy courses_delete_scoped_admin
on learning.courses
for delete
to authenticated
using (learning.can_current_user_manage_course(id));

-- -----------------------------------------------------------------------------
-- 10. Policies: course_memberships
-- -----------------------------------------------------------------------------

drop policy if exists course_memberships_select_scoped_access on learning.course_memberships;
create policy course_memberships_select_scoped_access
on learning.course_memberships
for select
to authenticated
using (
  learning.can_current_user_access_learning_center()
  and (
    learning.can_current_user_manage_course(course_id)
    or actor_id = learning.current_actor_id()
  )
);

drop policy if exists course_memberships_insert_scoped_admin on learning.course_memberships;
create policy course_memberships_insert_scoped_admin
on learning.course_memberships
for insert
to authenticated
with check (learning.can_current_user_manage_course(course_id));

drop policy if exists course_memberships_update_scoped_admin on learning.course_memberships;
create policy course_memberships_update_scoped_admin
on learning.course_memberships
for update
to authenticated
using (learning.can_current_user_manage_course(course_id))
with check (learning.can_current_user_manage_course(course_id));

drop policy if exists course_memberships_delete_scoped_admin on learning.course_memberships;
create policy course_memberships_delete_scoped_admin
on learning.course_memberships
for delete
to authenticated
using (learning.can_current_user_manage_course(course_id));

commit;
