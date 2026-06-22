import { useVportDashboardContext } from "@/features/vportDashboard/adapters/vportDashboard.adapter";

export function useVportReviews() {
  const { loading: ownershipLoading, callerActorId: viewerActorId, canManage: isOwner } = useVportDashboardContext();
  return { viewerActorId, isOwner, ownershipLoading };
}
