import { useCallback, useMemo, useState } from "react";

import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { submitFuelPriceSuggestionController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/submitFuelPriceSuggestion.controller";
import { publishFuelPriceUpdateAsPostController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/publishFuelPriceUpdateAsPost.controller";
import { notifyFuelPriceSubmissionBatchController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/notifyFuelPriceSubmissionBatch.controller";

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

  const { availableActors } = useIdentity();

  // ✅ normalize identity shape: supports `identity` OR `{ identity }`
  const me = useMemo(() => identity?.identity ?? identity ?? null, [identity]);

  // When the active actor is a vport, citizen submissions must use the user-kind actor.
  // vc.current_actor_id() returns the user actor — submitting with a vport actor ID
  // causes a 403 because submitted_by_actor_id = vc.current_actor_id() fails.
  const submitterActorId = useMemo(() => {
    if (!me?.actorId) return null;
    if (!isOwner && me.kind === 'vport') {
      const userActor = availableActors?.find(a => a.actorKind === 'user');
      return userActor?.actorId ?? null;
    }
    return me.actorId;
  }, [me, isOwner, availableActors]);

  const submit = useCallback(
    async ({
      fuelKey,
      proposedPrice,
      currencyCode = "USD",
      unit = "liter",
      submissionBatchId = null,
      notify = true,
    }) => {
      if (!targetActorId) throw new Error("targetActorId required");

      if (!submitterActorId) {
        return { ok: false, reason: "no_identity" };
      }

      setLoading(true);
      setError(null);

      try {
        const res = await submitFuelPriceSuggestionController({
          targetActorId,
          fuelKey,
          proposedPrice,
          actorId: submitterActorId,
          currencyCode,
          unit,
          ownerUpdate: isOwner,
          submissionBatchId,
          notify,
        });

        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [targetActorId, submitterActorId, isOwner]
  );

  const publishFeedPost = useCallback(
    async ({ updatedFuels }) => {
      if (!isOwner || !submitterActorId) {
        return { published: false, status: "failed", reason: "not_owner" };
      }
      return publishFuelPriceUpdateAsPostController({
        actorId: submitterActorId,
        updatedFuels,
      });
    },
    [isOwner, submitterActorId]
  );

  // TICKET-FUEL-BATCH-NOTIF-001: emit a single grouped notification for a whole
  // citizen submission batch. Source = the submitting citizen actor (same as the
  // per-fuel publish it replaces); never fires on the owner-direct path because
  // the bulk orchestrator only calls it for fuels that created a submission row.
  const notifyBatchSubmission = useCallback(
    async ({ submissionBatchId, fuelKeys }) => {
      if (!targetActorId || !submitterActorId) {
        return { ok: false, reason: "no_identity" };
      }
      return notifyFuelPriceSubmissionBatchController({
        targetActorId,
        actorId: submitterActorId,
        submissionBatchId,
        fuelKeys,
      });
    },
    [targetActorId, submitterActorId]
  );

  return {
    loading,
    error,
    submit,
    publishFeedPost,
    notifyBatchSubmission,
  };
}
