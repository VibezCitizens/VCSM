import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";

/**
 * Batch review DAL — wraps the secure SECURITY DEFINER RPCs that approve or
 * reject a whole citizen submission batch atomically.
 *
 * Actor-first: resolves profileId internally from targetActorId. Callers never
 * supply profileId — only the actor identity. The RPC re-derives the approving
 * actor from vc.current_actor_id() and enforces vport.actor_can_manage_profile,
 * so the p_profile_id argument is an internal lookup target, never the trust
 * boundary.
 */

export async function approveFuelPriceSubmissionBatchDAL({
  targetActorId,
  submissionBatchId,
  reason = null,
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!submissionBatchId) throw new Error("submissionBatchId required");

  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { data: null, error: new Error("profile not found for actor") };

  // RETURNS TABLE(approved_count, applied_count, stale_skipped_count) — one row.
  const { data, error } = await vportSchema.rpc("approve_fuel_price_submission_batch", {
    p_profile_id: profileId,
    p_submission_batch_id: submissionBatchId,
    p_reason: reason ?? null,
  });

  return { data: Array.isArray(data) ? data[0] ?? null : data ?? null, error };
}

export async function rejectFuelPriceSubmissionBatchDAL({
  targetActorId,
  submissionBatchId,
  reason = null,
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!submissionBatchId) throw new Error("submissionBatchId required");

  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { data: null, error: new Error("profile not found for actor") };

  // RETURNS TABLE(rejected_count) — one row.
  const { data, error } = await vportSchema.rpc("reject_fuel_price_submission_batch", {
    p_profile_id: profileId,
    p_submission_batch_id: submissionBatchId,
    p_reason: reason ?? null,
  });

  return { data: Array.isArray(data) ? data[0] ?? null : data ?? null, error };
}
