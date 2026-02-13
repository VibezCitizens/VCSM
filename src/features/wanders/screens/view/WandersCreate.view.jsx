// src/features/wanders/screens/WandersCreate.screen.jsx
import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import WandersLoading from "@/features/wanders/components/WandersLoading";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import CardBuilder from "@/features/wanders/components/cardstemplates/CardBuilder";
import { publishWandersFromBuilder } from "@/features/wanders/core/controllers/publishWandersFromBuilder.controller";

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

              <button type="button" onClick={() => navigate("/wanders")} className={C.btnLift}>
                <span aria-hidden className={C.btnSheen} />
                <span aria-hidden className={C.btnInnerRing} />
                <span className="relative">Back</span>
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
