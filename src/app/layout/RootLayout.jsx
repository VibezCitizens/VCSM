// src/layouts/RootLayout.jsx
import { Outlet, useLocation } from 'react-router-dom'
import TopNav from '@/shared/components/TopNav'
import BottomNavBar from '@/shared/components/BottomNavBar'
import PageContainer from '@/shared/components/PageContainer'

// DEV ONLY
import IdentityDebugger from '@/state/identity/IdentityDebugger'

export default function RootLayout() {
  const { pathname } = useLocation()

  // ✅ conversation screen only (/chat/:id and /vport/chat/:id)
  const isConversationScreen = /^\/(vport\/)?chat\/[^/]+$/.test(pathname)

  // ✅ any chat route (/chat, /chat/settings, /chat/spam, etc)
  const isChatRoute = /^\/(vport\/)?chat(\/.*)?$/.test(pathname)

  const isAuthRoute = ['/login','/register','/reset','/forgot-password','/onboarding'].includes(pathname)

  // ✅ show Vibez Citizens (TopNav) on inbox/settings, but hide on conversation
  const hideTopNav = isConversationScreen || isAuthRoute

  // ✅ keep bottom nav visible on inbox/settings, but hide on conversation + auth
  const hideBottomNav = isConversationScreen || isAuthRoute

  /**
   * ✅ SCROLL CONTRACT (LOCKED)
   * - RootLayout owns viewport (overflow-hidden)
   * - <main> is the ONE scroll container
   * - Screens NEVER control scrolling
   */
  const mainClass =
    hideTopNav || hideBottomNav
      ? 'flex-1 min-h-0 overflow-y-auto'
      : 'flex-1 min-h-0 overflow-y-auto pt-12 pb-[64px]'

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col overflow-hidden">
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
