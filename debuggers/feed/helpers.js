// debuggers/feed/helpers.js
// ============================================================
// Feed Debug Helpers — DEV-ONLY
// ============================================================

import {
  addFeedDebugEvent,
  getFeedDebugState,
  setFeedViewerSnapshot,
  setFeedSnapshot,
  setPostDecisions,
} from './store.js'

export function debugFeedEvent(step, opts = {}) {
  if (!import.meta.env.DEV) return
  addFeedDebugEvent({ step, ...opts })
}

export function debugFeedViewer({ user, identity }) {
  if (!import.meta.env.DEV) return

  const nextActorId = identity?.actorId ?? null
  const prevViewer = getFeedDebugState()?.viewer
  const prevActorId = prevViewer?.actorId ?? null

  // Stale-check: log when viewer is being updated to a different actor
  if (prevActorId && nextActorId && prevActorId !== nextActorId) {
    addFeedDebugEvent({
      step: 'FEED_VIEWER_SYNC',
      status: 'info',
      message: `Viewer actor changed: ${prevActorId.slice(0, 8)} → ${nextActorId.slice(0, 8)}`,
      payload: {
        prevActorId,
        nextActorId,
        prevKind: prevViewer?.actorKind ?? null,
        nextKind: identity?.kind ?? null,
        matched: false,
      },
    })
  }

  setFeedViewerSnapshot({
    sessionUserId: user?.id ?? null,
    sessionEmail: user?.email ?? null,
    actorId: nextActorId,
    actorKind: identity?.kind ?? null,
    identityUserId: identity?._engineMeta?.userId ?? null,
    realmId: identity?.realmId ?? null,
    userAppAccountId: identity?._engineMeta?.userAppAccountId ?? null,
    displayName: identity?.displayName ?? null,
    username: identity?.username ?? null,
    isComplete: Boolean(user?.id && nextActorId),
  })
}

export function debugFeedResult({ rawCount, filteredCount, renderedCount, debugRows, hiddenByMeCount, hasMore }) {
  if (!import.meta.env.DEV) return
  setFeedSnapshot({
    rawCount: rawCount ?? 0,
    filteredCount: filteredCount ?? 0,
    renderedCount: renderedCount ?? 0,
    hiddenByMeCount: hiddenByMeCount ?? 0,
    hasMore: hasMore ?? false,
    at: new Date().toISOString(),
  })

  if (Array.isArray(debugRows)) {
    setPostDecisions(debugRows.map((row) => ({
      postId: row.post_id ?? null,
      actorId: row.actor_id ?? null,
      visible: row.visible ?? false,
      reason: row.reason ?? 'unknown',
      isPrivate: row.is_private ?? null,
      isFollowing: row.is_following ?? false,
      isOwner: row.is_owner ?? false,
      actorKind: row.actor_kind ?? null,
    })))
  }
}
