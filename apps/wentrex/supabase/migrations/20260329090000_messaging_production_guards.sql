-- ============================================================================
-- MESSAGING PRODUCTION GUARDS
-- Patches existing learning.communication_* tables in-place.
-- Safe to run on existing data. Uses guarded DDL throughout.
-- ============================================================================

begin;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1: ORDERING
-- Add per-conversation monotonic message sequence
-- ════════════════════════════════════════════════════════════════════════════

-- 1a. Add next_message_seq counter to conversations
alter table learning.communication_conversations
  add column if not exists next_message_seq bigint not null default 0;

-- 1b. Add conversation_seq to messages
alter table learning.communication_messages
  add column if not exists conversation_seq bigint;

-- 1c. Backfill existing messages with deterministic sequence values
-- Order by (created_at asc, id asc) within each conversation
do $$
begin
  if exists (
    select 1 from learning.communication_messages
    where conversation_seq is null
    limit 1
  ) then
    with numbered as (
      select id,
             conversation_id,
             row_number() over (
               partition by conversation_id
               order by created_at asc, id asc
             ) as seq
      from learning.communication_messages
      where conversation_seq is null
    )
    update learning.communication_messages m
    set conversation_seq = n.seq
    from numbered n
    where m.id = n.id;

    -- Set next_message_seq on conversations to max+1
    update learning.communication_conversations c
    set next_message_seq = coalesce((
      select max(conversation_seq) + 1
      from learning.communication_messages
      where conversation_id = c.id
    ), 0);
  end if;
end
$$;

-- 1d. Make conversation_seq not null after backfill
alter table learning.communication_messages
  alter column conversation_seq set not null;

-- 1e. Unique guarantee on (conversation_id, conversation_seq)
create unique index if not exists comm_messages_conversation_seq_unique
  on learning.communication_messages (conversation_id, conversation_seq);


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2: IDEMPOTENCY
-- Prevent duplicate messages from client retries
-- ════════════════════════════════════════════════════════════════════════════

create unique index if not exists comm_messages_client_id_idempotency
  on learning.communication_messages (conversation_id, sender_actor_id, client_id)
  where client_id is not null;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3: INDEXES
-- Hot-path indexes for realtime chat performance
-- ════════════════════════════════════════════════════════════════════════════

-- Messages
create index if not exists comm_messages_conv_seq_desc
  on learning.communication_messages (conversation_id, conversation_seq desc);

create index if not exists comm_messages_conv_created_desc
  on learning.communication_messages (conversation_id, created_at desc);

create index if not exists comm_messages_reply_to
  on learning.communication_messages (reply_to_message_id)
  where reply_to_message_id is not null;

create index if not exists comm_messages_sender_created
  on learning.communication_messages (sender_actor_id, created_at desc);

-- Conversation members
create index if not exists comm_members_actor_active
  on learning.communication_conversation_members (actor_id, is_active, conversation_id);

create index if not exists comm_members_conv_active
  on learning.communication_conversation_members (conversation_id, is_active, actor_id);

-- Inbox entries
create index if not exists comm_inbox_actor_folder
  on learning.communication_inbox_entries (actor_id, folder, last_message_at desc nulls last);

create index if not exists comm_inbox_unread
  on learning.communication_inbox_entries (actor_id, folder)
  where unread_count > 0;

-- Receipts
create index if not exists comm_receipts_actor_status
  on learning.communication_message_receipts (actor_id, status, seen_at);

create index if not exists comm_receipts_message_status
  on learning.communication_message_receipts (message_id, status);

-- Conversations by scope
create index if not exists comm_conversations_realm_last
  on learning.communication_conversations (realm_id, last_message_at desc nulls last);

create index if not exists comm_conversations_course_last
  on learning.communication_conversations (course_id, last_message_at desc nulls last)
  where course_id is not null;

create index if not exists comm_conversations_org_last
  on learning.communication_conversations (organization_id, last_message_at desc nulls last)
  where organization_id is not null;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 4: INTEGRITY GUARDS
-- Supporting unique constraints needed for composite FK references
-- ════════════════════════════════════════════════════════════════════════════

-- Required for same-conversation FK checks
create unique index if not exists comm_messages_conv_id_unique
  on learning.communication_messages (conversation_id, id);


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 5: TRIGGERS — Sequence assignment
-- Assigns conversation_seq atomically on message insert
-- ════════════════════════════════════════════════════════════════════════════

create or replace function learning.assign_message_conversation_seq()
returns trigger
language plpgsql
as $$
declare
  v_seq bigint;
begin
  -- Atomically increment and fetch the next sequence number
  update learning.communication_conversations
  set next_message_seq = next_message_seq + 1
  where id = NEW.conversation_id
  returning next_message_seq into v_seq;

  if v_seq is null then
    raise exception 'Conversation % does not exist', NEW.conversation_id;
  end if;

  NEW.conversation_seq := v_seq;
  return NEW;
end;
$$;

