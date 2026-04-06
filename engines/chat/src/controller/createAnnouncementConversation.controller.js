import { EVENTS } from '../events.js'
import { publishDomainEvent } from '../services/domainEventService.js'
import { materializeConversationFromPolicyDecision } from '../services/conversationLifecycleService.js'
import { createAnnouncementPolicyDecision } from '../rules/conversationPolicy.rules.js'

export async function createAnnouncementConversationController({
  actorId,
  realmId,
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
  if (!actorId || !realmId) {
    throw new Error('[createAnnouncementConversation] actorId and realmId are required')
  }

  const decision = createAnnouncementPolicyDecision({
    actorId,
    memberActorIds,
    members,
    postingActorIds,
    managerActorIds,
    moderatorActorIds,
    title,
    avatarUrl,
    visibility,
    scopeKind,
    scopeId,
    conversationKind,
  })

  const { conversationId } = await materializeConversationFromPolicyDecision({
    actorId,
    realmId,
    decision,
  })

  await publishDomainEvent({
    eventName: EVENTS.CONVERSATION_CREATED,
    aggregateType: 'conversation',
    aggregateId: conversationId,
    conversationId,
    payload: {
      conversationId,
      createdByActorId: actorId,
      conversationKind: decision.conversationKind,
      accessMode: decision.accessMode,
      visibility: decision.visibility,
      scopeKind: decision.scopeKind,
      scopeId: decision.scopeId,
      announcementPosterActorIds: decision.members
        .filter((member) => member.canPost)
        .map((member) => member.actorId),
      memberActorIds: decision.members.map((member) => member.actorId),
    },
  })

  return {
    conversationId,
    policy: decision,
  }
}
