import { supabase } from "@/services/supabase/supabaseClient";

function normalizeType(t) {
  const v = String(t || "vibez").toLowerCase().trim();
  if (!v) return "vibez";
  const ok = /^[a-z0-9_]+$/.test(v) && v.length <= 48;
  return ok ? v : "vibez";
}

export async function fetchVportReviewsByActorId(
  actorId,
  reviewType = "vibez",
  { limit = 50 } = {}
) {
  if (!actorId) return [];
  const type = normalizeType(reviewType);
  if (type === "overall") return [];

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
      updated_at,
      is_deleted,
      deleted_at
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

export async function fetchVportReviewStatsByActorId(
  actorId,
  reviewType = "vibez",
  { limit = 500 } = {}
) {
  if (!actorId) return { count: 0, avg: null };

  const type = normalizeType(reviewType);
  if (type === "overall") return { count: 0, avg: null };

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_reviews")
    .select("rating")
    .eq("target_actor_id", actorId)
    .eq("review_type", type)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchVportReviewStatsByActorId] failed", error);
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];
  let count = 0;
  let sum = 0;

  for (const r of rows) {
    const n = Number(r?.rating);
    if (!Number.isFinite(n)) continue;
    count += 1;
    sum += n;
  }

  return {
    count,
    avg: count ? Number((sum / count).toFixed(2)) : null,
  };
}
