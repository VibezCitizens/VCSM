// src/features/profiles/kinds/vport/screens/services/components/VportServicesSkeleton.jsx
import React from "react";

function Block({ w = "w-full" }) {
  return <div className={["h-4 rounded-full bg-white/10", w].join(" ")} />;
}

export default function VportServicesSkeleton() {
  return (
    <div className="profiles-card rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 w-full">
          <Block w="w-40" />
          <Block w="w-72" />
        </div>
      </div>

      <div className="profiles-subcard p-5">
        <div className="space-y-3">
          <Block w="w-28" />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="h-14 rounded-2xl bg-white/5 border border-white/10" />
            <div className="h-14 rounded-2xl bg-white/5 border border-white/10" />
            <div className="h-14 rounded-2xl bg-white/5 border border-white/10" />
            <div className="h-14 rounded-2xl bg-white/5 border border-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
