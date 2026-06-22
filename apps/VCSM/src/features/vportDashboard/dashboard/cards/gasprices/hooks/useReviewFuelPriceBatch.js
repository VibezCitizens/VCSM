import { useCallback, useState } from "react";

import {
  approveFuelPriceBatchController,
  rejectFuelPriceBatchController,
} from "@/features/vportDashboard/dashboard/cards/gasprices/controller/reviewFuelPriceBatch.controller";

/**
 * Hook — batch approve / reject of citizen fuel-price submission batches.
 *
 * UI state only. No DAL imports. The active actor (owner/manager) is enforced
 * inside the RPC; this hook only needs the target station actor + batch id.
 *
 * @param {{ targetActorId: string, onRefresh?: Function }} opts
 */
export function useReviewFuelPriceBatch({ targetActorId, onRefresh }) {
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState(null);

  const approveBatch = useCallback(
    async ({ submissionBatchId, reason = null }) => {
      if (!targetActorId) return { ok: false, reason: "no_target" };
      setReviewing(true);
      setError(null);
      try {
        const res = await approveFuelPriceBatchController({
          targetActorId,
          submissionBatchId,
          reason,
        });
        if (res?.ok) await onRefresh?.();
        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setReviewing(false);
      }
    },
    [targetActorId, onRefresh]
  );

  const rejectBatch = useCallback(
    async ({ submissionBatchId, reason = null }) => {
      if (!targetActorId) return { ok: false, reason: "no_target" };
      setReviewing(true);
      setError(null);
      try {
        const res = await rejectFuelPriceBatchController({
          targetActorId,
          submissionBatchId,
          reason,
        });
        if (res?.ok) await onRefresh?.();
        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setReviewing(false);
      }
    },
    [targetActorId, onRefresh]
  );

  return { reviewing, error, approveBatch, rejectBatch };
}
