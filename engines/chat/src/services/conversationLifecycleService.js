import { getOrCreateDirectConversationRPC } from '../dal/getOrCreateDirectConversation.rpc.js'
import {
  createConversation,
  updateConversationConfiguration,
} from '../dal/conversations.write.dal.js'
import { upsertConversationMembershipDAL } from '../dal/conversationMembership.write.dal.js'
import { upsertInboxEntry } from '../dal/inbox.write.dal.js'
import { CONVERSATION_ACCESS_MODES } from '../rules/conversationAccess.rules.js'

async function syncConversationMembers({ conversationId, members = [] }) {
  await Promise.all(
    members.map((member) =>
      upsertConversationMembershipDAL({
        conversationId,
        actorId: member.actorId,
        role: member.role,
        membershipStatus: member.membershipStatus ?? 'active',
        canPost: member.canPost !== false,
        canManage: Boolean(member.canManage),
        canModerate: Boolean(member.canModerate),
      })
    )
  )
}

async function seedConversationInbox({ conversationId, members = [] }) {
  await Promise.all(
    members
      .filter((member) => (member.membershipStatus ?? 'active') === 'active')
      .map((member) =>
        upsertInboxEntry({
          actorId: member.actorId,
          conversationId,
          defaults: {
            folder: 'inbox',
            unread_count: 0,
            archived: false,
            archived_until_new: false,
          },
        })
      )
  )
}

function shouldUseOneToOneConversation(decision) {
  return (
    decision?.conversationKind === 'direct' &&
    decision?.accessMode !== CONVERSATION_ACCESS_MODES.ANNOUNCEMENT &&
    Array.isArray(decision?.members) &&
    decision.members.length === 2
  )
}

export async function materializeConversationFromPolicyDecision({
  actorId,
  realmId,
  decision,
}) {
  if (!actorId || !realmId) {
    throw new Error('[materializeConversationFromPolicyDecision] missing params')
  }

  if (!decision?.allowed) {
    throw new Error('[materializeConversationFromPolicyDecision] policy denied')
  }

  let conversationId = null
  let usedDirectResolver = false

  if (shouldUseOneToOneConversation(decision)) {
    const counterpart = decision.members.find((member) => member.actorId !== actorId)

    if (!counterpart?.actorId) {
      throw new Error('[materializeConversationFromPolicyDecision] direct conversations need a counterpart')
    }

    conversationId = await getOrCreateDirectConversationRPC({
      fromActorId: actorId,
      toActorId: counterpart.actorId,
      realmId,
    })

    usedDirectResolver = true

    await updateConversationConfiguration({
      conversationId,
      conversationKind: decision.conversationKind,
      accessMode: decision.accessMode,
      visibility: decision.visibility,
      scopeKind: decision.scopeKind,
      scopeId: decision.scopeId,
      title: decision.title,
      avatarUrl: decision.avatarUrl,
    })
  } else {
    const { id } = await createConversation({
      isGroup: decision.conversationKind !== 'direct',
      conversationKind: decision.conversationKind,
      accessMode: decision.accessMode,
      visibility: decision.visibility,
      scopeKind: decision.scopeKind,
      scopeId: decision.scopeId,
      createdByActorId: actorId,
      realmId,
      title: decision.title,
      avatarUrl: decision.avatarUrl,
    })

    conversationId = id
  }

  await syncConversationMembers({
    conversationId,
    members: decision.members,
  })

  await seedConversationInbox({
    conversationId,
    members: decision.members,
  })

  return {
    conversationId,
    usedDirectResolver,
  }
}
