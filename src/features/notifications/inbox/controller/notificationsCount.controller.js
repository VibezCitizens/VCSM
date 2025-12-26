import { countUnreadNotifications } from '../dal/notifications.count.dal'

export async function getUnreadNotificationCount(actorId) {
  if (!actorId) return 0
  return await countUnreadNotifications(actorId)
}
