// src/features/notifications/adapters/notifications.adapter.js
// ============================================================
// Public adapter surface for the notifications feature.
// All external features must import through here — never from
// @/features/notifications/publish directly.
// ============================================================

export {
  publishVcsmNotification,
  publishVcsmNotificationBatch,
} from '@/features/notifications/publish'

export { getUnreadNotificationCount } from '@/features/notifications/inbox/controller/notificationsCount.controller'
