// src/features/profiles/kinds/vport/screens/services/components/VportServicesHeader.jsx
import React from "react";

export default function VportServicesHeader({
  title = "Services",
  subtitle = "Capabilities and amenities offered by this vport.",
  right = null,
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-lg font-black text-white">{title}</div>
        {subtitle ? (
          <div className="mt-1 text-sm text-white/60">{subtitle}</div>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}