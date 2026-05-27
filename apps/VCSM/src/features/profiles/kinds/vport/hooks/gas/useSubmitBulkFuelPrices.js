import { useState, useCallback } from "react";

/**
 * Hook — encapsulates the bulk fuel price submission flow.
 *
 * Extracted from BulkUpdateFuelPricesModal onClick handler.
 * Owns: input validation, parallel submit, afterSubmitSuggestion cascade, feed share.
 *
 * @param {object} opts
 * @param {Function} opts.submitSuggestion  — submit one fuel row (from useSubmitFuelPriceSuggestion)
 * @param {Function} [opts.afterSubmitSuggestion] — called per citizen submission result with `submission.id`; skipped on owner-direct path (no submission object returned)
 * @param {Function} [opts.onShareToFeed]   — called with updatedFuels after all submits succeed
 */
export function useSubmitBulkFuelPrices({
  submitSuggestion,
  afterSubmitSuggestion,
  onShareToFeed,
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * @param {Array}  rows       — fuel rows from buildFuelPriceRows
   * @param {object} values     — { [fuelKey]: rawStringValue }
   * @param {object} [opts]
   * @param {boolean} [opts.shareToFeed]
   * @returns {{ ok: boolean }}
   */
  const handleSubmit = useCallback(
    async (rows, values, { shareToFeed = false } = {}) => {
      setError(null);

      // Validate all rows first — no DB calls until all values are clean
      const validRows = [];
      for (const row of rows) {
        const raw = values[row.fuelKey];
        if (raw === undefined || raw === null || String(raw).trim() === "") continue;
        const proposedPrice = Number(raw);
        if (!Number.isFinite(proposedPrice) || proposedPrice <= 0) {
          setError(`Invalid number for ${row.label}`);
          return { ok: false };
        }
        validRows.push({ row, proposedPrice });
      }

      if (validRows.length === 0) return { ok: false };

      setRunning(true);
      try {
        // Submit all in parallel
        const results = await Promise.all(
          validRows.map(({ row, proposedPrice }) =>
            submitSuggestion?.({
              fuelKey: row.fuelKey,
              proposedPrice,
              currencyCode: row.official.currencyCode ?? "USD",
              unit: row.official.unit ?? "liter",
            }).then((res) => ({ row, proposedPrice, res }))
          )
        );

        const firstFail = results.find((r) => !r.res?.ok);
        if (firstFail) {
          setError(firstFail.res?.reason ?? "Failed to submit");
          return { ok: false };
        }

        const updatedFuels = results
          .filter((r) => r.res?.official)
          .map((r) => ({
            fuelKey: r.res.official.fuelKey ?? r.row.fuelKey,
            price: r.res.official.price,
            currencyCode: r.res.official.currencyCode ?? "USD",
            unit: r.res.official.unit ?? "liter",
          }));

        // afterSubmitSuggestion: owner review cascade — single refresh wave at the end
        if (afterSubmitSuggestion) {
          await Promise.allSettled(
            results.map(({ row, proposedPrice, res }) => {
              const submissionId = res?.submission?.id ?? null;
              if (!submissionId) return Promise.resolve();
              return afterSubmitSuggestion({ submissionId, fuelKey: row.fuelKey, proposedPrice });
            })
          );
        }

        if (shareToFeed && onShareToFeed && updatedFuels.length > 0) {
          try {
            await onShareToFeed({ updatedFuels });
          } catch {
            // Non-blocking — price update already committed
          }
        }

        return { ok: true };
      } catch (err) {
        setError(err?.message ?? "Unexpected error");
        return { ok: false };
      } finally {
        setRunning(false);
      }
    },
    [submitSuggestion, afterSubmitSuggestion, onShareToFeed]
  );

  return { handleSubmit, running, error, clearError };
}
