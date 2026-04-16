// Migrated from legacy vc.notifications DAL to notification engine.
import { countUnread } from '@notifications'

export async function getUnreadNotificationCount(actorId) {
  if (!actorId) return 0

  try {
    return await countUnread({ recipientActorId: actorId })
  } catch {
    return 0
  }
}
