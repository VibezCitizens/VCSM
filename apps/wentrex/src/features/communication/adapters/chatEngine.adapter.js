import {
  CONVERSATION_ACCESS_MODES,
  createAllowedConversation,
  createAnnouncementConversation,
  evaluateConversationPolicy,
} from '@chat'
import { buildWentrexChatParticipant } from '@/features/communication/policy/wentrexMessagingPolicy'

function buildInitiator({ actorId, actorRoleKeys = [], actorType = null }) {
  return buildWentrexChatParticipant({
    actorId,
    chatActorType: actorType,
    roleKeys: actorRoleKeys,
    role: 'owner',
    conversationRole: 'owner',
  })
}

function buildParticipants(participants = []) {
  return (participants ?? []).map((participant) =>
    buildWentrexChatParticipant(participant)
  )
}

export async function evaluateWentrexMessagingPermission({
  actorId,
  actorRoleKeys = [],
  actorType = null,
  participants = [],
  requestedConversationKind = 'direct',
  requestedAccessMode = CONVERSATION_ACCESS_MODES.STANDARD,
  requestedVisibility = 'members',
  scopeKind = null,
  scopeId = null,
  title = null,
  avatarUrl = null,
  metadata = {},
}) {
  return evaluateConversationPolicy({
    actorId,
    initiator: buildInitiator({
      actorId,
      actorRoleKeys,
      actorType,
    }),
    participants: buildParticipants(participants),
    requestedConversationKind,
    requestedAccessMode,
    requestedVisibility,
    scopeKind,
    scopeId,
    title,
    avatarUrl,
    metadata,
  })
}

export async function createWentrexConversation({
  actorId,
  realmId,
  actorRoleKeys = [],
  actorType = null,
  participants = [],
  requestedConversationKind = 'direct',
  requestedVisibility = 'members',
  scopeKind = null,
  scopeId = null,
  title = null,
  avatarUrl = null,
  metadata = {},
}) {
  return createAllowedConversation({
    actorId,
    realmId,
    initiator: buildInitiator({
      actorId,
      actorRoleKeys,
      actorType,
    }),
    participants: buildParticipants(participants),
    requestedConversationKind,
    requestedAccessMode: CONVERSATION_ACCESS_MODES.STANDARD,
    requestedVisibility,
    scopeKind,
    scopeId,
    title,
    avatarUrl,
    metadata,
  })
}

export async function createWentrexAnnouncementConversation({
  actorId,
  realmId,
  actorRoleKeys = [],
  actorType = null,
  participants = [],
  requestedVisibility = 'members',
  scopeKind = null,
  scopeId = null,
  title = null,
  avatarUrl = null,
  metadata = {},
}) {
  const policy = await evaluateWentrexMessagingPermission({
    actorId,
    actorRoleKeys,
    actorType,
    participants,
    requestedConversationKind: 'channel',
    requestedAccessMode: CONVERSATION_ACCESS_MODES.ANNOUNCEMENT,
    requestedVisibility,
    scopeKind,
    scopeId,
    title,
    avatarUrl,
    metadata,
  })

  if (!policy?.allowed) {
    throw new Error(
      policy?.errorMessage ??
      'This announcement is not permitted by Wentrex chat rules.'
    )
  }

  return createAnnouncementConversation({
    actorId,
    realmId,
    title,
    avatarUrl,
    visibility: policy.visibility,
    scopeKind: policy.scopeKind,
    scopeId: policy.scopeId,
    conversationKind: policy.conversationKind,
    members: policy.members,
  })
}
