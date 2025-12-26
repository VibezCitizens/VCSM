// inboxUnread.controller.js
import { fetchInboxUnreadCounts } from '../dal/inboxUnreadCount.dal';

export async function getInboxUnreadBadgeCount(actorId) {
  if (!actorId) return 0;

  const rows = await fetchInboxUnreadCounts(actorId);
  return rows.reduce((sum, r) => sum + (r?.unread_count || 0), 0);
}
