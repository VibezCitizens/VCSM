import { useCallback, useMemo, useState } from "react";

import { submitFuelPriceSuggestionController } from "@/features/dashboard/vport/dashboard/cards/gasprices/controller/submitFuelPriceSuggestion.controller";
import { publishFuelPriceUpdateAsPostController } from "@/features/dashboard/vport/dashboard/cards/gasprices/controller/publishFuelPriceUpdateAsPost.controller";

/**
 * Hook — Submit Fuel Price Suggestion
 *
 * Single-action hook for submitting a fuel price suggestion.
 * Owns UI state only.
 *
 * No DAL imports.
 */
export function useSubmitFuelPriceSuggestion({ targetActorId, identity, isOwner = false }) {
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
          actorId: me.actorId,
          currencyCode,
          unit,
          ownerUpdate: isOwner,
        });

        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [targetActorId, me, isOwner]
  );

  const publishFeedPost = useCallback(
    async ({ updatedFuels }) => {
      if (!isOwner || !me?.actorId) {
        return { published: false, status: "failed", reason: "not_owner" };
      }
      return publishFuelPriceUpdateAsPostController({
        actorId: me.actorId,
        updatedFuels,
      });
    },
    [isOwner, me]
  );

  return {
    loading,
    error,
    submit,
    publishFeedPost,
  };
}
