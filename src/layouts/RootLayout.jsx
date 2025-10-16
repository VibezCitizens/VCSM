// src/layouts/RootLayout.jsx
import { Outlet, useLocation } from 'react-router-dom'
import TopNav from '@/ui/components/TopNav'
import BottomNavBar from '@/ui/components/BottomNavBar'
import PageContainer from '@/ui/components/PageContainer'

export default function RootLayout() {
  const { pathname } = useLocation()
  const isChat = pathname.startsWith('/chat/')
  const hideChrome =
    isChat ||
    ['/login','/register','/reset','/forgot-password','/onboarding'].includes(pathname)

  // shell does NOT scroll; child screens handle their own scrolling
  const mainClass = hideChrome ? 'flex-1 overflow-hidden' : 'flex-1 pt-12 pb-[64px] overflow-hidden'

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col overflow-hidden">
      {!hideChrome && <TopNav />}
      <main className={mainClass}>
        {/* keep width constraints; the child (e.g. CentralFeed) will scroll */}
        <PageContainer noScroll>
          <Outlet />
        </PageContainer>
      </main>
      {!hideChrome && <BottomNavBar />}
    </div>
  )
}
