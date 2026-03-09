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
import { getActorSummariesByIdsDAL } from '@/features/actors/dal/getActorSummariesByIds.dal'

function mapActorSummaryRow(summary) {
  const actorId = summary?.actor_id ?? summary?.actorId ?? summary?.id ?? null
  if (!actorId) return null

  const kind = String(summary?.kind ?? '').toLowerCase() || null
  const displayName = summary?.display_name ?? summary?.displayName ?? null
  const username = summary?.username ?? null
  const photoUrl = summary?.photo_url ?? summary?.photoUrl ?? null
  const vportName = summary?.vport_name ?? summary?.vportName ?? displayName ?? null
  const vportSlug = summary?.vport_slug ?? summary?.vportSlug ?? summary?.slug ?? null
  const vportAvatarUrl =
    summary?.vport_avatar_url ?? summary?.vportAvatarUrl ?? photoUrl ?? null

  if (kind === 'vport') {
    return {
      actor_id: actorId,
      kind: 'vport',
      display_name: displayName ?? vportName,
      username: username ?? vportSlug,
      photo_url: photoUrl ?? vportAvatarUrl,
      vport_name: vportName ?? displayName,
      vport_slug: vportSlug ?? username,
      vport_avatar_url: vportAvatarUrl ?? photoUrl,
    }
  }

  return {
    actor_id: actorId,
    kind: kind ?? 'user',
    display_name: displayName,
    username,
    photo_url: photoUrl,
    vport_name: vportName,
    vport_slug: vportSlug,
    vport_avatar_url: vportAvatarUrl,
  }
}

function actorNeedsFallback(actor) {
  if (!actor) return true

  const kind = String(actor?.kind ?? '').toLowerCase()
  if (kind === 'vport') {
    return !(
      actor?.vport_name ||
      actor?.display_name ||
      actor?.vport_slug ||
      actor?.username ||
      actor?.vport_avatar_url ||
      actor?.photo_url
    )
  }

  return !(actor?.display_name || actor?.username || actor?.photo_url)
}

function mergeActorPresentation(actor, fallback) {
  const current = actor ?? {}
  return {
    actor_id: current?.actor_id ?? fallback?.actor_id ?? null,
    kind: current?.kind ?? fallback?.kind ?? null,
    display_name: current?.display_name ?? fallback?.display_name ?? null,
    username: current?.username ?? fallback?.username ?? null,
    photo_url: current?.photo_url ?? fallback?.photo_url ?? null,
    vport_name: current?.vport_name ?? fallback?.vport_name ?? null,
    vport_slug: current?.vport_slug ?? fallback?.vport_slug ?? null,
    vport_avatar_url: current?.vport_avatar_url ?? fallback?.vport_avatar_url ?? null,
  }
}

async function hydrateMissingMemberActorPresentation(memberRows) {
  const list = Array.isArray(memberRows) ? memberRows : []
  if (!list.length) return list

  const actorIds = [
    ...new Set(
      list
        .filter((member) => actorNeedsFallback(member?.actor))
        .map((member) => member?.actor_id)
        .filter(Boolean)
    ),
  ]

  if (!actorIds.length) return list

  const { rows: summaryRows, error } = await getActorSummariesByIdsDAL({ actorIds })
  if (error || !summaryRows?.length) return list

  const fallbackByActorId = new Map(
    summaryRows
      .map(mapActorSummaryRow)
      .filter(Boolean)
      .map((row) => [row.actor_id, row])
  )

  return list.map((member) => {
    const actorId = member?.actor_id
    if (!actorId) return member

    const fallback = fallbackByActorId.get(actorId)
    if (!fallback) return member

    return {
      ...member,
      actor: mergeActorPresentation(member?.actor, fallback),
    }
  })
}

async function hydrateInboxRowsMemberActors(rows) {
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return list

  const allMembers = list.flatMap((row) =>
    Array.isArray(row?.members) ? row.members : []
  )
  if (!allMembers.length) return list

  const hydratedMembers = await hydrateMissingMemberActorPresentation(allMembers)
  const byActorAndRole = new Map(
    hydratedMembers.map((member) => [
      `${member?.actor_id ?? ''}:${member?.role ?? ''}:${member?.is_active ? '1' : '0'}`,
      member,
    ])
  )

  return list.map((row) => {
    const members = Array.isArray(row?.members)
      ? row.members.map((member) => {
          const key = `${member?.actor_id ?? ''}:${member?.role ?? ''}:${member?.is_active ? '1' : '0'}`
          return byActorAndRole.get(key) ?? member
        })
      : []

    return {
      ...row,
      members,
      conversation: row?.conversation
        ? {
            ...row.conversation,
            members,
          }
        : row?.conversation,
    }
  })
}

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

  const rows = (conversations || [])
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

  return hydrateInboxRowsMemberActors(rows)
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

  return hydrateInboxRowsMemberActors(rows)
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
