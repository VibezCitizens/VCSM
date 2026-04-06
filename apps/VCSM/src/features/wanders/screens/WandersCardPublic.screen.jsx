// src/features/wanders/screens/WandersCardPublic.screen.jsx
// ============================================================================
// WANDERS SCREEN — PUBLIC CARD (Routing)
// Contract: route params -> choose experience
// - no data fetching
// - no domain meaning
// - no DAL/models/controllers
// ============================================================================

import React, { useMemo } from "react";
import { useParams } from "react-router-dom";

import WandersCardPublicView from "@/features/wanders/screens/view/WandersCardPublic.view.jsx";

export default function WandersCardPublicScreen() {
  const params = useParams();
  const publicId = useMemo(() => String(params?.publicId || "").trim(), [params]);

  return <WandersCardPublicView publicId={publicId} />;
}
