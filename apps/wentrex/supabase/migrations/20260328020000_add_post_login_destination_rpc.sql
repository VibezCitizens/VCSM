create or replace function public.get_post_login_destination()
returns table (
  dashboard text,
  actor_id uuid,
  matched_role text,
  organization_id uuid,
  course_id uuid
)
language sql
security definer
set search_path to public, auth, core, learning
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
    from core.platform_owners po
    where po.user_id = am.user_id
  )

  union all

  select
    2,
    '/administration/dashboard'::text,
    am.actor_id,
    'admin'::text,
    om.organization_id,
    null::uuid
  from actor_me am
  join learning.organization_memberships om
    on om.actor_id = am.actor_id
   and om.status = 'active'
   and om.role = 'admin'

  union all

  select
    3,
    '/staff/dashboard'::text,
    am.actor_id,
    'staff'::text,
    om.organization_id,
    null::uuid
  from actor_me am
  join learning.organization_memberships om
    on om.actor_id = am.actor_id
   and om.status = 'active'
   and om.role = 'staff'

  union all

  select
    4,
    '/teacher/dashboard'::text,
    am.actor_id,
    'teacher'::text,
    om.organization_id,
    null::uuid
  from actor_me am
  join learning.organization_memberships om
    on om.actor_id = am.actor_id
   and om.status = 'active'
   and om.role = 'teacher'

  union all

  select
    4,
    '/teacher/dashboard'::text,
    am.actor_id,
    cm.role::text,
    c.organization_id,
    cm.course_id
  from actor_me am
  join learning.course_memberships cm
    on cm.actor_id = am.actor_id
   and cm.status = 'active'
   and cm.role in ('teacher', 'instructor', 'ta', 'grader')
  join learning.courses c
    on c.id = cm.course_id

  union all

  select
    5,
    '/parent/dashboard'::text,
    am.actor_id,
    cm.role::text,
    c.organization_id,
    cm.course_id
  from actor_me am
  join learning.course_memberships cm
    on cm.actor_id = am.actor_id
   and cm.status = 'active'
   and cm.role in ('parent', 'observer')
  join learning.courses c
    on c.id = cm.course_id

  union all

  select
    6,
    '/student/dashboard'::text,
    am.actor_id,
    'student'::text,
    c.organization_id,
    cm.course_id
  from actor_me am
  join learning.course_memberships cm
    on cm.actor_id = am.actor_id
   and cm.status = 'active'
   and cm.role = 'student'
  join learning.courses c
    on c.id = cm.course_id
),
best_match as (
  select *
  from candidates
  order by priority asc, organization_id nulls last, course_id nulls last
  limit 1
)
select
  case
    when me.user_id is null then '/login'
    when bm.dashboard is not null then bm.dashboard
    else '/unauthorized'
  end as dashboard,
  bm.actor_id,
  case
    when me.user_id is null then 'anonymous'
    when bm.matched_role is not null then bm.matched_role
    else 'none'
  end as matched_role,
  bm.organization_id,
  bm.course_id
from me
left join best_match bm on true;
$function$;

grant execute on function public.get_post_login_destination() to authenticated;
