import React from "react";

function fmtNum(v) {
  if (v === null || v === undefined) return "--";
  const n = Number(v);
  if (!Number.isFinite(n)) return "--";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

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

function toFinite(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmtSpread(v) {
  if (!Number.isFinite(v)) return "--";
  return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default function VportRateCard({
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
  updatedAt,
} = {}) {
  const safeBase = (baseCurrency ?? "--").toString().toUpperCase();
  const safeQuote = (quoteCurrency ?? "--").toString().toUpperCase();

  const buy = toFinite(buyRate);
  const sell = toFinite(sellRate);

  const mid =
    buy !== null && sell !== null ? (buy + sell) / 2 : buy ?? sell ?? null;
  const spread =
    buy !== null && sell !== null ? Math.abs(sell - buy) : null;

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-sky-300/15 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(56,189,248,0.12),rgba(15,23,42,0.88)_42%,rgba(2,6,23,0.98)_100%)] shadow-[0_16px_34px_-24px_rgba(56,189,248,0.7)]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-[0.12em] text-slate-300/80">Pair</span>
            <span className="font-mono text-sm font-semibold text-slate-100">{safeBase}/{safeQuote}</span>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Updated</div>
            <div className="text-[11px] text-slate-200">{fmtTs(updatedAt)}</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-emerald-200/75">Buy</div>
            <div className="mt-1 text-2xl font-semibold leading-none text-emerald-100">{fmtNum(buyRate)}</div>
          </div>

          <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-amber-200/75">Sell</div>
            <div className="mt-1 text-2xl font-semibold leading-none text-amber-100">{fmtNum(sellRate)}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Mid</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-100">{fmtNum(mid)}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Spread</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-100">{fmtSpread(spread)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
