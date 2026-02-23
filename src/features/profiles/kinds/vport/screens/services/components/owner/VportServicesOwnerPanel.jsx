import React, { useMemo } from "react";

import VportServicesHeader from "@/features/profiles/kinds/vport/screens/services/components/VportServicesHeader";
import VportServicesEmptyState from "@/features/profiles/kinds/vport/screens/services/components/VportServicesEmptyState";

import VportServicesOwnerToolbar from "@/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerToolbar";
import VportServicesOwnerCategorySection from "@/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerCategorySection";
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

export default function VportServicesOwnerPanel({
  loading = false,
  error = null,
  services = [],
  title = "Services",
  subtitle = "Manage your services and add-ons.",
  // owner behaviors
  dirty = false,
  isSaving = false,
  onSave = null,
  onReset = null,
  onToggleService = null, // ({ key, enabled }) => void
  onEditServiceMeta = null, // ({ key }) => void
  headerRight = null,
}) {
  const hasServices = (services?.length ?? 0) > 0;
  const grouped = useMemo(() => groupByCategory(services), [services]);

  const right = (
    <div className="flex items-center gap-3">
      {headerRight}
      <VportServicesOwnerToolbar
        dirty={dirty}
        isSaving={isSaving}
        onSave={onSave}
        onReset={onReset}
      />
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 space-y-5">
      <VportServicesHeader title={title} subtitle={subtitle} right={right} />

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

      {!loading && !error && !hasServices ? (
        <VportServicesEmptyState
          title="No services available"
          subtitle="Your catalog returned no services for this vport type."
        />
      ) : null}

      {!loading && !error && hasServices ? (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([cat, items]) => (
            <VportServicesOwnerCategorySection
              key={cat}
              title={cat}
              items={items}
              onToggleService={onToggleService}
              onEditServiceMeta={onEditServiceMeta}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}