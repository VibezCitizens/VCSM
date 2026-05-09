// src/features/communication/inbox/dal/inboxUpsert.write.dal.js
// ============================================================
// Inbox WRITE DAL — upsert, unread count, and last-message ops
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/* ============================================================
   Upsert inbox entry (used on first message or re-join)
   ============================================================ */

export async function upsertInboxEntry({
  actorId,
  conversationId,
  defaults = {},
}) {
  if (!actorId || !conversationId) {
    throw new Error('[upsertInboxEntry] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .upsert(
      {
        actor_id: actorId,
        conversation_id: conversationId,
        ...defaults,
      },
      {
        onConflict: 'conversation_id,actor_id',
      }
    )

  if (error) {
    console.error(error)
    throw new Error('[upsertInboxEntry] upsert failed')
  }
}

/* ============================================================
   Increment unread count
   ============================================================ */

export async function incrementUnread({
  actorId,
  conversationId,
  by = 1,
}) {
  if (!actorId || !conversationId) {
    throw new Error('[incrementUnread] missing params')
  }

  const { error } = await supabase.rpc('increment_inbox_unread', {
    p_actor_id: actorId,
    p_conversation_id: conversationId,
    p_by: by,
  })

  if (error) {
    console.error(error)
    throw new Error('[incrementUnread] rpc failed')
  }
}

/* ============================================================
   Reset unread count
   ============================================================ */

export async function resetUnread({
  actorId,
  conversationId,
}) {
  if (!actorId || !conversationId) {
    throw new Error('[resetUnread] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      unread_count: 0,
    })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[resetUnread] update failed')
  }
}

/* ============================================================
   Update last message pointer
   ============================================================ */

export async function updateInboxLastMessage({
  actorId,
  conversationId,
  messageId,
  createdAt,
}) {
  if (!actorId || !conversationId || !messageId || !createdAt) {
    console.warn('[updateInboxLastMessage] skipped — missing params', {
      actorId,
      conversationId,
      messageId,
      createdAt,
    })
    return
  }

  await upsertInboxEntry({
    actorId,
    conversationId,
    defaults: { folder: 'inbox', archived: false, archived_until_new: false },
  })

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      last_message_id: messageId,
      last_message_at: createdAt,
    })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[updateInboxLastMessage] update failed')
  }
}
