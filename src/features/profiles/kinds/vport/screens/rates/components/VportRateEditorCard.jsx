import React, { useMemo } from "react";

function normCode(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function isFiniteNum(v) {
  if (v === "" || v === null || v === undefined) return true;
  return Number.isFinite(Number(v));
}

export default function VportRateEditorCard({
  title = "Update Rate",
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
  onChangeBaseCurrency,
  onChangeQuoteCurrency,
  onChangeBuyRate,
  onChangeSellRate,
  onSubmit,
  submitting = false,
  error = null,
  disabled = false,
} = {}) {
  const safeBase = normCode(baseCurrency);
  const safeQuote = normCode(quoteCurrency);

  const canSubmit = useMemo(() => {
    if (disabled) return false;
    if (!safeBase || !safeQuote || safeBase === safeQuote) return false;
    return isFiniteNum(buyRate) && isFiniteNum(sellRate);
  }, [disabled, safeBase, safeQuote, buyRate, sellRate]);

  const pairLabel = safeBase && safeQuote ? `${safeBase}/${safeQuote}` : "Select pair";

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-sky-300/20 bg-[linear-gradient(145deg,rgba(56,189,248,0.13),rgba(15,23,42,0.45)_42%,rgba(2,6,23,0.88)_100%)] p-4 shadow-[0_14px_30px_-22px_rgba(56,189,248,0.65)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          <div className="mt-1 text-xs text-slate-300/80">Publish official buy/sell rates per currency pair.</div>
        </div>

        <div className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Pair</span>
          <span className="ml-2 font-mono text-sm font-semibold text-slate-100">{pairLabel}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Base currency</div>
          <input
            value={baseCurrency ?? ""}
            onChange={(e) => onChangeBaseCurrency?.(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none"
            placeholder="USD"
            maxLength={10}
            disabled={disabled || submitting}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Quote currency</div>
          <input
            value={quoteCurrency ?? ""}
            onChange={(e) => onChangeQuoteCurrency?.(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none"
            placeholder="MXN"
            maxLength={10}
            disabled={disabled || submitting}
          />
        </div>

        <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-emerald-200/80">Buy</div>
          <input
            value={buyRate ?? ""}
            onChange={(e) => onChangeBuyRate?.(e.target.value)}
            className="mt-2 w-full rounded-xl border border-emerald-300/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
            placeholder="17.20"
            inputMode="decimal"
            disabled={disabled || submitting}
          />
        </div>

        <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-amber-200/80">Sell</div>
          <input
            value={sellRate ?? ""}
            onChange={(e) => onChangeSellRate?.(e.target.value)}
            className="mt-2 w-full rounded-xl border border-amber-300/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
            placeholder="17.45"
            inputMode="decimal"
            disabled={disabled || submitting}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-3 profiles-error rounded-xl p-3 text-sm">{String(error)}</div>
      ) : null}

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            if (!canSubmit) return;
            onSubmit?.();
          }}
          className="rounded-xl border border-sky-300/40 bg-sky-300/20 px-4 py-2 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-300/30 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!canSubmit || submitting}
        >
          {submitting ? "Saving..." : "Publish Rate"}
        </button>
      </div>
    </div>
  );
}
