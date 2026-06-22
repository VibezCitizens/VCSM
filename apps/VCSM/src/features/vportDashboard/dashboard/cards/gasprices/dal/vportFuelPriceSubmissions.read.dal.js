import vportSchema from "@/services/supabase/vportClient";
import { createTTLCache } from "@/shared/lib/ttlCache";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";

// Pending submissions change on every citizen submit or owner review.
// 30-second TTL balances freshness against DB load on every gas tab render.
// Only the full-fetch path (fuelKey = null) is cached — targeted queries are not.
const pendingSubmissionsCache = createTTLCache(30_000);

const SUBMISSION_SELECT =
  "id,profile_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason,submission_batch_id";

export async function fetchPendingFuelPriceSubmissionsDAL({
  targetActorId,
  fuelKey = null,
  limit = 50,
}) {
  if (!targetActorId) return { data: [], error: null };

  // Only cache the full-fetch (no fuelKey filter) — the targeted variant must be fresh.
  const useCache = !fuelKey;
  if (useCache) {
    // createTTLCache.get() returns null on a miss, never undefined. Guard against
    // null so a cache miss falls through to the DB query instead of returning it.
    const cached = pendingSubmissionsCache.get(targetActorId);
    if (cached !== null) return { data: cached, error: null };
  }

  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { data: [], error: null };

  let query = vportSchema
    .from("fuel_price_submissions")
    .select(
      "id,profile_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,submission_batch_id"
    )
    .eq("profile_id", profileId)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (fuelKey) query = query.eq("fuel_key", fuelKey);

  const result = await query;

  if (useCache && !result.error && result.data) {
    pendingSubmissionsCache.set(targetActorId, result.data);
  }

  return result;
}

// Called by write paths that change pending submission state:
//   - createFuelPriceSubmissionDAL (new submission added)
//   - the batch review RPCs via reviewFuelPriceBatch.controller (status changed
//     to approved/rejected); invalidation is driven by FuelPriceCacheService
export function invalidatePendingSubmissionsCache(actorId) {
  pendingSubmissionsCache.invalidate(actorId);
}

// Not cached — used in review flow which must read live submission status.
export async function fetchFuelPriceSubmissionByIdDAL({ submissionId }) {
  if (!submissionId) return { data: null, error: null };

  return vportSchema
    .from("fuel_price_submissions")
    .select(SUBMISSION_SELECT)
    .eq("id", submissionId)
    .maybeSingle();
}
