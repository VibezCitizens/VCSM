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
    <div className="relative h-screen w-full overflow-y-auto touch-pan-y bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="py-3">
            <h1 className="text-lg font-bold tracking-wide">Wanders</h1>
            <p className="mt-1 text-sm text-zinc-300">Create a card, or open an inbox link.</p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-6">
        <div className="grid gap-4">
          {/* Primary actions */}
          <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-sm">
            <div className="text-sm font-semibold">Start</div>
            <div className="mt-1 text-sm text-gray-700">Create your first card or manage your mailbox.</div>

            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={goCreate}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 active:scale-[0.99]"
              >
                Create a card
              </button>

              <button
                type="button"
                onClick={goMailbox}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 active:scale-[0.99]"
              >
                Open mailbox
              </button>
            </div>
          </div>

          {/* Open public inbox */}
          <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-sm">
            <div className="text-sm font-semibold">Open an inbox link</div>
            <div className="mt-1 text-sm text-gray-700">Paste a public inbox link or id.</div>

            <div className="mt-4 grid gap-2 sm:flex sm:items-center">
              <input
                value={publicInboxIdOrUrl}
                onChange={(e) => setPublicInboxIdOrUrl(e.target.value)}
                placeholder="Paste /wanders/i/:publicId or just :publicId"
                onKeyDown={onKeyDown}
                className="w-full flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400"
              />

              <button
                type="button"
                onClick={goPublicInbox}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 active:scale-[0.99]"
              >
                Go
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-600">
              Example: <span className="font-mono">/wanders/i/abc123</span>
            </div>
          </div>

          <div className="text-xs text-zinc-400">
            Tip: After you create a card, you’ll see the full dashboard on the “sent” screen.
          </div>
        </div>
      </main>
    </div>
  );
}
