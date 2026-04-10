// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\review\vportReviews.read.dal.js
import vc from "@/services/supabase/vcClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const statsCache = createTTLCache(60_000);
const configCache = createTTLCache(60_000);

/* ============================================================
   DAL: READ (raw DB rows only)
   - explicit selects
   - no derived meaning
   - deterministic
   ============================================================ */

export async function dalGetVportReviewFormConfig(targetActorId) {
  const cached = configCache.get(targetActorId);
  if (cached) return cached;

  const { data, error } = await vc.schema("vc").rpc("get_vport_review_form_config", {
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

  const { data, error } = await vc.schema("vc").rpc("get_vport_official_stats", {
    p_target_actor_id: targetActorId,
  });

  if (error) throw error;
  const result = (data && data[0]) ? data[0] : null;
  if (result) statsCache.set(targetActorId, result);
  return result;
}

export function invalidateVportReviewCaches(actorId) {
  statsCache.invalidate(actorId);
  configCache.invalidate(actorId);
}

export async function dalListVportReviews(targetActorId, { limit = 25, cursor = null } = {}) {
  let query = vc
    .schema("vc")
    .from("vport_reviews")
    .select(
      [
        "id",
        "target_actor_id",
        "author_actor_id",
        "vport_type",
        "is_verified",
        "rating_scale",
        "overall_rating",
        "body",
        "created_at",
        "updated_at",
        "is_deleted",
        "deleted_at",
      ].join(",")
    )
    .eq("target_actor_id", targetActorId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
}

export async function dalListVportReviewRatingsByReviewIds(reviewIds) {
  if (!reviewIds?.length) return [];

  const { data, error } = await vc
    .schema("vc")
    .from("vport_review_ratings")
    .select(["review_id", "vport_type", "dimension_key", "rating", "created_at", "updated_at"].join(","))
    .in("review_id", reviewIds);

  if (error) throw error;
  return data ?? [];
}

export async function dalGetActiveReviewByAuthor(targetActorId, authorActorId) {
  const { data, error } = await vc
    .schema("vc")
    .from("vport_reviews")
    .select(
      [
        "id",
        "target_actor_id",
        "author_actor_id",
        "vport_type",
        "is_verified",
        "rating_scale",
        "overall_rating",
        "body",
        "created_at",
        "updated_at",
        "is_deleted",
        "deleted_at",
      ].join(",")
    )
    .eq("target_actor_id", targetActorId)
    .eq("author_actor_id", authorActorId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function dalReadVportReviewById(reviewId) {
  const { data, error } = await vc
    .schema("vc")
    .from("vport_reviews")
    .select(
      [
        "id",
        "target_actor_id",
        "author_actor_id",
        "vport_type",
        "is_verified",
        "rating_scale",
        "overall_rating",
        "body",
        "created_at",
        "updated_at",
        "is_deleted",
        "deleted_at",
      ].join(",")
    )
    .eq("id", reviewId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
