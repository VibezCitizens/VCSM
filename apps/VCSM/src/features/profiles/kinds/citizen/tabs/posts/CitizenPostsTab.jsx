import ActorProfilePostsView from "@/features/profiles/screens/views/ActorProfilePostsView";

export default function CitizenPostsTab({ profileActorId, canViewContent, onShare, onOpenMenu }) {
  return (
    <ActorProfilePostsView
      profileActorId={profileActorId}
      canViewContent={canViewContent}
      onShare={onShare}
      onOpenMenu={onOpenMenu}
    />
  );
}
