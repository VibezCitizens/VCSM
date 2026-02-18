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
 * Create or update the user's service review for THIS WEEK.
 * Requires unique index on (author_actor_id, service_id, week_start) WHERE is_deleted=false
 */
export async function createOrUpdateMyCurrentWeekServiceReview({ viewerActorId, serviceId, rating, body }) {
  if (!viewerActorId) throw new Error("Missing viewerActorId");
  if (!serviceId) throw new Error("Missing serviceId");

  const safeRating = Number(rating);
  if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
    throw new Error("Rating must be a number from 1 to 5");
  }

  const weekStart = utcWeekStartISO();

  const payload = {
    author_actor_id: viewerActorId,
    service_id: serviceId,
    rating: safeRating,
    body: typeof body === "string" ? body.trim() : null,
  };

  // 1) try insert
  const ins = await supabase
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
      week_start
    `
    )
    .maybeSingle();

  if (!ins.error) return ins.data || null;

  if (ins.error?.code !== "23505") {
    console.error("[createOrUpdateMyCurrentWeekServiceReview] insert failed", ins.error);
    throw ins.error;
  }

  // 2) fetch this week's row id
  const { data: existing, error: selErr } = await supabase
    .schema("vc")
    .from("vport_service_reviews")
    .select("id")
    .eq("author_actor_id", viewerActorId)
    .eq("service_id", serviceId)
    .eq("is_deleted", false)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (selErr) {
    console.error("[createOrUpdateMyCurrentWeekServiceReview] select existing failed", selErr);
    throw selErr;
  }

  if (!existing?.id) throw ins.error;

  // 3) update existing
  const { data: upd, error: updErr } = await supabase
    .schema("vc")
    .from("vport_service_reviews")
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
      service_id,
      rating,
      body,
      created_at,
      updated_at,
      week_start
    `
    )
    .maybeSingle();

  if (updErr) {
    console.error("[createOrUpdateMyCurrentWeekServiceReview] update failed", updErr);
    throw updErr;
  }

  return upd || null;
}
