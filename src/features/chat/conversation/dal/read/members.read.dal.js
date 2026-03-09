// src/features/chat/conversation/dal/read/members.read.dal.js

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

async function hydrateMissingActorPresentation(rows) {
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return list

  const actorIds = [
    ...new Set(
      list
        .filter((row) => actorNeedsFallback(row?.actor))
        .map((row) => row?.actor_id)
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

  return list.map((row) => {
    const actorId = row?.actor_id
    if (!actorId) return row

    const fallback = fallbackByActorId.get(actorId)
    if (!fallback) return row

    return {
      ...row,
      actor: mergeActorPresentation(row?.actor, fallback),
    }
  })
}

export async function getConversationMembersDAL({
  conversationId,
}) {
  if (!conversationId) {
    throw new Error('[getConversationMembersDAL] conversationId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select(`
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
    .eq('conversation_id', conversationId)

  if (error) throw error
  return hydrateMissingActorPresentation(data ?? [])
}

export async function getConversationMemberDAL({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[getConversationMemberDAL] missing params')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select(`
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
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const [hydrated] = await hydrateMissingActorPresentation([data])
  return hydrated ?? data
}
