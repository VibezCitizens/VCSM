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
  const categoryCount = grouped.size;

  const headerStats = useMemo(() => {
    return [
      { label: "Live services", value: String(services?.length ?? 0) },
      { label: "Categories", value: String(categoryCount) },
      { label: "Availability", value: hasServices ? "Active" : "Preparing" },
    ];
  }, [services?.length, categoryCount, hasServices]);

  return (
    <div className="profiles-card relative overflow-hidden rounded-2xl p-6 space-y-5">
      <div className="pointer-events-none absolute -top-28 right-[-56px] h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[-56px] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      <VportServicesHeader
        title={title}
        subtitle={subtitle}
        right={headerRight}
        stats={headerStats}
      />

      {loading ? (
        <div className="profiles-subcard rounded-3xl border border-white/12 bg-white/[0.02] p-5 text-sm profiles-muted">
          Loading services...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="profiles-error rounded-2xl p-4 text-sm">
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
