import { supabase } from "@/services/supabase/supabaseClient";

export async function readReviewSummaries() {
  const { data, error } = await supabase
    .schema("reviews")
    .from("public_vport_review_summary_v")
    .select("target_actor_id, review_count, average_rating");

  if (error) throw error;
  return data ?? [];
}

export async function readRecentReviews() {
  const { data, error } = await supabase
    .schema("reviews")
    .from("public_vport_reviews_v")
    .select(
      "review_id, overall_rating, body, review_activity_at, author_display_name_snapshot"
    )
    .order("review_activity_at", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}
