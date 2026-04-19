import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const cache = createTTLCache(60_000);

/**
 * DAL: fetch per-dimension average ratings from reviews.public_vport_review_dimensions_v.
 * Returns [] when no dimension data exists.
 */
export async function readPublicVportReviewDimensionsDAL(targetActorId) {
  if (!targetActorId) throw new Error("readPublicVportReviewDimensionsDAL: targetActorId is required");

  const cached = cache.get(targetActorId);
  if (cached !== undefined) return cached;

  const { data, error } = await supabase
    .schema("reviews")
    .from("public_vport_review_dimensions_v")
    .select("target_actor_id,dimension_id,dimension_key,dimension_label,sort_order,rating_count,average_rating")
    .eq("target_actor_id", targetActorId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const result = data ?? [];
  cache.set(targetActorId, result);
  return result;
}

export function invalidatePublicReviewDimensionsCache(targetActorId) {
  targetActorId ? cache.invalidate(targetActorId) : cache.invalidateAll();
}

export default readPublicVportReviewDimensionsDAL;
