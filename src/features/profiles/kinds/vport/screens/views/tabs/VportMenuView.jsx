// src/features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx

import React, { useMemo } from "react";

import VportMenuManageView from "@/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuManageView";

/**
 * Back-compat wrapper:
 * - Old tab/view passed `profile`
 * - New menu management expects `actorId`
 *
 * This file keeps the old import path stable for your tab registry/router.
 */
export default function VportMenuView({ profile } = {}) {
  const actorId = useMemo(() => {
    // Try common shapes without assuming too much.
    return profile?.actorId ?? profile?.actor_id ?? profile?.actor?.id ?? null;
  }, [profile]);

  if (!actorId) {
    return (
      <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
        <h3 className="text-lg font-semibold">Menu</h3>

        <div className="mt-3 text-sm text-neutral-300 whitespace-pre-wrap">
          Missing actorId for this VPORT profile.
        </div>

        <div className="mt-4 text-xs text-neutral-400">
          Vport: @{profile?.username || "unknown"}
        </div>
      </div>
    );
  }

  return <VportMenuManageView actorId={actorId} />;
}
