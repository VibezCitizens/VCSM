// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\GasPricesPanel.jsx

import { useMemo, useState, useEffect } from "react";

import { GasStates } from "@/features/profiles/kinds/vport/screens/gas/components/GasStates";

export function GasPricesPanel({
  loading,
  error,
  official = [],
  officialByFuelKey = {},
  communitySuggestionByFuelKey = {},
  settings,
  identity,
  submitSuggestion,
  submitting = false,

  // ✅ NEW: allow owner screen to show bulk update
  allowOwnerUpdate = false,

  // ✅ NEW: optional hook for owner to auto-approve + apply to official
  afterSubmitSuggestion = null,
}) {
  const [showBulkModal, setShowBulkModal] = useState(false);

  // ✅ normalize identity shape (context vs actor object)
  const me = useMemo(() => identity?.identity ?? identity ?? null, [identity]);
  const canSubmit = !!me?.actorId;

  // ✅ still detect owner actor, but DO NOT hide button automatically anymore
  const isOwnerActor = me?.kind === "vport";

  const fuelKeys = useMemo(() => {
    const fromSettings =
      settings?.fuelKeys ??
      settings?.fuel_keys ??
      settings?.fuels?.map((f) => f?.fuelKey ?? f?.fuel_key ?? f?.key ?? null) ??
      settings?.fuelTypes?.map((f) => f?.fuelKey ?? f?.fuel_key ?? f?.key ?? null) ??
      null;

    const cleanSettingsKeys = Array.isArray(fromSettings)
      ? fromSettings.map((k) => (k ? String(k) : null)).filter(Boolean)
      : [];

    if (cleanSettingsKeys.length) return cleanSettingsKeys;

    const derived = new Set();

    for (const row of Array.isArray(official) ? official : []) {
      const k = row?.fuelKey ?? row?.fuel_key ?? row?.key ?? null;
      if (k) derived.add(String(k));
    }

    for (const k of Object.keys(officialByFuelKey || {})) derived.add(String(k));
    for (const k of Object.keys(communitySuggestionByFuelKey || {}))
      derived.add(String(k));

    const derivedList = Array.from(derived);
    if (derivedList.length) return derivedList;

    return ["regular", "midgrade", "premium", "diesel"];
  }, [settings, official, officialByFuelKey, communitySuggestionByFuelKey]);

  const prettyFuelLabel = (fuelKey) => {
    const map = {
      regular: "Regular",
      midgrade: "Midgrade",
      premium: "Premium",
      diesel: "Diesel",
      e85: "E85",
    };
    return (
      map[String(fuelKey).toLowerCase()] ??
      String(fuelKey)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase())
    );
  };

  const rows = useMemo(() => {
    return fuelKeys.map((fuelKey) => {
      const officialRow =
        officialByFuelKey?.[fuelKey] ??
        (Array.isArray(official)
          ? official.find((r) => (r?.fuelKey ?? r?.fuel_key ?? r?.key) === fuelKey) ??
            null
          : null);

      const suggestion = communitySuggestionByFuelKey?.[fuelKey] ?? null;

      const officialPrice = officialRow?.price ?? null;
      const officialCurrencyCode =
        officialRow?.currencyCode ?? officialRow?.currency_code ?? "USD";
      const officialUnit = officialRow?.unit ?? "liter";

      const suggestedPrice = suggestion?.proposedPrice ?? suggestion?.proposed_price ?? null;
      const suggestedCurrencyCode =
        suggestion?.currencyCode ?? suggestion?.currency_code ?? officialCurrencyCode;
      const suggestedUnit = suggestion?.unit ?? officialUnit;

      return {
        fuelKey,
        label: prettyFuelLabel(fuelKey),
        official: {
          price: officialPrice,
          currencyCode: officialCurrencyCode,
          unit: officialUnit,
        },
        community: {
          price: suggestedPrice,
          currencyCode: suggestedCurrencyCode,
          unit: suggestedUnit,
        },
        suggestion,
      };
    });
  }, [fuelKeys, official, officialByFuelKey, communitySuggestionByFuelKey]);

  const empty = !loading && !error && rows.length === 0;

  // ✅ show update button rules:
  // - public/citizen view: show if NOT owner actor (keeps old intent)
  // - owner dashboard: explicitly enable with allowOwnerUpdate=true
  const showUpdateButton = useMemo(() => {
    if (!canSubmit) return false;
    if (allowOwnerUpdate) return true;
    if (isOwnerActor) return false; // keep old behavior for public screen
    return true;
  }, [canSubmit, allowOwnerUpdate, isOwnerActor]);

  return (
    <div className="space-y-4">
      <GasStates loading={loading} error={error} empty={empty} />

      {!loading && !error && !empty && (
        <>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[18px] font-semibold tracking-tight text-white">
                Fuel Prices
              </div>
              <div className="mt-0.5 text-xs text-neutral-400">
                Official rates + last community update
              </div>
            </div>

            {showUpdateButton ? (
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="shrink-0 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(168,85,247,0.25)] hover:from-purple-400 hover:to-purple-600 active:scale-[0.98] transition"
              >
                Update prices
              </button>
            ) : !canSubmit ? (
              <div className="text-xs text-neutral-500">Log in to update</div>
            ) : null}
          </div>

          <div className="space-y-3">
            {rows.map((row) => {
              const hasCommunity =
                row.community.price !== null && row.community.price !== undefined;

              return (
                <div
                  key={row.fuelKey}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-white/10" />
                  <div className="pointer-events-none absolute -top-24 right-[-60px] h-52 w-52 rounded-full bg-purple-500/10 blur-3xl" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-white">{row.label}</div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-neutral-300">
                          {row.official.currencyCode}/{row.official.unit}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-neutral-400">
                            Official
                          </div>
                          <div className="mt-1 text-xl font-semibold text-white">
                            {row.official.price ?? "—"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] uppercase tracking-wide text-neutral-400">
                              Last update
                            </div>

                            {hasCommunity ? (
                              <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] text-purple-300">
                                Community
                              </span>
                            ) : (
                              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-neutral-400">
                                None yet
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-xl font-semibold text-white">
                            {row.community.price ?? "—"}
                          </div>
                        </div>
                      </div>

                      {!hasCommunity ? (
                        <div className="mt-2 text-xs text-neutral-500">
                          Be the first to update this station.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <BulkUpdateFuelPricesModal
            open={showBulkModal}
            onClose={() => setShowBulkModal(false)}
            rows={rows}
            submitting={submitting}
            submitSuggestion={submitSuggestion}
            afterSubmitSuggestion={afterSubmitSuggestion}
          />
        </>
      )}
    </div>
  );
}

function BulkUpdateFuelPricesModal({
  open,
  onClose,
  rows,
  submitting,
  submitSuggestion,

  // ✅ NEW: owner can auto-approve & apply to official
  afterSubmitSuggestion = null,
}) {
  const [values, setValues] = useState({});
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setValues({});
    setLocalError(null);
  }, [open]);

  const anyValue = useMemo(() => {
    return Object.values(values).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ""
    );
  }, [values]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 px-3 py-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.75)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">Update prices</div>
            <div className="mt-1 text-xs text-neutral-400">
              Fill any fuels you want. Blank = skip.
            </div>
          </div>

          <button
            type="button"
            onClick={submitting ? undefined : onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
            disabled={submitting}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div
              key={row.fuelKey}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{row.label}</div>
                  <div className="mt-0.5 text-[11px] text-neutral-400">
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
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-purple-500/50"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-neutral-500">
                <div>
                  Official:{" "}
                  <span className="text-neutral-300">{row.official.price ?? "—"}</span>
                </div>
                <div>
                  Last update:{" "}
                  <span className="text-neutral-300">{row.community.price ?? "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {localError ? (
          <div className="mt-4 rounded-2xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300">
            {String(localError?.message ?? localError)}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!anyValue || submitting}
            onClick={async () => {
              setLocalError(null);

              // Submit only filled fuels, stop on first failure
              for (const row of rows) {
                const raw = values[row.fuelKey];
                if (raw === undefined || raw === null || String(raw).trim() === "") continue;

                const proposedPrice = Number(raw);
                if (!Number.isFinite(proposedPrice) || proposedPrice <= 0) {
                  setLocalError(`Invalid number for ${row.label}`);
                  return;
                }

                const res = await submitSuggestion?.({
                  fuelKey: row.fuelKey,
                  proposedPrice,
                  currencyCode: row.official.currencyCode ?? "USD",
                  unit: row.official.unit ?? "liter",
                });

                if (!res?.ok) {
                  setLocalError(res?.reason ?? "Failed to submit");
                  return;
                }

                // ✅ owner flow: auto-approve + apply to official (if provided)
                if (afterSubmitSuggestion) {
                  const submissionId =
                    res?.submissionId ?? res?.id ?? res?.submission?.id ?? null;

                  if (submissionId) {
                    const r2 = await afterSubmitSuggestion({
                      submissionId,
                      fuelKey: row.fuelKey,
                      proposedPrice,
                    });

                    if (r2 && r2.ok === false) {
                      setLocalError(r2?.reason ?? "Failed to apply to official");
                      return;
                    }
                  }
                }
              }

              onClose();
            }}
            className="rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(168,85,247,0.25)] hover:from-purple-400 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Save updates"}
          </button>
        </div>
      </div>
    </div>
  );
}