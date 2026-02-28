-- Follow Request Accept - RLS debug probes
-- Run in Supabase SQL Editor while authenticated as the affected user.

-- 1) Confirm who auth.uid() is in this session.
select auth.uid() as auth_user_id;

-- 2) Which actors does this user own?
select ao.actor_id, ao.user_id, ao.is_void, ao.is_primary
from vc.actor_owners ao
where ao.user_id = auth.uid()
order by ao.created_at desc;

-- 3) Confirm the specific request row exists.
-- Replace with your requester/target actor ids if needed.
select r.requester_actor_id, r.target_actor_id, r.status, r.created_at, r.updated_at
from vc.social_follow_requests r
where r.requester_actor_id = 'b89c28cb-134f-4b8e-9e12-7486958d4b17'
  and r.target_actor_id = '753289fb-29a8-45af-b1f4-3362b4fd0c29';

-- 4) Show RLS state and policies on both relevant tables.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'vc'
  and c.relname in ('social_follow_requests', 'notifications')
order by c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'vc'
  and tablename in ('social_follow_requests', 'notifications')
order by tablename, policyname;

-- 5) Dry-run check for request pair visibility from this session.
select exists (
  select 1
  from vc.social_follow_requests r
  where r.requester_actor_id = 'b89c28cb-134f-4b8e-9e12-7486958d4b17'
    and r.target_actor_id = '753289fb-29a8-45af-b1f4-3362b4fd0c29'
) as can_select_request_row;

