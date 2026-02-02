import { supabase } from "@/services/supabase/supabaseClient";

export async function readPostMediaByPostIdsDAL(postIds = []) {
  const ids = Array.isArray(postIds) ? postIds.filter(Boolean) : [];
  if (!ids.length) return new Map();

  const { data, error } = await supabase
    .schema("vc")
    .from("post_media")
    .select("post_id, url, media_type, sort_order, created_at")
    .in("post_id", ids)
    .order("post_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const map = new Map(); // post_id -> [{ type, url, sort_order }]
  for (const r of data || []) {
    const arr = map.get(r.post_id) || [];
    arr.push({
      type: r.media_type,
      url: r.url,
      sort_order: r.sort_order ?? 0,
    });
    map.set(r.post_id, arr);
  }

  return map;
}
