import ActorProfileTagsView from "@/features/profiles/screens/views/ActorProfileTagsView";

export default function CitizenTagsTab({ profileActorId, isProfileOwner }) {
  return <ActorProfileTagsView actorId={profileActorId} canAddTag={isProfileOwner} />;
}
