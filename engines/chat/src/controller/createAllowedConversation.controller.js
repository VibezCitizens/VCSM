import { EVENTS } from '../events.js'
import { publishDomainEvent } from '../services/domainEventService.js'
import { materializeConversationFromPolicyDecision } from '../services/conversationLifecycleService.js'
import { resolveConversationPolicy } from '../services/conversationPolicyService.js'

export async function createAllowedConversationController(params) {
  const { actorId, realmId } = params ?? {}

  if (!actorId || !realmId) {
    throw new Error('[createAllowedConversation] actorId and realmId are required')
  }

  const { decision } = await resolveConversationPolicy({
    request: params,
  })

  if (!decision.allowed) {
    throw new Error(
      decision.errorMessage ??
      '[createAllowedConversation] conversation not permitted'
    )
  }

  const { conversationId, usedDirectResolver } =
    await materializeConversationFromPolicyDecision({
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
      reason: decision.reason,
      memberActorIds: decision.members.map((member) => member.actorId),
      usedDirectResolver,
    },
  })

  return {
    conversationId,
    policy: decision,
  }
}
