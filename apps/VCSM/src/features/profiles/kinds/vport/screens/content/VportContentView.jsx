// src/features/profiles/kinds/vport/screens/content/VportContentView.jsx
// Smart view — renders owner management or public viewer depending on isOwner.

import { useMemo } from "react";

import VportContentManageView from "@/features/profiles/kinds/vport/screens/content/VportContentManageView";
import VportContentPublicView from "@/features/profiles/kinds/vport/screens/content/VportContentPublicView";

export function VportContentView({ profile, isOwner = false }) {
  const actorId = useMemo(
    () => profile?.actorId ?? profile?.actor_id ?? null,
    [profile]
  );

  if (!actorId) return null;

  if (isOwner) {
    return <VportContentManageView actorId={actorId} />;
  }

  return <VportContentPublicView actorId={actorId} />;
}

export default VportContentView;
