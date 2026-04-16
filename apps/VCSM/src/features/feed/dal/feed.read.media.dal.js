import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

// 60s TTL — post media rarely changes. Per-post caching prevents re-reads
// if the same post appears across pagination pages or pull-to-refresh.
const mediaCache = createTTLCache(60_000);

export function invalidatePostMediaCache(postId) {
  if (postId) mediaCache.invalidate(postId);
  else mediaCache.invalidateAll();
}

export async function readPostMediaMap(postIds) {
  const mediaMap = new Map(); // post_id -> [{url,media_type,sort_order}, ...]

  if (!Array.isArray(postIds) || postIds.length === 0) return mediaMap;

  // Split into cached vs uncached post IDs
  const uncachedIds = [];
  for (const pid of postIds) {
    const cached = mediaCache.get(pid);
    if (cached) {
      if (cached.length > 0) mediaMap.set(pid, cached);
    } else {
      uncachedIds.push(pid);
    }
  }

  if (uncachedIds.length === 0) return mediaMap;

  const { data: pm, error: pmErr } = await supabase
    .schema("vc")
    .from("post_media")
    .select("post_id, url, media_type, sort_order")
    .in("post_id", uncachedIds)
    .order("sort_order", { ascending: true });

  if (pmErr) {
    return mediaMap;
  }

  // Build results for fetched posts and cache them
  const fetchedMap = new Map();
  for (const it of (pm || [])) {
    const pid = it?.post_id;
    const url = it?.url;
    if (!pid || !url) continue;

    const arr = fetchedMap.get(pid) || [];
    arr.push({
      url,
      media_type: it?.media_type ?? null,
      sort_order: it?.sort_order ?? 0,
    });
    fetchedMap.set(pid, arr);
  }

  // Cache all fetched post media (including empty results to prevent re-fetch)
  for (const pid of uncachedIds) {
    const media = fetchedMap.get(pid) || [];
    mediaCache.set(pid, media);
    if (media.length > 0) mediaMap.set(pid, media);
  }

  return mediaMap;
}
