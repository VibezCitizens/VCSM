import ActorProfileFriendsView from "@/features/profiles/kinds/citizen/tabs/friends/ActorProfileFriendsView";

export default function CitizenFriendsTab({ profileActorId, canViewContent, gateVersion }) {
  return (
    <ActorProfileFriendsView
      profileActorId={profileActorId}
      canViewContent={canViewContent}
      version={gateVersion}
    />
  );
}
