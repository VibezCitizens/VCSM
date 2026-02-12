// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersSent.screen.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useWandersCards } from "@/features/wanders/core/hooks/useWandersCards.hook";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";
import { resolveRealm } from "@/features/upload/model/resolveRealm";

import WandersSharePreview from "../components/WandersSharePreview";
import WandersShareVCSM from "../components/WandersShareVCSM";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function WandersSentScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const query = useQuery();

  const { readByPublicId } = useWandersCards();

  const cardPublicId = (params.cardPublicId || query.get("card") || "").trim();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [mailboxCopied, setMailboxCopied] = useState(false);

  const baseUrl = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
      }
    } catch {}
    return "";
  }, []);

  const realmId = resolveRealm(false);

  const mailboxLink = useMemo(() => {
    if (!baseUrl) return "/wanders/mailbox?mode=sent";
    return `${baseUrl}/wanders/mailbox?mode=sent`;
  }, [baseUrl]);

  useEffect(() => {
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

  const goMailbox = () => navigate("/wanders/mailbox?mode=sent");
  const goCreate = () => navigate("/wanders/create", { state: { realmId, baseUrl } });

  const handleCopyMailbox = async () => {
    try {
      await navigator.clipboard.writeText(mailboxLink);
      setMailboxCopied(true);
      setTimeout(() => setMailboxCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy mailbox link", e);
    }
  };

  if (loading) return <WandersLoading />;

  if (!cardPublicId) {
    return <WandersEmptyState title="Missing card id" subtitle="We couldn’t find a card public id in the URL." />;
  }

  if (!card) {
    return (
      <WandersEmptyState
        title="Card not found"
        subtitle={
          loadError
            ? String(loadError?.message || loadError)
            : "This card link is invalid or the card is unavailable."
        }
      />
    );
  }

  const dashBox =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4 text-white backdrop-blur-xl " +
    "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.10)]";

  const glowTL =
    "pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl";
  const glowBR =
    "pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/08 blur-3xl";

  // ✅ MORE VISUAL BUTTON (clear separation + sheen + stronger edge glow)
  const btnLift =
    [
      "relative overflow-hidden",
      "rounded-xl",
      "bg-zinc-900/90",
      "border border-white/15",
      "px-4 py-3",
      "text-sm font-semibold text-white",
      // stronger elevation
      "shadow-[0_10px_26px_rgba(0,0,0,0.75)]",
      "transition",
      // hover pop + violet edge (subtle but visible)
      "hover:bg-zinc-900 hover:border-white/25",
      "hover:shadow-[0_14px_34px_rgba(0,0,0,0.78),0_0_26px_rgba(124,58,237,0.22)]",
      "active:scale-[0.99]",
      "focus:outline-none focus:ring-2 focus:ring-violet-500/35 focus:ring-offset-0",
    ].join(" ");

  // sheen layer (top highlight) — gives “button” look, not flat
  const btnSheen =
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_55%)]";

  // tiny inner ring for definition
  const btnInnerRing = "pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10";

  return (
    <div className="relative h-screen w-full overflow-y-auto touch-pan-y bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="py-3">
            <h1 className="text-lg font-bold tracking-wide">Sent 🎉</h1>
            <p className="mt-1 text-sm text-zinc-300">
              Your card is ready — share it or manage your inbox.
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-5">
        <WandersSharePreview cardPublicId={cardPublicId} card={card} baseUrl={baseUrl} />

        <div className="mt-5 grid gap-3 md:gap-4 md:grid-cols-2">
          <div className={dashBox}>
            <div aria-hidden className={glowTL} />
            <div aria-hidden className={glowBR} />
            <div className="relative">
              <div className="text-sm font-semibold text-white/90">Your WVOX</div>
              <div className="mt-1 text-sm text-white/60">View your incoming and sent cards.</div>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={goMailbox} className={["flex-1", btnLift].join(" ")}>
                  <span aria-hidden className={btnSheen} />
                  <span aria-hidden className={btnInnerRing} />
                  <span className="relative">Open WVOX</span>
                </button>

                <button type="button" onClick={handleCopyMailbox} className={["flex-1", btnLift].join(" ")}>
                  <span aria-hidden className={btnSheen} />
                  <span aria-hidden className={btnInnerRing} />
                  <span className="relative">{mailboxCopied ? "Copied ✓" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className={dashBox}>
            <div aria-hidden className={glowTL} />
            <div aria-hidden className={glowBR} />
            <div className="relative">
              <div className="text-sm font-semibold text-white/90">Send another</div>
              <div className="mt-1 text-sm text-white/60">Create a new Wander card and share it.</div>

              <div className="mt-4">
                <button type="button" onClick={goCreate} className={["w-full", btnLift].join(" ")}>
                  <span aria-hidden className={btnSheen} />
                  <span aria-hidden className={btnInnerRing} />
                  <span className="relative">Create a Wander Card</span>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <WandersShareVCSM cardPublicId={cardPublicId} fromPath="/wanders/sent" />
          </div>

          <div className="md:col-span-2">
            <div className="pt-1 text-xs text-zinc-400">
              Tip: Save your mailbox link — it always shows your full Wander history.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
