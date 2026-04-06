// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\hooks\gas\useSubmitFuelPriceSuggestion.js

import { useCallback, useMemo, useState } from "react";

import { submitFuelPriceSuggestionController } from "@/features/profiles/kinds/vport/controller/gas/submitFuelPriceSuggestion.controller";

/**
 * Hook — Submit Fuel Price Suggestion
 *
 * Single-action hook for submitting a fuel price suggestion.
 * Owns UI state only.
 *
 * No DAL imports.
 */
export function useSubmitFuelPriceSuggestion({ targetActorId, identity }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ normalize identity shape: supports `identity` OR `{ identity }`
  const me = useMemo(() => identity?.identity ?? identity ?? null, [identity]);

  const submit = useCallback(
    async ({
      fuelKey,
      proposedPrice,
      currencyCode = "USD",
      unit = "liter",
      evidence = {},
    }) => {
      if (!targetActorId) throw new Error("targetActorId required");

      if (!me?.actorId) {
        return { ok: false, reason: "no_identity" };
      }

      setLoading(true);
      setError(null);

      try {
        const res = await submitFuelPriceSuggestionController({
          targetActorId,
          fuelKey,
          proposedPrice,
          actorId: me.actorId, // ✅ use normalized actorId
          currencyCode,
          unit,
          evidence,
        });

        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [targetActorId, me]
  );

  return {
    loading,
    error,
    submit,
  };
}