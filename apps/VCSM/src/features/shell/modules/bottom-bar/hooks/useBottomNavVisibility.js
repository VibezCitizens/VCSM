import { useLocation } from 'react-router-dom';

export function useBottomNavVisibility() {
  const { pathname } = useLocation();

  const isChatRoute = /^\/chat(\/.*)?$/.test(pathname);
  const isChatInboxRoot = pathname === '/chat';
  const isChatSubScreen = isChatRoute && !isChatInboxRoot;
  const isAuthRoute = ['/login', '/register', '/reset', '/forgot-password', '/onboarding'].includes(pathname);
  const isLearningRoute = /^\/learning(\/.*)?$/.test(pathname);
  const isDevPerfRoute = /^\/dev\/performance/.test(pathname);

  const hideBottomNav = isChatSubScreen || isAuthRoute || isLearningRoute || isDevPerfRoute;

  return { hideBottomNav };
}
