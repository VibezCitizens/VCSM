import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

// Slug resolution for the public menu page only.
// Queries public_menu_read_model_v — accessible to anon without touching vport.profiles directly.
// Only resolves vports that have at least one active menu category + item.
const cache = createTTLCache(10 * 60 * 1000);

export async function resolveMenuSlugDAL(slug) {
  if (!slug || typeof slug !== "string") return null;

  const key = slug.toLowerCase().trim();
  const cached = cache.get(key);
  if (cached) return cached;

  const { data, error } = await supabase
    .schema("vport")
    .from("public_menu_read_model_v")
    .select("actor_id, profile_slug")
    .eq("profile_slug", key)
    .limit(1)
    .maybeSingle();

  if (error || !data?.actor_id) return null;

  const result = { actorId: data.actor_id, slug: data.profile_slug };
  cache.set(key, result);
  return result;
}

export function invalidateMenuSlugCache(slug) {
  slug ? cache.invalidate(slug.toLowerCase()) : cache.invalidateAll();
}
