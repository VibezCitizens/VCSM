import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";

/**
 * Emit ONE grouped notification for a whole citizen fuel-price submission batch,
 * replacing the previous one-notification-per-fuel behavior (TICKET-FUEL-BATCH-
 * NOTIF-001). Recipient is the station VPORT actor; source is the submitting
 * citizen — identical trust model to the per-fuel publish it replaces.
 *
 * The notification engine (publishVcsmNotification) still enforces that the
 * source actor is owned by the authenticated session (app guard + DB trigger),
 * and self-skips when source === recipient. No raw actor/profile UUID is stored:
 * linkPath is null and only the batch id + fuel keys travel in context, so the
 * dashboard path stays derivable from the recipient's active identity.
 *
 * Non-throwing: a notification failure must never break the submit UX. Returns a
 * result object instead of throwing.
 *
 * @param {{ targetActorId: string, actorId: string, submissionBatchId?: string|null, fuelKeys?: string[] }} opts
 * @returns {Promise<{ ok: boolean, reason?: string, count?: number }>}
 */
export async function notifyFuelPriceSubmissionBatchController({
  targetActorId,
  actorId,
  submissionBatchId = null,
  fuelKeys = [],
}) {
  try {
    if (!targetActorId || !actorId) return { ok: false, reason: "missing_actor" };

    const keys = Array.isArray(fuelKeys) ? fuelKeys.filter(Boolean) : [];
    if (keys.length === 0) return { ok: false, reason: "no_fuels" };

    // DEADPOOL fix (TICKET-FUEL-BATCH-NOTIF-001): every other VCSM notification
    // publishes with a NON-NULL object id (per-fuel gas used the submission row id,
    // bookings use the booking id, etc.). object_id: null was the only divergence
    // and is the prime suspect for the silently-swallowed insert failure. The batch
    // IS the object, so use its id. submissionBatchId is a batch UUID — not an
    // actor/profile UUID — and linkPath stays null, so no raw identity leaks.
    //
    // Await the publish and return its real boolean so a failed publish is no longer
    // an invisible no-op (the previous fire-and-forget hid the failure entirely).
    const published = await publishVcsmNotification({
      recipientActorId: targetActorId,
      actorId,
      kind: "vport.gas_price_suggestion",
      objectType: "gas_price_suggestion",
      objectId: submissionBatchId ?? null,
      linkPath: null,
      context: {
        // Discriminator so the inbox renders the grouped card. The single-fuel
        // fallback still works: count === 1 keeps fuelKey populated.
        kind: "fuel_price_submission_batch",
        submissionBatchId: submissionBatchId ?? null,
        fuelKeys: keys,
        count: keys.length,
        fuelKey: keys.length === 1 ? keys[0] : null,
      },
    });

    return { ok: published === true, published: published === true, count: keys.length };
  } catch (error) {
    captureVcsmError({
      feature: "vportDashboard",
      module: "gasprices.notifyFuelPriceSubmissionBatch.controller",
      severity: "error",
      message: `notifyFuelPriceSubmissionBatchController: ${error?.message ?? "unknown"}`,
      error_name: error?.name,
      operation: "notifyFuelPriceSubmissionBatch",
      is_handled: true,
      context: { dbErrorCode: error?.code ?? null },
    });
    return { ok: false, reason: "error" };
  }
}
