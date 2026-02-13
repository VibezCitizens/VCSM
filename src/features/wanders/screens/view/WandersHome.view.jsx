// src/features/wanders/screens/view/WandersHome.view.jsx

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
    return (
      <WandersEmptyState
        title="Wanders unavailable"
        subtitle={String(error?.message || error)}
      />
    );
  }

  const actionBtn =
    [
      "relative overflow-hidden",
      "w-full",
      "rounded-2xl",
      "border border-white/10",
      "bg-white/5",
      "px-4 py-3",
      "text-sm font-semibold text-white",
      "shadow-[0_10px_26px_rgba(0,0,0,0.75)]",
      "transition",
      "hover:bg-white/10",
      "active:scale-[0.99]",
      "focus:outline-none focus:ring-2 focus:ring-violet-500/35 focus:ring-offset-0",
    ].join(" ");

  const actionSheen =
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_55%)]";

  const actionInnerRing =
    "pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10";

  return (
    <div className={C.shell}>
      <div aria-hidden className={C.bgGlow} />

      <header className={C.header}>
        {/* ✅ keep header centered tighter too */}
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className={C.headerPad}>
            <h1 className={C.headerTitle}>Wanders</h1>
            <p className={C.headerSub}>
              Digital cards made to be shared — designed for connection.
            </p>
          </div>
        </div>
      </header>

      <main className={C.main}>
        {/* ✅ force the whole page content to be a centered column */}
        <div className="mx-auto w-full max-w-2xl">
          <div className="grid gap-4">
            <div className={C.dashBox}>
              <div aria-hidden className={C.glowTL} />
              <div aria-hidden className={C.glowBR} />

              <div className="relative">
                <div>
                  <div className="text-sm font-semibold text-white/90">Start</div>
                  <div className={["mt-1", C.muted].join(" ")}>
                    Create a card in seconds, share a link, and collect replies.
                  </div>
                </div>

                <div className="mt-6">
                  <button type="button" onClick={goCreate} className={actionBtn}>
                    <span aria-hidden className={actionSheen} />
                    <span aria-hidden className={actionInnerRing} />
                    <span className="relative">Create a card</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={C.tip}>
              Tip: After you create a card, you’ll see the dashboard on the “sent” screen.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
