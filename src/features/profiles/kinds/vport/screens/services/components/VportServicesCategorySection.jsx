// src/features/profiles/kinds/vport/screens/services/components/VportServicesCategorySection.jsx
import React from "react";
import VportServiceBadge from "./VportServiceBadge";

export default function VportServicesCategorySection({
  title,
  items = [],
  columns = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  // optional (owner/edit mode)
  onToggleService = null, // ({ key, enabled }) => void
  onEditServiceMeta = null, // ({ key }) => void
}) {
  if (!items?.length) return null;

  const canToggle = typeof onToggleService === "function";
  const canEdit = typeof onEditServiceMeta === "function";

  return (
    <section className="profiles-subcard rounded-3xl border border-white/12 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-300/85">
          {title || "Other"}
        </div>
        <div className="rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-200/85">
          {items.length} {items.length === 1 ? "service" : "services"}
        </div>
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
