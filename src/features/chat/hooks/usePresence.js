// src/features/chat/hooks/usePresence.js
import { useEffect, useRef } from 'react'
import { users as usersDAL } from '@/data/user/profiles'

/**
 * usePresence (basic)
 * - Every interval, sends a "last seen" ping for the user.
 * - No leader election, no storage events, just the core loop.
 *
 * @param {{id?: string}|null} user
 * @param {number} intervalMs Default 60s
 */
export function usePresence(user, intervalMs = 60000) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return

    const doPing = async () => {
      try {
        if (document.visibilityState === 'visible') {
          await usersDAL.touchLastSeen()
        }
      } catch (err) {
        console.warn('presence ping failed', err)
      }
    }

    // Initial ping
    doPing()

    // Loop
    timerRef.current = setInterval(doPing, intervalMs)

    // On visibility change, do an extra ping
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        doPing()
      }
    }
    document.addEventListener('visibilitychange', onVis)

    // Cleanup
    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', onVis)
      doPing() // final best-effort ping
    }
  }, [user?.id, intervalMs])
}
