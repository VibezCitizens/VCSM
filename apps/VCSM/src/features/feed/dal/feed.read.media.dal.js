import { supabase } from "@/services/supabase/supabaseClient";

export async function readPostMediaMap(postIds) {
  const mediaMap = new Map(); // post_id -> [{url,media_type,sort_order}, ...]

  if (!Array.isArray(postIds) || postIds.length === 0) return mediaMap;

  const { data: pm, error: pmErr } = await supabase
    .schema("vc")
    .from("post_media")
    .select("post_id, url, media_type, sort_order")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true });

  if (pmErr) {
    console.warn("[feed.read.media] post_media fetch failed; falling back to legacy media_url", {
      postCount: postIds.length,
      error: pmErr.message || pmErr,
    });
    return mediaMap;
  }

  if (!Array.isArray(pm) || pm.length === 0) {
    return mediaMap;
  }

  for (const it of pm) {
    const pid = it?.post_id;
    const url = it?.url;
    if (!pid || !url) continue;

    const arr = mediaMap.get(pid) || [];
    arr.push({
      url,
      media_type: it?.media_type ?? null,
      sort_order: it?.sort_order ?? 0,
    });
    mediaMap.set(pid, arr);
  }

  return mediaMap;
}
