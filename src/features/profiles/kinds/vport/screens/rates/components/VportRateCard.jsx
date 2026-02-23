import React from "react";

function fmtNum(v) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toString();
}

function fmtTs(ts) {
  if (!ts) return "None yet";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "None yet";
  return d.toLocaleString();
}

export default function VportRateCard({
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
  updatedAt,
} = {}) {
  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-white">
          {baseCurrency ?? "—"} / {quoteCurrency ?? "—"}
        </div>
        <div className="text-[11px] text-neutral-400">
          LAST UPDATE: {fmtTs(updatedAt)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/30 border border-neutral-800 p-3">
          <div className="text-[10px] text-neutral-400 mb-1">BUY</div>
          <div className="text-xl font-bold text-white">{fmtNum(buyRate)}</div>
        </div>

        <div className="rounded-xl bg-black/30 border border-neutral-800 p-3">
          <div className="text-[10px] text-neutral-400 mb-1">SELL</div>
          <div className="text-xl font-bold text-white">{fmtNum(sellRate)}</div>
        </div>
      </div>
    </div>
  );
}