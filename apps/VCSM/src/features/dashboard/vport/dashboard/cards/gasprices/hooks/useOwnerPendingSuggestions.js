import { useCallback, useState } from "react";

import { reviewFuelPriceSuggestionController } from "@/features/dashboard/vport/dashboard/cards/gasprices/controller/reviewFuelPriceSuggestion.controller";

export function useOwnerPendingSuggestions({ identity, onRefresh }) {
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState(null);

  const reviewSuggestion = useCallback(
    async ({ submissionId, decision, reason, applyToOfficialOnApprove }) => {
      if (!identity?.actorId) {
        return { ok: false, reason: "no_identity" };
      }

      setReviewing(true);
      setError(null);

      try {
        const res = await reviewFuelPriceSuggestionController({
          submissionId,
          decision,
          decidedByActorId: identity.actorId,
          reason,
          applyToOfficialOnApprove,
        });

        if (res?.ok) {
          await onRefresh?.();
        }

        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setReviewing(false);
      }
    },
    [identity, onRefresh]
  );

  return { reviewing, error, reviewSuggestion };
}