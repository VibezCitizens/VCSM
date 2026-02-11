// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersHome.screen.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import { resolveRealm } from "@/features/upload/model/resolveRealm";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

export default function WandersHomeScreen() {
  const navigate = useNavigate();

  // ✅ New architecture: guest auth identity (auth.users.id)
  const { ensureUser } = useWandersGuest();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publicInboxIdOrUrl, setPublicInboxIdOrUrl] = useState("");

  const baseUrl = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, []);

  const realmId = resolveRealm(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.resolve(ensureUser?.());
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureUser]);

  const parsedPublicInboxId = useMemo(() => {
    const raw = (publicInboxIdOrUrl || "").trim();
    if (!raw) return "";

    try {
      const maybeUrl = raw.startsWith("http://") || raw.startsWith("https://") ? new URL(raw) : null;
      const path = maybeUrl ? maybeUrl.pathname : raw;
      const match = path.match(/\/wanders\/i\/([^/?#]+)/i);
      if (match?.[1]) return match[1];
    } catch {}

    const loose = raw.match(/(?:^|\/)i\/([^/?#]+)/i);
    if (loose?.[1]) return loose[1];

    return raw;
  }, [publicInboxIdOrUrl]);

  const goMailbox = () => navigate("/wanders/mailbox");
  const goCreate = () =>
    navigate("/wanders/create", {
      state: { realmId, baseUrl },
    });

  const goPublicInbox = () => {
    const id = parsedPublicInboxId;
    if (!id) return;
    navigate(`/wanders/i/${id}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") goPublicInbox();
  };

  if (loading) return <WandersLoading />;

  if (error) {
    return <WandersEmptyState title="Wanders unavailable" subtitle={String(error?.message || error)} />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-y-auto touch-pan-y bg-black text-white">
      {/* neutral modern background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_360px_at_50%_-140px,rgba(255,255,255,0.10),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_15%_0%,rgba(148,163,184,0.14),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(650px_240px_at_85%_0%,rgba(203,213,225,0.10),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold tracking-wide">Wanders</h1>
                <p className="mt-1 text-sm text-zinc-300">
                  Simple cards and anonymous replies — fast, private, and clean.
                </p>
              </div>

              <div className="hidden sm:block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
                Neutral • Mobile-first
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-28 pt-6">
        <div className="grid gap-4">
          {/* HERO / PRIMARY CTA */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Start</div>
                <div className="mt-1 text-sm text-zinc-300">
                  Create a card in seconds or open your mailbox.
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-zinc-200">
                💌
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {/* PRIMARY */}
              <button
                type="button"
                onClick={goCreate}
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-zinc-100 active:scale-[0.99]"
              >
                Create a card
              </button>

              {/* SECONDARY */}
              <button
                type="button"
                onClick={goMailbox}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 active:scale-[0.99]"
              >
                Open mailbox
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                🔒 Guest-safe
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                🕊️ Anonymous-friendly
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                ⚡ Mobile-first
              </span>
            </div>
          </div>

          {/* OPEN PUBLIC INBOX */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Open an inbox</div>
                <div className="mt-1 text-sm text-zinc-300">Paste an inbox link or just the id.</div>
              </div>
              <div className="text-xs text-zinc-400">Shareable</div>
            </div>

            <div className="mt-4 grid gap-2">
              <input
                value={publicInboxIdOrUrl}
                onChange={(e) => setPublicInboxIdOrUrl(e.target.value)}
                placeholder="Paste /wanders/i/:publicId or just :publicId"
                onKeyDown={onKeyDown}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />

              <button
                type="button"
                onClick={goPublicInbox}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 active:scale-[0.99]"
              >
                Open inbox
              </button>
            </div>

            <div className="mt-2 text-xs text-zinc-400">
              Example: <span className="font-mono text-zinc-300">/wanders/i/abc123</span>
            </div>
          </div>

          <div className="text-xs text-zinc-500">
            Tip: After you create a card, you’ll see the dashboard on the “sent” screen.
          </div>
        </div>
      </main>
    </div>
  );
}
