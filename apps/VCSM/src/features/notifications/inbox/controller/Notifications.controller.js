// src/features/notifications/inbox/controller/Notifications.controller.js

import { getInboxNotifications } from '@notifications'
import { loadBlockSets, filterByBlocks } from '../lib/blockFilter'
import { resolveSenders } from '../lib/resolveSenders'
import { mapNotification } from '../model/notification.mapper'
import { resolveInboxActor } from '../lib/resolveInboxActor'
import { ctrlListIncomingRequests } from '@/features/social/friend/request/controllers/followRequests.controller'

function normalizeNotificationKind(kind) {
  return String(kind || '').toLowerCase().replaceAll('.', '_')
}

function extractRequesterActorId(row) {
  const payload =
    typeof row?.payload === 'object' && row.payload !== null
      ? row.payload
      : {}

  return (
    payload?.requesterActorId ??
    payload?.requester_actor_id ??
    row?.sourceActorId ??
    null
  )
}

async function filterResolvedFollowRequestRows({ rows, targetActorId }) {
  const safeRows = Array.isArray(rows) ? rows : []
  if (!targetActorId || safeRows.length === 0) return safeRows

  const followRequestRows = safeRows.filter(
    (row) => normalizeNotificationKind(row?.eventKey) === 'follow_request'
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
      if (normalizeNotificationKind(row?.eventKey) !== 'follow_request') return true

      const requesterActorId = extractRequesterActorId(row)
      if (!requesterActorId) return false

      return pendingRequesterIds.has(String(requesterActorId))
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Notifications.controller] follow_request filter failed', error)
    }
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
  // FETCH FROM NOTIFICATION ENGINE (notification.* schema)
  // autoMarkSeen is handled by the engine
  // ------------------------------------------------------------
  const { notifications: raw } = await getInboxNotifications({
    recipientActorId: targetActorId,
    limit: 20,
    autoMarkSeen: true,
  })

  // ------------------------------------------------------------
  // BLOCK FILTERING
  // ------------------------------------------------------------
  const blocks = await loadBlockSets(myActorId)

  const filtered = filterByBlocks(raw, blocks, {
    getActorId: (row) => row.sourceActorId,
  })

  const visibleRows = await filterResolvedFollowRequestRows({
    rows: filtered,
    targetActorId,
  })

  // ------------------------------------------------------------
  // SENDER RESOLUTION
  // ------------------------------------------------------------
  const actorIds = visibleRows
    .map(r => r.sourceActorId)
    .filter(Boolean)

  const senderMap = await resolveSenders(actorIds)

  // ------------------------------------------------------------
  // DOMAIN MAPPING
  // ------------------------------------------------------------
  const mapped = visibleRows.map(r =>
    mapNotification(r, senderMap)
  )

  return mapped
}
