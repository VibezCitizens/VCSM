// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\SubmitFuelPriceSuggestionModal.jsx

import { useEffect, useMemo, useState } from "react";

export function SubmitFuelPriceSuggestionModal({
  open,
  onClose,
  fuelKey,
  currencyCode = "USD",
  unit = "liter",
  onSubmit,
  submitting = false,
  error = null,
}) {
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (open) {
      setPrice("");
    }
  }, [open, fuelKey]);

  const disabled = useMemo(() => {
    const p = Number(price);
    return !Number.isFinite(p) || p <= 0 || submitting;
  }, [price, submitting]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">
              Suggest a price
            </div>
            <div className="mt-1 text-sm text-neutral-400">
              Fuel: <span className="text-neutral-200">{fuelKey}</span>
            </div>
          </div>

          <button
            type="button"
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 disabled:opacity-60"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm text-neutral-300">Price</label>

          <div className="mt-2 flex items-center gap-2">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 1.23"
              className="
                w-full px-4 py-2
                rounded-2xl bg-neutral-900 text-white
                border border-purple-700
                focus:ring-2 focus:ring-purple-500
              "
              disabled={submitting}
            />
            <div className="shrink-0 rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200">
              {currencyCode}/{unit}
            </div>
          </div>

          {error ? (
            <div className="mt-3 text-sm text-red-400">
              {String(error?.message ?? error)}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-60"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
            onClick={() =>
              onSubmit?.({
                fuelKey,
                proposedPrice: Number(price),
                currencyCode,
                unit,
              })
            }
            disabled={disabled}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}