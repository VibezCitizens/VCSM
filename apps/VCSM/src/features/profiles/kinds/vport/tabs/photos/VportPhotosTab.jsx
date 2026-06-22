import ActorProfilePhotosView from "@/features/profiles/screens/views/ActorProfilePhotosView";

export default function VportPhotosTab({ profile, viewerActorId, onShare }) {
  return (
    <ActorProfilePhotosView
      actorId={profile.actorId}
      viewerActorId={viewerActorId}
      canViewContent
      handleShare={onShare}
    />
  );
}
