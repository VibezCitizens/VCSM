import VportBookingView from "@/features/profiles/kinds/vport/screens/views/tabs/VportBookingView";
import VportBarberShopBookingView from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView";

export default function VportBookTab({ profile, isOwner, vportType }) {
  if (vportType === "barbershop") {
    return <VportBarberShopBookingView profile={profile} isOwner={isOwner} />;
  }
  return <VportBookingView profile={profile} isOwner={isOwner} />;
}
