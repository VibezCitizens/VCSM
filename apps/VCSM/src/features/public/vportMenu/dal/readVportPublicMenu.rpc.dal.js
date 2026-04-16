import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: fetch vport public menu from vport.* tables.
 * Resolves actor_id → profile_id via vport.profiles, then fetches
 * categories and items in parallel.
 * Returns an envelope compatible with mapVportPublicMenuRpcResult (nested shape).
 */
export async function readVportPublicMenuRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicMenuRpcDAL: actorId is required");
  }

  const { data: profileRow, error: profileError } = await supabase
    .schema("vport")
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profileRow) {
    return { ok: false, actor_id: actorId, error: "not_found", rows: [] };
  }

  const profileId = profileRow.id;

  const [catResult, itemResult] = await Promise.all([
    supabase
      .schema("vport")
      .from("menu_categories")
      .select("id,key,name,description,sort_order")
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .schema("vport")
      .from("menu_items")
      .select("id,category_id,key,name,description,price_cents,currency_code,image_url,sort_order")
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (catResult.error) throw catResult.error;
  if (itemResult.error) throw itemResult.error;

  const categories = catResult.data ?? [];
  const items = itemResult.data ?? [];

  if (!categories.length && !items.length) {
    return { ok: false, actor_id: actorId, error: "not_found", rows: [] };
  }

  return {
    ok: true,
    actor_id: actorId,
    error: null,
    categories,
    items,
  };
}

export default readVportPublicMenuRpcDAL;
