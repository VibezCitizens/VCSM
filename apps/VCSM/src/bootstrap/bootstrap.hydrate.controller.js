// ============================================================
// Bootstrap Hydration Controller
// Owns all session-level polling and realtime subscriptions
// for unread counts. Called once when actorId becomes available.
// Use useBootstrapHydration(actorId) — the hook wires lifecycle.
// ============================================================

import { useEffect, useRef } from 'react'
import { useBootstrapStore } from './bootstrap.store'
import { getUnreadNotificationCount } from '@/features/notifications/inbox/controller/notificationsCount.controller'
import { getInboxUnreadBadgeCount } from '@/features/notifications/inbox/controller/inboxUnread.controller'
import {
  subscribeNotificationBadge,
  subscribeInboxBadge,
} from '@/features/notifications/inbox/realtime/badgeSubscriptions'

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const NOTIFICATION_POLL_MS = 60_000
const CHAT_POLL_MS = 30_000

function isValidActor(id) {
  return typeof id === 'string' && UUID_RX.test(id)
}

// Standalone loader — used by the hook and by invalidation helpers
export async function loadNotificationUnread(actorId) {
  if (!isValidActor(actorId)) return
  try {
    const count = await getUnreadNotificationCount(actorId)
    useBootstrapStore.getState().setNotificationUnread(count)
  } catch {
    // Non-fatal — keep last known value
  }
}

export async function loadChatUnread(actorId) {
  if (!isValidActor(actorId)) return
  try {
    const count = await getInboxUnreadBadgeCount(actorId)
    useBootstrapStore.getState().setChatUnread(count)
  } catch {
    // Non-fatal — keep last known value
  }
}

/**
 * useBootstrapHydration
 *
 * Call this once from a persistent component (e.g. BottomNavBar or RootLayout).
 * It hydrates unread counts on actorId change and tears down on unmount.
 */
export function useBootstrapHydration(actorId) {
  const store = useBootstrapStore
  const lastActorRef = useRef(null)
  const unsubNotiRef = useRef(null)
  const unsubChatRef = useRef(null)
  const notiPollRef = useRef(null)
  const chatPollRef = useRef(null)

  useEffect(() => {
    function teardown() {
      if (unsubNotiRef.current) { unsubNotiRef.current(); unsubNotiRef.current = null }
      if (unsubChatRef.current) { unsubChatRef.current(); unsubChatRef.current = null }
      if (notiPollRef.current) { clearInterval(notiPollRef.current); notiPollRef.current = null }
      if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null }
    }

    if (!isValidActor(actorId)) {
      teardown()
      store.getState().reset()
      return
    }

    const actorChanged = lastActorRef.current !== actorId
    lastActorRef.current = actorId

    if (actorChanged) {
      teardown()
      store.getState().setLoading(true)

      // Initial load for both counts in parallel
      Promise.all([
        loadNotificationUnread(actorId),
        loadChatUnread(actorId),
      ]).then(() => {
        store.getState().setHydrated(actorId)
      })
    }

    // Debounce realtime bursts before re-querying
    let notiRealtimeTimer = null
    const onNotiRealtime = () => {
      if (notiRealtimeTimer) clearTimeout(notiRealtimeTimer)
      notiRealtimeTimer = setTimeout(() => loadNotificationUnread(actorId), 2_000)
    }

    let chatRealtimeTimer = null
    const onChatRealtime = () => {
      if (chatRealtimeTimer) clearTimeout(chatRealtimeTimer)
      chatRealtimeTimer = setTimeout(() => loadChatUnread(actorId), 2_000)
    }

    unsubNotiRef.current = subscribeNotificationBadge({ actorId, onChange: onNotiRealtime })
    unsubChatRef.current = subscribeInboxBadge({ actorId, onChange: onChatRealtime })

    // Fallback polling — realtime covers changes but poll ensures eventual consistency
    notiPollRef.current = setInterval(() => loadNotificationUnread(actorId), NOTIFICATION_POLL_MS)
    chatPollRef.current = setInterval(() => loadChatUnread(actorId), CHAT_POLL_MS)

    const onGlobalRefresh = () => {
      loadNotificationUnread(actorId)
      loadChatUnread(actorId)
    }
    window.addEventListener('noti:refresh', onGlobalRefresh)

    return () => {
      window.removeEventListener('noti:refresh', onGlobalRefresh)
      if (notiRealtimeTimer) clearTimeout(notiRealtimeTimer)
      if (chatRealtimeTimer) clearTimeout(chatRealtimeTimer)
      teardown()
    }
  }, [actorId])
}
