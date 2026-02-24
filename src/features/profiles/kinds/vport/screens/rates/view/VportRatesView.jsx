import React, { useMemo } from "react";

import useVportRates from "@/features/profiles/kinds/vport/hooks/rates/useVportRates.js";
import VportRateCard from "@/features/profiles/kinds/vport/screens/rates/components/VportRateCard.jsx";

function fmtTs(ts) {
  if (!ts) return "None yet";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "None yet";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function VportRatesView({
  profile = null,
  actorId: actorIdProp = null,
  rateType = "fx",
  title = "Exchange Rates",
  subtitle = "Official rates | last update shown per pair",
} = {}) {
  const targetActorId = useMemo(() => {
    return actorIdProp ?? profile?.actorId ?? profile?.actor_id ?? null;
  }, [actorIdProp, profile]);

  const q = useVportRates({ targetActorId, rateType });

  const rates = q.data?.rates ?? [];
  const lastUpdated = q.data?.lastUpdated ?? null;
  const error = q.error ?? null;

  const rankedRates = useMemo(() => {
    return [...rates].sort((a, b) => {
      const aMs = new Date(a?.updatedAt ?? 0).getTime();
      const bMs = new Date(b?.updatedAt ?? 0).getTime();
      return (Number.isFinite(bMs) ? bMs : 0) - (Number.isFinite(aMs) ? aMs : 0);
    });
  }, [rates]);

  const pairCount = rankedRates.length;

  if (!targetActorId) {
    return <div className="p-6 text-sm profiles-muted">Invalid vport.</div>;
  }

  if (q.isLoading) {
    return (
      <div className="profiles-card p-6">
        <div className="h-6 w-48 rounded bg-white/10" />
        <div className="mt-2 h-4 w-72 rounded bg-white/10" />
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="h-16 rounded-xl border border-white/10 bg-white/5" />
          <div className="h-16 rounded-xl border border-white/10 bg-white/5" />
          <div className="h-16 rounded-xl border border-white/10 bg-white/5" />
        </div>
        <div className="mt-4 h-40 rounded-2xl border border-white/10 bg-white/5" />
      </div>
    );
  }

  return (
    <div className="profiles-card p-6">
      <div className="rounded-2xl border border-sky-300/20 bg-[linear-gradient(140deg,rgba(56,189,248,0.12),rgba(15,23,42,0.4)_45%,rgba(2,6,23,0.7)_100%)] p-4">
        <div className="text-lg font-semibold text-slate-100">{title}</div>
        <div className="mt-1 text-sm text-slate-300/80">{subtitle}</div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Pairs tracked</div>
            <div className="mt-1 text-xl font-semibold text-white">{pairCount}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Rate type</div>
            <div className="mt-1 text-xl font-semibold text-emerald-200">{String(rateType || "fx").toUpperCase()}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Global update</div>
            <div className="mt-1 text-sm font-semibold text-white">{fmtTs(lastUpdated)}</div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 profiles-error rounded-xl p-3 text-sm">
          {String(error?.message ?? error)}
        </div>
      ) : null}

      <div className="mt-4">
        {pairCount === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-sm font-semibold text-slate-100">No exchange pairs yet</div>
            <div className="mt-1 text-xs text-slate-400">Create your first pair above to publish official rates.</div>
          </div>
        ) : (
          rankedRates.map((r) => (
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
