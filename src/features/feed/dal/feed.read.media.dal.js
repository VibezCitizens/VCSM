import { supabase } from "@/services/supabase/supabaseClient";
import { inferMediaType } from "@/features/feed/model/inferMediaType";

export async function readPostMediaMap(postIds) {
  const mediaMap = new Map(); // post_id -> [{type,url}, ...]

  if (!Array.isArray(postIds) || postIds.length === 0) return mediaMap;

  const { data: pm, error: pmErr } = await supabase
    .schema("vc")
    .from("post_media")
    .select("post_id, url, media_type, sort_order")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true });

  if (pmErr || !Array.isArray(pm) || pm.length === 0) return mediaMap;

  for (const it of pm) {
    const pid = it?.post_id;
    const url = it?.url;
    if (!pid || !url) continue;

    const type =
      (it.media_type || inferMediaType(url)) === "video" ? "video" : "image";

    const arr = mediaMap.get(pid) || [];
    arr.push({ type, url });
    mediaMap.set(pid, arr);
  }

  return mediaMap;
}
