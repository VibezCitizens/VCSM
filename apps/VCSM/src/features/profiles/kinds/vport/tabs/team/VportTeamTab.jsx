import VportBarberShopTeamView from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView";

export default function VportTeamTab({ profile, isOwner, vportType }) {
  if (vportType !== "barbershop") return null;
  return <VportBarberShopTeamView profile={profile} isOwner={isOwner} />;
}
