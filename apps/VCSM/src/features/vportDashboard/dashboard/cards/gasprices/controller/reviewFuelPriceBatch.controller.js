import {
  approveFuelPriceSubmissionBatchDAL,
  rejectFuelPriceSubmissionBatchDAL,
} from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceBatchReview.write.dal";
import { FuelPriceCacheService } from "@/features/vportDashboard/dashboard/cards/gasprices/services/fuelPriceCache.service";
import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";

/**
 * Approve an entire citizen submission batch for a gas station.
 *
 * Authorization is enforced inside the SECURITY DEFINER RPC via
 * vc.current_actor_id() + vport.actor_can_manage_profile — the controller does
 * not (and must not) re-derive ownership from any client-supplied id. The
 * approving actor is the active actor on the authenticated session; this
 * controller only passes the target station actor + batch id.
 *
 * @param {{ targetActorId: string, submissionBatchId: string, reason?: string }} opts
 * @returns {Promise<{ ok: boolean, reason?: string, result?: object }>}
 */
export async function approveFuelPriceBatchController({
  targetActorId,
  submissionBatchId,
  reason = null,
}) {
  try {
    if (!targetActorId) throw new Error("targetActorId required");
    if (!submissionBatchId) return { ok: false, reason: "missing_batch" };

    const { data, error } = await approveFuelPriceSubmissionBatchDAL({
      targetActorId,
      submissionBatchId,
      reason,
    });

    if (error) {
      // RPC raises 42501 when the active actor cannot manage the profile.
      if (error.code === "42501") return { ok: false, reason: "not_owner" };
      throw error;
    }

    FuelPriceCacheService.invalidatePendingSubmissions(targetActorId);
    FuelPriceCacheService.invalidateOfficialPrices(targetActorId);

    return {
      ok: true,
      result: {
        approvedCount: Number(data?.approved_count ?? 0),
        appliedCount: Number(data?.applied_count ?? 0),
        staleSkippedCount: Number(data?.stale_skipped_count ?? 0),
      },
    };
  } catch (error) {
    captureVcsmError({
      feature: "vportDashboard",
      module: "gasprices.reviewFuelPriceBatch.controller",
      severity: "error",
      message: `approveFuelPriceBatchController: ${error?.message ?? "unknown"}`,
      error_name: error?.name,
      operation: "approveFuelPriceBatch",
      is_handled: false,
      context: { dbErrorCode: error?.code ?? null },
    });
    throw error;
  }
}

/**
 * Reject an entire citizen submission batch. Same authorization model as approve.
 * Never touches vport.fuel_prices.
 *
 * @param {{ targetActorId: string, submissionBatchId: string, reason?: string }} opts
 * @returns {Promise<{ ok: boolean, reason?: string, result?: object }>}
 */
export async function rejectFuelPriceBatchController({
  targetActorId,
  submissionBatchId,
  reason = null,
}) {
  try {
    if (!targetActorId) throw new Error("targetActorId required");
    if (!submissionBatchId) return { ok: false, reason: "missing_batch" };

    const { data, error } = await rejectFuelPriceSubmissionBatchDAL({
      targetActorId,
      submissionBatchId,
      reason,
    });

    if (error) {
      if (error.code === "42501") return { ok: false, reason: "not_owner" };
      throw error;
    }

    FuelPriceCacheService.invalidatePendingSubmissions(targetActorId);

    return {
      ok: true,
      result: { rejectedCount: Number(data?.rejected_count ?? 0) },
    };
  } catch (error) {
    captureVcsmError({
      feature: "vportDashboard",
      module: "gasprices.reviewFuelPriceBatch.controller",
      severity: "error",
      message: `rejectFuelPriceBatchController: ${error?.message ?? "unknown"}`,
      error_name: error?.name,
      operation: "rejectFuelPriceBatch",
      is_handled: false,
      context: { dbErrorCode: error?.code ?? null },
    });
    throw error;
  }
}
