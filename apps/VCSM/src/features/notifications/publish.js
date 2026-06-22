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
import { supabase } from '@/services/supabase/supabaseClient'
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring'

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

  // Session guard: reject publish without an authenticated session.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  // Actor identity guard (ELEK-2026-06-07-B003): verify the caller-supplied actorId
  // is owned by the authenticated session user. Prevents actor impersonation at the
  // app layer — the DB trigger (TICKET-ARCH-NOTI-SESSION-001) remains the backstop.
  if (actorId) {
    const { data: ownerLink } = await supabase
      .schema('vc')
      .from('actor_owners')
      .select('actor_id')
      .eq('user_id', session.user.id)
      .eq('actor_id', actorId)
      .maybeSingle()
    if (!ownerLink) return false
  }

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
    captureVcsmError(err, 'publishVcsmNotification')

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

  // Session guard — same requirement as publishVcsmNotification.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  // Actor identity guard — verify actorId belongs to session user (ELEK-2026-06-07-B003).
  if (actorId) {
    const { data: ownerLink } = await supabase
      .schema('vc')
      .from('actor_owners')
      .select('actor_id')
      .eq('user_id', session.user.id)
      .eq('actor_id', actorId)
      .maybeSingle()
    if (!ownerLink) return false
  }

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
  } catch (err) {
    captureVcsmError(err, 'publishVcsmNotificationBatch')

    if (import.meta.env.DEV) {
      console.error('[publishVcsmNotificationBatch] failed:', err)
    }

    return false
  }
}
