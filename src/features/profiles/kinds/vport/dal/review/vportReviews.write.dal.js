import { supabase } from "@/services/supabase/supabaseClient";

function normalizeType(t) {
  const v = (t || "overall").toLowerCase();
  return v === "food" ? "food" : "overall";
}

function utcWeekStartISO(d = new Date()) {
  const dt = new Date(d);
  const day = dt.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - diffToMonday);
  dt.setUTCHours(0, 0, 0, 0);
  return dt.toISOString().slice(0, 10);
}

/**
 * Create or update the user's review for THIS WEEK.
 * Enforces "1 review per week" by:
 *  - attempt insert
 *  - if unique violation: fetch current week row and update it
 *
 * Requires DB:
 *  - week_start GENERATED STORED
 *  - unique index on (author_actor_id, target_actor_id, review_type, week_start) WHERE is_deleted=false
 */
export async function createOrUpdateMyCurrentWeekVportReview({
  viewerActorId,
  targetActorId,
  reviewType = "overall",
  rating,
  body,
}) {
  if (!viewerActorId) throw new Error("Missing viewerActorId");
  if (!targetActorId) throw new Error("Missing targetActorId");

  const type = normalizeType(reviewType);
  const safeRating = Number(rating);

  if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
    throw new Error("Rating must be a number from 1 to 5");
  }

  const weekStart = utcWeekStartISO();
  const payload = {
    author_actor_id: viewerActorId,
    target_actor_id: targetActorId,
    review_type: type,
    rating: safeRating,
    body: typeof body === "string" ? body.trim() : null,
    // do NOT send week_start (generated)
  };

  // 1) try insert
  const ins = await supabase
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

  if (!ins.error) return ins.data || null;

  // Unique violation => already reviewed this week -> update the row
  // PostgREST error code for unique violation is typically "23505"
  if (ins.error?.code !== "23505") {
    console.error("[createOrUpdateMyCurrentWeekVportReview] insert failed", ins.error);
    throw ins.error;
  }

  // 2) fetch current week row id
  const { data: existing, error: selErr } = await supabase
    .schema("vc")
    .from("vport_reviews")
    .select("id")
    .eq("author_actor_id", viewerActorId)
    .eq("target_actor_id", targetActorId)
    .eq("review_type", type)
    .eq("is_deleted", false)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (selErr) {
    console.error("[createOrUpdateMyCurrentWeekVportReview] select existing failed", selErr);
    throw selErr;
  }

  if (!existing?.id) {
    // edge case: index says conflict but row not visible (RLS) or missing
    throw ins.error;
  }

  // 3) update existing
  const { data: upd, error: updErr } = await supabase
    .schema("vc")
    .from("vport_reviews")
    .update({
      rating: safeRating,
      body: payload.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
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

  if (updErr) {
    console.error("[createOrUpdateMyCurrentWeekVportReview] update failed", updErr);
    throw updErr;
  }

  return upd || null;
}
