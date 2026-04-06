-- Multi-tenant migration: backfill organization_id, add indexes, set NOT NULL
-- This makes organization_id the tenant boundary across all learning tables.

begin;

-- ─── 1. Backfill actors.organization_id from org memberships ─────────────────
update learning.actors a
set organization_id = (
  select om.organization_id
  from learning.organization_memberships om
  where om.actor_id = a.id and om.status = 'active'
  order by om.created_at asc
  limit 1
)
where a.organization_id is null
  and exists (
    select 1 from learning.organization_memberships om
    where om.actor_id = a.id and om.status = 'active'
  );

-- Fallback: backfill from course_memberships -> courses
update learning.actors a
set organization_id = (
  select c.organization_id
  from learning.course_memberships cm
  join learning.courses c on c.id = cm.course_id
  where cm.actor_id = a.id and cm.status = 'active'
  order by cm.created_at asc
  limit 1
)
where a.organization_id is null
  and exists (
    select 1 from learning.course_memberships cm
    join learning.courses c on c.id = cm.course_id
    where cm.actor_id = a.id and cm.status = 'active'
  );

-- ─── 2. Backfill actor_identities.organization_id from actors ────────────────
update learning.actor_identities ai
set organization_id = a.organization_id
from learning.actors a
where ai.actor_id = a.id
  and ai.organization_id is null
  and a.organization_id is not null;

-- ─── 3. Backfill course_memberships.organization_id from courses ─────────────
update learning.course_memberships cm
set organization_id = c.organization_id
from learning.courses c
where cm.course_id = c.id
  and cm.organization_id is null;

-- ─── 4. Backfill modules.organization_id from courses ────────────────────────
update learning.modules m
set organization_id = c.organization_id
from learning.courses c
where m.course_id = c.id
  and m.organization_id is null;

-- ─── 5. Backfill lessons.organization_id from courses ────────────────────────
update learning.lessons l
set organization_id = c.organization_id
from learning.courses c
where l.course_id = c.id
  and l.organization_id is null;

-- ─── 6. Backfill assignments.organization_id from courses ────────────────────
update learning.assignments a
set organization_id = c.organization_id
from learning.courses c
where a.course_id = c.id
  and a.organization_id is null;

-- ─── 7. Backfill submissions.organization_id from courses ────────────────────
update learning.submissions s
set organization_id = c.organization_id
from learning.courses c
where s.course_id = c.id
  and s.organization_id is null;

-- ─── 8. Backfill grades.organization_id from submissions ─────────────────────
update learning.grades g
set organization_id = s.organization_id
from learning.submissions s
where g.submission_id = s.id
  and g.organization_id is null
  and s.organization_id is not null;

-- ─── 9. Backfill observer_student_links.organization_id from courses ─────────
update learning.observer_student_links osl
set organization_id = c.organization_id
from learning.courses c
where osl.course_id = c.id
  and osl.organization_id is null;

-- ─── 10. Tenant-scoped indexes ───────────────────────────────────────────────
create index if not exists idx_actors_organization_id
  on learning.actors (organization_id);

create index if not exists idx_actor_identities_organization_id
  on learning.actor_identities (organization_id);

create index if not exists idx_course_memberships_org_actor
  on learning.course_memberships (organization_id, actor_id);

create index if not exists idx_course_memberships_org_course
  on learning.course_memberships (organization_id, course_id);

create index if not exists idx_courses_org_id
  on learning.courses (organization_id, id);

create index if not exists idx_modules_org_course
  on learning.modules (organization_id, course_id);

create index if not exists idx_lessons_org_course
  on learning.lessons (organization_id, course_id);

create index if not exists idx_assignments_org_course
  on learning.assignments (organization_id, course_id);

create index if not exists idx_submissions_org_course_actor
  on learning.submissions (organization_id, course_id, actor_id);

create index if not exists idx_observer_student_links_org_course
  on learning.observer_student_links (organization_id, course_id);

-- ─── 11. Unique index: one actor per user per org ────────────────────────────
create unique index if not exists idx_actors_user_org_unique
  on learning.actors (user_id, organization_id)
  where organization_id is not null;

-- ─── 12. Helper: get current user's organization IDs ─────────────────────────
create or replace function learning.current_user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  select distinct om.organization_id
  from learning.organization_memberships om
  join vc.actor_owners ao on ao.actor_id = om.actor_id
  where ao.user_id = auth.uid()
    and coalesce(ao.is_void, false) = false
    and om.status = 'active';
$$;

grant execute on function learning.current_user_organization_ids() to authenticated, service_role;

commit;
