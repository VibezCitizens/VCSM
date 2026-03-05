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
const DIMENSION_SELECT = [
  "vport_type",
  "dimension_key",
  "label",
  "weight",
  "sort_order",
  "is_active",
  "created_at",
  "updated_at",
].join(",");

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

export async function dalUpsertVportReviewDimensions(vportType, dimensions) {
  const safeVportType = String(vportType ?? "").trim().toLowerCase();
  if (!safeVportType) return [];

  const rows = Array.isArray(dimensions) ? dimensions : [];
  if (!rows.length) return [];

  const nowIso = new Date().toISOString();

  const payload = rows
    .map((d, idx) => {
      const key = String(d?.dimensionKey ?? d?.dimension_key ?? d?.key ?? "").trim();
      if (!key) return null;

      const label = String(d?.label ?? key).trim();
      const weight = Number(d?.weight);
      const sortOrder = Number(d?.sortOrder ?? d?.sort_order ?? idx);

      return {
        vport_type: safeVportType,
        dimension_key: key,
        label: label || key,
        weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : idx,
        is_active: true,
        updated_at: nowIso,
      };
    })
    .filter(Boolean);

  if (!payload.length) return [];

  const { data, error } = await vc
    .schema("vc")
    .from("vport_review_dimensions")
    .upsert(payload, { onConflict: "vport_type,dimension_key" })
    .select(DIMENSION_SELECT);

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
