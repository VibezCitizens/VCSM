import { supabase } from "@/services/supabase/supabaseClient";

/**
 * List active services for a vport actor.
 * Returns raw rows.
 */
export async function fetchVportServicesByActorId(actorId, { limit = 200 } = {}) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_services")
    .select(
      `
      id,
      actor_id,
      name,
      description,
      price_cents,
      currency_code,
      duration_minutes,
      is_active,
      sort_order,
      created_at,
      updated_at
    `
    )
    .eq("actor_id", actorId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[fetchVportServicesByActorId] failed", error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}
