import { supabase } from "@/services/supabase/supabaseClient";

export async function readFeedPostsPage({
  realmId,
  cursorCreatedAt,
  pageSize,
}) {
  if (!realmId) {
    return { pageRows: [], hasMoreNow: false, nextCursorCreatedAt: null };
  }

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
      location_text,
      payload
    `)
    .is("deleted_at", null)
    .eq("realm_id", realmId)
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
