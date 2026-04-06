// src/features/profiles/kinds/vport/screens/services/components/VportServicesSkeleton.jsx
import React from "react";

function Block({ w = "w-full", h = "h-4", rounded = "rounded-full" }) {
  return <div className={[h, rounded, "bg-white/10", w].join(" ")} />;
}

function CardBlock() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <Block w="w-24" />
      <Block w="w-full" h="h-3" rounded="rounded mt-2" />
    </div>
  );
}

export default function VportServicesSkeleton() {
  return (
    <div className="profiles-card rounded-2xl p-6 space-y-5">
      <div className="space-y-3">
        <Block w="w-28" h="h-3" />
        <Block w="w-44" h="h-7" rounded="rounded-2xl" />
        <Block w="w-80 max-w-full" h="h-4" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Block w="w-24" h="h-8" rounded="rounded-full" />
        <Block w="w-20" h="h-8" rounded="rounded-full" />
        <Block w="w-28" h="h-8" rounded="rounded-full" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <Block w="w-36" h="h-3" />
        <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <CardBlock />
          <CardBlock />
          <CardBlock />
          <CardBlock />
          <CardBlock />
          <CardBlock />
        </div>
      </div>
    </div>
  );
}
