-- Allow authenticated reporters to write/read their own report_events rows.
-- Run in Supabase SQL editor.

alter table if exists vc.report_events enable row level security;

drop policy if exists report_events_select_self on vc.report_events;
create policy report_events_select_self
on vc.report_events
for select
to authenticated
using (
  (
    actor_id is not null
    and exists (
      select 1
      from vc.actor_owners ao
      where ao.actor_id = report_events.actor_id
        and ao.user_id = auth.uid()
        and coalesce(ao.is_void, false) = false
    )
  )
  or exists (
    select 1
    from vc.reports r
    join vc.actor_owners ao on ao.actor_id = r.reporter_actor_id
    where r.id = report_events.report_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
);

drop policy if exists report_events_insert_self_created on vc.report_events;
create policy report_events_insert_self_created
on vc.report_events
for insert
to authenticated
with check (
  event_type = 'created'
  and actor_id is not null
  and exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = report_events.actor_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
  and exists (
    select 1
    from vc.reports r
    where r.id = report_events.report_id
      and r.reporter_actor_id = report_events.actor_id
  )
);
