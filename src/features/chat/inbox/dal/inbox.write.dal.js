// src/features/chat/inbox/dal/inbox.write.dal.js
// ============================================================
// Inbox — WRITE DAL
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Writes only to vc.inbox_entries
// - Business rules live in controllers / triggers
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

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

/**
 * Increment unread count for an inbox entry.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.conversationId
 * @param {number} [params.by=1]
 */
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

/**
 * Reset unread count to zero.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.conversationId
 */
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

/**
 * Update last message info for inbox entry.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.conversationId
 * @param {string} params.messageId
 * @param {string} params.createdAt
 */
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

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      last_message_id: messageId,
      last_message_at: createdAt,
      archived: false,
      archived_until_new: false,
    })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[updateInboxLastMessage] update failed')
  }
}

/* ============================================================
   Update inbox flags (pin / mute / archive)
   ============================================================ */

/**
 * Update inbox flags.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.conversationId
 * @param {Object} params.flags
 * @param {boolean} [params.flags.pinned]
 * @param {boolean} [params.flags.muted]
 * @param {boolean} [params.flags.archived]
 * @param {boolean} [params.flags.archived_until_new]
 */
export async function updateInboxFlags({
  actorId,
  conversationId,
  flags = {},
}) {
  if (!actorId || !conversationId) {
    throw new Error('[updateInboxFlags] missing params')
  }

  if (Object.keys(flags).length === 0) return

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update(flags)
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[updateInboxFlags] update failed')
  }
}

/* ============================================================
   Soft-hide conversation (used by leave / archive flows)
   ============================================================ */

/**
 * Archive conversation for actor.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.conversationId
 * @param {boolean} [params.untilNew=true]
 */
export async function archiveConversationForActor({
  actorId,
  conversationId,
  untilNew = true,
}) {
  if (!actorId || !conversationId) {
    throw new Error('[archiveConversationForActor] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      archived: true,
      archived_until_new: untilNew,
      unread_count: 0,
    })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[archiveConversationForActor] update failed')
  }
}

/* ============================================================
   Folder moves (spam / inbox / requests / archived)
   ============================================================ */

/**
 * Move conversation to folder for actor.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.conversationId
 * @param {'inbox'|'spam'|'requests'|'archived'} params.folder
 */
export async function moveConversationToFolder({
  actorId,
  conversationId,
  folder,
}) {
  if (!actorId || !conversationId || !folder) {
    throw new Error('[moveConversationToFolder] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({ folder })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[moveConversationToFolder] update failed')
  }
}
