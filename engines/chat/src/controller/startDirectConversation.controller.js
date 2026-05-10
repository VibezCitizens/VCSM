import { getOrCreateDirectConversation } from './getOrCreateDirectConversation.controller.js'
import { resolvePickedActor } from './resolvePickedToActorId.controller.js'
import { readActorRealmContextDAL } from '../dal/actorRealm.read.dal.js'
import { listUserBlockRowsBetweenActorsDAL } from '../dal/blockRelations.read.dal.js'
import { openConversation } from '../dal/openConversation.rpc.js'
import { resolveRealm, isUuid } from '../config.js'
import { EVENTS } from '../events.js'
import { publishDomainEvent } from '../services/domainEventService.js'

async function resolveChatRealmId({ fromActorId, realmId }) {
  if (isUuid(realmId)) return realmId

  try {
    const actor = await readActorRealmContextDAL({ actorId: fromActorId })
    if (actor) {
      return resolveRealm(Boolean(actor.is_void))
    }
  } catch {
    // Fallback below.
  }

  return resolveRealm(false)
}

export async function startDirectConversation({
  fromActorId,
  realmId,
  picked,
}) {
  if (!fromActorId) throw new Error('Missing fromActorId')
  if (!picked) throw new Error('Missing picked')

  if (picked.actorId && picked.actorId.length !== 36) {
    throw new Error('[chat/start] Invalid actorId passed into chat boundary')
  }

  const toActorId = await resolvePickedActor(picked)
  if (!toActorId) throw new Error('Failed to resolve target actor')
  if (!isUuid(toActorId)) {
    throw new Error('[chat/start] target actor id is invalid')
  }

  const effectiveRealmId = await resolveChatRealmId({ fromActorId, realmId })

  const isBlocked =
    (await listUserBlockRowsBetweenActorsDAL({
      actorA: fromActorId,
      actorB: toActorId,
    })).length > 0
  if (isBlocked) {
    throw new Error('[chat/start] blocked relationship - cannot start conversation')
  }

  const { conversationId } = await getOrCreateDirectConversation({
    fromActorId,
    toActorId,
    realmId: effectiveRealmId,
  })

  const opened = await openConversation({
    conversationId,
    actorId: fromActorId,
  })

  await publishDomainEvent({
    eventName: EVENTS.CONVERSATION_CREATED,
    aggregateType: 'conversation',
    aggregateId: conversationId,
    conversationId,
    payload: {
      conversationId,
      fromActorId,
      toActorId,
      conversationKind: 'direct',
    },
  })

  return { conversationId }
}
