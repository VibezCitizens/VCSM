// src/features/chat/inbox/dal/inbox.read.dal.js
// ============================================================
// Inbox — READ DAL
// ------------------------------------------------------------
// - Actor-based
// - Uses read model vc.inbox_entries
// - Resolves members via conversations → conversation_members
// - Hydrates identity via vc.actor_presentation
// - FK-safe for PostgREST
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

export async function getInboxEntries({
  actorId,
  includeArchived = false,
  folder = 'inbox', // ✅ NEW
}) {
  if (!actorId) {
    throw new Error('[getInboxEntries] actorId required')
  }

  let query = supabase
    .schema('vc')
    .from('inbox_entries')
    .select(`
      conversation_id,
      actor_id,
      last_message_id,
      last_message_at,
      unread_count,
      pinned,
      archived,
      muted,
      archived_until_new,
      history_cutoff_at,
      folder,

      conversation:conversations (
        members:conversation_members (
          actor_id,
          role,
          is_active,
          actor:actor_presentation (
            actor_id,
            kind,
            display_name,
            username,
            photo_url,
            vport_name,
            vport_slug,
            vport_avatar_url
          )
        )
      )
    `)
    .eq('actor_id', actorId)
    .eq('folder', folder) // ✅ NEW

  // ------------------------------------------------------------
  // Visibility rules (semantic correctness)
  // ------------------------------------------------------------
  if (!includeArchived) {
    query = query
      .eq('archived', false)
      .eq('archived_until_new', false)
  }

  const { data, error } = await query
    .order('pinned', { ascending: false })
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[getInboxEntries] error', error)
    throw new Error('[getInboxEntries] query failed')
  }

  return (data || []).map((row) => ({
    ...row,
    members: row.conversation?.members ?? [],
  }))
}

/* ============================================================
   Conversation history cutoff (USED BY MESSAGE CONTROLLER)
   ============================================================ */

/**
 * Fetch history cutoff timestamp for an actor in a conversation.
 * RAW READ ONLY — no semantics here.
 */
export async function getConversationHistoryCutoff({
  actorId,
  conversationId,
}) {
  if (!actorId || !conversationId) {
    throw new Error('[getConversationHistoryCutoff] missing params')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .select('history_cutoff_at')
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)
    .maybeSingle()

  if (error) {
    console.error('[getConversationHistoryCutoff] error', error)
    throw error
  }

  return data?.history_cutoff_at ?? null
}
