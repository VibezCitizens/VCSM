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
  const browserToolbarLift = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return '0px'
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '')
    if (!isIOS) return '0px'
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone === true
    return standalone ? '0px' : '2px'
  }, [])

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
      style={{
        bottom: `calc(var(--vc-bottom-nav-safe-pad) + var(--vc-bottom-nav-float-gap) + ${browserToolbarLift})`,
      }}
    >
      <nav
        className="pointer-events-auto mx-auto flex items-center justify-between gap-1 rounded-full border border-indigo-200/20 bg-slate-950/58 px-3 text-slate-100 shadow-[0_14px_34px_rgba(2,6,22,0.58)] ring-1 ring-indigo-300/15 backdrop-blur-2xl supports-[backdrop-filter]:bg-slate-900/52"
        style={{
          width: 'min(560px, calc(100% - 36px))',
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
          className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200/40 bg-gradient-to-br from-violet-500 via-indigo-400 to-sky-400 text-white shadow-[0_12px_30px_rgba(83,104,255,0.62),0_0_16px_rgba(87,150,255,0.5)] transition-all duration-200 hover:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-indigo-200/60"
        >
          <Plus size={22} />
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
            ? 'border border-indigo-200/30 bg-indigo-400/18 text-indigo-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_16px_rgba(87,138,255,0.32)]'
            : 'text-slate-300/90 hover:bg-white/10 hover:text-indigo-100'
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
