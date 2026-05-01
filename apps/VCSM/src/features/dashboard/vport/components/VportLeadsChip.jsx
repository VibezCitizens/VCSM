import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIdentity } from "@/state/identity/identityContext";
import { useVportNewLeadsCount } from "@/features/dashboard/vport/hooks/useVportNewLeadsCount";

export function VportLeadsChip() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { identity } = useIdentity();

  const isVport = identity?.kind === "vport";
  const actorId = isVport ? identity?.actorId : null;
  const count = useVportNewLeadsCount(actorId);

  const leadsPath = actorId ? `/actor/${actorId}/dashboard/leads` : null;
  const isOnLeadsPage = leadsPath ? pathname.startsWith(leadsPath) : false;

  if (!isVport || !actorId || count === 0 || isOnLeadsPage) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(leadsPath)}
      style={{
        position: "fixed",
        bottom: "calc(var(--vc-bottom-nav-height, 80px) + 10px)",
        right: 16,
        zIndex: 8500,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px 8px 10px",
        borderRadius: 9999,
        border: "1px solid rgba(239,68,68,0.40)",
        background: "rgba(15,13,26,0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(239,68,68,0.28), 0 0 0 1px rgba(239,68,68,0.18)",
        cursor: "pointer",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
      aria-label={`${count} new lead${count !== 1 ? "s" : ""}`}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#ef4444",
          flexShrink: 0,
          boxShadow: "0 0 6px rgba(239,68,68,0.80)",
          animation: "leads-pulse 1.8s ease-in-out infinite",
        }}
      />
      LEADS
      <span
        style={{
          minWidth: 20,
          height: 20,
          borderRadius: 9999,
          background: "#ef4444",
          color: "#fff",
          fontSize: 11,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 5px",
          lineHeight: 1,
        }}
      >
        {count > 99 ? "99+" : count}
      </span>

      <style>{`
        @keyframes leads-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </button>
  );
}

export default VportLeadsChip;
