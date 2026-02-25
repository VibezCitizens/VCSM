import React, { useEffect, useMemo, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Plus, User, Compass, MessageCircle, Bell, Settings } from 'lucide-react'

import useNotiCount from '@/features/notifications/inbox/hooks/useNotiCount'
import useUnreadBadge from '@/features/notifications/inbox/hooks/useUnreadBadge'

import { useIdentity } from '@/state/identity/identityContext'

const DEBUG = import.meta.env.DEV

export default function BottomNavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { identity } = useIdentity()

  const personaActorId = useMemo(() => identity?.actorId ?? null, [identity?.actorId])

  const lastActorRef = useRef()
  useEffect(() => {
    if (!DEBUG) return
    if (lastActorRef.current !== personaActorId) {
      console.log('[BottomNavBar] actorId=', personaActorId)
      lastActorRef.current = personaActorId
    }
  }, [personaActorId])

  const notiCount = useNotiCount({
    actorId: personaActorId,
    debug: DEBUG,
    pollMs: 45_000,
  })

  const { count: chatUnread } = useUnreadBadge({
    actorId: personaActorId,
    refreshMs: 15_000,
    debug: DEBUG,
  })

  const profilePath = personaActorId ? `/profile/${personaActorId}` : '/feed'

  useEffect(() => {
    if (!personaActorId) return
    if (DEBUG) console.log('[BottomNavBar] route change -> noti:refresh', location.pathname)
    window.dispatchEvent(new Event('noti:refresh'))
  }, [location.pathname, personaActorId])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800/90 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80"
      role="navigation"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-11 max-w-[600px] items-end justify-between px-3 pb-0 text-white">
        <Tab to="/feed" label="Home" icon={<Home size={18} />} end />
        <Tab to="/explore" label="Explore" icon={<Compass size={18} />} />

        <Tab
          to="/chat"
          label={chatUnread > 0 ? `Vox (${chatUnread})` : 'Vox'}
          icon={<MessageCircle size={18} />}
          badgeCount={chatUnread}
        />

        <button
          aria-label="New Upload"
          onClick={() => navigate('/upload')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow transition-transform hover:scale-95 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <Plus size={18} />
        </button>

        <Tab
          to="/notifications"
          label={notiCount > 0 ? `Notifications (${notiCount})` : 'Notifications'}
          icon={<Bell size={18} />}
          badgeCount={notiCount}
        />

        <Tab to={profilePath} label="Citizen" icon={<User size={18} />} />
        <Tab to="/settings" label="Settings" icon={<Settings size={18} />} />
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
        `relative flex h-8 w-8 items-center justify-center transition-all duration-150 ${
          isActive ? 'text-white' : 'text-neutral-500 hover:text-white'
        }`
      }
    >
      <span className="inline-flex items-center justify-center">{icon}</span>

      {showBadge && (
        <span
          className="pointer-events-none absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-medium shadow"
          aria-hidden="true"
        >
          {badgeText}
        </span>
      )}
    </NavLink>
  )
})

