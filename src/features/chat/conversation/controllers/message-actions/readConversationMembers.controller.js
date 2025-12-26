// src/features/chat/conversation/controllers/message-actions/readConversationMembers.controller.js
// (R)

import {
  getConversationMembersDAL,
  getConversationMemberDAL,
} from '../../dal/read/members.read.dal'

import { ConversationMemberModel }
  from '../../model/ConversationMember.model'

export async function readConversationMembersController({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error(
      '[readConversationMembersController] missing params'
    )
  }

  const [membersRaw, meRaw] = await Promise.all([
    getConversationMembersDAL({ conversationId }),
    getConversationMemberDAL({ conversationId, actorId }),
  ])

  return {
    members: (membersRaw ?? [])
      .map(ConversationMemberModel)
      .filter(Boolean),

    me: meRaw ? ConversationMemberModel(meRaw) : null,
  }
}
