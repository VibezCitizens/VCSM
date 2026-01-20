// src/layouts/RootLayout.jsx
import { Outlet, useLocation } from 'react-router-dom'
import TopNav from '@/shared/components/TopNav'
import BottomNavBar from '@/shared/components/BottomNavBar'
import PageContainer from '@/shared/components/PageContainer'

// DEV ONLY
import IdentityDebugger from '@/state/identity/IdentityDebugger'

export default function RootLayout() {
  const { pathname } = useLocation()

  const isChatScreen = /^\/(vport\/)?chat\/[^/]+$/.test(pathname)

  const hideChrome =
    isChatScreen ||
    ['/login','/register','/reset','/forgot-password','/onboarding'].includes(pathname)

  /**
   * ✅ SCROLL CONTRACT (LOCKED)
   * - RootLayout owns viewport (overflow-hidden)
   * - <main> is the ONE scroll container
   * - Screens NEVER control scrolling
   */
  const mainClass = hideChrome
    ? 'flex-1 min-h-0 overflow-y-auto'
    : 'flex-1 min-h-0 overflow-y-auto pt-12 pb-[64px]'

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col overflow-hidden">
      {!hideChrome && <TopNav />}

      {/* ✅ GLOBAL SCROLL CONTAINER */}
      <main className={mainClass}>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>

      {!hideChrome && <BottomNavBar />}

      {import.meta.env.DEV && <IdentityDebugger />}
    </div>
  )
}
