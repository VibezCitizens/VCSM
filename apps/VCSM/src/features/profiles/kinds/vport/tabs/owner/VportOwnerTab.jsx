import VportOwnerView from "@/features/profiles/kinds/vport/screens/owner/VportOwnerView";

export default function VportOwnerTab({ profile, profileActorId, isOwner }) {
  if (!isOwner) return null;
  return <VportOwnerView actorId={profile?.actorId ?? profileActorId ?? null} />;
}
