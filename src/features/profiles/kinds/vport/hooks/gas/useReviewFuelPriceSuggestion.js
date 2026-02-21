// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\hooks\gas\useReviewFuelPriceSuggestion.js

import { useCallback, useState } from "react";

import { reviewFuelPriceSuggestionController } from "@/features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller";

/**
 * Hook — Review Fuel Price Suggestion
 *
 * Single-action hook for approving/rejecting a fuel price submission.
 * Owns UI state only.
 *
 * No DAL imports.
 */
export function useReviewFuelPriceSuggestion({ identity }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const review = useCallback(
    async ({ submissionId, decision, reason = null, applyToOfficialOnApprove = true }) => {
      if (!identity?.actorId) {
        return { ok: false, reason: "no_identity" };
      }

      setLoading(true);
      setError(null);

      try {
        const res = await reviewFuelPriceSuggestionController({
          submissionId,
          decision,
          decidedByActorId: identity.actorId,
          reason,
          applyToOfficialOnApprove,
        });

        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [identity]
  );

  return {
    loading,
    error,
    review,
  };
}