import { useOwnerQuickStats } from "@/features/dashboard/vport/adapters/vport.adapter";

export function useVportOwnerQuickStats(actorId) {
  return useOwnerQuickStats(actorId);
}
