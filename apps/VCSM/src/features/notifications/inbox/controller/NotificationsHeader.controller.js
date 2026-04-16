// Migrated from legacy vc.notifications DAL to notification engine.
import { countUnread, getInboxNotifications } from '@notifications'

export async function loadNotificationHeader(actorId) {
  if (!actorId) return { unreadCount: 0 }

  try {
    const unreadCount = await countUnread({ recipientActorId: actorId })
    return { unreadCount }
  } catch {
    return { unreadCount: 0 }
  }
}

export async function markAllNotificationsSeen(actorId) {
  if (!actorId) return

  try {
    // Fetch first page with autoMarkSeen — engine marks all fetched items as seen
    await getInboxNotifications({
      recipientActorId: actorId,
      limit: 50,
      autoMarkSeen: true,
    })
  } catch {
    // Silently fail — badge will still refresh via polling
  }

  window.dispatchEvent(new Event('noti:refresh'))
}
