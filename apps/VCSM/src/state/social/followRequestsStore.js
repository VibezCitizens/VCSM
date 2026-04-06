import { create } from "zustand";

/**
 * ============================================================
 * Follow Requests Store
 * ------------------------------------------------------------
 * Purpose:
 *  - Force re-fetch of incoming follow requests
 *  - Triggered when a request is sent / accepted / declined
 *
 * Rules:
 *  - NO data
 *  - NO business logic
 *  - Signal-only (version bump)
 * ============================================================
 */
export const useFollowRequestsStore = create((set) => ({
  version: 0,

  invalidate: () =>
    set((state) => ({
      version: state.version + 1,
    })),
}));
