// src/features/notifications/publish.js
// ============================================================
// VCSM Notification Publisher — App-level adapter
// ============================================================
// Maps the legacy dalInsertNotification shape to the notification
// engine's publishEvent API. This adapter lets controllers migrate
// incrementally without learning the full engine API shape.
//
// Usage:
//   import { publishVcsmNotification } from '@/features/notifications/publish'
//
//   await publishVcsmNotification({
//     recipientActorId,
//     actorId,
//     kind: 'booking_created',
//     objectType: 'booking',
//     objectId: bookingId,
//     linkPath: '/profile/...',
//     context: { ... },
//   })
// ============================================================

import { publishEvent } from '@notifications'

/**
 * Publish a VCSM notification through the notification engine.
 *
 * Accepts the same shape as the legacy dalInsertNotification for
 * easy migration. Maps to engine publishEvent internally.
 *
 * @param {Object} params
 * @param {string} params.recipientActorId — who receives the notification
 * @param {string} [params.actorId] — who triggered the event (source actor)
 * @param {string} params.kind — event key (e.g., 'booking_created')
 * @param {string} [params.objectType] — object type (e.g., 'booking', 'review')
 * @param {string} [params.objectId] — object ID
 * @param {string} [params.linkPath] — navigation path for the notification
 * @param {Object} [params.context] — domain-specific event payload
 * @returns {Promise<boolean>} — true if published successfully
 */
export async function publishVcsmNotification({
  recipientActorId,
  actorId = null,
  kind,
  objectType = null,
  objectId = null,
  linkPath = null,
  context = {},
}) {
  if (!recipientActorId || !kind) return false

  // Skip self-notifications — actor should not notify themselves
  if (actorId && String(actorId) === String(recipientActorId)) return false

  try {
    await publishEvent({
      event: {
        eventKey: kind,
        sourceDomain: 'vc',
        sourceActorId: actorId,
        objectType,
        objectId,
        payload: context,
      },
      recipients: [
        {
          recipientActorId,
          recipientDomain: 'vc',
          recipientKind: 'actor',
          deliveryChannel: 'in_app',
        },
      ],
      renderContext: {
        linkPath,
      },
    })
    return true
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[publishVcsmNotification] failed:', err)
    }
    return false
  }
}

/**
 * Publish notifications to multiple recipients at once.
 * Skips self-notifications per recipient.
 *
 * @param {Object} params — same as publishVcsmNotification but recipientActorIds is an array
 * @returns {Promise<boolean>}
 */
export async function publishVcsmNotificationBatch({
  recipientActorIds,
  actorId = null,
  kind,
  objectType = null,
  objectId = null,
  linkPath = null,
  context = {},
}) {
  const ids = (recipientActorIds || []).filter(Boolean)
  if (!ids.length || !kind) return false

  // Filter out self-notifications
  const recipients = ids
    .filter((rid) => !actorId || String(rid) !== String(actorId))
    .map((rid) => ({ recipientActorId: rid, recipientDomain: 'vc', recipientKind: 'actor', deliveryChannel: 'in_app' }))

  if (!recipients.length) return false

  try {
    await publishEvent({
      event: {
        eventKey: kind,
        sourceDomain: 'vc',
        sourceActorId: actorId,
        objectType,
        objectId,
        payload: context,
      },
      recipients,
      renderContext: {
        linkPath,
      },
    })
    return true
  } catch {
    return false
  }
}
