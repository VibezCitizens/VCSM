// src/features/notifications/inbox/controller/Notifications.controller.js

import { fetchNotificationsPage } from '../dal/notifications.read.dal'
import { dalMarkNotificationsSeen } from '../dal/notifications.dal'
import { loadBlockSets, filterByBlocks } from '../lib/blockFilter'
import { resolveSenders } from '../lib/resolveSenders'
import { mapNotification } from '../model/notification.mapper'
import { resolveInboxActor } from '../lib/resolveInboxActor'

// ============================================================
// DEV DEBUGGER (controller boundary only)
// ============================================================
const DEBUG = import.meta.env.DEV
const log = (...a) => DEBUG && console.log('[NotificationsController]', ...a)

export async function getNotifications(identity) {
  log('start', {
    actorId: identity?.actorId ?? null,
    kind: identity?.kind ?? null,
  })

  const { targetActorId, myActorId } =
    await resolveInboxActor(identity)

  log('resolved actors', { targetActorId, myActorId })

  if (!targetActorId) {
    log('abort: no targetActorId')
    return []
  }

  // ------------------------------------------------------------
  // FETCH RAW NOTIFICATIONS
  // ------------------------------------------------------------
  const raw = await fetchNotificationsPage({
    recipientActorId: targetActorId,
    limit: 20,
  })

  log('raw notifications', raw.length)

  // ------------------------------------------------------------
  // BLOCK FILTERING
  // ------------------------------------------------------------
  const blocks = await loadBlockSets(myActorId)
  log('block sets loaded', blocks)

  const filtered = filterByBlocks(raw, blocks)
  log('after block filter', filtered.length)

  // ------------------------------------------------------------
  // MARK AS SEEN
  // ------------------------------------------------------------
  const unseenIds = filtered
    .filter(n => !n.is_seen)
    .map(n => n.id)

  if (unseenIds.length) {
    await dalMarkNotificationsSeen({
      actorId: targetActorId,
      notificationIds: unseenIds,
    })
  }

  // ------------------------------------------------------------
  // SENDER RESOLUTION
  // ------------------------------------------------------------
  const actorIds = filtered.map(r => r.actor_id)
  log('sender actor ids', actorIds)

  const senderMap = await resolveSenders(actorIds)
  log('senderMap keys', Object.keys(senderMap))

  // ------------------------------------------------------------
  // DOMAIN MAPPING
  // ------------------------------------------------------------
  const mapped = filtered.map(r =>
    mapNotification(r, senderMap)
  )

  log('final notifications', mapped.length)

  return mapped
}
