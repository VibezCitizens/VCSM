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
  "is_verified",
  "rating_scale",
  "overall_rating",
  "body",
  "created_at",
  "updated_at",
  "is_deleted",
  "deleted_at",
].join(",");

const RATING_SELECT = ["review_id", "dimension_key", "rating", "created_at", "updated_at"].join(",");

export async function dalInsertVportReviewRow(input) {
  const { targetActorId, authorActorId, isVerified, body } = input;

  const { data, error } = await vc
    .schema("vc")
    .from("vport_reviews")
    .insert({
      target_actor_id: targetActorId,
      author_actor_id: authorActorId,
      is_verified: isVerified,
      body: body ?? null,
    })
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalUpdateVportReviewBody(reviewId, body) {
  const { data, error } = await vc
    .schema("vc")
    .from("vport_reviews")
    .update({
      body: body ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalUpsertVportReviewRatings(reviewId, ratings) {
  if (!ratings?.length) return [];

  const payload = ratings.map((r) => ({
    review_id: reviewId,
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