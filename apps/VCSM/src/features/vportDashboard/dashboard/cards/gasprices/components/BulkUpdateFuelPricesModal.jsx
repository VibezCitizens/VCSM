import { useMemo, useState, useEffect } from "react";
import { useSubmitBulkFuelPrices } from "@/features/vportDashboard/dashboard/cards/gasprices/hooks/useSubmitBulkFuelPrices";
import { normalizeGasError } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasErrorMessages";

export function BulkUpdateFuelPricesModal({
  open,
  onClose,
  rows,
  submitSuggestion,
  afterSubmitSuggestion = null,
  canShareToFeed = false,
  onShareToFeed = null,
  onPublishResult = null,
  onBatchSubmitted = null,
}) {
  const [values, setValues] = useState({});
  const [shareToFeed, setShareToFeed] = useState(true);

  const { handleSubmit, running, error, clearError } = useSubmitBulkFuelPrices({
    submitSuggestion,
    afterSubmitSuggestion,
    onShareToFeed,
    onBatchSubmitted,
  });

  useEffect(() => {
    if (!open) return;
    setValues({});
    clearError();
    setShareToFeed(true);
  }, [open, clearError]);

  const anyValue = useMemo(() => {
    return Object.values(values).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ""
    );
  }, [values]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-3 sm:p-6">
      <div className="profiles-card flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.75)]">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-white">Update prices</div>
            <div className="mt-1 text-xs text-white/50">
              Fill any fuels you want. Blank = skip.
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={running ? undefined : onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/90 hover:bg-black/50 disabled:opacity-60"
            disabled={running}
          >
            X
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.fuelKey}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{row.label}</div>
                    <div className="mt-0.5 text-[11px] text-white/50">
                      {row.official.currencyCode}/{row.official.unit}
                    </div>
                  </div>
                  <div className="w-40">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="e.g. 1.23"
                      value={values[row.fuelKey] ?? ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        setValues((s) => ({ ...s, [row.fuelKey]: next }));
                      }}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/25"
                      disabled={running}
                    />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/40">
                  <div>
                    Official:{" "}
                    <span className="text-white/70">{row.official.price ?? "-"}</span>
                  </div>
                  <div>
                    Last update:{" "}
                    <span className="text-white/70">{row.lastUpdate?.label || "-"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error ? (
            <div className="profiles-error mt-4 rounded-2xl p-3 text-sm">
              {normalizeGasError(error)}
            </div>
          ) : null}
        </div>

        {canShareToFeed && (
          <div className="border-t border-white/8 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={shareToFeed}
                onChange={(e) => setShareToFeed(e.target.checked)}
                disabled={running}
                style={{
                  appearance: "auto",
                  WebkitAppearance: "checkbox",
                  width: 16,
                  height: 16,
                  margin: 0,
                  accentColor: "#38bdf8",
                  flexShrink: 0,
                }}
              />
              <span className="text-xs text-white/70">Share this update to my feed</span>
            </label>
          </div>
        )}

        <div className="mt-auto flex items-center justify-end gap-2 border-t border-white/10 bg-black/20 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className="profiles-pill-btn rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!anyValue || running}
            onClick={async () => {
              const result = await handleSubmit(rows, values, { shareToFeed });
              if (result?.publishResult) onPublishResult?.(result.publishResult);
              if (result?.ok) onClose();
            }}
            className="rounded-2xl border border-sky-300/35 bg-gradient-to-b from-sky-300/40 to-blue-500/40 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(56,189,248,0.22)] hover:from-sky-300/55 hover:to-blue-500/55 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Submitting..." : "Save updates"}
          </button>
        </div>
      </div>
    </div>
  );
}
