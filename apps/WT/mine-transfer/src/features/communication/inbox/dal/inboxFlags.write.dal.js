// src/features/communication/inbox/dal/inboxFlags.write.dal.js
// ============================================================
// Inbox WRITE DAL — flag updates (pin / mute / archive)
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'
import { upsertInboxEntry } from './inboxUpsert.write.dal'

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

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      archived: true,
      folder: 'archived',
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
    .upsert(
      {
        actor_id: actorId,
        conversation_id: conversationId,
        folder,
      },
      {
        onConflict: 'conversation_id,actor_id',
      }
    )

  if (error) {
    console.error(error)
    throw new Error('[moveConversationToFolder] update failed')
  }
}
