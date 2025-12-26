// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/layouts/RootLayout.jsx
import { Outlet, useLocation } from 'react-router-dom'
import TopNav from '@/shared/components/TopNav' //transfer
import BottomNavBar from '@/shared/components/BottomNavBar' //transfer
import PageContainer from '@/shared/components/PageContainer' //transfer

// ✅ DEV-ONLY DEBUGGER
import IdentityDebugger from '@/state/identity/IdentityDebugger'

export default function RootLayout() {
  const { pathname } = useLocation()

  // Hide chrome only on ChatScreen (thread), not on conversation list
  // Matches /chat/:id or /vport/chat/:id
  const isChatScreen = /^\/(vport\/)?chat\/[^/]+$/.test(pathname)

  const hideChrome =
    isChatScreen ||
    ['/login','/register','/reset','/forgot-password','/onboarding'].includes(pathname)

  // shell does NOT scroll; child screens handle their own scrolling
  const mainClass = hideChrome 
    ? 'flex-1 overflow-hidden' 
    : 'flex-1 pt-12 pb-[64px] overflow-hidden'

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col overflow-hidden">
      {!hideChrome && <TopNav />}

      <main className={mainClass}>
        {/* ✅ width + centering restored by PageContainer */}
        <PageContainer noScroll>
          <Outlet />
        </PageContainer>
      </main>

      {!hideChrome && <BottomNavBar />}

      {/* ✅ DEV-ONLY IDENTITY DIAGNOSTICS */}
      {import.meta.env.DEV && <IdentityDebugger />}
    </div>
  )
}
