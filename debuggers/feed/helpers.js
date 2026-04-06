// debuggers/feed/helpers.js
// ============================================================
// Feed Debug Helpers — DEV-ONLY
// ============================================================

import {
  addFeedDebugEvent,
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
  setFeedViewerSnapshot({
    sessionUserId: user?.id ?? null,
    sessionEmail: user?.email ?? null,
    actorId: identity?.actorId ?? null,
    actorKind: identity?.kind ?? null,
    identityUserId: identity?._engineMeta?.userId ?? null,
    realmId: identity?.realmId ?? null,
    userAppAccountId: identity?._engineMeta?.userAppAccountId ?? null,
    displayName: identity?.displayName ?? null,
    username: identity?.username ?? null,
    isComplete: Boolean(user?.id && identity?.actorId),
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
