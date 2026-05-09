// src/features/profiles/kinds/vport/screens/services/components/VportServicesHeader.jsx
import React from "react";
import { useTranslation } from "@i18n";

export default function VportServicesHeader({
  title = "Services",
  subtitle = "Capabilities and amenities offered by this vport.",
  right = null,
  stats = [],
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/75">
            {t('vport.servicesView.catalog')}
          </div>
          <div className="mt-1 text-lg font-black text-white sm:text-xl">{title}</div>
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {subtitle ? (
        <div className="max-w-2xl text-sm text-white/70/80">{subtitle}</div>
      ) : null}

      {stats.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {stats.map((s) => (
            <div
              key={s?.label}
              className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs"
            >
              <span className="text-white/45">{s?.label}</span>
              <span className="ml-2 font-semibold text-white">{s?.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
