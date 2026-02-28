// src/layouts/RootLayout.jsx

import { Outlet, useLocation } from 'react-router-dom'
import TopNav from '@/shared/components/TopNav'
import BottomNavBar from '@/shared/components/BottomNavBar'
import PageContainer from '@/shared/components/PageContainer'

// DEV ONLY
import IdentityDebugger from '@/state/identity/IdentityDebugger'

export default function RootLayout() {
  const { pathname } = useLocation()

  // ✅ any chat route (/chat, /chat/settings, /chat/spam, etc)
  const isChatRoute = /^\/chat(\/.*)?$/.test(pathname)
  const isChatInboxRoot = pathname === '/chat'
  const isChatSubScreen = isChatRoute && !isChatInboxRoot

  const isAuthRoute = ['/login', '/register', '/reset', '/forgot-password', '/onboarding'].includes(
    pathname
  )

  // Hide app nav on chat sub-screens (settings/spam/requests/archived/conversation/new)
  const hideTopNav = isChatSubScreen || isAuthRoute
  const hideBottomNav = isChatSubScreen || isAuthRoute

  /**
   * ✅ SCROLL CONTRACT (LOCKED)
   * - RootLayout owns viewport (overflow-hidden)
   * - <main> is the ONE scroll container
   * - Screens NEVER control scrolling
   */
  const mainClass =
    hideTopNav || hideBottomNav
      ? 'flex-1 min-h-0 overflow-y-auto'
      : 'flex-1 min-h-0 overflow-y-auto pt-[calc(48px+env(safe-area-inset-top))] pb-[var(--vc-bottom-nav-height)]'

  return (
    <div className="h-[100dvh] bg-black text-white flex flex-col overflow-hidden">
      {!hideTopNav && <TopNav />}

      {/* ✅ GLOBAL SCROLL CONTAINER */}
      <main className={mainClass}>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>

      {!hideBottomNav && <BottomNavBar />}

      {import.meta.env.DEV && <IdentityDebugger />}
    </div>
  )
}