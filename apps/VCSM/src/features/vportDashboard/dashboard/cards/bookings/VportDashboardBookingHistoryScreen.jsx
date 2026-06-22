import { useVportDashboardContext } from "@/features/vportDashboard/adapters/vportDashboard.adapter";
import VportDashboardBookingHistoryView from "./VportDashboardBookingHistoryView";

export default function VportDashboardBookingHistoryScreen() {
  const { loading, callerActorId, vportActorId, canManage } = useVportDashboardContext();

  if (!vportActorId) return null;
  if (loading) return null;
  if (!canManage) return <div className="p-10 text-center text-white/50">Owner access only.</div>;

  return <VportDashboardBookingHistoryView ownerActorId={vportActorId} viewerActorId={callerActorId} />;
}
