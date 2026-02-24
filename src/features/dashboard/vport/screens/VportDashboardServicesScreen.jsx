// src/features/dashboard/vport/screens/VportDashboardServicesScreen.jsx

import React, { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import VportServicesView from "@/features/profiles/kinds/vport/screens/services/view/VportServicesView";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";

export function VportDashboardServicesScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const isDesktop = useDesktopBreakpoint();
  const viewerActorId = identity?.actorId ?? null;
  const isOwner =
    Boolean(actorId) &&
    Boolean(viewerActorId) &&
    String(viewerActorId) === String(actorId);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  if (identityLoading) {
    return <div className="p-10 text-center text-neutral-400">Loading...</div>;
  }

  if (!identity) {
    return (
      <div className="p-10 text-center text-neutral-400">Sign in required.</div>
    );
  }

  if (!actorId) {
    return <div className="p-6 text-sm text-neutral-400">Invalid vport.</div>;
  }

  if (!isOwner) {
    return (
      <div className="p-10 text-center text-neutral-400">
        You can only manage services for your own vport.
      </div>
    );
  }

  const content = (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
        color: "#fff",
        padding: 18,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isDesktop ? 1100 : 900,
          margin: "0 auto",
          paddingBottom: 56,
        }}
      >
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(12,14,24,0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: 14,
            }}
          >
            <button
              type="button"
              onClick={goBack}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
                letterSpacing: 0.3,
              }}
            >
              {isDesktop ? "<- Back" : "<"}
            </button>

            <div style={{ fontWeight: 950, letterSpacing: 1.2 }}>SERVICES</div>

            <div style={{ width: 110 }} />
          </div>

          <div style={{ padding: 16 }}>
            <VportServicesView
              actorId={actorId}
              viewerActorId={viewerActorId}
              allowOwnerEditing={true}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "auto",
          background: "#000",
        }}
      >
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

export default VportDashboardServicesScreen;

