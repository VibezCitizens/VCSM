import { supabase } from "@/services/supabase/supabaseClient";

export async function fetchRawPostMentionEdgesDAL(postIds) {
  const ids = Array.isArray(postIds) ? postIds.filter(Boolean) : [];
  if (!ids.length) return [];

  const { data: edges, error: eErr } = await supabase
    .schema("vc")
    .from("post_mentions")
    .select("post_id, mentioned_actor_id")
    .in("post_id", ids);

  if (eErr) {
    if (import.meta.env.DEV) console.warn("[fetchRawPostMentionEdgesDAL] post_mentions query failed:", eErr);
    return [];
  }

  return Array.isArray(edges) ? edges : [];
}

export const readPostMentionRows = fetchRawPostMentionEdgesDAL;
