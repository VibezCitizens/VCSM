import { CONVERSATION_ROLES } from '../model/constants/conversationRoles.js'
import { getActorRefKey, normalizeActorSource } from '../utils/actorRefs.js'
import {
  CONVERSATION_ACCESS_MODES,
  normalizeConversationAccessMode,
  normalizeConversationKind,
  normalizeConversationMemberAccess,
  normalizeConversationVisibility,
} from './conversationAccess.rules.js'

function normalizeActorType(value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  return normalized || null
}

function dedupeParticipants(participants = []) {
  const seen = new Set()

  return participants.filter((participant) => {
    if (!participant?.actorId) return false

    const key = getActorRefKey({
      actorId: participant.actorId,
      actorSource: participant.actorSource,
    })

    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizeParticipant(participant, fallbackRole = CONVERSATION_ROLES.MEMBER) {
  if (!participant?.actorId) {
    throw new Error('[conversationPolicy] participant actorId required')
  }

  return {
    actorId: participant.actorId,
    actorSource: normalizeActorSource(
      participant.actorSource ??
      participant.actor_source ??
      participant.source
    ),
    chatActorType: normalizeActorType(
      participant.chatActorType ??
        participant.actorType ??
        participant.participantType ??
        participant.roleKey ??
        participant.role
    ),
    role: participant.role ?? fallbackRole,
    membershipStatus: participant.membershipStatus ?? 'active',
    canPost: participant.canPost,
    canManage: participant.canManage,
    canModerate: participant.canModerate,
    metadata: participant.metadata ?? {},
  }
}

function buildDefaultMembers(request) {
  return request.allParticipants.map((participant) => {
    const isInitiator = participant.actorId === request.initiator.actorId
    const role = participant.role ?? (
      isInitiator ? CONVERSATION_ROLES.OWNER : CONVERSATION_ROLES.MEMBER
    )
    const access = normalizeConversationMemberAccess({
      role,
      canPost: participant.canPost,
      canManage: participant.canManage ?? (isInitiator ? true : undefined),
      canModerate: participant.canModerate ?? (isInitiator ? true : undefined),
      accessMode: request.requestedAccessMode,
    })

    return {
      actorId: participant.actorId,
      actorSource: participant.actorSource ?? null,
      role,
      membershipStatus: participant.membershipStatus ?? 'active',
      ...access,
    }
  })
}

export function normalizeConversationPolicyRequest({
  actorId,
  initiator,
  participants = [],
  requestedConversationKind,
  requestedAccessMode = CONVERSATION_ACCESS_MODES.STANDARD,
  requestedVisibility = 'members',
  scope,
  scopeKind,
  scopeId,
  title = null,
  avatarUrl = null,
  metadata = {},
}) {
  if (!actorId) {
    throw new Error('[conversationPolicy] actorId required')
  }

  const normalizedInitiator = normalizeParticipant(
    initiator ?? {
      actorId,
      role: CONVERSATION_ROLES.OWNER,
    },
    CONVERSATION_ROLES.OWNER
  )

  if (normalizedInitiator.actorId !== actorId) {
    throw new Error('[conversationPolicy] initiator must match actorId')
  }

  const normalizedParticipants = dedupeParticipants(
    (participants ?? []).map((participant) =>
      normalizeParticipant(participant, CONVERSATION_ROLES.MEMBER)
    )
  ).filter((participant) => (
    getActorRefKey({
      actorId: participant.actorId,
      actorSource: participant.actorSource,
    }) !== getActorRefKey({
      actorId,
      actorSource: normalizedInitiator.actorSource,
    })
  ))

  if (!normalizedParticipants.length) {
    throw new Error('[conversationPolicy] at least one participant is required')
  }

  const requestedMode = normalizeConversationAccessMode(requestedAccessMode)
  const normalizedScopeKind = scope?.scopeKind ?? scopeKind ?? null
  const normalizedScopeId = scope?.scopeId ?? scopeId ?? null

  const allParticipants = dedupeParticipants([
    normalizedInitiator,
    ...normalizedParticipants,
  ])

  return {
    actorId,
    initiator: normalizedInitiator,
    participants: normalizedParticipants,
    allParticipants,
    requestedAccessMode: requestedMode,
    requestedConversationKind: normalizeConversationKind({
      conversationKind: requestedConversationKind,
      accessMode: requestedMode,
      memberCount: allParticipants.length,
    }),
    requestedVisibility: normalizeConversationVisibility(requestedVisibility),
    scopeKind: normalizedScopeKind,
    scopeId: normalizedScopeId,
    title,
    avatarUrl,
    metadata,
  }
}

export function buildDefaultConversationPolicyDecision(request) {
  return {
    allowed: true,
    reason: 'default.allowed',
    conversationKind: request.requestedConversationKind,
    accessMode: request.requestedAccessMode,
    visibility: request.requestedVisibility,
    scopeKind: request.scopeKind,
    scopeId: request.scopeId,
    title: request.title ?? null,
    avatarUrl: request.avatarUrl ?? null,
    members: buildDefaultMembers(request),
  }
}

export function assertConversationPolicyDecision(decision, request) {
  if (!decision || typeof decision !== 'object') {
    throw new Error('[conversationPolicy] resolver must return an object')
  }

  if (decision.allowed === false) {
    return {
      allowed: false,
      reason: decision.reason ?? 'policy.denied',
      errorMessage:
        decision.errorMessage ??
        decision.message ??
        '[conversationPolicy] conversation not permitted',
    }
  }

  const accessMode = normalizeConversationAccessMode(
    decision.accessMode ?? request.requestedAccessMode
  )

  const rawMembers = Array.isArray(decision.members) && decision.members.length
    ? decision.members
    : buildDefaultMembers(request)

  const members = dedupeParticipants(
    rawMembers.map((member) =>
      normalizeParticipant(
        member,
        member.actorId === request.initiator.actorId
          ? CONVERSATION_ROLES.OWNER
          : CONVERSATION_ROLES.MEMBER
      )
    )
  ).map((member) => {
    const role = member.role ?? (
      member.actorId === request.initiator.actorId
        ? CONVERSATION_ROLES.OWNER
        : CONVERSATION_ROLES.MEMBER
    )

    const access = normalizeConversationMemberAccess({
      role,
      canPost: member.canPost,
      canManage: member.canManage,
      canModerate: member.canModerate,
      accessMode,
    })

    return {
      actorId: member.actorId,
      actorSource: member.actorSource ?? null,
      role,
      membershipStatus: member.membershipStatus ?? 'active',
      ...access,
    }
  })

  const requestActorIds = new Set(
    request.allParticipants.map((participant) =>
      getActorRefKey({
        actorId: participant.actorId,
        actorSource: participant.actorSource,
      })
    )
  )
  const decisionActorIds = new Set(
    members.map((member) =>
      getActorRefKey({
        actorId: member.actorId,
        actorSource: member.actorSource,
      })
    )
  )

  for (const actorId of requestActorIds) {
    if (!decisionActorIds.has(actorId)) {
      throw new Error('[conversationPolicy] resolver must return every requested participant')
    }
  }

  return {
    allowed: true,
    reason: decision.reason ?? 'policy.allowed',
    conversationKind: normalizeConversationKind({
      conversationKind: decision.conversationKind ?? request.requestedConversationKind,
      accessMode,
      memberCount: members.length,
    }),
    accessMode,
    visibility: normalizeConversationVisibility(
      decision.visibility ?? request.requestedVisibility
    ),
    scopeKind: decision.scopeKind ?? request.scopeKind,
    scopeId: decision.scopeId ?? request.scopeId,
    title: decision.title ?? request.title ?? null,
    avatarUrl: decision.avatarUrl ?? request.avatarUrl ?? null,
    members,
    metadata: decision.metadata ?? request.metadata ?? {},
  }
}

export function createAnnouncementPolicyDecision({
  actorId,
  memberActorIds = [],
  members = [],
  postingActorIds = [actorId],
  managerActorIds = [actorId],
  moderatorActorIds = managerActorIds,
  title = null,
  avatarUrl = null,
  visibility = 'members',
  scopeKind = null,
  scopeId = null,
  conversationKind = 'channel',
}) {
  if (!actorId) {
    throw new Error('[announcementPolicy] actorId required')
  }

  const memberInputs = members.length
    ? members.map((member) => ({
        actorId: member.actorId,
        actorSource: member.actorSource ?? null,
        role: member.role,
        membershipStatus: member.membershipStatus,
        canPost: member.canPost,
        canManage: member.canManage,
        canModerate: member.canModerate,
      }))
    : dedupeParticipants([
        { actorId, role: CONVERSATION_ROLES.OWNER },
        ...memberActorIds.map((memberActorId) => ({
          actorId: memberActorId,
          role: memberActorId === actorId
            ? CONVERSATION_ROLES.OWNER
            : CONVERSATION_ROLES.MEMBER,
        })),
      ])

  const memberRows = dedupeParticipants([
    {
      actorId,
      actorSource: null,
      role: CONVERSATION_ROLES.OWNER,
      canPost: postingActorIds.includes(actorId),
      canManage: managerActorIds.includes(actorId),
      canModerate: moderatorActorIds.includes(actorId),
    },
    ...memberInputs,
  ]).map((member) => {
    const role = member.role ?? (
      member.actorId === actorId
        ? CONVERSATION_ROLES.OWNER
        : CONVERSATION_ROLES.MEMBER
    )

    return {
      actorId: member.actorId,
      actorSource: member.actorSource ?? null,
      role,
      membershipStatus: member.membershipStatus ?? 'active',
      ...normalizeConversationMemberAccess({
        role,
        canPost: member.canPost ?? postingActorIds.includes(member.actorId),
        canManage: member.canManage ?? managerActorIds.includes(member.actorId),
        canModerate:
          member.canModerate ?? moderatorActorIds.includes(member.actorId),
        accessMode: CONVERSATION_ACCESS_MODES.ANNOUNCEMENT,
      }),
    }
  })

  return {
    allowed: true,
    reason: 'announcement.created',
    conversationKind: normalizeConversationKind({
      conversationKind,
      accessMode: CONVERSATION_ACCESS_MODES.ANNOUNCEMENT,
      memberCount: memberRows.length,
    }),
    accessMode: CONVERSATION_ACCESS_MODES.ANNOUNCEMENT,
    visibility: normalizeConversationVisibility(visibility),
    scopeKind,
    scopeId,
    title,
    avatarUrl,
    members: memberRows,
  }
}
