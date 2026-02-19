// src/features/profiles/kinds/vport/dal/services/vportServiceReviews.write.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Unlimited system:
 * - no week_start
 * - no 24h gate
 * - insert new rows freely
 */

export async function createServiceReview({
  viewerActorId,
  serviceId,
  rating,
  body,
}) {
  if (!viewerActorId) throw new Error("Missing viewerActorId");
  if (!serviceId) throw new Error("Missing serviceId");

  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    throw new Error("Rating must be a number from 1 to 5");
  }

  const payload = {
    author_actor_id: viewerActorId,
    service_id: serviceId,
    rating: r,
    body: typeof body === "string" ? body.trim() : null,
  };

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_service_reviews")
    .insert(payload)
    .select(
      `
      id,
      author_actor_id,
      service_id,
      rating,
      body,
      created_at,
      updated_at,
      is_deleted,
      deleted_at
      `
    )
    .maybeSingle();

  if (error) {
    console.error("[createServiceReview] failed", error);
    throw error;
  }

  return data || null;
}

/**
 * Optional edit-by-id (only if you support editing a specific review row)
 */
export async function updateServiceReview({
  reviewId,
  rating,
  body,
}) {
  if (!reviewId) throw new Error("Missing reviewId");

  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    throw new Error("Rating must be a number from 1 to 5");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_service_reviews")
    .update({
      rating: r,
      body: typeof body === "string" ? body.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(
      `
      id,
      author_actor_id,
      service_id,
      rating,
      body,
      created_at,
      updated_at,
      is_deleted,
      deleted_at
      `
    )
    .maybeSingle();

  if (error) {
    console.error("[updateServiceReview] failed", error);
    throw error;
  }

  return data || null;
}
