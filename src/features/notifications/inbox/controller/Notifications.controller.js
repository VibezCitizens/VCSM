// src/features/notifications/inbox/controller/Notifications.controller.js

import { fetchNotificationsPage } from '../dal/notifications.read.dal'
import { dalMarkNotificationsSeen } from '../dal/notifications.dal'
import { loadBlockSets, filterByBlocks } from '../lib/blockFilter'
import { resolveSenders } from '../lib/resolveSenders'
import { mapNotification } from '../model/notification.mapper'
import { resolveInboxActor } from '../lib/resolveInboxActor'
import { ctrlListIncomingRequests } from '@/features/social/friend/request/controllers/followRequests.controller'

function normalizeNotificationKind(kind) {
  return String(kind || '').toLowerCase().replaceAll('.', '_')
}

function extractRequesterActorId(row) {
  const ctx =
    typeof row?.context === 'object' && row.context !== null
      ? row.context
      : {}

  return (
    ctx?.requesterActorId ??
    ctx?.requester_actor_id ??
    row?.actor_id ??
    null
  )
}

async function filterResolvedFollowRequestRows({ rows, targetActorId }) {
  const safeRows = Array.isArray(rows) ? rows : []
  if (!targetActorId || safeRows.length === 0) return safeRows

  const followRequestRows = safeRows.filter(
    (row) => normalizeNotificationKind(row?.kind) === 'follow_request'
  )
  if (!followRequestRows.length) return safeRows

  try {
    const pendingRows = await ctrlListIncomingRequests({ targetActorId })
    const pendingRequesterIds = new Set(
      (pendingRows ?? [])
        .map((row) => row?.requester_actor_id ?? row?.requesterActorId ?? null)
        .filter(Boolean)
        .map((id) => String(id))
    )

    return safeRows.filter((row) => {
      if (normalizeNotificationKind(row?.kind) !== 'follow_request') return true

      const requesterActorId = extractRequesterActorId(row)
      if (!requesterActorId) return false

      return pendingRequesterIds.has(String(requesterActorId))
    })
  } catch (error) {
    console.error('[Notifications.controller] follow_request filter failed', error)
    return safeRows
  }
}

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

  const visibleRows = await filterResolvedFollowRequestRows({
    rows: filtered,
    targetActorId,
  })

  // ------------------------------------------------------------
  // SENDER RESOLUTION
  // ------------------------------------------------------------
  const actorIds = visibleRows.map(r => r.actor_id)

  const senderMap = await resolveSenders(actorIds)

  // ------------------------------------------------------------
  // DOMAIN MAPPING
  // ------------------------------------------------------------
  const mapped = visibleRows.map(r =>
    mapNotification(r, senderMap)
  )

  return mapped
}
