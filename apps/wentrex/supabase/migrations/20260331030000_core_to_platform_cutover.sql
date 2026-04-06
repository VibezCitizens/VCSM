-- Core → Platform cutover: data migration + FK repointing + function updates
-- ============================================================
--
-- Goals:
--   1. Copy live data from core.* into the equivalent platform.* tables.
--   2. Repoint any foreign keys that reference core.user_app_accounts
--      to platform.user_app_accounts.
--   3. Update security-definer functions that query core.platform_owners
--      to use platform.platform_owners instead.
--   4. Do NOT drop core.* tables — that is a separate, later step.
--
-- Safety:
--   - All INSERT ... SELECT use ON CONFLICT DO NOTHING so re-running
--     is safe and existing platform rows are never overwritten.
--   - FK changes use DO $$ blocks with IF NOT EXISTS guards.
--   - Function replacements are CREATE OR REPLACE — idempotent.

begin;

-- ============================================================
-- 1. Data migration: core → platform
-- ============================================================

-- platform.apps ─────────────────────────────────────────────
-- Assumes column parity: id, key, name, is_active, created_at
-- (add / cast columns as needed if schemas diverge)
insert into platform.apps (id, key, name, is_active, created_at)
select id, key, name, is_active, created_at
from core.apps
on conflict (id) do nothing;

-- platform.platform_owners ──────────────────────────────────
-- core.platform_owners.user_id is the primary identity column.
-- Copy all rows; skip duplicates if already present.
insert into platform.platform_owners (user_id)
select user_id
from core.platform_owners
on conflict (user_id) do nothing;

-- platform.user_app_access ──────────────────────────────────
-- One row per (user_id, app_id). Copy granted / revoked status.
insert into platform.user_app_access (
  id, user_id, app_id, status, granted_at, revoked_at
)
select id, user_id, app_id, status, granted_at, revoked_at
from core.user_app_access
on conflict (user_id, app_id) do nothing;

-- platform.user_app_accounts ────────────────────────────────
-- These are the rows that learning.actors.user_app_account_id
-- and vc.actors.user_app_account_id point to.
insert into platform.user_app_accounts (
  id, user_id, app_id, status, activated_at, last_seen_at
)
select id, user_id, app_id, status, activated_at, last_seen_at
from core.user_app_accounts
on conflict (user_id, app_id) do nothing;

-- ============================================================
-- 2. Repoint foreign keys: core → platform
-- ============================================================
-- Defensively drops known constraint names and adds the new ones.
-- Uses IF NOT EXISTS / exception guards so the migration is
-- safe to re-run even if constraints have already been changed.

do $$
begin

  -- ── learning.actors.user_app_account_id ──────────────────
  -- Drop any existing FK referencing core (try common name variants)
  begin
    alter table learning.actors
      drop constraint if exists actors_user_app_account_id_fkey;
  exception when others then null;
  end;

  begin
    alter table learning.actors
      drop constraint if exists learning_actors_user_app_account_id_fkey;
  exception when others then null;
  end;

  begin
    alter table learning.actors
      drop constraint if exists fk_actors_user_app_account;
  exception when others then null;
  end;

  -- Add FK to platform if the column exists and constraint is missing
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'learning'
      and table_name   = 'actors'
      and column_name  = 'user_app_account_id'
  ) and not exists (
    select 1 from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
    where tc.table_schema       = 'learning'
      and tc.table_name         = 'actors'
      and tc.constraint_type    = 'FOREIGN KEY'
      and ccu.table_schema      = 'platform'
      and ccu.table_name        = 'user_app_accounts'
  ) then
    alter table learning.actors
      add constraint actors_user_app_account_id_platform_fkey
      foreign key (user_app_account_id)
      references platform.user_app_accounts (id)
      on delete set null
      deferrable initially deferred;
  end if;

  -- ── vc.actors.user_app_account_id ────────────────────────
  begin
    alter table vc.actors
      drop constraint if exists actors_user_app_account_id_fkey;
  exception when others then null;
  end;

  begin
    alter table vc.actors
      drop constraint if exists vc_actors_user_app_account_id_fkey;
  exception when others then null;
  end;

  begin
    alter table vc.actors
      drop constraint if exists fk_vc_actors_user_app_account;
  exception when others then null;
  end;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'vc'
      and table_name   = 'actors'
      and column_name  = 'user_app_account_id'
  ) and not exists (
    select 1 from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
    where tc.table_schema       = 'vc'
      and tc.table_name         = 'actors'
      and tc.constraint_type    = 'FOREIGN KEY'
      and ccu.table_schema      = 'platform'
      and ccu.table_name        = 'user_app_accounts'
  ) then
    alter table vc.actors
      add constraint vc_actors_user_app_account_id_platform_fkey
      foreign key (user_app_account_id)
      references platform.user_app_accounts (id)
      on delete set null
      deferrable initially deferred;
  end if;

end $$;

