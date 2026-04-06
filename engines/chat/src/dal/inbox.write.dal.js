// src/dal/inbox.write.dal.js
// ============================================================
// Inbox — WRITE DAL
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Writes only to chat.inbox_entries
// - Business rules live in controllers / triggers
// ============================================================

import { getSupabaseClient } from '../config.js'

/* ============================================================
   Upsert inbox entry (used on first message or re-join)
   ============================================================ */

/**
 * Ensure an inbox entry exists for an actor + conversation.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.conversationId
 * @param {Object} [params.defaults]
 */
export async function upsertInboxEntry({
  actorId,
  conversationId,
  defaults = {},
}) {
  if (!actorId || !conversationId) {
    throw new Error('[upsertInboxEntry] missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
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

  if (error) throw new Error('[upsertInboxEntry] upsert failed')
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

  const supabase = getSupabaseClient()

  // Direct update — no RPC dependency.
  // Reads current unread_count and adds `by` to it.
  const { data: current, error: readError } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .select('unread_count')
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)
    .maybeSingle()

  if (readError) throw new Error('[incrementUnread] read failed')
  if (!current) return // no inbox entry yet — nothing to increment

  const { error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .update({ unread_count: (current.unread_count || 0) + by })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) throw new Error('[incrementUnread] update failed')
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

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .update({
      unread_count: 0,
    })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) throw new Error('[resetUnread] update failed')
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
    return
  }

  await upsertInboxEntry({
    actorId,
    conversationId,
    defaults: { folder: 'inbox', archived: false, archived_until_new: false },
  })

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .update({
      last_message_id: messageId,
      last_message_at: createdAt,
    })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) throw new Error('[updateInboxLastMessage] update failed')
}

/* ============================================================
   Update inbox flags (pin / mute / archive)
   ============================================================ */

export async function updateInboxFlags({
  actorId,
  conversationId,
  flags = {},
}) {
  if (!actorId || !conversationId) {
    throw new Error('[updateInboxFlags] missing params')
  }

  if (Object.keys(flags).length === 0) return

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .update(flags)
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) throw new Error('[updateInboxFlags] update failed')
}

/* ============================================================
   Archive conversation for actor
   ============================================================ */

export async function archiveConversationForActor({
  actorId,
  conversationId,
  untilNew = true,
}) {
  if (!actorId || !conversationId) {
    throw new Error('[archiveConversationForActor] missing params')
  }

  await upsertInboxEntry({
    actorId,
    conversationId,
    defaults: { folder: 'inbox', archived: false, archived_until_new: false },
  })

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .update({
      archived: true,
      folder: 'archived',
      archived_until_new: untilNew,
      unread_count: 0,
    })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) throw new Error('[archiveConversationForActor] update failed')
}

/* ============================================================
   Folder moves (spam / inbox / requests / archived)
   ============================================================ */

export async function moveConversationToFolder({
  actorId,
  conversationId,
  folder,
}) {
  if (!actorId || !conversationId || !folder) {
    throw new Error('[moveConversationToFolder] missing params')
  }

  const patch = { folder }

  if (folder === 'archived') {
    patch.archived = true
    patch.archived_until_new = false
    patch.unread_count = 0
  } else {
    patch.archived = false
    patch.archived_until_new = false
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .upsert(
      {
        actor_id: actorId,
        conversation_id: conversationId,
        ...patch,
      },
      {
        onConflict: 'conversation_id,actor_id',
      }
    )

  if (error) throw new Error('[moveConversationToFolder] update failed')
}
