import ActorProfilePostsView from "@/features/profiles/screens/views/ActorProfilePostsView";

export default function VportVibesTab({ profile, onShare, onOpenMenu }) {
  return (
    <ActorProfilePostsView
      profileActorId={profile.actorId}
      onShare={onShare}
      onOpenMenu={onOpenMenu}
    />
  );
}
