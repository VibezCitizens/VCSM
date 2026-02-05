// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersSent.screen.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useWandersCards } from "../hooks/useWandersCards";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";
import { resolveRealm } from "@/features/upload/model/resolveRealm";

// ✅ NEW: use the share+preview component
import WandersSharePreview from "../components/WandersSharePreview";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function WandersSentScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const query = useQuery();

  const { readByPublicId } = useWandersCards();

  // Support both:
  // /wanders/sent/:cardPublicId
  // /wanders/sent?card=:publicId
  const cardPublicId = (params.cardPublicId || query.get("card") || "").trim();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // keep consistent with AppRoutes (PUBLIC realm)
  const baseUrl = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, []);
  const realmId = resolveRealm(false);

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

  const inboxLink = useMemo(() => {
    const inboxPublicId =
      card?.inboxPublicId || card?.inbox?.publicId || card?.inboxPublic?.id || card?.inbox?.id;

    if (!inboxPublicId) return "";
    if (typeof window === "undefined") return `/wanders/i/${inboxPublicId}`;
    return `${window.location.origin}/wanders/i/${inboxPublicId}`;
  }, [card]);

  const handleCreateInbox = () => {
    navigate("/wanders/create", { state: { realmId, baseUrl } });
  };

  const handleViewOutbox = () => {
    navigate("/wanders/outbox");
  };

 const goMailbox = () => navigate("/wanders/mailbox?mode=sent");

  const goOutbox = () => navigate("/wanders/outbox");
  const goCreate = () => navigate("/wanders/create", { state: { realmId, baseUrl } });
  const goClaim = () => navigate("/wanders/claim");

  if (loading) return <WandersLoading />;

  if (!cardPublicId) {
    return (
      <WandersEmptyState title="Missing card id" subtitle="We couldn’t find a card public id in the URL." />
    );
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
            <p className="mt-1 text-sm text-zinc-300">Your card is ready — share it or manage your inbox.</p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-5">
        {/* ✅ Preview + share panel moved to component */}
        <WandersSharePreview
          cardPublicId={cardPublicId}
          card={card}
          baseUrl={baseUrl}
        />

        {/* ✅ The dashboard you want AFTER creating a card */}
        <div className="mt-5 grid gap-3 md:gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-sm">
            <div className="text-sm font-semibold">Your mailbox</div>
            <div className="mt-1 text-sm text-gray-700">Read incoming cards, reply, and organize.</div>
            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:gap-2">
              <button
                type="button"
                onClick={goMailbox}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
              >
                Open mailbox
              </button>
              <button
                type="button"
                onClick={goOutbox}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
              >
                View outbox
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-sm">
            <div className="text-sm font-semibold">Create an inbox</div>
            <div className="mt-1 text-sm text-gray-700">
              Generate a shareable link so anyone can send you cards.
            </div>
            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:gap-2">
              <button
                type="button"
                onClick={goCreate}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
              >
                Create inbox
              </button>
              <button
                type="button"
                onClick={goClaim}
                className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
              >
                Claim / connect account
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="pt-1 text-xs text-zinc-400">
              Tip: If you’re anon-only, you can still receive cards—connect later via{" "}
              <span className="font-mono">/wanders/claim</span>.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
