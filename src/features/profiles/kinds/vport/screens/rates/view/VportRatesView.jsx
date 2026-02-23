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
    return <div className="p-6 text-sm text-neutral-400">Invalid vport.</div>;
  }

  if (q.isLoading) {
    return (
      <div className="p-6">
        <div className="h-5 w-40 bg-neutral-800 rounded mb-2" />
        <div className="h-4 w-72 bg-neutral-800 rounded mb-6" />
        <div className="h-28 bg-neutral-900/60 border border-neutral-800 rounded-2xl mb-3" />
        <div className="h-28 bg-neutral-900/60 border border-neutral-800 rounded-2xl mb-3" />
        <div className="h-28 bg-neutral-900/60 border border-neutral-800 rounded-2xl mb-3" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="text-lg font-semibold text-white">{title}</div>
        <div className="text-sm text-neutral-400">{subtitle}</div>

        <div className="text-[12px] text-neutral-500 mt-2">
          Last updated:{" "}
          <span className="text-neutral-300">{fmtTs(lastUpdated)}</span>
        </div>

        {error ? (
          <div className="mt-3 text-sm text-red-400">
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