// ============================================================
// Bootstrap Hydration Controller
// Activates React Query unread hooks for badge polling.
// Realtime badge subscriptions are disabled for now.
// Polling is owned by React Query (bootstrap.selectors.js).
// ============================================================

import { useEffect, useRef } from 'react'
import { useBootstrapStore } from './bootstrap.store'
import { queryClient } from '@/queries/queryClient'
import { queryKeys } from '@/queries/queryKeys'

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidActor(id) {
  return typeof id === 'string' && UUID_RX.test(id)
}

/**
 * useBootstrapHydration
 *
 * Call once from a persistent component (e.g. BottomNavBar or RootLayout).
 * Sets hydratedForActorId in the store so React Query unread selectors activate.
 */
export function useBootstrapHydration(actorId) {
  const store = useBootstrapStore
  const lastActorRef = useRef(null)

  useEffect(() => {
    if (!isValidActor(actorId)) {
      lastActorRef.current = null
      store.getState().reset()
      return undefined
    }

    const actorChanged = lastActorRef.current !== actorId
    lastActorRef.current = actorId

    if (actorChanged) {
      // Activates useNotificationUnread / useChatUnread in bootstrap.selectors.js.
      store.getState().setHydrated(actorId)
    }

    const onGlobalRefresh = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(actorId) })
    }

    window.addEventListener('noti:refresh', onGlobalRefresh)
    return () => window.removeEventListener('noti:refresh', onGlobalRefresh)
  }, [actorId, store])
}
