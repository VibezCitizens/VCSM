// src/features/notifications/components/NotificationsBell.jsx
import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import useNotiCount from '@/features/notifications/inbox/hooks/useNotiCount'
import { useIdentity } from '@/state/identity/identityContext'
import BellIcon from '@/components/icons/BellIcon'

/**
 * NotificationsBell
 *
 * Actor-based notification badge
 * - Counts unread notifications for CURRENT actor
 * - Updates automatically when actor switches
 * - No user/vport branching
 */
export default function NotificationsBell({ className = '', debug = false }) {
  const { pathname } = useLocation()
  const { identity } = useIdentity()

  const actorId = identity?.actorId ?? null

  const count = useNotiCount({
    actorId,
    pollMs: 60_000,
    debug,
  })

  // Refresh count on navigation
  useEffect(() => {
    if (!actorId) return
    if (debug) {
      console.log('[NotificationsBell] route change → refresh', {
        pathname,
        actorId,
      })
    }
    window.dispatchEvent(new Event('noti:refresh'))
  }, [pathname, actorId, debug])

  // Identity not ready
  if (!actorId) {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <BellIcon />
      </div>
    )
  }

  const showBadge = Number.isFinite(count) && count > 0

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      aria-label="Notifications"
    >
      <BellIcon />

      {showBadge && (
        <span
          className="
            absolute -top-1 -right-1
            min-w-4 h-4 px-1
            rounded-full
            bg-red-600 text-white
            text-[10px] leading-4 text-center
          "
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  )
}
