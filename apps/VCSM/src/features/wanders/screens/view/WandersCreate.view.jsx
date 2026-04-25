// src/features/wanders/screens/WandersCreate.screen.jsx
import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import WandersLoading from "@/features/wanders/components/WandersLoading";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import CardBuilder from "@/features/wanders/components/cardstemplates/CardBuilder";
import { usePublishWandersFromBuilder } from "@/features/wanders/core/hooks/usePublishWandersFromBuilder";

import { WANDERS_CHROME as C } from "@/features/wanders/utils/wandersChrome";

export default function WandersCreateScreen({ realmId: realmIdProp, baseUrl: baseUrlProp }) {
  const navigate = useNavigate();
  const location = useLocation();

  const realmId = realmIdProp || location?.state?.realmId || null;

  const baseUrl = useMemo(() => {
    if (baseUrlProp) return baseUrlProp;
    if (location?.state?.baseUrl) return location.state.baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch (_ERR) {
      void _ERR;
    }
    return "";
  }, [baseUrlProp, location?.state?.baseUrl]);

  const { ensureUser } = useWandersGuest({ auto: true });
  const publishWanders = usePublishWandersFromBuilder();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = useCallback(
    async (payload) => {
      if (!realmId) return;

      setSubmitting(true);
      setError(null);

      try {
        await Promise.resolve(ensureUser?.());

        const res = await publishWanders({
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
    [realmId, ensureUser, baseUrl, navigate, publishWanders]
  );

  if (!realmId) {
    return <WandersEmptyState title="Missing realm" subtitle="Pass realmId into WandersCreateScreen." />;
  }

  return (
    <div className={C.shell}>
      <div aria-hidden className={C.bgGlow} />

      <header className={C.header}>
        <div className={C.container}>
          <div className={C.headerPad}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className={C.headerTitle}>Create a Card</h1>
                <p className={C.headerSub}>Pick a style, write a message, share a link.</p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/wanders")}
                className={[
                  "inline-flex items-center gap-1.5 rounded-[10px] px-[14px] py-[8px]",
                  "border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] text-white",
                  "text-sm font-medium transition-all duration-200",
                  "hover:bg-[rgba(255,255,255,0.14)] active:scale-[0.97]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  "focus-visible:outline-[rgba(139,92,246,0.6)]",
                  "shadow-[0_8px_22px_rgba(0,0,0,0.32)] backdrop-blur-sm",
                ].join(" ")}
              >
                <ChevronLeft size={16} aria-hidden />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={C.main}>
        {submitting ? <WandersLoading /> : null}

        <div className={C.dashBox}>
          <div aria-hidden className={C.glowTL} />
          <div aria-hidden className={C.glowBR} />
          <div className="relative">
            <CardBuilder defaultCardType="generic" loading={submitting} error={error} onSubmit={onSubmit} />
          </div>
        </div>
      </main>
    </div>
  );
}
