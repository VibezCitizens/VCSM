import reviewsSchema from "@/services/supabase/reviewsClient";

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

const RATING_SELECT =
  "review_id,dimension_id,rating,label_snapshot,weight_snapshot,created_at,updated_at";

/**
 * Resolve dimension keys → dimension UUIDs for a given vport type.
 * Returns a Map<dimensionKey, dimensionId>.
 */
async function resolveDimensionIds(dimensionKeys, vportType) {
  if (!dimensionKeys.length) return new Map();

  const safeSubtype = String(vportType ?? "").trim().toLowerCase() || "other";

  const { data, error } = await reviewsSchema
    .from("review_dimensions")
    .select("id,key")
    .in("key", dimensionKeys)
    .eq("target_kind", "vport")
    .eq("target_subtype", safeSubtype)
    .eq("is_active", true);

  if (error) throw error;

  return new Map((data ?? []).map((d) => [d.key, d.id]));
}

export async function dalInsertVportReviewRow(input) {
  const { targetActorId, authorActorId, vportType, body } = input;
  const safeSubtype = String(vportType ?? "").trim().toLowerCase() || "other";

  const { data, error } = await reviewsSchema
    .from("reviews")
    .insert({
      target_actor_id: targetActorId,
      author_actor_id: authorActorId,
      target_kind: "vport",
      target_subtype: safeSubtype,
      body: body ?? null,
    })
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalUpdateVportReviewBody(reviewId, body, vportType = null) {
  const patch = {
    body: body ?? null,
    updated_at: new Date().toISOString(),
  };
  if (vportType) {
    patch.target_subtype = String(vportType).trim().toLowerCase() || null;
  }

  const { data, error } = await reviewsSchema
    .from("reviews")
    .update(patch)
    .eq("id", reviewId)
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalUpsertVportReviewRatings(reviewId, ratings, vportType) {
  if (!ratings?.length) return [];

  const dimensionKeys = ratings.map((r) => r.dimensionKey).filter(Boolean);
  const keyToId = await resolveDimensionIds(dimensionKeys, vportType);

  const payload = ratings
    .map((r) => {
      const dimensionId = keyToId.get(r.dimensionKey);
      if (!dimensionId) return null;
      return {
        review_id: reviewId,
        dimension_id: dimensionId,
        rating: r.rating,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (!payload.length) return [];

  const { data, error } = await reviewsSchema
    .from("review_dimension_ratings")
    .upsert(payload, { onConflict: "review_id,dimension_id" })
    .select(RATING_SELECT);

  if (error) throw error;
  return data ?? [];
}

export async function dalSoftDeleteVportReview(reviewId) {
  const { data, error } = await reviewsSchema
    .from("reviews")
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
