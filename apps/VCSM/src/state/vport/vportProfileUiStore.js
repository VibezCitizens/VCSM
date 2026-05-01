// src/state/vport/vportProfileUiStore.js
// Zustand store for VPORT profile page UI state ONLY.
// Never store server data here — React Query owns server data.
// Stored: which tab is active, which resource is selected, modal open/close flags.

import { create } from 'zustand'

export const useVportProfileUiStore = create((set) => ({
  activeProfileTab: null,
  selectedResourceId: null,
  isQrOpen: false,
  isBookingModalOpen: false,

  setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),
  setSelectedResourceId: (id) => set({ selectedResourceId: id }),
  setIsQrOpen: (open) => set({ isQrOpen: open }),
  setIsBookingModalOpen: (open) => set({ isBookingModalOpen: open }),
}))
