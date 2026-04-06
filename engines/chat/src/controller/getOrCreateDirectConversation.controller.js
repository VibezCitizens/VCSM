import { getOrCreateDirectConversationRPC } from '../dal/getOrCreateDirectConversation.rpc.js'

export async function getOrCreateDirectConversation({
  fromActorId,
  toActorId,
  realmId,
}) {
  if (!fromActorId) throw new Error('Missing fromActorId')
  if (!toActorId) throw new Error('Missing toActorId')
  if (!realmId) throw new Error('Missing realmId')
  if (fromActorId === toActorId) {
    throw new Error('Cannot DM self')
  }

  const conversationId = await getOrCreateDirectConversationRPC({
    fromActorId,
    toActorId,
    realmId,
  })

  return { conversationId }
}
