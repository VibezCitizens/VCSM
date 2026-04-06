-- Fix current_actor_id() to resolve actors for ALL users, not just those
-- with vc.actor_owners rows. Parents created via ensure_parent_identity
-- have rows in learning.actor_owners but NOT in vc.actor_owners, so the
-- old function returns NULL for them — breaking all RLS policies.
--
-- This patch checks:
-- 1. vc.actor_owners (existing path — works for staff/teachers)
-- 2. learning.actor_owners (new — works for parents)
-- 3. learning.actors.user_id (fallback — works for any actor)

begin;

create or replace function learning.current_actor_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, vc, learning
as $$
  -- Try vc.actor_owners first (original path)
  select ao.actor_id
  from vc.actor_owners ao
  where ao.user_id = auth.uid()
    and coalesce(ao.is_void, false) = false
  order by ao.actor_id
  limit 1

  union all

  -- Try learning.actor_owners (for parents created via ensure_parent_identity)
  select lao.actor_id
  from learning.actor_owners lao
  where lao.user_id = auth.uid()
    and coalesce(lao.is_void, false) = false
    and lao.is_primary = true
  order by lao.actor_id
  limit 1

  union all

  -- Direct fallback: learning.actors.user_id
  select a.id
  from learning.actors a
  where a.user_id = auth.uid()
    and a.is_active = true
  limit 1

  limit 1;
$$;

commit;
