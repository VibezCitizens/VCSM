// ============================================================
// Notifications Engine — InboxItem Model
// ============================================================

/**
 * Transform a raw DB row from notification.inbox_items into a domain object.
 *
 * @param {Object} row
 * @returns {import('../types/index.js').InboxItem}
 */
export function InboxItemModel(row) {
  return {
    recipientId: row.recipient_id,
    isSeen: row.is_seen ?? false,
    seenAt: row.seen_at ?? null,
    isRead: row.is_read ?? false,
    readAt: row.read_at ?? null,
    isOpened: row.is_opened ?? false,
    openedAt: row.opened_at ?? null,
    isDismissed: row.is_dismissed ?? false,
    dismissedAt: row.dismissed_at ?? null,
    badgeCounted: row.badge_counted ?? true,
    archivedAt: row.archived_at ?? null,
    snoozedUntil: row.snoozed_until ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
