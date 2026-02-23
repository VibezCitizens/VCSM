// src/features/profiles/kinds/vport/screens/services/components/VportServicesEmptyState.jsx
import React from "react";

export default function VportServicesEmptyState({
  title = "No services listed",
  subtitle = "This vport hasn’t published any capabilities yet.",
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-white/50">{subtitle}</div>
    </div>
  );
}