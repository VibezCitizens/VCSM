// src/features/wanders/screens/view/WandersHome.view.jsx
// ============================================================================
// WANDERS VIEW SCREEN — HOME
// Contract: Domain experience composition (hooks + UI).
// - no DAL, no Supabase
// - no controllers directly
// - navigation only as UI intent handlers
// ============================================================================

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import WandersLoading from "@/features/wanders/components/WandersLoading";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";

import { resolveRealm } from "@/features/upload/model/resolveRealm";
import { useWandersHomeExperience } from "@/features/wanders/core/hooks/useWandersHomeExperience.hook";

import { WANDERS_CHROME as C } from "@/features/wanders/utils/wandersChrome";

export default function WandersHomeView() {
  const navigate = useNavigate();

  const { loading, error } = useWandersHomeExperience();

  const baseUrl = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, []);

  const realmId = resolveRealm(false);

  const goCreate = () => navigate("/wanders/create", { state: { realmId, baseUrl } });

  if (loading) return <WandersLoading />;

  if (error) {
    return <WandersEmptyState title="Wanders unavailable" subtitle={String(error?.message || error)} />;
  }

  return (
    <div className={C.shell}>
      <div aria-hidden className={C.bgGlow} />

      <header className={C.header}>
        <div className={C.container}>
          <div className={C.headerPad}>
            <h1 className={C.headerTitle}>Wanders</h1>
            <p className={C.headerSub}>“Digital cards made to be shared — designed for connection.”</p>
          </div>
        </div>
      </header>

      <main className={C.main}>
        <div className="grid gap-3 md:gap-4">
          <div className={C.dashBox}>
            <div aria-hidden className={C.glowTL} />
            <div aria-hidden className={C.glowBR} />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white/90">Start</div>
                  <div className={["mt-1", C.muted].join(" ")}>
                    Create a card in seconds, share a link, and collect replies.
                  </div>
                </div>

                <div className={C.pill}></div>
              </div>

              <div className="mt-4 grid gap-2">
                <button type="button" onClick={goCreate} className={["w-full", C.btnLift].join(" ")}>
                  <span aria-hidden className={C.btnSheen} />
                  <span aria-hidden className={C.btnInnerRing} />
                  <span className="relative">Create a card</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={C.pill}>🔒 Guest-safe</span>
                <span className={C.pill}>🕊️ Anonymous-friendly</span>
                <span className={C.pill}>⚡ Mobile-first</span>
              </div>
            </div>
          </div>

          <div className={C.tip}>Tip: After you create a card, you’ll see the dashboard on the “sent” screen.</div>
        </div>
      </main>
    </div>
  );
}
