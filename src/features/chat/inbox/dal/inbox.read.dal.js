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

function isDeletedMessage(m) {
  if (!m) return false
  // If your select doesn't include deleted_at, this will be undefined.
  // We include it below.
  return !!m.deleted_at
}

async function loadInboxFallbackFromMembership({ actorId }) {
  const { data: memberships, error: membershipError } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select('conversation_id')
    .eq('actor_id', actorId)
    .eq('is_active', true)

  if (membershipError) {
    console.error('[getInboxEntries] fallback memberships error', membershipError)
    return []
  }

  const conversationIds = [...new Set((memberships || []).map((m) => m.conversation_id).filter(Boolean))]
  if (conversationIds.length === 0) return []

  const [{ data: conversations, error: conversationError }, { data: members, error: membersError }] =
    await Promise.all([
      supabase
        .schema('vc')
        .from('conversations')
        .select('id,last_message_id,last_message_at')
        .in('id', conversationIds),
      supabase
        .schema('vc')
        .from('conversation_members')
        .select(`
          conversation_id,
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
        `)
        .in('conversation_id', conversationIds),
    ])

  if (conversationError) {
    console.error('[getInboxEntries] fallback conversations error', conversationError)
    return []
  }
  if (membersError) {
    console.error('[getInboxEntries] fallback members error', membersError)
    return []
  }

  const lastMessageIds = [...new Set((conversations || []).map((c) => c.last_message_id).filter(Boolean))]
  let messageMap = new Map()

  if (lastMessageIds.length > 0) {
    const { data: messages, error: messagesError } = await supabase
      .schema('vc')
      .from('messages')
      .select('id,body,message_type,media_url,created_at,deleted_at')
      .in('id', lastMessageIds)

    if (messagesError) {
      console.error('[getInboxEntries] fallback last messages error', messagesError)
    } else {
      messageMap = new Map((messages || []).map((m) => [m.id, m]))
    }
  }

  const membersByConversation = new Map()
  for (const row of members || []) {
    const key = row.conversation_id
    if (!membersByConversation.has(key)) membersByConversation.set(key, [])
    membersByConversation.get(key).push(row)
  }

  return (conversations || [])
    .map((c) => ({
      conversation_id: c.id,
      actor_id: actorId,
      last_message_id: c.last_message_id ?? null,
      last_message_at: c.last_message_at ?? null,
      unread_count: 0,
      pinned: false,
      archived: false,
      muted: false,
      archived_until_new: false,
      history_cutoff_at: null,
      folder: 'inbox',
      last_message: c.last_message_id ? messageMap.get(c.last_message_id) ?? null : null,
      conversation: {
        members: membersByConversation.get(c.id) ?? [],
      },
      members: membersByConversation.get(c.id) ?? [],
    }))
    .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))
}

async function hasAnyInboxMetadataForActor({ actorId }) {
  const { count, error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .select('conversation_id', { count: 'exact', head: true })
    .eq('actor_id', actorId)

  if (error) {
    console.error('[getInboxEntries] metadata existence check failed', error)
    return false
  }

  return Number(count || 0) > 0
}

export async function getInboxEntries({
  actorId,
  includeArchived = false,
  folder = 'inbox',
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

      last_message:messages!inbox_entries_last_message_id_fkey (
        id,
        body,
        message_type,
        media_url,
        created_at,
        deleted_at
      ),

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
    .eq('folder', folder)

  // ------------------------------------------------------------
  // Visibility rules (semantic correctness)
  // ------------------------------------------------------------
  // Archived flags are inbox-specific visibility controls.
  // Folder screens (spam/requests) should rely on folder value directly.
  if (!includeArchived && folder === 'inbox') {
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

  const rows = (data || []).map((row) => ({
    ...row,
    members: row.conversation?.members ?? [],
  }))

  // Heal path: only when actor truly has no inbox metadata at all.
  // If metadata exists (even archived/requests/spam), do NOT synthesize inbox rows
  // from memberships; doing so resurrects intentionally hidden threads.
  if (rows.length === 0 && folder === 'inbox') {
    const hasInboxMetadata = await hasAnyInboxMetadataForActor({ actorId })
    if (!hasInboxMetadata) {
      return loadInboxFallbackFromMembership({ actorId })
    }
  }

  // If last_message is deleted OR missing, backfill from messages table
  const convoIdsNeedingBackfill = []
  for (const row of rows) {
    if (isDeletedMessage(row.last_message) || !row.last_message_id) {
      convoIdsNeedingBackfill.push(row.conversation_id)
      row.last_message = null
      row.last_message_id = null
    }
  }

  if (convoIdsNeedingBackfill.length > 0) {
    const uniqueConversationIds = [...new Set(convoIdsNeedingBackfill)]
    const limit = Math.min(uniqueConversationIds.length * 50, 1000)

    const { data: recentMessages, error: msgErr } = await supabase
      .schema('vc')
      .from('messages')
      .select('id, conversation_id, body, message_type, media_url, created_at, deleted_at')
      .in('conversation_id', uniqueConversationIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (msgErr) {
      console.error('[getInboxEntries] backfill messages error', msgErr)
      return rows
    }

    const newestByConversation = new Map()
    for (const m of recentMessages || []) {
      if (!newestByConversation.has(m.conversation_id)) {
        newestByConversation.set(m.conversation_id, m)
      }
    }

    for (const row of rows) {
      if (!row.last_message && uniqueConversationIds.includes(row.conversation_id)) {
        const m = newestByConversation.get(row.conversation_id) || null
        if (m) {
          row.last_message = m
          row.last_message_id = m.id
        }
      }
    }
  }

  return rows
}

/* ============================================================
   Conversation history cutoff (USED BY MESSAGE CONTROLLER)
   ============================================================ */

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
