import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopNav from "@/shared/components/TopNav";
import { BottomNavBar, useBottomNavVisibility } from "@/features/shell/adapters/shell.adapter";
import PageContainer from "@/shared/components/PageContainer";
import { IOSDebugHUD, IOSProdRouteDebugger } from "@/app/platform/ios";
import { hideLaunchSplash } from "@/shared/lib/hideLaunchSplash";
import { appendIOSProdDebugLog } from "@/shared/lib/iosProdDebugger";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { ClaimOnboardingBanner } from "@/features/claimOnboarding/adapters/claimOnboarding.adapter";
import { PendingClaimResume } from "@/features/claim/adapters/claim.adapter";

export default function RootLayout() {
  const { pathname } = useLocation();
  const prevPathRef = useRef(null);
  const { identityLoading } = useIdentity();
  const { hideBottomNav } = useBottomNavVisibility();

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
    appendIOSProdDebugLog('root_layout_route_change', {
      from: prevPathRef.current,
      to: pathname,
      isAuthRoute,
      isLearningRoute,
      isChatSubScreen,
      hideTopNav,
      hideBottomNav,
    });
    prevPathRef.current = pathname;
  }, [pathname, isAuthRoute, isLearningRoute, isChatSubScreen, hideTopNav, hideBottomNav]);

  useEffect(() => {
    if (pathname === "/CentralFeed") return;
    appendIOSProdDebugLog('root_layout_hide_launch_splash', { pathname });
    hideLaunchSplash();
  }, [pathname]);

  // /feed defers hideLaunchSplash until identity resolves to prevent flash of null-identity content.
  useEffect(() => {
    if (pathname !== "/CentralFeed") return;
    if (identityLoading) return;
    appendIOSProdDebugLog('root_layout_feed_identity_ready', { pathname });
    hideLaunchSplash();
  }, [pathname, identityLoading]);

  // Chat sub-screens use fixed positioning with overflow-hidden.
  // All other pages use min-height with natural document scrolling.
  const rootClassName = isLearningRoute
    ? "min-h-[100dvh] bg-white text-black flex flex-col"
    : isChatSubScreen
      ? "vc-dynamic-gradient h-[100dvh] text-white flex flex-col overflow-hidden"
      : "vc-dynamic-gradient min-h-[100dvh] text-white flex flex-col";

  return (
    <div className={rootClassName}>
      {/* TICKET-TRAZE-CLAIM-RESUME-001 — render-null; resumes a pending claim
          after auth + onboarding. RootLayout renders only past CompleteProfileGate,
          so the user is already authenticated + onboarded here. */}
      <PendingClaimResume />

      {!hideTopNav && <TopNav />}

      <main className={mainClass}>
        <PageContainer>
          {/* Gate content on identity resolution for authenticated routes.
              Auth routes (login/register/etc.) bypass this — identity is irrelevant there. */}
          {(isAuthRoute || !identityLoading) ? (
            <>
              {/* T7: self-gating approved-claim onboarding entry point. */}
              {!isAuthRoute ? <ClaimOnboardingBanner /> : null}
              <Outlet />
            </>
          ) : null}
        </PageContainer>
      </main>

      {/* Always mounted to preserve realtime subscriptions + polling.
          CSS-hidden when not needed (prevents remount churn). */}
      <div style={hideBottomNav ? { display: 'none' } : undefined}>
        <BottomNavBar />
      </div>

{import.meta.env.DEV && <IOSDebugHUD />}
      {import.meta.env.DEV && <IOSProdRouteDebugger />}
    </div>
  );
}
