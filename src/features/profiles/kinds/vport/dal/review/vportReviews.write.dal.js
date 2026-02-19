// src/features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

// vc.vport_reviews constraint: review_type ~ '^[a-z0-9_]+$' and len <= 48
function normalizeType(t) {
  const v = String(t || "vibez").toLowerCase().trim();
  if (!v) return "vibez";
  const ok = /^[a-z0-9_]+$/.test(v) && v.length <= 48;
  return ok ? v : "vibez";
}

/**
 * Create a new review row (no 24h / no weekly limit).
 * "overall" is NOT stored; only dimension keys are stored.
 */
export async function createVportReview({
  viewerActorId,
  targetActorId,
  reviewType,
  rating,
  body,
}) {
  if (!viewerActorId) throw new Error("Missing viewerActorId");
  if (!targetActorId) throw new Error("Missing targetActorId");

  const type = normalizeType(reviewType);
  if (type === "overall") {
    throw new Error("Overall is computed. Pick a category to review.");
  }

  const safeRating = Number(rating);
  if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
    throw new Error("Rating must be a number from 1 to 5");
  }

  const payload = {
    author_actor_id: viewerActorId,
    target_actor_id: targetActorId,
    review_type: type,
    rating: safeRating,
    body: typeof body === "string" ? body.trim() : null,
  };

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_reviews")
    .insert(payload)
    .select(
      `
      id,
      author_actor_id,
      target_actor_id,
      review_type,
      rating,
      body,
      created_at,
      updated_at
    `
    )
    .maybeSingle();

  if (error) {
    console.error("[createVportReview] failed", error);
    throw error;
  }

  return data || null;
}

/**
 * Optional: edit an existing review row (if you want "edit my review" UX later).
 */
export async function updateVportReview({ reviewId, rating, body }) {
  if (!reviewId) throw new Error("Missing reviewId");

  const safeRating = Number(rating);
  if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
    throw new Error("Rating must be a number from 1 to 5");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_reviews")
    .update({
      rating: safeRating,
      body: typeof body === "string" ? body.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(
      `
      id,
      author_actor_id,
      target_actor_id,
      review_type,
      rating,
      body,
      created_at,
      updated_at
    `
    )
    .maybeSingle();

  if (error) {
    console.error("[updateVportReview] failed", error);
    throw error;
  }

  return data || null;
}
