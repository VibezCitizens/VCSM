// platform/services/notificationService.js
// ============================================================
// Notification Service — Platform Service Layer (Stub)
// ============================================================
// Stable API for notification orchestration.
//
// Currently a stub defining the target API shape.
// Implementation will wrap engines/notifications once the app
// migrates from legacy vc.notifications to engine notification.* schema.
//
// Consumers: apps/VCSM, apps/wentrex (future)
// Dependencies: engines/notifications (future wiring)
// ============================================================

/**
 * Publish a notification event to the platform notification pipeline.
 *
 * Future implementation: delegates to engines/notifications publishEvent
 * with platform-level recipient resolution and preference evaluation.
 *
 * @param {Object} options
 * @param {string} options.eventType — notification event identifier
 * @param {string} options.actorId — actor who triggered the event
 * @param {Object} options.payload — event-specific data
 * @param {Object} [options.recipientOverrides] — explicit recipient targeting
 * @returns {Promise<{ delivered: boolean, recipientCount: number }>}
 */
export async function publishNotification(_options) {
  throw new Error('[PSL] notificationService.publishNotification is not yet implemented')
}

/**
 * Get unread notification summary for an actor.
 *
 * Future implementation: wraps countUnread from engines/notifications
 * with platform-level caching.
 *
 * @param {Object} options
 * @param {string} options.actorId
 * @returns {Promise<{ total: number, byChannel: Record<string, number> }>}
 */
export async function getUnreadSummary(_options) {
  throw new Error('[PSL] notificationService.getUnreadSummary is not yet implemented')
}

/**
 * Get inbox notifications for an actor (paginated).
 *
 * Future implementation: wraps getInboxNotifications from engines/notifications.
 *
 * @param {Object} options
 * @param {string} options.actorId
 * @param {number} [options.limit]
 * @param {string} [options.cursor]
 * @returns {Promise<{ items: Array, nextCursor: string|null }>}
 */
export async function getInbox(_options) {
  throw new Error('[PSL] notificationService.getInbox is not yet implemented')
}

/**
 * Mark notifications as read.
 *
 * @param {Object} options
 * @param {string} options.actorId
 * @param {string[]} options.notificationIds
 * @returns {Promise<{ updated: number }>}
 */
export async function markRead(_options) {
  throw new Error('[PSL] notificationService.markRead is not yet implemented')
}

/**
 * Dismiss notifications.
 *
 * @param {Object} options
 * @param {string} options.actorId
 * @param {string[]} options.notificationIds
 * @returns {Promise<{ dismissed: number }>}
 */
export async function dismiss(_options) {
  throw new Error('[PSL] notificationService.dismiss is not yet implemented')
}
