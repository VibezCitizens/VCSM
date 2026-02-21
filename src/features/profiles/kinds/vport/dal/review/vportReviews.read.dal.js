// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\review\vportReviews.read.dal.js
import vc from "@/services/supabase/vcClient";

/* ============================================================
   DAL: READ (raw DB rows only)
   - explicit selects
   - no derived meaning
   - deterministic
   ============================================================ */

export async function dalGetVportReviewFormConfig(targetActorId) {
  const { data, error } = await vc.schema("vc").rpc("get_vport_review_form_config", {
    p_target_actor_id: targetActorId,
  });

  if (error) throw error;
  return data ?? [];
}

export async function dalGetVportOfficialStats(targetActorId) {
  const { data, error } = await vc.schema("vc").rpc("get_vport_official_stats", {
    p_target_actor_id: targetActorId,
  });

  if (error) throw error;
  // supabase rpc returns array
  return (data && data[0]) ? data[0] : null;
}

export async function dalListVportReviews(targetActorId, limit = 25) {
  const { data, error } = await vc
    .schema("vc")
    .from("vport_reviews")
    .select(
      [
        "id",
        "target_actor_id",
        "author_actor_id",
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
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function dalListVportReviewRatingsByReviewIds(reviewIds) {
  if (!reviewIds?.length) return [];

  const { data, error } = await vc
    .schema("vc")
    .from("vport_review_ratings")
    .select(["review_id", "dimension_key", "rating", "created_at", "updated_at"].join(","))
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