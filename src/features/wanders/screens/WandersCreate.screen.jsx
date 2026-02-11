// src/features/wanders/screens/WandersCreate.screen.jsx
import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import CardBuilder from "@/features/wanders/components/cardstemplates/CardBuilder";
import { publishWandersFromBuilder } from "@/features/wanders/core/controllers/publishWandersFromBuilder.controller";

export default function WandersCreateScreen({ realmId: realmIdProp, baseUrl: baseUrlProp }) {
  const navigate = useNavigate();
  const location = useLocation();

  const realmId = realmIdProp || location?.state?.realmId || null;

  const baseUrl = useMemo(() => {
    if (baseUrlProp) return baseUrlProp;
    if (location?.state?.baseUrl) return location.state.baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, [baseUrlProp, location?.state?.baseUrl]);

  const { ensureUser } = useWandersGuest({ auto: true });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = useCallback(
    async (payload) => {
      if (!realmId) return;

      setSubmitting(true);
      setError(null);

      try {
        await Promise.resolve(ensureUser?.());

        const res = await publishWandersFromBuilder({
          realmId,
          baseUrl,
          payload,
        });

        const publicId = res?.publicId || null;
        const url = res?.url || null;

        if (publicId) {
          navigate(`/wanders/sent/${publicId}`);
          return;
        }
        if (url) window.location.assign(url);
      } catch (e) {
        setError(e);
      } finally {
        setSubmitting(false);
      }
    },
    [realmId, ensureUser, baseUrl, navigate]
  );

  if (!realmId) {
    return <WandersEmptyState title="Missing realm" subtitle="Pass realmId into WandersCreateScreen." />;
  }

  return (
    <div className="relative h-screen w-full overflow-y-auto touch-pan-y bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-lg font-bold tracking-wide">Create a Card</h1>
              <p className="mt-1 text-sm text-zinc-300">Pick a style, write a message, share a link.</p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/wanders")}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-6">
        {submitting ? <WandersLoading /> : null}

        <CardBuilder
          defaultCardType="generic"
          loading={submitting}
          error={error}
          onSubmit={onSubmit}
        />
      </main>
    </div>
  );
}
