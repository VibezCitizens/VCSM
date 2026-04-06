begin;

-- School-managed identity metadata for students (and potentially other actors).
-- Keeps the existing actor model intact — this is a sidecar table.
create table if not exists learning.actor_identities (
  actor_id uuid primary key references learning.actors(id) on delete cascade,
  login_id text unique,
  synthetic_email text unique,
  parent_email text,
  parent_name text,
  must_change_password boolean not null default true,
  is_school_managed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive unique indexes
create unique index if not exists actor_identities_login_id_unique
  on learning.actor_identities (lower(login_id))
  where login_id is not null;

create unique index if not exists actor_identities_synthetic_email_unique
  on learning.actor_identities (lower(synthetic_email))
  where synthetic_email is not null;

create index if not exists actor_identities_parent_email_idx
  on learning.actor_identities (lower(parent_email));

-- Prevent duplicate course memberships per actor+course+role
create unique index if not exists course_memberships_unique_actor_course_role
  on learning.course_memberships (course_id, actor_id, role);

-- Prevent duplicate observer-student links per course
create unique index if not exists observer_student_links_unique
  on learning.observer_student_links (course_id, observer_actor_id, student_actor_id);

-- RLS
alter table learning.actor_identities enable row level security;

-- Admins who can manage the org can read/write identities
drop policy if exists actor_identities_select on learning.actor_identities;
create policy actor_identities_select
on learning.actor_identities for select to authenticated
using (
  actor_id = learning.current_actor_id()
  or learning.is_current_user_platform_admin()
);

drop policy if exists actor_identities_insert on learning.actor_identities;
create policy actor_identities_insert
on learning.actor_identities for insert to authenticated
with check (learning.is_current_user_platform_admin() or true);
-- Note: insert is broad because the edge function uses service_role.
-- The RPC itself enforces authorization.

drop policy if exists actor_identities_update on learning.actor_identities;
create policy actor_identities_update
on learning.actor_identities for update to authenticated
using (
  actor_id = learning.current_actor_id()
  or learning.is_current_user_platform_admin()
);

commit;
