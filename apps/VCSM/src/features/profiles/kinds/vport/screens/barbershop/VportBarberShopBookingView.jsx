import VportPublicBookingFlow from "@/features/profiles/kinds/vport/screens/booking/view/VportPublicBookingFlow";
import { VportDashboardScheduleScreen } from "@/features/dashboard/vport/adapters/vport.adapter";

export default function VportBarberShopBookingView({ profile, isOwner = false }) {
  if (isOwner) {
    const actorId = profile?.actorId ?? profile?.actor_id ?? null;
    return <VportDashboardScheduleScreen actorId={actorId} embedded />;
  }

  return <VportPublicBookingFlow profile={profile} />;
}
