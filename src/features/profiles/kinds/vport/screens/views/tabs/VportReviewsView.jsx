// src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx

import React from "react";
import VportReviewsView from "@/features/profiles/kinds/vport/screens/views/tabs/review/VportReviewsView";

export default function VportReviewsTab({ profile, viewerActorId }) {
  return <VportReviewsView profile={profile} viewerActorId={viewerActorId} />;
}
