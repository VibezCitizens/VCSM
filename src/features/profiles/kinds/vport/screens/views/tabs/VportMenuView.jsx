// src/features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx
// wrapper redirect to main screen under menu folder

import React from "react";

// ✅ Delegate to the smart Menu tab implementation (owner vs viewer)
import VportMenuViewSmart from "@/features/profiles/kinds/vport/screens/menu/VportMenuView";

export default function VportMenuView({ profile, onOpenFoodReview } = {}) {
  return (
    <VportMenuViewSmart
      profile={profile}
      onOpenFoodReview={onOpenFoodReview}
    />
  );
}
