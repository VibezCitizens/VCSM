// src/features/wanders/screens/WandersMailbox.screen.jsx
// ============================================================================
// WANDERS SCREEN — MAILBOX (Routing Boundary)
// Owns: route parsing + selecting the domain experience.
// No DAL, no controllers, no hooks.
// ============================================================================

import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

import WandersMailboxView from "@/features/wanders/screens/view/WandersMailbox.view";


function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function WandersMailboxScreen() {
  const query = useQuery();
  const mode = query.get("mode");
  return <WandersMailboxView mode={mode} />;
}
