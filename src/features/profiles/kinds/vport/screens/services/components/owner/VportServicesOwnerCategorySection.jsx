// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\services\components\owner\VportServicesOwnerCategorySection.jsx

import React from "react";
import VportServiceBadge from "@/features/profiles/kinds/vport/screens/services/components/VportServiceBadge";

function toKey(v) {
  return (v ?? "").toString().trim();
}

export default function VportServicesOwnerCategorySection({
  title,
  items = [],
  onToggleService = null, // ({ key, enabled }) => void
  onEditServiceMeta = null, // ({ key }) => void
  columns = "grid-cols-1 sm:grid-cols-2",
}) {
  if (!items?.length) return null;

  const canToggle = typeof onToggleService === "function";
  const canEdit = typeof onEditServiceMeta === "function";

  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-xs font-black tracking-[0.6px] uppercase text-white/70">
        {title || "Other"}
      </div>

      <div className={["mt-4 grid gap-3", columns].join(" ")}>
        {items.map((x) => {
          const rawKey = x?.key ?? x?.serviceKey ?? x?.id ?? x?.label;
          const k = toKey(rawKey);
          if (!k) return null;

          const label = x?.label ?? x?.name ?? x?.key ?? "Service";
          const enabled =
            typeof x?.enabled === "boolean"
              ? x.enabled
              : typeof x?.is_enabled === "boolean"
                ? x.is_enabled
                : true;

          const meta = x?.meta ?? x?.details ?? x?.note ?? null;

          // Make the badge clickable (toggle)
          return (
            <button
              key={k}
              type="button"
              className="text-left"
              onClick={
                canToggle
                  ? () => {
                      console.log("[OwnerCategorySection] toggle", {
                        key: k,
                        from: enabled,
                        to: !enabled,
                      });
                      onToggleService({ key: k, enabled: !enabled });
                    }
                  : undefined
              }
              onDoubleClick={
                canEdit
                  ? () => {
                      console.log("[OwnerCategorySection] edit meta", { key: k });
                      onEditServiceMeta({ key: k });
                    }
                  : undefined
              }
            >
              <VportServiceBadge label={label} enabled={enabled} meta={meta} />
            </button>
          );
        })}
      </div>
    </section>
  );
}