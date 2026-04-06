import { CONVERSATION_ACCESS_MODES } from '@chat'

export const WENTREX_CHAT_ACTOR_TYPES = {
  ADMINISTRATION: 'administration',
  STAFF: 'staff',
  PARENT: 'parent',
  STUDENT: 'student',
}

const ROLE_TO_CHAT_ACTOR_TYPE = {
  owner: WENTREX_CHAT_ACTOR_TYPES.ADMINISTRATION,
  admin: WENTREX_CHAT_ACTOR_TYPES.ADMINISTRATION,
  teacher: WENTREX_CHAT_ACTOR_TYPES.STAFF,
  staff: WENTREX_CHAT_ACTOR_TYPES.STAFF,
  parent: WENTREX_CHAT_ACTOR_TYPES.PARENT,
  observer: WENTREX_CHAT_ACTOR_TYPES.PARENT,
  student: WENTREX_CHAT_ACTOR_TYPES.STUDENT,
}

const DIRECT_RULES = [
  {
    key: 'wentrex.administration_to_staff',
    from: WENTREX_CHAT_ACTOR_TYPES.ADMINISTRATION,
    to: new Set([WENTREX_CHAT_ACTOR_TYPES.STAFF]),
  },
  {
    key: 'wentrex.staff_to_parent',
    from: WENTREX_CHAT_ACTOR_TYPES.STAFF,
    to: new Set([WENTREX_CHAT_ACTOR_TYPES.PARENT]),
  },
  {
    key: 'wentrex.student_to_staff',
    from: WENTREX_CHAT_ACTOR_TYPES.STUDENT,
    to: new Set([WENTREX_CHAT_ACTOR_TYPES.STAFF]),
  },
  {
    key: 'wentrex.student_to_parent',
    from: WENTREX_CHAT_ACTOR_TYPES.STUDENT,
    to: new Set([WENTREX_CHAT_ACTOR_TYPES.PARENT]),
  },
]

function normalizeChatActorType(value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  return normalized || null
}

export function resolveWentrexChatActorType({
  chatActorType,
  role,
  roleKeys = [],
} = {}) {
  const explicitType = normalizeChatActorType(chatActorType)
  if (explicitType) return explicitType

  const normalizedRole = normalizeChatActorType(role)
  if (normalizedRole && ROLE_TO_CHAT_ACTOR_TYPE[normalizedRole]) {
    return ROLE_TO_CHAT_ACTOR_TYPE[normalizedRole]
  }

  for (const roleKey of roleKeys ?? []) {
    const normalizedRoleKey = normalizeChatActorType(roleKey)
    if (normalizedRoleKey && ROLE_TO_CHAT_ACTOR_TYPE[normalizedRoleKey]) {
      return ROLE_TO_CHAT_ACTOR_TYPE[normalizedRoleKey]
    }
  }

  return null
}

export function buildWentrexChatParticipant(participant = {}) {
  if (!participant?.actorId) {
    throw new Error('[wentrexMessagingPolicy] actorId required')
  }

  return {
    actorId: participant.actorId,
    chatActorType: resolveWentrexChatActorType({
      chatActorType: participant.chatActorType,
      role: participant.role,
      roleKeys: participant.roleKeys,
    }),
    role: participant.conversationRole ?? participant.role,
    canPost: participant.canPost,
    canManage: participant.canManage,
    canModerate: participant.canModerate,
    metadata: participant.metadata ?? {},
  }
}

function buildStandardMembers({ request, participants }) {
  return [
    {
      actorId: request.initiator.actorId,
      role: 'owner',
      canPost: true,
      canManage: true,
      canModerate: true,
    },
    ...participants.map((participant) => ({
      actorId: participant.actorId,
      role: participant.role ?? 'member',
      canPost: participant.canPost ?? true,
      canManage: participant.canManage ?? false,
      canModerate: participant.canModerate ?? false,
    })),
  ]
}

function buildAnnouncementMembers({ request, participants }) {
  return [
    {
      actorId: request.initiator.actorId,
      role: 'owner',
      canPost: true,
      canManage: true,
      canModerate: true,
    },
    ...participants.map((participant) => ({
      actorId: participant.actorId,
      role: participant.role ?? 'member',
      canPost: participant.canPost ?? false,
      canManage: participant.canManage ?? false,
      canModerate: participant.canModerate ?? false,
    })),
  ]
}

function isValidAnnouncementAudience({ initiatorType, participants }) {
  if (!participants.length) return false

  if (initiatorType === WENTREX_CHAT_ACTOR_TYPES.ADMINISTRATION) {
    return participants.every(
      (participant) =>
        participant.chatActorType === WENTREX_CHAT_ACTOR_TYPES.STAFF
    )
  }

  if (initiatorType === WENTREX_CHAT_ACTOR_TYPES.STAFF) {
    return participants.every(
      (participant) =>
        participant.chatActorType === WENTREX_CHAT_ACTOR_TYPES.PARENT
    )
  }

  return false
}

function findMatchingDirectRule({ initiatorType, participants }) {
  return DIRECT_RULES.find(
    (rule) =>
      rule.from === initiatorType &&
      participants.every((participant) => rule.to.has(participant.chatActorType))
  )
}

export function createWentrexConversationPolicyResolver() {
  return async function resolveConversationPolicy(request) {
    const initiatorType = resolveWentrexChatActorType({
      chatActorType: request?.initiator?.chatActorType,
      role: request?.initiator?.role,
      roleKeys: request?.initiator?.roleKeys,
    })

    const participants = (request?.participants ?? []).map((participant) => ({
      ...participant,
      chatActorType: resolveWentrexChatActorType({
        chatActorType: participant?.chatActorType,
        role: participant?.role,
        roleKeys: participant?.roleKeys,
      }),
    }))

    if (!initiatorType || participants.some((participant) => !participant.chatActorType)) {
      return {
        allowed: false,
        reason: 'wentrex.actor_type_missing',
        errorMessage: 'Wentrex chat rules need actor role facts before opening a conversation.',
      }
    }

    if (request?.requestedAccessMode === CONVERSATION_ACCESS_MODES.ANNOUNCEMENT) {
      if (!isValidAnnouncementAudience({ initiatorType, participants })) {
        return {
          allowed: false,
          reason: 'wentrex.announcement_not_permitted',
          errorMessage: 'This announcement audience is not permitted by Wentrex chat rules.',
        }
      }

      return {
        allowed: true,
        reason: 'wentrex.announcement',
        conversationKind: 'channel',
        accessMode: CONVERSATION_ACCESS_MODES.ANNOUNCEMENT,
        visibility: request.requestedVisibility,
        scopeKind: request.scopeKind,
        scopeId: request.scopeId,
        title: request.title,
        avatarUrl: request.avatarUrl,
        members: buildAnnouncementMembers({ request, participants }),
      }
    }

    const matchingRule = findMatchingDirectRule({
      initiatorType,
      participants,
    })

    if (!matchingRule) {
      return {
        allowed: false,
        reason: 'wentrex.not_permitted',
        errorMessage: 'This sender and participant combination is not permitted by Wentrex chat rules.',
      }
    }

    return {
      allowed: true,
      reason: matchingRule.key,
      conversationKind: participants.length > 1 ? 'group' : 'direct',
      accessMode: CONVERSATION_ACCESS_MODES.STANDARD,
      visibility: request.requestedVisibility,
      scopeKind: request.scopeKind,
      scopeId: request.scopeId,
      title: request.title,
      avatarUrl: request.avatarUrl,
      members: buildStandardMembers({ request, participants }),
    }
  }
}
