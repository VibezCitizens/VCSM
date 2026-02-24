import React, { useMemo } from "react";

import useVportRates from "@/features/profiles/kinds/vport/hooks/rates/useVportRates.js";
import VportRateCard from "@/features/profiles/kinds/vport/screens/rates/components/VportRateCard.jsx";

function fmtTs(ts) {
  if (!ts) return "None yet";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "None yet";
  return d.toLocaleString();
}

export default function VportRatesView({
  profile = null,
  actorId: actorIdProp = null,
  rateType = "fx",
  title = "Exchange Rates",
  subtitle = "Official rates • last updated shown per pair",
} = {}) {
  const targetActorId = useMemo(() => {
    return actorIdProp ?? profile?.actorId ?? profile?.actor_id ?? null;
  }, [actorIdProp, profile]);

  const q = useVportRates({ targetActorId, rateType });

  const rates = q.data?.rates ?? [];
  const lastUpdated = q.data?.lastUpdated ?? null;
  const error = q.error ?? null;

  if (!targetActorId) {
    return <div className="p-6 text-sm profiles-muted">Invalid vport.</div>;
  }

  if (q.isLoading) {
    return (
      <div className="profiles-card p-6">
        <div className="h-5 w-40 bg-white/10 rounded mb-2" />
        <div className="h-4 w-72 bg-white/10 rounded mb-6" />
        <div className="h-28 profiles-subcard mb-3" />
        <div className="h-28 profiles-subcard mb-3" />
        <div className="h-28 profiles-subcard mb-3" />
      </div>
    );
  }

  return (
    <div className="profiles-card p-6">
      <div className="mb-4">
        <div className="text-lg font-semibold text-slate-100">{title}</div>
        <div className="text-sm text-slate-400">{subtitle}</div>

        <div className="text-[12px] text-slate-500 mt-2">
          Last updated:{" "}
          <span className="text-slate-300">{fmtTs(lastUpdated)}</span>
        </div>

        {error ? (
          <div className="mt-3 profiles-error rounded-xl p-3 text-sm">
            {String(error?.message ?? error)}
          </div>
        ) : null}
      </div>

      <div>
        {rates.length === 0 ? (
          <VportRateCard
            baseCurrency={null}
            quoteCurrency={null}
            buyRate={null}
            sellRate={null}
            updatedAt={null}
          />
        ) : (
          rates.map((r) => (
            <VportRateCard
              key={r.id}
              baseCurrency={r.baseCurrency}
              quoteCurrency={r.quoteCurrency}
              buyRate={r.buyRate}
              sellRate={r.sellRate}
              updatedAt={r.updatedAt}
            />
          ))
        )}
      </div>
    </div>
  );
}
