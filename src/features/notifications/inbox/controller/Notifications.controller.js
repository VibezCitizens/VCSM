// src/features/notifications/inbox/controller/Notifications.controller.js

import { fetchNotificationsPage } from '../dal/notifications.read.dal'
import { dalMarkNotificationsSeen } from '../dal/notifications.dal'
import { loadBlockSets, filterByBlocks } from '../lib/blockFilter'
import { resolveSenders } from '../lib/resolveSenders'
import { mapNotification } from '../model/notification.mapper'
import { resolveInboxActor } from '../lib/resolveInboxActor'

export async function getNotifications(identity) {
  const { targetActorId, myActorId } =
    await resolveInboxActor(identity)

  if (!targetActorId) {
    return []
  }

  // ------------------------------------------------------------
  // FETCH RAW NOTIFICATIONS
  // ------------------------------------------------------------
  const raw = await fetchNotificationsPage({
    recipientActorId: targetActorId,
    limit: 20,
  })

  // ------------------------------------------------------------
  // BLOCK FILTERING
  // ------------------------------------------------------------
  const blocks = await loadBlockSets(myActorId)

  const filtered = filterByBlocks(raw, blocks)

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

  const senderMap = await resolveSenders(actorIds)

  // ------------------------------------------------------------
  // DOMAIN MAPPING
  // ------------------------------------------------------------
  const mapped = filtered.map(r =>
    mapNotification(r, senderMap)
  )

  return mapped
}
