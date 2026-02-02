// src/ui/components/BottomNavBar.jsx

import React, { useEffect, useMemo, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Plus, User, Compass, MessageCircle, Bell, Settings } from 'lucide-react'

import useNotiCount from '@/features/notifications/inbox/hooks/useNotiCount'
import useUnreadBadge from '@/features/notifications/inbox/hooks/useUnreadBadge'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

const DEBUG = true

export default function BottomNavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { identity } = useIdentity()

  // persona choice
  const isVport = identity?.kind === 'vport' && !!identity?.vportId

  // ✅ ACTOR ID (SSOT)
  const personaActorId = useMemo(() => {
    return identity?.actorId ?? null
  }, [identity?.actorId])

  // debug actor changes
  const lastActorRef = useRef()
  useEffect(() => {
    if (!DEBUG) return
    if (lastActorRef.current !== personaActorId) {
      console.log('[BottomNavBar] personaActorId=', personaActorId, {
        identity,
        userId_was_profiles_id: user?.id ?? null,
      })
      lastActorRef.current = personaActorId
    }
  }, [personaActorId, identity, user?.id])

  // notifications (actor-scoped)
  const notiCount = useNotiCount({
    actorId: personaActorId,
    scope: isVport ? 'vport' : 'user',
    debug: DEBUG,
    pollMs: 60_000,
  })

  // chat unread (actor-scoped)
  const { count: chatUnread } = useUnreadBadge({
    actorId: personaActorId,
    vportId: identity?.vportId || null,
    scope: isVport ? 'vport' : 'user',
    refreshMs: 20_000,
  })

  // persona-aware routes
  const notificationsPath = isVport ? '/vport/notifications' : '/notifications'
  const chatPath = isVport ? '/vport/chat' : '/chat'

  // ✅ FIXED PROFILE ROUTE (ACTOR-BASED)
  const profilePath = personaActorId
    ? `/profile/${personaActorId}`
    : '/feed'

  // refresh badges on navigation
  useEffect(() => {
    if (!personaActorId) return
    if (DEBUG) console.log('[BottomNavBar] route change → noti:refresh', location.pathname)
    window.dispatchEvent(new Event('noti:refresh'))
  }, [location.pathname, personaActorId])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-800 pb-[max(0px,env(safe-area-inset-bottom))]"
      role="navigation"
      aria-label="Primary"
    >
      <div className="max-w-[600px] mx-auto h-16 flex items-center justify-between px-6 text-white">
        <Tab to="/feed" label="Home" icon={<Home size={22} />} end />
        <Tab to="/explore" label="Explore" icon={<Compass size={22} />} />

        <Tab
          to={chatPath}
          label={chatUnread > 0 ? `Vox (${chatUnread})` : 'Vox'}
          icon={<MessageCircle size={22} />}
          badgeCount={chatUnread}
        />

        <button
          aria-label="New Upload"
          onClick={() => navigate('/upload')}
          className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center shadow hover:scale-95 transition-transform -mt-4 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <Plus size={24} />
        </button>

        <Tab
          to={notificationsPath}
          label={notiCount > 0 ? `Notifications (${notiCount})` : 'Notifications'}
          icon={<Bell size={22} />}
          badgeCount={notiCount}
        />

        <Tab to={profilePath} label="Citizen" icon={<User size={22} />} />
        <Tab to="/settings" label="Settings" icon={<Settings size={22} />} />
      </div>
    </nav>
  )
}

const Tab = React.memo(function Tab({
  to,
  icon,
  label,
  end = false,
  badgeCount = 0,
  badgeMax = 99,
}) {
  const showBadge = Number(badgeCount) > 0
  const badgeText = Number(badgeCount) > badgeMax ? `${badgeMax}+` : String(badgeCount)

  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        `relative flex items-center justify-center w-10 h-10 transition-all duration-150 ${
          isActive ? 'text-white' : 'text-neutral-500 hover:text-white'
        }`
      }
    >
      <span className="inline-flex items-center justify-center">{icon}</span>

      {showBadge && (
        <span
          className="pointer-events-none absolute top-0 right-0 translate-x-1/2 -translate-y-1/2
                     min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white
                     text-[10px] leading-[18px] text-center font-medium shadow"
          aria-hidden="true"
        >
          {badgeText}
        </span>
      )}
    </NavLink>
  )
})
