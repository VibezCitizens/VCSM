-- Allow authenticated actors to read/write their own inbox rows.
-- Run in Supabase SQL editor.

alter table if exists vc.inbox_entries enable row level security;

drop policy if exists inbox_entries_select_self on vc.inbox_entries;
create policy inbox_entries_select_self
on vc.inbox_entries
for select
to authenticated
using (
  exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = inbox_entries.actor_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
);

drop policy if exists inbox_entries_insert_self on vc.inbox_entries;
create policy inbox_entries_insert_self
on vc.inbox_entries
for insert
to authenticated
with check (
  exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = inbox_entries.actor_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
  and exists (
    select 1
    from vc.conversation_members cm
    where cm.conversation_id = inbox_entries.conversation_id
      and cm.actor_id = inbox_entries.actor_id
      and cm.is_active = true
  )
);

drop policy if exists inbox_entries_update_self on vc.inbox_entries;
create policy inbox_entries_update_self
on vc.inbox_entries
for update
to authenticated
using (
  exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = inbox_entries.actor_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
)
with check (
  exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = inbox_entries.actor_id
      and ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
  )
  and exists (
    select 1
    from vc.conversation_members cm
    where cm.conversation_id = inbox_entries.conversation_id
      and cm.actor_id = inbox_entries.actor_id
      and cm.is_active = true
  )
);

