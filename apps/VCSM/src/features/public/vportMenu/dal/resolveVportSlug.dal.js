import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

// Resolves a vport slug to an actorId for public vport pages.
// Queries vport.profiles directly — works for any vport with a public profile,
// regardless of whether they have menu items (unlike resolveMenuSlugDAL).
const cache = createTTLCache(10 * 60 * 1000);

export async function resolveVportSlugDAL(slug) {
  if (!slug || typeof slug !== "string") return null;

  const key = slug.toLowerCase().trim();
  const cached = cache.get(key);
  if (cached) return cached;

  const { data, error } = await supabase
    .schema("vport")
    .from("profiles")
    .select("actor_id, slug")
    .eq("slug", key)
    .eq("is_deleted", false)
    .limit(1)
    .maybeSingle();

  if (error || !data?.actor_id) return null;

  const result = { actorId: data.actor_id, slug: data.slug };
  cache.set(key, result);
  return result;
}

export function invalidateVportSlugCache(slug) {
  slug ? cache.invalidate(slug.toLowerCase()) : cache.invalidateAll();
}
