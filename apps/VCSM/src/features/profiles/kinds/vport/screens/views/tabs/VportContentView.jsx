// src/features/profiles/kinds/vport/screens/views/tabs/VportContentView.jsx
// Tab wrapper — delegates to the smart VportContentView.

import VportContentViewSmart from "@/features/profiles/kinds/vport/screens/content/VportContentView";

export default function VportContentView({ profile, isOwner = false }) {
  return <VportContentViewSmart profile={profile} isOwner={isOwner} />;
}
