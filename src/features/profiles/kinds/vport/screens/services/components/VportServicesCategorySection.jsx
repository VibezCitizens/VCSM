// src/features/profiles/kinds/vport/screens/services/components/VportServicesCategorySection.jsx
import React from "react";
import VportServiceBadge from "./VportServiceBadge";

export default function VportServicesCategorySection({
  title,
  items = [],
  columns = "grid-cols-1 sm:grid-cols-2",
  // optional (owner/edit mode)
  onToggleService = null, // ({ key, enabled }) => void
  onEditServiceMeta = null, // ({ key }) => void
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
          const key = x.key ?? x.serviceKey ?? x.id ?? x.label;
          const label = x.label ?? x.name ?? x.key ?? "Service";
          const enabled =
            typeof x.enabled === "boolean"
              ? x.enabled
              : typeof x.is_enabled === "boolean"
                ? x.is_enabled
                : true;

          const k = String(key);

          // default (viewer): no interactivity
          if (!canToggle && !canEdit) {
            return (
              <VportServiceBadge
                key={k}
                label={label}
                enabled={enabled}
                meta={x.meta ?? x.details ?? x.note ?? null}
              />
            );
          }

          // owner/edit: make the whole badge tappable for toggle.
          // (keeps VportServiceBadge untouched)
          return (
            <button
              key={k}
              type="button"
              onClick={
                canToggle
                  ? () => onToggleService({ key: k, enabled: !enabled })
                  : undefined
              }
              onDoubleClick={
                canEdit ? () => onEditServiceMeta({ key: k }) : undefined
              }
              className="text-left"
            >
              <VportServiceBadge
                label={label}
                enabled={enabled}
                meta={x.meta ?? x.details ?? x.note ?? null}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}