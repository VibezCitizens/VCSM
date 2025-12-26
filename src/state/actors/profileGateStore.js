import { create } from "zustand";

/**
 * ============================================================
 * Profile Gate Store
 * ------------------------------------------------------------
 * Purpose:
 *  - Force re-evaluation of profile privacy gates
 *  - Triggered after relationship mutations (unsubscribe, unfriend, block)
 *
 * Rules:
 *  - NO business logic
 *  - NO privacy decisions
 *  - Pure invalidation signal only
 * ============================================================
 */

export const useProfileGateStore = create((set) => ({
  // Monotonic version used as dependency in useProfileGate
  gateVersion: 0,

  // Force all consumers to re-run gate checks
  invalidateGate: () =>
    set((state) => ({
      gateVersion: state.gateVersion + 1,
    })),

  // Optional hard reset (rarely needed, but safe)
  resetGate: () =>
    set({
      gateVersion: 0,
    }),
}));
