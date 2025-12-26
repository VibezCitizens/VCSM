// src/features/chat/conversation/controllers/message-actions/getConversationMembers.controller.js
// ============================================================
// getConversationMembers.controller
// ------------------------------------------------------------
// PURPOSE
// ------------------------------------------------------------
// Conversation members READ use-case.
//
// This controller is the sole boundary responsible for
// retrieving conversation membership in a domain-safe way.
//
// Responsibilities:
// - Validate inputs (conversationId, actorId)
// - Orchestrate DAL reads
// - Apply ConversationMember model
// - Return domain-safe data only
//
// Non-responsibilities:
// - UI concerns
// - Realtime subscriptions
// - Permission inference beyond RLS
//
// ARCHITECTURE RULE:
// Controller → DAL → DB
// ============================================================

import {
  getConversationMembersDAL,
  getConversationMemberDAL,
} from '../../dal/read/members.read.dal'

import { ConversationMemberModel }
  from '../../model/ConversationMember.model'

/**
 * Fetch all members of a conversation and the current actor's membership.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 *
 * @returns {Promise<{
 *   members: Array<ConversationMember>,
 *   me: ConversationMember | null
 * }>}
 */
export async function getConversationMembersController({
  conversationId,
  actorId,
}) {
  /* ============================================================
     Input validation
     ============================================================ */
  if (!conversationId || !actorId) {
    throw new Error(
      '[getConversationMembersController] missing conversationId or actorId'
    )
  }

  /* ============================================================
     DAL orchestration (RAW reads only)(R)(R)(R)
     ============================================================ */
  const [membersRaw, meRaw] = await Promise.all([
    getConversationMembersDAL({ conversationId }),
    getConversationMemberDAL({ conversationId, actorId }),
  ])

  /* ============================================================
     Domain mapping
     ============================================================ */
  return {
    members: (membersRaw ?? [])
      .map(ConversationMemberModel)
      .filter(Boolean),

    me: meRaw
      ? ConversationMemberModel(meRaw)
      : null,
  }
}