drop trigger if exists trg_assign_message_seq on learning.communication_messages;
create trigger trg_assign_message_seq
  before insert on learning.communication_messages
  for each row
  when (NEW.conversation_seq is null)
  execute function learning.assign_message_conversation_seq();


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 6: TRIGGERS — Sender validation
-- Sender must be active member with posting rights
-- ════════════════════════════════════════════════════════════════════════════

create or replace function learning.validate_message_sender()
returns trigger
language plpgsql
as $$
declare
  v_member record;
  v_admins_only boolean;
begin
  -- Check membership
  select is_active, can_post, role
  into v_member
  from learning.communication_conversation_members
  where conversation_id = NEW.conversation_id
    and actor_id = NEW.sender_actor_id;

  if not found then
    raise exception 'Sender % is not a member of conversation %',
      NEW.sender_actor_id, NEW.conversation_id;
  end if;

  if not v_member.is_active then
    raise exception 'Sender % is not an active member of conversation %',
      NEW.sender_actor_id, NEW.conversation_id;
  end if;

  if not v_member.can_post then
    raise exception 'Sender % does not have posting rights in conversation %',
      NEW.sender_actor_id, NEW.conversation_id;
  end if;

  -- Check admin-only posting
  select only_admins_can_post
  into v_admins_only
  from learning.communication_conversations
  where id = NEW.conversation_id;

  if v_admins_only and v_member.role not in ('owner', 'admin') and not v_member.can_post then
    raise exception 'Only admins can post in conversation %', NEW.conversation_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_validate_message_sender on learning.communication_messages;
create trigger trg_validate_message_sender
  before insert on learning.communication_messages
  for each row
  execute function learning.validate_message_sender();


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 7: TRIGGERS — Reply validation
-- reply_to_message_id must reference same conversation
-- ════════════════════════════════════════════════════════════════════════════

create or replace function learning.validate_reply_same_conversation()
returns trigger
language plpgsql
as $$
begin
  if NEW.reply_to_message_id is not null then
    if not exists (
      select 1 from learning.communication_messages
      where id = NEW.reply_to_message_id
        and conversation_id = NEW.conversation_id
    ) then
      raise exception 'reply_to_message_id % does not belong to conversation %',
        NEW.reply_to_message_id, NEW.conversation_id;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_validate_reply on learning.communication_messages;
create trigger trg_validate_reply
  before insert or update on learning.communication_messages
  for each row
  when (NEW.reply_to_message_id is not null)
  execute function learning.validate_reply_same_conversation();


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 8: TRIGGERS — Update conversation last_message pointers
-- ════════════════════════════════════════════════════════════════════════════

create or replace function learning.update_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update learning.communication_conversations
  set
    last_message_id = NEW.id,
    last_message_at = NEW.created_at
  where id = NEW.conversation_id
    and (
      last_message_at is null
      or NEW.created_at > last_message_at
      or (NEW.created_at = last_message_at and NEW.conversation_seq > coalesce(
        (select conversation_seq from learning.communication_messages where id = learning.communication_conversations.last_message_id),
        0
      ))
    );
  return NEW;
end;
$$;

drop trigger if exists trg_update_conv_last_message on learning.communication_messages;
create trigger trg_update_conv_last_message
  after insert on learning.communication_messages
  for each row
  execute function learning.update_conversation_last_message();


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 9: TRIGGERS — Receipt validation
-- Receipt actor must be active member of the message's conversation
-- ════════════════════════════════════════════════════════════════════════════

create or replace function learning.validate_receipt_membership()
returns trigger
language plpgsql
as $$
declare
  v_conversation_id uuid;
begin
  select conversation_id into v_conversation_id
  from learning.communication_messages
  where id = NEW.message_id;

  if v_conversation_id is null then
    raise exception 'Message % does not exist', NEW.message_id;
  end if;

  if not exists (
    select 1 from learning.communication_conversation_members
    where conversation_id = v_conversation_id
      and actor_id = NEW.actor_id
      and is_active = true
  ) then
    raise exception 'Actor % is not an active member of the conversation for message %',
      NEW.actor_id, NEW.message_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_validate_receipt on learning.communication_message_receipts;
create trigger trg_validate_receipt
  before insert on learning.communication_message_receipts
  for each row
  execute function learning.validate_receipt_membership();


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 10: CHECKS
-- Payload and receipt validation constraints
-- ════════════════════════════════════════════════════════════════════════════

-- Receipt seen_at consistency
-- delivered = seen_at must be null, read = seen_at must be set
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'comm_receipts_seen_at_consistency'
      and conrelid = 'learning.communication_message_receipts'::regclass
  ) then
    alter table learning.communication_message_receipts
      add constraint comm_receipts_seen_at_consistency
      check (
        (status = 'delivered' and seen_at is null)
        or (status = 'read' and seen_at is not null)
      );
  end if;
end
$$;

-- Text messages must have non-empty body (unless deleted/hidden)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'comm_messages_text_body_required'
      and conrelid = 'learning.communication_messages'::regclass
  ) then
    alter table learning.communication_messages
      add constraint comm_messages_text_body_required
      check (
        message_type != 'text'
        or deleted_at is not null
        or is_hidden = true
        or (body is not null and trim(body) != '')
      );
  end if;
end
$$;


commit;
