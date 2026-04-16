// ============================================================
// Bootstrap Store
// Session-level Zustand store for shared unread counts.
// Hydrated once per actorId by bootstrap.hydrate.controller.js.
// Consumers read via bootstrap.selectors.js.
// Write paths invalidate via bootstrap.invalidate.js.
// ============================================================

import { create } from 'zustand'

export const useBootstrapStore = create((set) => ({
  // Hydration state
  loading: false,
  hydratedAt: null,
  hydratedForActorId: null,
  error: null,

  // Unread counts
  notificationUnread: 0,
  chatUnread: 0,

  // Actions
  setLoading: (loading) => set({ loading }),

  setHydrated: (actorId) =>
    set({ hydratedAt: Date.now(), hydratedForActorId: actorId, loading: false, error: null }),

  setError: (error) => set({ error, loading: false }),

  setNotificationUnread: (count) =>
    set({ notificationUnread: typeof count === 'number' ? count : 0 }),

  setChatUnread: (count) =>
    set({ chatUnread: typeof count === 'number' ? count : 0 }),

  reset: () =>
    set({
      loading: false,
      hydratedAt: null,
      hydratedForActorId: null,
      error: null,
      notificationUnread: 0,
      chatUnread: 0,
    }),
}))
