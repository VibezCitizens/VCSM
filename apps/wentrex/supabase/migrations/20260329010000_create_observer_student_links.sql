-- Observer-student links table for the create-parent flow
-- Purpose:
-- - Connect observer (parent) actors to student actors at the course level
-- - Parents are course-level observers, not organization members
-- - Supports RLS so observers can see their own links and managers can administer them

begin;

create table if not exists learning.observer_student_links (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references learning.courses(id),
  observer_actor_id uuid not null,
  student_actor_id uuid not null,
  created_at timestamptz not null default now()
);

comment on table learning.observer_student_links
is 'Links an observer (parent) actor to a student actor within a specific course.';

-- Prevent duplicate links for the same observer-student pair in a course.
alter table learning.observer_student_links
  drop constraint if exists uq_observer_student_links_course_observer_student;

alter table learning.observer_student_links
  add constraint uq_observer_student_links_course_observer_student
  unique (course_id, observer_actor_id, student_actor_id);

-- Indexes for efficient lookups by observer or student within a course.
create index if not exists idx_observer_student_links_course_observer
  on learning.observer_student_links (course_id, observer_actor_id);

create index if not exists idx_observer_student_links_course_student
  on learning.observer_student_links (course_id, student_actor_id);

-- Enable Row-Level Security.
alter table learning.observer_student_links enable row level security;

-- SELECT: authenticated users who can access the course OR whose actor matches observer_actor_id.
drop policy if exists "observer_student_links_select" on learning.observer_student_links;
create policy "observer_student_links_select"
  on learning.observer_student_links
  for select
  to authenticated
  using (
    learning.can_current_user_access_course(course_id)
    or observer_actor_id in (
      select ao.actor_id
      from vc.actor_owners ao
      where ao.user_id = auth.uid()
        and coalesce(ao.is_void, false) = false
    )
  );

-- INSERT: authenticated users who can manage the course.
drop policy if exists "observer_student_links_insert" on learning.observer_student_links;
create policy "observer_student_links_insert"
  on learning.observer_student_links
  for insert
  to authenticated
  with check (
    learning.can_current_user_manage_course(course_id)
  );

-- UPDATE: authenticated users who can manage the course.
drop policy if exists "observer_student_links_update" on learning.observer_student_links;
create policy "observer_student_links_update"
  on learning.observer_student_links
  for update
  to authenticated
  using (
    learning.can_current_user_manage_course(course_id)
  )
  with check (
    learning.can_current_user_manage_course(course_id)
  );

-- DELETE: authenticated users who can manage the course.
drop policy if exists "observer_student_links_delete" on learning.observer_student_links;
create policy "observer_student_links_delete"
  on learning.observer_student_links
  for delete
  to authenticated
  using (
    learning.can_current_user_manage_course(course_id)
  );

-- Grant service_role full access (bypasses RLS).
grant all on learning.observer_student_links to service_role;

commit;
