import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopNav from "@/shared/components/TopNav";
import BottomNavBar from "@/shared/components/BottomNavBar";
import PageContainer from "@/shared/components/PageContainer";
import { IOSDebugHUD } from "@/app/platform/ios";
import { hideLaunchSplash } from "@/shared/lib/hideLaunchSplash";

export default function RootLayout() {
  const { pathname } = useLocation();

  const isLearningRoute = /^\/learning(\/.*)?$/.test(pathname);

  // any chat route (/chat, /chat/settings, /chat/spam, etc)
  const isChatRoute = /^\/chat(\/.*)?$/.test(pathname);
  const isChatInboxRoot = pathname === "/chat";
  const isChatSubScreen = isChatRoute && !isChatInboxRoot;

  const isAuthRoute = ["/login", "/register", "/reset", "/forgot-password", "/onboarding"].includes(
    pathname
  );

  const isDevPerfRoute = /^\/dev\/performance/.test(pathname);

  // Hide social app nav on chat sub-screens, auth, learning, and dev/performance
  const hideTopNav = isChatSubScreen || isAuthRoute || isLearningRoute || isDevPerfRoute;
  const hideBottomNav = isChatSubScreen || isAuthRoute || isLearningRoute || isDevPerfRoute;

  /**
   * SCROLL CONTRACT
   * - RootLayout owns viewport
   * - <main> is the ONE scroll container
   * - Screens NEVER control scrolling
   */
  const mainClass = isChatSubScreen
    ? "flex-1 min-h-0 overflow-hidden"
    : hideTopNav || hideBottomNav
      ? "flex-1"
      : "flex-1 pt-[calc(48px+env(safe-area-inset-top))] pb-[var(--vc-bottom-nav-height)]";

  useEffect(() => {
    if (pathname === "/feed") return;
    hideLaunchSplash();
  }, [pathname]);

  // Chat sub-screens use fixed positioning with overflow-hidden.
  // All other pages use min-height with natural document scrolling.
  const rootClassName = isLearningRoute
    ? "min-h-[100dvh] bg-white text-black flex flex-col"
    : isChatSubScreen
      ? "vc-dynamic-gradient h-[100dvh] text-white flex flex-col overflow-hidden"
      : "vc-dynamic-gradient min-h-[100dvh] text-white flex flex-col";

  return (
    <div className={rootClassName}>
      {!hideTopNav && <TopNav />}

      <main className={mainClass}>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>

      {/* Always mounted to preserve realtime subscriptions + polling.
          CSS-hidden when not needed (prevents remount churn). */}
      <div style={hideBottomNav ? { display: 'none' } : undefined}>
        <BottomNavBar />
      </div>

      {import.meta.env.DEV && <IOSDebugHUD />}
    </div>
  );
}