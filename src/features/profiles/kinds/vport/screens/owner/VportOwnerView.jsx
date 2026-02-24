import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function OwnerActionCard({ title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="profiles-subcard w-full rounded-2xl p-4 text-left transition hover:bg-white/10"
    >
      <div className="text-sm font-black tracking-[0.6px] uppercase text-white">{title}</div>
      <div className="mt-2 text-sm profiles-muted leading-relaxed">{desc}</div>
    </button>
  );
}

export function VportOwnerView({ actorId }) {
  const navigate = useNavigate();

  const links = useMemo(
    () => [
      {
        title: "Dashboard",
        desc: "Open your owner dashboard and manage all modules.",
        onClick: () => navigate(`/actor/${actorId}/dashboard`),
      },
      {
        title: "Settings",
        desc: "Edit public details, hours, links, and profile info.",
        onClick: () => navigate(`/actor/${actorId}/settings`),
      },
      {
        title: "Ads Pipeline",
        desc: "Create and manage ads shown in your vport settings preview.",
        onClick: () => navigate(`/ads/vport/${actorId}`),
      },
    ],
    [navigate, actorId]
  );

  return (
    <section className="profiles-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">Owner</div>
          <div className="mt-1 text-sm profiles-muted">Quick access to owner-only tools.</div>
        </div>
        <div className="profiles-pill-btn px-3 py-1 text-xs font-semibold">Private</div>
      </div>

      <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {links.map((link) => (
          <OwnerActionCard
            key={link.title}
            title={link.title}
            desc={link.desc}
            onClick={link.onClick}
          />
        ))}
      </div>
    </section>
  );
}

export default VportOwnerView;
