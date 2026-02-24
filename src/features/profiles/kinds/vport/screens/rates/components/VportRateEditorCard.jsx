import React, { useMemo } from "react";

function normCode(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
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
  const canSubmit = useMemo(() => {
    if (disabled) return false;
    const b = normCode(baseCurrency);
    const q = normCode(quoteCurrency);
    if (!b || !q) return false;
    if (b === q) return false;

    const buyOk =
      buyRate === "" || buyRate === null || buyRate === undefined
        ? true
        : Number.isFinite(Number(buyRate));

    const sellOk =
      sellRate === "" || sellRate === null || sellRate === undefined
        ? true
        : Number.isFinite(Number(sellRate));

    return buyOk && sellOk;
  }, [disabled, baseCurrency, quoteCurrency, buyRate, sellRate]);

  return (
    <div className="profiles-subcard p-4 mb-3">
      <div className="text-sm font-semibold text-slate-100 mb-3">{title}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-slate-400 mb-1">BASE</div>
          <input
            value={baseCurrency ?? ""}
            onChange={(e) => onChangeBaseCurrency?.(e.target.value)}
            className="
              w-full px-4 py-2 pr-10
              profiles-input
              rounded-2xl
            "
            placeholder="USD"
            maxLength={10}
            disabled={disabled || submitting}
          />
        </div>

        <div>
          <div className="text-[10px] text-slate-400 mb-1">QUOTE</div>
          <input
            value={quoteCurrency ?? ""}
            onChange={(e) => onChangeQuoteCurrency?.(e.target.value)}
            className="
              w-full px-4 py-2 pr-10
              profiles-input
              rounded-2xl
            "
            placeholder="MXN"
            maxLength={10}
            disabled={disabled || submitting}
          />
        </div>

        <div>
          <div className="text-[10px] text-slate-400 mb-1">BUY</div>
          <input
            value={buyRate ?? ""}
            onChange={(e) => onChangeBuyRate?.(e.target.value)}
            className="
              w-full px-4 py-2 pr-10
              profiles-input
              rounded-2xl
            "
            placeholder="17.20"
            inputMode="decimal"
            disabled={disabled || submitting}
          />
        </div>

        <div>
          <div className="text-[10px] text-slate-400 mb-1">SELL</div>
          <input
            value={sellRate ?? ""}
            onChange={(e) => onChangeSellRate?.(e.target.value)}
            className="
              w-full px-4 py-2 pr-10
              profiles-input
              rounded-2xl
            "
            placeholder="17.45"
            inputMode="decimal"
            disabled={disabled || submitting}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-3 profiles-error rounded-xl p-3 text-sm">{String(error)}</div>
      ) : null}

      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            if (!canSubmit) return;
            onSubmit?.();
          }}
          className="
            px-4 py-2 rounded-2xl
            border border-sky-300/30
            bg-sky-300/10 text-sky-100
            font-extrabold text-sm
            hover:bg-sky-300/20 disabled:opacity-50
          "
          disabled={!canSubmit || submitting}
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
