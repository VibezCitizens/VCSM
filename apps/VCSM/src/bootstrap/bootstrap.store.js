// ============================================================
// Bootstrap Store
// UI-only Zustand state: hydration lifecycle tracking.
// Server data (unread counts) is owned by React Query.
// Consumers read via bootstrap.selectors.js.
// ============================================================

import { create } from 'zustand'

export const useBootstrapStore = create((set) => ({
  // Hydration lifecycle state
  loading: false,
  hydratedAt: null,
  hydratedForActorId: null,
  error: null,

  setLoading: (loading) => set({ loading }),

  setHydrated: (actorId) =>
    set({ hydratedAt: Date.now(), hydratedForActorId: actorId, loading: false, error: null }),

  setError: (error) => set({ error, loading: false }),

  reset: () =>
    set({ loading: false, hydratedAt: null, hydratedForActorId: null, error: null }),
}))
