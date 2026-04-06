// src/features/profiles/kinds/vport/screens/services/components/VportServicesEmptyState.jsx
import React from "react";
import { ShieldCheck, Sparkles, TimerReset } from "lucide-react";

const PREVIEW_CAPABILITIES = [
  {
    key: "quality",
    icon: ShieldCheck,
    title: "Quality Assured",
    subtitle: "Verified service standards and consistency checks.",
  },
  {
    key: "experience",
    icon: Sparkles,
    title: "Premium Experience",
    subtitle: "A curated service stack is being prepared for this vport.",
  },
  {
    key: "launch",
    icon: TimerReset,
    title: "Launching Soon",
    subtitle: "Capabilities will appear here as soon as they are published.",
  },
];

export default function VportServicesEmptyState({
  title = "Service catalog is being prepared",
  subtitle = "No services are published yet, but this page is ready for a full capability rollout.",
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-slate-950/80 via-[#0b1324]/75 to-[#051420]/80 p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-14 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative">
        <div className="text-base font-semibold text-white sm:text-lg">{title}</div>
        <div className="mt-1 text-sm text-slate-300/75">{subtitle}</div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {PREVIEW_CAPABILITIES.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.key}
                className="rounded-2xl border border-white/12 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl border border-sky-300/30 bg-sky-300/10 text-sky-200">
                    <Icon size={16} />
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-300/70">{item.subtitle}</div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
