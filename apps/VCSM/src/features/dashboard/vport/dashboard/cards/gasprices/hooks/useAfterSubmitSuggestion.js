// src/features/dashboard/vport/hooks/gas/useAfterSubmitSuggestion.js
//
// Hook: useAfterSubmitSuggestion
//
// Orchestrates the two-phase owner submit flow:
//   1. A citizen suggestion is submitted via submitSuggestion (upstream)
//   2. As owner, the suggestion is immediately auto-approved and applied to official prices
//
// Responsibility: hook layer — owns the auto-review cascade triggered after owner submits.
// No JSX / no UI concerns.

import { useCallback } from "react";

/**
 * @param {{ reviewSuggestionAndRefresh: (payload: object) => Promise<object> }} params
 * @returns {{ afterSubmitSuggestion: (params: { submissionId: string }) => Promise<object> }}
 */
export function useAfterSubmitSuggestion({ reviewSuggestionAndRefresh }) {
  const afterSubmitSuggestion = useCallback(
    async ({ submissionId }) => {
      if (!submissionId) return { ok: false, reason: "no_submission_id" };

      const res = await reviewSuggestionAndRefresh?.({
        submissionId,
        decision: "approved",
        reason: "Owner updated official prices",
        applyToOfficialOnApprove: true,
      });

      return res;
    },
    [reviewSuggestionAndRefresh]
  );

  return { afterSubmitSuggestion };
}
