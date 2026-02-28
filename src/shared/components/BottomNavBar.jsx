import React, { useEffect, useMemo } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Plus, User, Compass, MessageCircle, Bell, Settings } from 'lucide-react'

import useNotiCount from '@/features/notifications/inbox/hooks/useNotiCount'
import useUnreadBadge from '@/features/notifications/inbox/hooks/useUnreadBadge'

import { useIdentity } from '@/state/identity/identityContext'

export default function BottomNavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { identity } = useIdentity()

  const personaActorId = useMemo(() => identity?.actorId ?? null, [identity?.actorId])

  const notiCount = useNotiCount({
    actorId: personaActorId,
    pollMs: 45_000,
  })

  const { count: chatUnread } = useUnreadBadge({
    actorId: personaActorId,
    refreshMs: 15_000,
  })

  const profilePath = personaActorId ? `/profile/${personaActorId}` : '/feed'

  useEffect(() => {
    if (!personaActorId) return
    const path = location.pathname || ''
    // Avoid global refresh storms on every route change.
    // Pollers already keep badges updated.
    if (!path.startsWith('/notifications') && !path.startsWith('/chat')) return
    window.dispatchEvent(new Event('noti:refresh'))
  }, [location.pathname, personaActorId])

  return (
    <div
      className="fixed inset-x-0 z-50 pointer-events-none"
      style={{ bottom: 'calc(var(--vc-bottom-nav-safe-pad) + var(--vc-bottom-nav-float-gap))' }}
    >
      <nav
        className="pointer-events-auto mx-auto flex items-center justify-between gap-1 rounded-[20px] border border-white/15 bg-white/[0.07] px-3 text-white shadow-[0_12px_28px_rgba(0,0,0,0.46)] ring-1 ring-white/6 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/[0.09]"
        style={{
          width: 'min(620px, calc(100% - 24px))',
          height: 'var(--vc-bottom-nav-rail-height)',
        }}
        role="navigation"
        aria-label="Primary"
      >
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
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-transform hover:scale-95 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <Plus size={20} />
        </button>

        <Tab
          to="/notifications"
          label={notiCount > 0 ? `Notifications (${notiCount})` : 'Notifications'}
          icon={<Bell size={18} />}
          badgeCount={notiCount}
        />

        <Tab to={profilePath} label="Citizen" icon={<User size={18} />} />
        <Tab to="/settings" label="Settings" icon={<Settings size={18} />} />
      </nav>
    </div>
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
        `relative flex h-10 min-w-[40px] items-center justify-center rounded-full px-1 transition-all duration-150 ${
          isActive
            ? 'border border-white/12 bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
            : 'text-neutral-300/90 hover:bg-white/8 hover:text-white'
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

