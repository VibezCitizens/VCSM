import { supabase } from "@/services/supabase/supabaseClient";

function utcWeekStartISO(d = new Date()) {
  const dt = new Date(d);
  const day = dt.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7; // Mon=0 ... Sun=6
  dt.setUTCDate(dt.getUTCDate() - diffToMonday);
  dt.setUTCHours(0, 0, 0, 0);
  return dt.toISOString().slice(0, 10);
}

/**
 * List reviews for a service.
 */
export async function fetchServiceReviewsByServiceId(serviceId, { limit = 50 } = {}) {
  if (!serviceId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_service_reviews")
    .select(
      `
      id,
      author_actor_id,
      service_id,
      rating,
      body,
      created_at,
      updated_at,
      week_start
    `
    )
    .eq("service_id", serviceId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchServiceReviewsByServiceId] failed", error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Fetch "my review for this week" for a service.
 */
export async function fetchMyCurrentWeekServiceReview(viewerActorId, serviceId) {
  if (!viewerActorId || !serviceId) return null;

  const weekStart = utcWeekStartISO();

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_service_reviews")
    .select(
      `
      id,
      author_actor_id,
      service_id,
      rating,
      body,
      created_at,
      updated_at,
      week_start
    `
    )
    .eq("author_actor_id", viewerActorId)
    .eq("service_id", serviceId)
    .eq("is_deleted", false)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) {
    console.error("[fetchMyCurrentWeekServiceReview] failed", error);
    throw error;
  }

  return data || null;
}

/**
 * Stats for a service: count + avg.
 */
export async function fetchServiceReviewStatsByServiceId(serviceId, { limit = 500 } = {}) {
  if (!serviceId) return { count: 0, avg: null };

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_service_reviews")
    .select("rating")
    .eq("service_id", serviceId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchServiceReviewStatsByServiceId] failed", error);
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];
  let count = 0;
  let sum = 0;

  for (const r of rows) {
    const rating = Number(r?.rating);
    if (!Number.isFinite(rating)) continue;
    count += 1;
    sum += rating;
  }

  return {
    count,
    avg: count ? Number((sum / count).toFixed(2)) : null,
  };
}
