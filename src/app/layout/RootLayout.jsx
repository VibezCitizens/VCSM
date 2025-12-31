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

  // ✅ ALLOW CHILD SCREENS TO SCROLL
  const mainClass = hideChrome
    ? 'flex-1 min-h-0'
    : 'flex-1 min-h-0 pt-12 pb-[64px]'

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col overflow-hidden">
      {!hideChrome && <TopNav />}

      <main className={mainClass}>
        {/* ❌ noScroll REMOVED */}
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>

      {!hideChrome && <BottomNavBar />}

      {import.meta.env.DEV && <IdentityDebugger />}
    </div>
  )
}
