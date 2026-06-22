// Migrated from legacy vc.notifications DAL to notification engine.
import { countUnread, countUnreadBatch } from '@notifications'

export async function getUnreadNotificationCount(actorId) {
  if (!actorId) return 0

  try {
    return await countUnread({ recipientActorId: actorId })
  } catch {
    return 0
  }
}

export async function getUnreadNotificationCountBatch(actorIds) {
  if (!Array.isArray(actorIds) || actorIds.length === 0) return {}

  try {
    return await countUnreadBatch({ recipientActorIds: actorIds })
  } catch {
    return Object.fromEntries(actorIds.map((id) => [id, 0]))
  }
}
