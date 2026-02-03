import { supabase } from "@/services/supabase/supabaseClient";

export async function readFeedPostsPage({
  realmId,
  cursorCreatedAt,
  pageSize,
}) {
  let q = supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      title,
      media_url,
      media_type,
      post_type,
      created_at,
      realm_id,
      edited_at,
      deleted_at,
      deleted_by_actor_id,
      location_text
    `)
    .eq("realm_id", realmId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(pageSize + 1);

  if (cursorCreatedAt) {
    q = q.lt("created_at", cursorCreatedAt);
  }

  const { data: rows, error } = await q;
  if (error) throw error;

  const list = Array.isArray(rows) ? rows : [];

  const hasMoreNow = list.length > pageSize;
  const pageRows = hasMoreNow ? list.slice(0, pageSize) : list;

  const nextCursorCreatedAt = pageRows.at(-1)?.created_at ?? null;

  return {
    pageRows,
    hasMoreNow,
    nextCursorCreatedAt,
  };
}
