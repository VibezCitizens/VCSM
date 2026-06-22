import VportContentView from "@/features/profiles/kinds/vport/screens/views/tabs/VportContentView";

export default function VportContentTab({ profile, isOwner }) {
  return <VportContentView profile={profile} isOwner={isOwner} />;
}
