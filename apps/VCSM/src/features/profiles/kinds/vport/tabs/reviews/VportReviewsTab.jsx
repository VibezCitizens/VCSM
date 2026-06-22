import VportReviewsView from "@/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView";

export default function VportReviewsTab({ profile, viewerActorId, reviewsDefaultTab, onConsumedReviewsTab }) {
  return (
    <VportReviewsView
      profile={profile}
      viewerActorId={viewerActorId}
      initialReviewTab={reviewsDefaultTab}
      onConsumedInitialTab={onConsumedReviewsTab}
    />
  );
}
