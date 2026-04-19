// src/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal.js
// Public DAL — returns only published pages for a vport actor

import vportSchema from "@/services/supabase/vportClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const PUBLIC_SELECT =
  "id,actor_id,profile_id,title,slug,excerpt,category,service_keys,published_at,created_at";

// 5-minute TTL — invalidated on publish/unpublish via invalidateVportPublicContentCache
const publicContentCache = createTTLCache(5 * 60_000);

export function invalidateVportPublicContentCache(actorId) {
  if (actorId) publicContentCache.invalidate(`pages:${actorId}`);
  else publicContentCache.invalidateAll();
}

export async function listVportPublicContentPagesDAL({ actorId } = {}) {
  if (!actorId) throw new Error("listVportPublicContentPagesDAL: actorId is required");

  const cacheKey = `pages:${actorId}`;
  const cached = publicContentCache.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await vportSchema
    .from("content_pages")
    .select(PUBLIC_SELECT)
    .eq("actor_id", actorId)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;
  const rows = data ?? [];
  publicContentCache.set(cacheKey, rows);
  return rows;
}

export default listVportPublicContentPagesDAL;
