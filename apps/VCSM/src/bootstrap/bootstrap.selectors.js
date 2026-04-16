// ============================================================
// Bootstrap Selectors
// Typed hooks for reading bootstrap store values.
// Import these in components — never read the store directly.
// ============================================================

import { useBootstrapStore } from './bootstrap.store'

/** Returns the current unread notification count for the active actor. */
export function useNotificationUnread() {
  return useBootstrapStore((s) => s.notificationUnread)
}

/** Returns the current unread chat count for the active actor. */
export function useChatUnread() {
  return useBootstrapStore((s) => s.chatUnread)
}

/** Returns true while the initial bootstrap hydration is in progress. */
export function useBootstrapLoading() {
  return useBootstrapStore((s) => s.loading)
}

/** Returns the timestamp of the last successful hydration (ms), or null. */
export function useBootstrapHydratedAt() {
  return useBootstrapStore((s) => s.hydratedAt)
}
