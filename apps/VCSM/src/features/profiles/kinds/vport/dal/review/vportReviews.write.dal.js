// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\review\vportReviews.write.dal.js
import vc from "@/services/supabase/vcClient";

/* ============================================================
   DAL: WRITE (raw DB writes only)
   - explicit selects
   - no business logic
   ============================================================ */
const REVIEW_SELECT = [
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
].join(",");

const RATING_SELECT = ["review_id", "vport_type", "dimension_key", "rating", "created_at", "updated_at"].join(",");

export async function dalInsertVportReviewRow(input) {
  const { targetActorId, authorActorId, vportType, body } = input;
  const safeVportType = String(vportType ?? "").trim().toLowerCase() || "other";

  const { data, error } = await vc
    .schema("vc")
    .from("vport_reviews")
    .insert({
      target_actor_id: targetActorId,
      author_actor_id: authorActorId,
      vport_type: safeVportType,
      is_verified: false,
      body: body ?? null,
    })
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalUpdateVportReviewBody(reviewId, body, vportType = null) {
  const safeVportType = String(vportType ?? "").trim().toLowerCase() || null;
  const patch = {
    body: body ?? null,
    updated_at: new Date().toISOString(),
  };
  if (safeVportType) patch.vport_type = safeVportType;

  const { data, error } = await vc
    .schema("vc")
    .from("vport_reviews")
    .update(patch)
    .eq("id", reviewId)
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalUpsertVportReviewRatings(reviewId, ratings, vportType) {
  if (!ratings?.length) return [];
  const safeVportType = String(vportType ?? "").trim().toLowerCase() || "other";

  const payload = ratings.map((r) => ({
    review_id: reviewId,
    vport_type: safeVportType,
    dimension_key: r.dimensionKey,
    rating: r.rating,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await vc
    .schema("vc")
    .from("vport_review_ratings")
    .upsert(payload, { onConflict: "review_id,dimension_key" })
    .select(RATING_SELECT);

  if (error) throw error;
  return data ?? [];
}

export async function dalSoftDeleteVportReview(reviewId) {
  const { data, error } = await vc
    .schema("vc")
    .from("vport_reviews")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}