-- ============================================================
-- 3. Replace core.platform_owners references in functions
-- ============================================================

-- learning.is_platform_owner() ──────────────────────────────
-- Was: queries core.platform_owners
-- Now: queries platform.platform_owners
create or replace function learning.is_platform_owner(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, platform, learning, auth
as $$
  select exists (
    select 1
    from platform.platform_owners
    where user_id = p_user_id
  );
$$;

revoke all on function learning.is_platform_owner(uuid) from public;
grant execute on function learning.is_platform_owner(uuid)
  to authenticated, service_role;

-- learning.list_all_realms_admin() ─────────────────────────
-- Was: checks core.platform_owners for authorization
-- Now: checks platform.platform_owners
create or replace function learning.list_all_realms_admin(p_caller_user_id uuid)
returns table (
  id              uuid,
  slug            text,
  name            text,
  vc_realm_id     uuid,
  owner_actor_id  uuid,
  is_active       boolean,
  created_at      timestamptz,
  updated_at      timestamptz
)
language plpgsql
security definer
set search_path = public, platform, learning
as $$
begin
  if not exists (
    select 1 from platform.platform_owners where user_id = p_caller_user_id
  ) then
    raise exception 'Only platform owners can list all realms';
  end if;

  return query
  select
    r.id,
    r.slug,
    r.name,
    r.vc_realm_id,
    r.owner_actor_id,
    r.is_active,
    r.created_at,
    r.updated_at
  from learning.realms r
  order by r.created_at asc;
end;
$$;

revoke all on function learning.list_all_realms_admin(uuid) from public;
grant execute on function learning.list_all_realms_admin(uuid)
  to authenticated, service_role;

-- public.get_post_login_destination() ──────────────────────
-- Was: checks core.platform_owners for owner role detection
-- Now: checks platform.platform_owners
-- Note: this RPC predates the identity engine and is superseded
-- by provisionWentrexIdentity + resolveAuthenticatedContext.
-- Kept for backward compatibility; core reference removed.
create or replace function public.get_post_login_destination()
returns table (
  dashboard       text,
  actor_id        uuid,
  matched_role    text,
  organization_id uuid,
  course_id       uuid
)
language sql
security definer
set search_path to public, platform, auth, learning
as $function$
with me as (
  select auth.uid() as user_id
),
actor_me as (
  select a.id as actor_id, a.user_id
  from learning.actors a
  join me on me.user_id = a.user_id
  where a.is_active = true
  limit 1
),
candidates as (
  select
    1 as priority,
    '/owner/dashboard'::text as dashboard,
    am.actor_id,
    'owner'::text as matched_role,
    null::uuid as organization_id,
    null::uuid as course_id
  from actor_me am
  where exists (
    select 1
    from platform.platform_owners po
    where po.user_id = am.user_id
  )

  union all

  select
    2, '/administration/dashboard'::text,
    am.actor_id, 'admin'::text, om.organization_id, null::uuid
  from actor_me am
  join learning.organization_memberships om
    on om.actor_id = am.actor_id and om.status = 'active' and om.role = 'admin'

  union all

  select
    3, '/staff/dashboard'::text,
    am.actor_id, 'staff'::text, om.organization_id, null::uuid
  from actor_me am
  join learning.organization_memberships om
    on om.actor_id = am.actor_id and om.status = 'active' and om.role = 'staff'

  union all

  select
    4, '/teacher/dashboard'::text,
    am.actor_id, 'teacher'::text, om.organization_id, null::uuid
  from actor_me am
  join learning.organization_memberships om
    on om.actor_id = am.actor_id and om.status = 'active' and om.role = 'teacher'

  union all

  select
    5, '/parent/dashboard'::text,
    am.actor_id, cm.role::text, c.organization_id, cm.course_id
  from actor_me am
  join learning.course_memberships cm
    on cm.actor_id = am.actor_id and cm.status = 'active'
       and cm.role in ('parent', 'observer')
  join learning.courses c on c.id = cm.course_id

  union all

  select
    6, '/student/dashboard'::text,
    am.actor_id, 'student'::text, c.organization_id, cm.course_id
  from actor_me am
  join learning.course_memberships cm
    on cm.actor_id = am.actor_id and cm.status = 'active' and cm.role = 'student'
  join learning.courses c on c.id = cm.course_id
),
best_match as (
  select *
  from candidates
  order by priority asc, organization_id nulls last, course_id nulls last
  limit 1
)
select
  case
    when me.user_id is null  then '/login'
    when bm.dashboard is not null then bm.dashboard
    else '/unauthorized'
  end as dashboard,
  bm.actor_id,
  case
    when me.user_id is null       then 'anonymous'
    when bm.matched_role is not null then bm.matched_role
    else 'none'
  end as matched_role,
  bm.organization_id,
  bm.course_id
from me
left join best_match bm on true;
$function$;

grant execute on function public.get_post_login_destination() to authenticated;

commit;
