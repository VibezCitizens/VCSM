-- Allow authenticated users to insert ONLY valid follow-related notifications.
-- Run this in Supabase SQL editor.

alter table if exists vc.notifications enable row level security;

drop policy if exists notifications_insert_follow_events on vc.notifications;

create policy notifications_insert_follow_events
on vc.notifications
for insert
to authenticated
with check (
  -- Caller must own at least one participant actor on the notification row.
  exists (
    select 1
    from vc.actor_owners ao
    where ao.user_id = auth.uid()
      and coalesce(ao.is_void, false) = false
      and ao.actor_id in (
        notifications.actor_id,
        notifications.recipient_actor_id
      )
  )

  -- Client can only create these kinds of notification rows.
  and (
    -- Direct follow: follower -> followed
    (
      kind = 'follow'
      and object_type = 'actor'
      and object_id in (actor_id, recipient_actor_id)
      and (link_path is null or link_path = '/profile/' || actor_id::text)
      and exists (
        select 1
        from vc.actor_follows f
        where (
            f.follower_actor_id = notifications.actor_id
            and f.followed_actor_id = notifications.recipient_actor_id
          )
          or (
            f.follower_actor_id = notifications.recipient_actor_id
            and f.followed_actor_id = notifications.actor_id
          )
          and f.is_active = true
      )
    )

    -- Follow request created: requester -> target
    or (
      kind = 'follow_request'
      and object_type = 'actor'
      and object_id in (actor_id, recipient_actor_id)
      and (link_path is null or link_path = '/profile/' || actor_id::text)
      and exists (
        select 1
        from vc.social_follow_requests r
        where (
            r.requester_actor_id = notifications.actor_id
            and r.target_actor_id = notifications.recipient_actor_id
          )
          or (
            r.requester_actor_id = notifications.recipient_actor_id
            and r.target_actor_id = notifications.actor_id
          )
          and r.status = 'pending'
      )
    )

    -- Follow request accepted: target -> requester
    or (
      kind = 'follow_request_accepted'
      and object_type = 'actor'
      and object_id in (actor_id, recipient_actor_id)
      and (link_path is null or link_path = '/profile/' || actor_id::text)
      and exists (
        select 1
        from vc.social_follow_requests r
        where (
            r.requester_actor_id = notifications.recipient_actor_id
            and r.target_actor_id = notifications.actor_id
          )
          or (
            r.requester_actor_id = notifications.actor_id
            and r.target_actor_id = notifications.recipient_actor_id
          )
          and r.status in ('pending', 'accepted')
      )
    )
  )
);
