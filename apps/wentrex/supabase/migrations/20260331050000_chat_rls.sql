-- ============================================================
-- Chat Schema — Row-Level Security
-- ============================================================
-- Wentrex-first. VC deferred to Phase 4.
--
-- Architecture:
--   chat.current_actor_id()        → resolves auth.uid() to actor_id
--   chat.is_conversation_member()  → active membership check
--   chat.can_current_actor_post()  → posting rights check
--   chat.can_current_actor_manage()→ management rights check
--
-- User-facing tables get scoped policies.
-- Internal tables (outbox, audit, legacy, keys) stay backend-only.
-- ============================================================


-- ============================================================
-- 1. HELPER FUNCTIONS
-- ============================================================

-- Delegates to learning.current_actor_id() which resolves auth.uid()
-- through vc.actor_owners / learning.actor_owners / learning.actors.
-- Will be generalized for multi-app actor resolution in Phase 4.
create or replace function chat.current_actor_id()
returns uuid
language sql stable security definer
set search_path = learning
as $$
  select learning.current_actor_id();
$$;

-- Check if the current actor is an active member of a conversation
create or replace function chat.is_conversation_member(_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path = chat
as $$
  select exists (
    select 1 from chat.conversation_members
    where conversation_id = _conversation_id
      and actor_id = chat.current_actor_id()
      and membership_status = 'active'
  );
$$;

-- Check if the current actor can post in a conversation
create or replace function chat.can_current_actor_post(_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path = chat
as $$
  select exists (
    select 1 from chat.conversation_members
    where conversation_id = _conversation_id
      and actor_id = chat.current_actor_id()
      and membership_status = 'active'
      and can_post = true
  );
$$;

-- Check if the current actor can manage a conversation (add/remove members, edit settings)
create or replace function chat.can_current_actor_manage(_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path = chat
as $$
  select exists (
    select 1 from chat.conversation_members
    where conversation_id = _conversation_id
      and actor_id = chat.current_actor_id()
      and membership_status = 'active'
      and (can_manage = true or role in ('owner', 'admin'))
  );
$$;

-- Check if the current actor can moderate a conversation (hide/delete messages, ban)
create or replace function chat.can_current_actor_moderate(_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path = chat
as $$
  select exists (
    select 1 from chat.conversation_members
    where conversation_id = _conversation_id
      and actor_id = chat.current_actor_id()
      and membership_status = 'active'
      and (can_moderate = true or role in ('owner', 'admin'))
  );
$$;

-- Check if the current actor can read a specific message (member of its conversation)
create or replace function chat.can_current_actor_read_message(_message_id uuid)
returns boolean
language sql stable security definer
set search_path = chat
as $$
  select exists (
    select 1 from chat.messages m
    join chat.conversation_members cm
      on cm.conversation_id = m.conversation_id
    where m.id = _message_id
      and cm.actor_id = chat.current_actor_id()
      and cm.membership_status = 'active'
  );
$$;


-- ============================================================
-- 2. ENABLE RLS ON USER-FACING TABLES
-- ============================================================

alter table chat.conversations              enable row level security;
alter table chat.conversation_members       enable row level security;
alter table chat.messages                   enable row level security;
alter table chat.inbox_entries              enable row level security;
alter table chat.message_receipts           enable row level security;
alter table chat.message_attachments        enable row level security;
alter table chat.typing_states              enable row level security;
alter table chat.moderation_actions         enable row level security;
alter table chat.participant_snapshots      enable row level security;
alter table chat.saved_messages             enable row level security;
alter table chat.conversation_pins          enable row level security;
alter table chat.message_reactions          enable row level security;


-- ============================================================
-- 3. BACKEND-ONLY TABLES — revoke client access
-- ============================================================

alter table chat.outbox_events              enable row level security;
alter table chat.legacy_mappings            enable row level security;
alter table chat.audit_log                  enable row level security;
alter table chat.conversation_keys          enable row level security;

-- No policies = no rows visible to authenticated role.
-- Service role bypasses RLS for backend workers.
revoke all on chat.outbox_events            from authenticated;
revoke all on chat.legacy_mappings          from authenticated;
revoke all on chat.audit_log                from authenticated;
revoke all on chat.conversation_keys        from authenticated;


-- ============================================================
-- 4. POLICIES — conversations
-- ============================================================

-- SELECT: only members can see conversations they belong to
create policy chat_conversations_select_member
on chat.conversations for select to authenticated
using (chat.is_conversation_member(id));

-- INSERT: authenticated user must be the creator
create policy chat_conversations_insert_creator
on chat.conversations for insert to authenticated
with check (created_by_actor_id = chat.current_actor_id());

-- UPDATE: only conversation managers can update metadata
create policy chat_conversations_update_manager
on chat.conversations for update to authenticated
using (chat.can_current_actor_manage(id));


-- ============================================================
-- 5. POLICIES — conversation_members
-- ============================================================

-- SELECT: members can see other members of their conversations
create policy chat_members_select_member
on chat.conversation_members for select to authenticated
using (chat.is_conversation_member(conversation_id));

-- INSERT: managers can add members, or actors can insert themselves
create policy chat_members_insert
on chat.conversation_members for insert to authenticated
with check (
  actor_id = chat.current_actor_id()
  or chat.can_current_actor_manage(conversation_id)
);

-- UPDATE: managers can update any member; actors can update own row
create policy chat_members_update
on chat.conversation_members for update to authenticated
using (
  actor_id = chat.current_actor_id()
  or chat.can_current_actor_manage(conversation_id)
);


-- ============================================================
-- 6. POLICIES — messages
-- ============================================================

-- SELECT: only conversation members can read messages
create policy chat_messages_select_member
on chat.messages for select to authenticated
using (chat.is_conversation_member(conversation_id));

-- INSERT: must be sender, active member, AND have posting rights
create policy chat_messages_insert_poster
on chat.messages for insert to authenticated
with check (
  sender_actor_id = chat.current_actor_id()
  and chat.can_current_actor_post(conversation_id)
);

-- UPDATE: sender can edit own messages; moderators can update any
create policy chat_messages_update
on chat.messages for update to authenticated
using (
  sender_actor_id = chat.current_actor_id()
  or chat.can_current_actor_moderate(conversation_id)
);


-- ============================================================
-- 7. POLICIES — inbox_entries
-- ============================================================

-- SELECT: actors can only see their own inbox entries
create policy chat_inbox_select_own
on chat.inbox_entries for select to authenticated
using (actor_id = chat.current_actor_id());

-- INSERT: own entries or conversation managers seeding inbox
create policy chat_inbox_insert
on chat.inbox_entries for insert to authenticated
with check (
  actor_id = chat.current_actor_id()
  or chat.can_current_actor_manage(conversation_id)
);

-- UPDATE: own entries only
create policy chat_inbox_update_own
on chat.inbox_entries for update to authenticated
using (actor_id = chat.current_actor_id());

-- DELETE: own entries only
create policy chat_inbox_delete_own
on chat.inbox_entries for delete to authenticated
using (actor_id = chat.current_actor_id());


-- ============================================================
-- 8. POLICIES — message_receipts
-- ============================================================

-- SELECT: own receipts only
create policy chat_receipts_select_own
on chat.message_receipts for select to authenticated
using (actor_id = chat.current_actor_id());

-- INSERT: own receipts for messages in accessible conversations
create policy chat_receipts_insert_own
on chat.message_receipts for insert to authenticated
with check (
  actor_id = chat.current_actor_id()
  and chat.can_current_actor_read_message(message_id)
);

-- UPDATE: own receipts only
create policy chat_receipts_update_own
on chat.message_receipts for update to authenticated
using (actor_id = chat.current_actor_id());


-- ============================================================
-- 9. POLICIES — message_attachments
-- ============================================================

-- SELECT: readable if actor is member of the message's conversation
create policy chat_attachments_select_member
on chat.message_attachments for select to authenticated
using (chat.can_current_actor_read_message(message_id));

-- INSERT: must be the sender of the message
create policy chat_attachments_insert_sender
on chat.message_attachments for insert to authenticated
with check (
  exists (
    select 1 from chat.messages m
    where m.id = message_id
      and m.sender_actor_id = chat.current_actor_id()
  )
);


-- ============================================================
-- 10. POLICIES — typing_states
-- ============================================================

-- SELECT: conversation members can see who's typing
create policy chat_typing_select_member
on chat.typing_states for select to authenticated
using (chat.is_conversation_member(conversation_id));

-- INSERT: own typing state only, must be member
create policy chat_typing_insert_own
on chat.typing_states for insert to authenticated
with check (
  actor_id = chat.current_actor_id()
  and chat.is_conversation_member(conversation_id)
);

-- UPDATE: own typing state only
create policy chat_typing_update_own
on chat.typing_states for update to authenticated
using (actor_id = chat.current_actor_id());

-- DELETE: own typing state only
create policy chat_typing_delete_own
on chat.typing_states for delete to authenticated
using (actor_id = chat.current_actor_id());


-- ============================================================
-- 11. POLICIES — moderation_actions
-- ============================================================

-- SELECT: conversation moderators only
create policy chat_moderation_select_moderator
on chat.moderation_actions for select to authenticated
using (
  object_type = 'conversation'
  and chat.can_current_actor_moderate(object_id::uuid)
);

-- INSERT: must be the acting moderator and have moderation rights
create policy chat_moderation_insert_moderator
on chat.moderation_actions for insert to authenticated
with check (
  actor_id = chat.current_actor_id()
  and object_type = 'conversation'
  and chat.can_current_actor_moderate(object_id::uuid)
);


-- ============================================================
-- 12. POLICIES — participant_snapshots
-- ============================================================

-- SELECT: conversation members can see snapshots
-- No INSERT/UPDATE/DELETE — backend-only writes via service role
create policy chat_snapshots_select_member
on chat.participant_snapshots for select to authenticated
using (chat.is_conversation_member(conversation_id));


-- ============================================================
-- 13. POLICIES — saved_messages
-- ============================================================

-- SELECT: own saved messages only
create policy chat_saved_select_own
on chat.saved_messages for select to authenticated
using (actor_id = chat.current_actor_id());

-- INSERT: own saved messages for accessible messages
create policy chat_saved_insert_own
on chat.saved_messages for insert to authenticated
with check (
  actor_id = chat.current_actor_id()
  and chat.can_current_actor_read_message(message_id)
);

-- DELETE: own saved messages only
create policy chat_saved_delete_own
on chat.saved_messages for delete to authenticated
using (actor_id = chat.current_actor_id());


-- ============================================================
-- 14. POLICIES — conversation_pins
-- ============================================================

-- SELECT: conversation members can see pins
create policy chat_pins_select_member
on chat.conversation_pins for select to authenticated
using (chat.is_conversation_member(conversation_id));

-- INSERT: conversation managers can pin messages
create policy chat_pins_insert_manager
on chat.conversation_pins for insert to authenticated
with check (
  pinned_by_actor_id = chat.current_actor_id()
  and chat.can_current_actor_manage(conversation_id)
);

-- DELETE: conversation managers can unpin
create policy chat_pins_delete_manager
on chat.conversation_pins for delete to authenticated
using (chat.can_current_actor_manage(conversation_id));


-- ============================================================
-- 15. POLICIES — message_reactions
-- ============================================================

-- SELECT: conversation members can see reactions
create policy chat_reactions_select_member
on chat.message_reactions for select to authenticated
using (chat.can_current_actor_read_message(message_id));

-- INSERT: own reactions for accessible messages
create policy chat_reactions_insert_own
on chat.message_reactions for insert to authenticated
with check (
  actor_id = chat.current_actor_id()
  and chat.can_current_actor_read_message(message_id)
);

-- DELETE: own reactions only
create policy chat_reactions_delete_own
on chat.message_reactions for delete to authenticated
using (actor_id = chat.current_actor_id());


-- ============================================================
-- 16. GRANTS — user-facing tables
-- ============================================================
-- The authenticated role needs base table access; RLS restricts rows.

grant select, insert, update          on chat.conversations           to authenticated;
grant select, insert, update          on chat.conversation_members    to authenticated;
grant select, insert, update          on chat.messages                to authenticated;
grant select, insert, update, delete  on chat.inbox_entries           to authenticated;
grant select, insert, update          on chat.message_receipts        to authenticated;
grant select, insert                  on chat.message_attachments     to authenticated;
grant select, insert, update, delete  on chat.typing_states           to authenticated;
grant select, insert                  on chat.moderation_actions      to authenticated;
grant select                          on chat.participant_snapshots   to authenticated;
grant select, insert, delete          on chat.saved_messages          to authenticated;
grant select, insert, delete          on chat.conversation_pins       to authenticated;
grant select, insert, delete          on chat.message_reactions       to authenticated;

-- Helper functions callable by authenticated users
grant execute on function chat.current_actor_id()                     to authenticated;
grant execute on function chat.is_conversation_member(uuid)           to authenticated;
grant execute on function chat.can_current_actor_post(uuid)           to authenticated;
grant execute on function chat.can_current_actor_manage(uuid)         to authenticated;
grant execute on function chat.can_current_actor_moderate(uuid)       to authenticated;
grant execute on function chat.can_current_actor_read_message(uuid)   to authenticated;
