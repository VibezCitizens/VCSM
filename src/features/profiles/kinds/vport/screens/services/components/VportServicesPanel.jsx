// src/features/profiles/kinds/vport/screens/services/components/VportServicesPanel.jsx
import React, { useMemo } from "react";
import VportServicesHeader from "./VportServicesHeader";
import VportServicesEmptyState from "./VportServicesEmptyState";
import VportServicesCategorySection from "./VportServicesCategorySection";

function normalizeCategory(v) {
  const raw = (v ?? "").toString().trim();
  return raw || "Other";
}

function groupByCategory(services) {
  const groups = new Map();
  (services ?? []).forEach((s) => {
    if (!s) return;
    const cat = normalizeCategory(s.category ?? s.group ?? s.section);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(s);
  });
  return groups;
}

export default function VportServicesPanel({
  loading = false,
  error = null,
  services = [],
  title = "Services",
  subtitle = "Capabilities and amenities offered by this vport.",
  headerRight = null,
}) {
  const hasServices = (services?.length ?? 0) > 0;

  const grouped = useMemo(() => groupByCategory(services), [services]);

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 space-y-5">
      <VportServicesHeader title={title} subtitle={subtitle} right={headerRight} />

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-white/50">
          Loading services…
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {String(error?.message ?? error)}
        </div>
      ) : null}

      {!loading && !error && !hasServices ? <VportServicesEmptyState /> : null}

      {!loading && !error && hasServices ? (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([cat, items]) => (
            <VportServicesCategorySection key={cat} title={cat} items={items} />
          ))}
        </div>
      ) : null}
    </div>
  );
}