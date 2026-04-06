import { countUnreadNotifications } from "@/features/notifications/inbox/dal/notifications.count.dal";
import { markAllNotificationsSeenDAL } from "@/features/notifications/inbox/dal/notifications.write.dal";

export async function loadNotificationHeader(actorId) {
  return {
    unreadCount: await countUnreadNotifications(actorId),
  };
}

export async function markAllNotificationsSeen(actorId) {
  await markAllNotificationsSeenDAL(actorId);
}
