-- Allow actor owners to read/write their own follow-request edges.
-- Run this in Supabase SQL editor.

alter table if exists vc.social_follow_requests enable row level security;

drop policy if exists social_follow_requests_select_participant on vc.social_follow_requests;
create policy social_follow_requests_select_participant
on vc.social_follow_requests
for select
to authenticated
using (
  exists (
    select 1
    from vc.actor_owners ao
    where ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
      and ao.actor_id in (
        social_follow_requests.requester_actor_id,
        social_follow_requests.target_actor_id
      )
  )
);

drop policy if exists social_follow_requests_insert_requester on vc.social_follow_requests;
create policy social_follow_requests_insert_requester
on vc.social_follow_requests
for insert
to authenticated
with check (
  requester_actor_id <> target_actor_id
  and status = 'pending'
  and exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = social_follow_requests.requester_actor_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
);

drop policy if exists social_follow_requests_update_target_decision on vc.social_follow_requests;
create policy social_follow_requests_update_target_decision
on vc.social_follow_requests
for update
to authenticated
using (
  status = 'pending'
  and exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = social_follow_requests.target_actor_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
)
with check (
  requester_actor_id = social_follow_requests.requester_actor_id
  and target_actor_id = social_follow_requests.target_actor_id
  and status in ('accepted', 'declined')
);

drop policy if exists social_follow_requests_update_requester_cancel on vc.social_follow_requests;
create policy social_follow_requests_update_requester_cancel
on vc.social_follow_requests
for update
to authenticated
using (
  status = 'pending'
  and exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = social_follow_requests.requester_actor_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
)
with check (
  requester_actor_id = social_follow_requests.requester_actor_id
  and target_actor_id = social_follow_requests.target_actor_id
  and status in ('cancelled', 'revoked')
);

