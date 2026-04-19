import { supabase } from "@/services/supabase/supabaseClient";

const PAGE_SIZE = 20;

/**
 * DAL: paginated read from reviews.public_vport_reviews_v.
 * cursor is the `created_at` value of the last row from the previous page.
 */
export async function readPublicVportReviewsDAL(targetActorId, { limit = PAGE_SIZE, cursor = null } = {}) {
  if (!targetActorId) throw new Error("readPublicVportReviewsDAL: targetActorId is required");

  let query = supabase
    .schema("reviews")
    .from("public_vport_reviews_v")
    .select(
      "review_id,target_actor_id,author_actor_id,verification_status,overall_rating,body,author_display_name_snapshot,author_username_snapshot,author_avatar_url_snapshot,review_activity_at,created_at"
    )
    .eq("target_actor_id", targetActorId)
    .order("review_activity_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.lt("review_activity_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
}

export default readPublicVportReviewsDAL;
