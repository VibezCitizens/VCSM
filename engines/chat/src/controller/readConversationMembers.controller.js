// src/controller/readConversationMembers.controller.js

import { getActorSummariesByIds } from '../config.js'
import {
  collectConversationMemberActorIdsNeedingFallback,
  hydrateConversationMemberRows,
} from '../model/lib/memberActorPresentation.js'
import { ConversationMemberModel } from '../model/ConversationMember.model.js'
import {
  getConversationMembersDAL,
  getConversationMemberDAL,
} from '../dal/conversationMembers.read.dal.js'

async function hydrateMemberActors(rows) {
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return list

  const actorIds = collectConversationMemberActorIdsNeedingFallback(list)
  if (!actorIds.length) return list

  const { rows: summaryRows, error } = await getActorSummariesByIds({
    actorIds,
  })

  if (error || !summaryRows?.length) return list
  return hydrateConversationMemberRows(list, summaryRows)
}

export async function readConversationMembersController({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[readConversationMembersController] missing params')
  }

  const [membersRaw, meRaw] = await Promise.all([
    getConversationMembersDAL({ conversationId }),
    getConversationMemberDAL({ conversationId, actorId }),
  ])

  const [membersHydrated, meHydrated] = await Promise.all([
    hydrateMemberActors(membersRaw ?? []),
    hydrateMemberActors(meRaw ? [meRaw] : []),
  ])

  if (!meRaw || meRaw.membership_status !== 'active') {
    throw new Error('[readConversationMembersController] actor may not read this conversation')
  }

  return {
    members: (membersHydrated ?? [])
      .map(ConversationMemberModel)
      .filter(Boolean),
    me: meHydrated?.[0] ? ConversationMemberModel(meHydrated[0]) : null,
  }
}
