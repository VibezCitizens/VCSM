// src/features/vport/screens/views/VportViewScreen.jsx

import { useMemo, useState, useEffect } from "react";

import { VPORT_TABS } from "@/features/profiles/config/profileTabs.config";
import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/gas/getVportTabsByType.model";

import { useIdentity } from "@/state/identity/identityContext";
import { VportGasPricesView } from "@/features/profiles/kinds/vport/screens/gas/view/VportGasPricesView";

export default function VportViewScreen({
  viewerActorId,
  vportId,

  // ✅ pass this if you have it (recommended)
  vportType = null,

  // ✅ actor-first (required for gas pricing)
  actorId = null,
}) {
  const identity = useIdentity();

  const tabs = useMemo(() => {
    if (vportType) return getVportTabsByType(vportType);
    return VPORT_TABS;
  }, [vportType]);

  // default tab = first tab in layout
  const initialTab = useMemo(() => {
    const list = Array.isArray(tabs) ? tabs : [];
    return list[0]?.key ?? "vibes";
  }, [tabs]);

  const [tab, setTab] = useState(initialTab);

  // keep selected tab valid when layout changes
  useEffect(() => {
    setTab((prev) => {
      const list = Array.isArray(tabs) ? tabs : [];
      if (!list.length) return prev || "vibes";
      const exists = list.some((t) => t.key === prev);
      return exists ? prev : list[0]?.key ?? "vibes";
    });
  }, [tabs]);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vport Page</h1>
        <p className="text-sm text-neutral-400">vportId: {vportId}</p>
        <p className="text-sm text-neutral-500">
          viewerActorId: {viewerActorId}
        </p>
        <p className="text-sm text-neutral-600">
          vportType: {String(vportType ?? "")}
        </p>
        <p className="text-sm text-neutral-600">
          actorId: {String(actorId ?? "")}
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-neutral-800 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 ${
              tab === t.key
                ? "border-b-2 border-white text-white"
                : "text-neutral-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {tab === "vibes" && (
        <div className="text-neutral-300">
          📌 Vport posts (vibes) will appear here.
        </div>
      )}

      {tab === "photos" && (
        <div className="text-neutral-300">🖼️ Vport photos will appear here.</div>
      )}

      {tab === "about" && (
        <div className="text-neutral-300">ℹ️ About this vport.</div>
      )}

      {tab === "reviews" && (
        <div className="text-neutral-300">⭐ Reviews will appear here.</div>
      )}

      {tab === "menu" && (
        <div className="text-neutral-300">🍽️ Menu will appear here.</div>
      )}

      {tab === "subscribers" && (
        <div className="text-neutral-300">👥 Subscribers will appear here.</div>
      )}

      {tab === "gas" && (
        <div className="mt-4">
          <VportGasPricesView actorId={actorId ?? vportId} identity={identity} />
        </div>
      )}
    </div>
  );
}