import vc from "@/services/supabase/vcClient";
import reviewsSchema from "@/services/supabase/reviewsClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const statsCache = createTTLCache(60_000);
const configCache = createTTLCache(60_000);

const REVIEW_SELECT = [
  "id",
  "target_actor_id",
  "author_actor_id",
  "target_subtype",
  "verification_status",
  "rating_scale",
  "overall_rating",
  "body",
  "created_at",
  "updated_at",
  "is_deleted",
  "deleted_at",
].join(",");

// RPCs live in vc schema — unchanged
export async function dalGetVportReviewFormConfig(targetActorId) {
  const cached = configCache.get(targetActorId);
  if (cached) return cached;

  const { data, error } = await vc.rpc("get_vport_review_form_config", {
    p_target_actor_id: targetActorId,
  });

  if (error) throw error;
  const result = data ?? [];
  configCache.set(targetActorId, result);
  return result;
}

export async function dalGetVportOfficialStats(targetActorId) {
  const cached = statsCache.get(targetActorId);
  if (cached) return cached;

  const { data, error } = await vc.rpc("get_vport_official_stats", {
    p_target_actor_id: targetActorId,
  });

  if (error) throw error;
  const result = data && data[0] ? data[0] : null;
  if (result) statsCache.set(targetActorId, result);
  return result;
}

export function invalidateVportReviewCaches(actorId) {
  statsCache.invalidate(actorId);
  configCache.invalidate(actorId);
}

export async function dalListVportReviews(targetActorId, { limit = 25, cursor = null } = {}) {
  let query = reviewsSchema
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("target_actor_id", targetActorId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
}

export async function dalListVportReviewRatingsByReviewIds(reviewIds) {
  if (!reviewIds?.length) return [];

  const { data, error } = await reviewsSchema
    .from("review_dimension_ratings")
    .select("review_id,dimension_id,rating,label_snapshot,weight_snapshot,created_at,updated_at")
    .in("review_id", reviewIds);

  if (error) throw error;
  return data ?? [];
}

export async function dalGetActiveReviewByAuthor(targetActorId, authorActorId) {
  const { data, error } = await reviewsSchema
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("target_actor_id", targetActorId)
    .eq("author_actor_id", authorActorId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function dalReadVportReviewById(reviewId) {
  const { data, error } = await reviewsSchema
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("id", reviewId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
