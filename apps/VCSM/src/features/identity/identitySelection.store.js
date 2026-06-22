import { create } from "zustand";

export const useIdentitySelectionStore = create((set) => ({
  activeActorId: null,
  activeActorKind: null,
  activeActorLinkId: null,
  setActiveActor: ({ actorId, actorKind, actorLinkId }) =>
    set({ activeActorId: actorId, activeActorKind: actorKind, activeActorLinkId: actorLinkId }),
  clearActiveActor: () =>
    set({ activeActorId: null, activeActorKind: null, activeActorLinkId: null }),
}));
