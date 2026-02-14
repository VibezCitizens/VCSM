// src/features/wanders/screens/view/WandersSent.view.jsx
import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useWandersCards } from "@/features/wanders/core/hooks/useWandersCards.hook";

import WandersLoading from "@/features/wanders/components/WandersLoading";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";

import WandersSharePreview from "@/features/wanders/components/WandersSharePreview";
import WandersShareVCSM from "@/features/wanders/components/WandersShareVCSM";

import { WANDERS_CHROME as C } from "@/features/wanders/utils/wandersChrome";

export default function WandersSentView({ cardPublicId, realmId, baseUrl }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { readByPublicId } = useWandersCards();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const resolvedBaseUrl = useMemo(() => {
    if (baseUrl) return baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, [baseUrl]);

  const mailboxHref = useMemo(() => {
    if (!resolvedBaseUrl) return "/wanders/mailbox?mode=sent";
    return `${String(resolvedBaseUrl).replace(/\/+$/, "")}/wanders/mailbox?mode=sent`;
  }, [resolvedBaseUrl]);

  const fromPath = useMemo(() => {
    const p = location?.pathname || "/wanders/sent";
    const s = location?.search || "";
    return `${p}${s}`;
  }, [location?.pathname, location?.search]);

  React.useEffect(() => {
    if (!cardPublicId) {
      setLoading(false);
      setCard(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const result = await Promise.resolve(readByPublicId?.(cardPublicId));
        if (cancelled) return;
        setCard(result || null);
      } catch (e) {
        if (cancelled) return;
        setCard(null);
        setLoadError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cardPublicId, readByPublicId]);

  const goMailbox = useCallback(() => {
    navigate("/wanders/mailbox?mode=sent");
  }, [navigate]);

  const goCreate = useCallback(() => {
    navigate("/wanders/create", { state: { realmId, baseUrl: resolvedBaseUrl } });
  }, [navigate, realmId, resolvedBaseUrl]);

  if (loading) return <WandersLoading />;

  if (!cardPublicId) {
    return <WandersEmptyState title="Missing card id" subtitle="We couldn’t find a card public id in the URL." />;
  }

  if (!card) {
    return (
      <WandersEmptyState
        title="Card not found"
        subtitle={loadError ? String(loadError?.message || loadError) : "This card link is invalid or the card is unavailable."}
      />
    );
  }

  return (
    <div className={C.shell}>
      <div aria-hidden className={C.bgGlow} />

      <header className={C.header}>
        <div className={C.container}>
          <div className={C.headerPad}>
            <h1 className={C.headerTitle}>Sent 🎉</h1>
            <p className={C.headerSub}>Your card is ready — share it or manage your inbox.</p>
          </div>
        </div>
      </header>

      <main className={C.main}>
        <WandersSharePreview cardPublicId={cardPublicId} card={card} baseUrl={resolvedBaseUrl} />

        <div className="mt-5 grid gap-3 md:gap-4 md:grid-cols-2">
          <div className={C.dashBox}>
            <div aria-hidden className={C.glowTL} />
            <div aria-hidden className={C.glowBR} />
            <div className="relative">
              <div className="text-sm font-semibold text-white/90">Your WVOX</div>

              <div className={["mt-1", C.muted].join(" ")}>
                Guest mailboxes are stored on this device. If you clear site data, switch devices, or your browser
                blocks storage, you can lose access. Create an account to keep your WVOX forever.
              </div>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={goMailbox} className={["flex-1", C.btnLift].join(" ")}>
                  <span aria-hidden className={C.btnSheen} />
                  <span aria-hidden className={C.btnInnerRing} />
                  <span className="relative">Open WVOX</span>
                </button>
              </div>

              <span className="sr-only">{mailboxHref}</span>
            </div>
          </div>

          <div className={C.dashBox}>
            <div aria-hidden className={C.glowTL} />
            <div aria-hidden className={C.glowBR} />
            <div className="relative">
              <div className="text-sm font-semibold text-white/90">Send another</div>
              <div className={["mt-1", C.muted].join(" ")}>Create a new Wander card and share it.</div>

              <div className="mt-4">
                <button type="button" onClick={goCreate} className={["w-full", C.btnLift].join(" ")}>
                  <span aria-hidden className={C.btnSheen} />
                  <span aria-hidden className={C.btnInnerRing} />
                  <span className="relative">Create a Wander Card</span>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <WandersShareVCSM cardPublicId={cardPublicId} fromPath={fromPath} />
          </div>

          <div className="md:col-span-2">
            <div className={C.tip}>Tip: Create an account to keep your mailbox across devices and never lose access.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
