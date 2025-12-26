// src/features/post/dal/post.listByActor.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * List posts by actor
 * DAL — RAW DB ROWS ONLY
 */
export async function listPostsByActorDAL({
  actorId,
  page = 0,
  pageSize = 20,
  media = "all",
}) {
  if (!actorId) {
    return { rows: [], done: true };
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      title,
      media_type,
      media_url,
      post_type,
      tags,
      created_at
    `)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (media !== "all") {
    query = query.eq("media_type", media);
  }

  const { data, error } = await query;

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];

  return {
    rows,
    done: rows.length < pageSize,
  };
}
