import vportSchema from "@/services/supabase/vportClient";

const SUBMISSION_SELECT =
  "id,profile_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason,evidence";

async function resolveProfileId(actorId) {
  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function fetchPendingFuelPriceSubmissionsDAL({
  targetActorId,
  fuelKey = null,
  limit = 50,
}) {
  if (!targetActorId) return { data: [], error: null };

  const profileId = await resolveProfileId(targetActorId);
  if (!profileId) return { data: [], error: null };

  let query = vportSchema
    .from("fuel_price_submissions")
    .select(
      "id,profile_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,evidence"
    )
    .eq("profile_id", profileId)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (fuelKey) query = query.eq("fuel_key", fuelKey);

  return query;
}

export async function fetchFuelPriceSubmissionByIdDAL({ submissionId }) {
  if (!submissionId) return { data: null, error: null };

  return vportSchema
    .from("fuel_price_submissions")
    .select(SUBMISSION_SELECT)
    .eq("id", submissionId)
    .maybeSingle();
}
