import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const cache = createTTLCache(60_000);

/**
 * DAL: fetch public vport review summary from reviews.public_vport_review_summary_v.
 * Returns null when no reviews exist for the actor.
 */
export async function readPublicVportReviewSummaryDAL(targetActorId) {
  if (!targetActorId) throw new Error("readPublicVportReviewSummaryDAL: targetActorId is required");

  const cached = cache.get(targetActorId);
  if (cached !== undefined) return cached;

  const { data, error } = await supabase
    .schema("reviews")
    .from("public_vport_review_summary_v")
    .select("target_actor_id,review_count,average_rating,first_review_at,last_review_activity_at")
    .eq("target_actor_id", targetActorId)
    .maybeSingle();

  if (error) throw error;

  cache.set(targetActorId, data);
  return data;
}

export function invalidatePublicReviewSummaryCache(targetActorId) {
  targetActorId ? cache.invalidate(targetActorId) : cache.invalidateAll();
}

export default readPublicVportReviewSummaryDAL;
