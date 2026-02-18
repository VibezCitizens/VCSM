import { supabase } from "@/services/supabase/supabaseClient";

function normalizeType(t) {
  const v = (t || "overall").toLowerCase();
  return v === "food" ? "food" : "overall";
}

function utcWeekStartISO(d = new Date()) {
  // returns YYYY-MM-DD for Monday-start week in UTC (matches date_trunc('week', ...)
  const dt = new Date(d);
  const day = dt.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7; // Mon=0 ... Sun=6
  dt.setUTCDate(dt.getUTCDate() - diffToMonday);
  dt.setUTCHours(0, 0, 0, 0);
  return dt.toISOString().slice(0, 10);
}

/**
 * List reviews for a vport actor by type.
 */
export async function fetchVportReviewsByActorId(actorId, reviewType = "overall", { limit = 50 } = {}) {
  if (!actorId) return [];

  const type = normalizeType(reviewType);

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_reviews")
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
    .eq("target_actor_id", actorId)
    .eq("review_type", type)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchVportReviewsByActorId] failed", error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Fetch "my review for this week" (if exists) for a given target actor + type.
 * Requires viewerActorId (author).
 */
export async function fetchMyCurrentWeekVportReview(viewerActorId, targetActorId, reviewType = "overall") {
  if (!viewerActorId || !targetActorId) return null;

  const type = normalizeType(reviewType);
  const weekStart = utcWeekStartISO();

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_reviews")
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
    .eq("author_actor_id", viewerActorId)
    .eq("target_actor_id", targetActorId)
    .eq("review_type", type)
    .eq("is_deleted", false)
    // week_start is GENERATED STORED in DB; you can filter it as a column
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) {
    console.error("[fetchMyCurrentWeekVportReview] failed", error);
    throw error;
  }

  return data || null;
}

/**
 * Lightweight stats (count + avg) for both types.
 * Uses RPC-free approach: fetch ratings only and aggregate client-side (fine for small sets).
 * If you want server-side aggregation later, we can add an RPC or a view.
 */
export async function fetchVportReviewStatsByActorId(actorId, { limit = 500 } = {}) {
  if (!actorId) {
    return {
      overall: { count: 0, avg: null },
      food: { count: 0, avg: null },
    };
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_reviews")
    .select("review_type, rating")
    .eq("target_actor_id", actorId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchVportReviewStatsByActorId] failed", error);
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];
  const agg = {
    overall: { count: 0, sum: 0 },
    food: { count: 0, sum: 0 },
  };

  for (const r of rows) {
    const t = normalizeType(r?.review_type);
    const rating = Number(r?.rating);
    if (!Number.isFinite(rating)) continue;
    agg[t].count += 1;
    agg[t].sum += rating;
  }

  const mk = (x) => ({
    count: x.count,
    avg: x.count ? Number((x.sum / x.count).toFixed(2)) : null,
  });

  return {
    overall: mk(agg.overall),
    food: mk(agg.food),
  };
}
