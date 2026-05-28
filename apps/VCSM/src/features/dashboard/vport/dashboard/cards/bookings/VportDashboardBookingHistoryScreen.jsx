import { useParams } from "react-router-dom";
import { useIdentity } from "@/state/identity/identityContext";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import VportDashboardBookingHistoryView from "./VportDashboardBookingHistoryView";

export default function VportDashboardBookingHistoryScreen() {
  const params        = useParams();
  const { identity }  = useIdentity();

  const targetActorId = params?.actorId ?? null;
  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, targetActorId);

  if (!targetActorId)  return null;
  if (ownershipLoading) return null;
  if (!isOwner) return <div className="p-10 text-center text-white/50">Owner access only.</div>;

  return <VportDashboardBookingHistoryView ownerActorId={targetActorId} viewerActorId={viewerActorId} />;
}
