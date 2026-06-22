import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useVportDashboardContext } from "@/features/vportDashboard/adapters/vportDashboard.adapter";

export function useVportServices() {
  const { identity, identityLoading } = useIdentity();
  const { loading: ownershipLoading, callerActorId: viewerActorId, canManage: isOwner } = useVportDashboardContext();
  return { identity, identityLoading, viewerActorId, isOwner, ownershipLoading };
}
