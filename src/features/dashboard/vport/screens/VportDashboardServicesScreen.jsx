// src/features/dashboard/vport/screens/VportDashboardServicesScreen.jsx

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import VportServicesView from "@/features/profiles/kinds/vport/screens/services/view/VportServicesView";

export function VportDashboardServicesScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  // ✅ reactive desktop detection (same breakpoint style you used)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 821px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(min-width: 821px)");
    const onChange = () => setIsDesktop(mq.matches);

    onChange();

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  if (identityLoading) {
    return <div className="p-10 text-center text-neutral-400">Loading…</div>;
  }

  if (!identity) {
    return (
      <div className="p-10 text-center text-neutral-400">Sign in required.</div>
    );
  }

  if (!actorId) {
    return <div className="p-6 text-sm text-neutral-400">Invalid vport.</div>;
  }

  const content = (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="h-full w-full overflow-y-auto touch-pan-y">
        <div className="px-4 pb-24 max-w-3xl mx-auto">
          <div className="pt-6 pb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="
                px-4 py-2 rounded-2xl
                bg-neutral-900 text-white
                border border-purple-700
                hover:border-purple-500
                focus:ring-2 focus:ring-purple-500
                font-black text-sm
              "
            >
              ← Back to Dashboard
            </button>

            <div className="text-xs font-black tracking-[0.25em] text-neutral-400">
              SERVICES
            </div>

            <div className="w-[170px]" />
          </div>

          <VportServicesView
            actorId={actorId}
            viewerActorId={identity.actorId}
            allowOwnerEditing={true}
          />
        </div>
      </div>
    </div>
  );

  // ✅ match dashboard behavior: desktop = fullscreen overlay
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