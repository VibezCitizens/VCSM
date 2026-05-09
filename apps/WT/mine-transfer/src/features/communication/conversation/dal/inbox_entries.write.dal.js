// src/features/chat/conversation/dal/inbox_entries.write.dal.js
// ============================================================
// inbox_entries.write.dal (COMPAT SHIM)
// ------------------------------------------------------------
// - Preserves legacy imports and call signatures
// - Accepts both:
//     { lastMessageId, lastMessageAt, unreadCount }   (preferred)
//   and
//     { messageId, createdAt }                        (legacy)
// - NEVER writes undefined into last_message_*
// - Upserts to ensure row exists (update() no-op otherwise)
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

async function ensureInboxEntry({ actorId, conversationId, defaults = {} }) {
  if (!actorId || !conversationId) return

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .upsert(
      {
        actor_id: actorId,
        conversation_id: conversationId,
        ...defaults,
      },
      { onConflict: 'conversation_id,actor_id' }
    )

  if (error) throw error
}

/**
 * Reset unread count for a conversation + actor.
 */
export async function resetInboxUnread({ conversationId, actorId }) {
  await ensureInboxEntry({
    actorId,
    conversationId,
    defaults: { folder: 'inbox', archived: false, archived_until_new: false },
  })

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({ unread_count: 0 })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}

/**
 * Archive a conversation for an actor.
 * Folder-first model.
 */
export async function archiveInboxEntry({ conversationId, actorId }) {
  await ensureInboxEntry({
    actorId,
    conversationId,
    defaults: { folder: 'inbox', archived: false, archived_until_new: false },
  })

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      folder: 'archived',
      archived: true,
      archived_until_new: true,
      unread_count: 0,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}

/**
 * Unarchive a conversation for an actor.
 */
export async function unarchiveInboxEntry({ conversationId, actorId }) {
  await ensureInboxEntry({
    actorId,
    conversationId,
    defaults: { folder: 'inbox', archived: false, archived_until_new: false },
  })

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      folder: 'inbox',
      archived: false,
      archived_until_new: false,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}

/**
 * Bump inbox state after a message is sent.
 *
 * Preferred signature:
 *   bumpInboxAfterSend({ lastMessageId, lastMessageAt, unreadCount })
 *
 * Legacy signature:
 *   bumpInboxAfterSend({ messageId, createdAt })
 */
export async function bumpInboxAfterSend({
  conversationId,
  actorId,

  // preferred
  lastMessageId,
  lastMessageAt,
  unreadCount,

  // legacy aliases
  messageId,
  createdAt,
}) {
  await ensureInboxEntry({
    actorId,
    conversationId,
    defaults: { folder: 'inbox', archived: false, archived_until_new: false },
  })

  const finalLastMessageId = lastMessageId ?? messageId ?? null
  const finalLastMessageAt = lastMessageAt ?? createdAt ?? null

  // IMPORTANT:
  // - do not write undefined
  // - do not overwrite unread unless a number is provided
  const patch = {
    folder: 'inbox',
    archived: false,
    archived_until_new: false,

    ...(finalLastMessageId ? { last_message_id: finalLastMessageId } : {}),
    ...(finalLastMessageAt ? { last_message_at: finalLastMessageAt } : {}),
    ...(typeof unreadCount === 'number' ? { unread_count: unreadCount } : {}),
  }

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update(patch)
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}
