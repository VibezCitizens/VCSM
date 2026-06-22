import { createContext, useContext, useMemo } from "react";
import { useVportOwnership } from "@/features/vportDashboard/hooks/useVportOwnership";

const VportDashboardContext = createContext(null);

/**
 * Wraps all /actor/:actorId/dashboard/* routes (mounted inside OwnerOnlyDashboardGuard).
 * Resolves display-layer ownership once per dashboard navigation session.
 *
 * SECURITY: This context is display-only. Controllers must still independently
 * verify ownership via assertActorOwnsVportActorController for all mutations
 * and privileged reads. This provider does not replace controller authorization.
 */
export function VportDashboardProvider({ actorId, callerActorId, children }) {
  const { isOwner, ownershipLoading } = useVportOwnership(callerActorId, actorId);

  const value = useMemo(() => {
    const canManage = Boolean(isOwner);
    const mode = ownershipLoading
      ? null
      : canManage
        ? callerActorId === actorId
          ? "self"
          : "actor_owner"
        : null;

    return {
      loading: ownershipLoading,
      callerActorId,
      vportActorId: actorId,
      canManage,
      mode,
    };
  }, [isOwner, ownershipLoading, callerActorId, actorId]);

  return (
    <VportDashboardContext.Provider value={value}>
      {children}
    </VportDashboardContext.Provider>
  );
}

export function useVportDashboardContext() {
  const ctx = useContext(VportDashboardContext);
  if (!ctx) {
    throw new Error("useVportDashboardContext must be used inside VportDashboardProvider");
  }
  return ctx;
}
