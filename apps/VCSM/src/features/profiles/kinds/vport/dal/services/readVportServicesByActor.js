// src/features/profiles/kinds/vport/dal/services/readVportServicesByActor.js

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: Read vport services overrides for an actor_id.
 *
 * Returns raw vc.vport_services rows (explicit projection).
 *
 * @param {object} params
 * @param {string} params.actorId
 * @param {boolean} [params.includeDisabled=true]
 * @returns {Promise<Array>}
 */
export async function readVportServicesByActor({
  actorId,
  includeDisabled = true,
} = {}) {
  if (!actorId) {
    throw new Error("readVportServicesByActor: actorId is required");
  }

  let q = supabase
    .schema("vc")
    .from("vport_services")
    .select("id,actor_id,key,label,category,enabled,meta,created_at,updated_at")
    .eq("actor_id", actorId)
    .order("key", { ascending: true });

  if (!includeDisabled) q = q.eq("enabled", true);

  const { data, error } = await q;
  if (error) throw error;

  return data ?? [];
}

export default readVportServicesByActor;