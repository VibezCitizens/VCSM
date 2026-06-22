import { useOwnerQuickStats } from "@/features/vportDashboard/adapters/vportDashboard.adapter";

export function useVportOwnerQuickStats(actorId, callerActorId) {
  return useOwnerQuickStats(actorId, callerActorId);
}
