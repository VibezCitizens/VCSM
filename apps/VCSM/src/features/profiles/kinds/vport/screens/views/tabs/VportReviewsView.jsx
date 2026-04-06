// src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx
import React from "react";
import VportReviewsView from "@/features/profiles/kinds/vport/screens/review/VportReviewsView";

export default function VportReviewsTab({
  profile,
  viewerActorId,
  initialReviewTab = null,
  onConsumedInitialTab,
}) {
  return (
    <VportReviewsView
      profile={profile}
      viewerActorId={viewerActorId}
      initialReviewTab={initialReviewTab}
      onConsumedInitialTab={onConsumedInitialTab}
    />
  );
}

