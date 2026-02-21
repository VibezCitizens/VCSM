// src/features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function VportOwnerView({ actorId }) {
  const navigate = useNavigate();

  const links = useMemo(
    () => [
      {
        title: "Dashboard",
        desc: "Owner-only hub: tools and insights.",
        // ✅ actor-first route (no vportId ambiguity)
        onClick: () => navigate(`/actor/${actorId}/dashboard`),
      },
    ],
    [navigate, actorId]
  );

  return (
    <div className="p-3">
      <div className="mb-4">
        <div className="text-base font-black">Owner</div>
        <div className="mt-1 text-sm text-white/60">
          Quick access to manage your vport.
        </div>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {links.map((x) => (
          <div
            key={x.title}
            role="button"
            tabIndex={0}
            onClick={x.onClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") x.onClick();
            }}
            className="
              select-none cursor-pointer
              rounded-[18px]
              border border-white/10
              bg-white/5
              p-4
              shadow-[0_18px_50px_rgba(0,0,0,0.45)]
              hover:bg-white/10
              focus:outline-none focus:ring-2 focus:ring-white/20
            "
          >
            <div className="text-sm font-black tracking-[0.6px] uppercase">
              {x.title}
            </div>
            <div className="mt-2 text-sm text-white/60 leading-relaxed">
              {x.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VportOwnerView;