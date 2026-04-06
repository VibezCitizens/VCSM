// src/features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.js

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: Read add-ons for an actor_id (optionally filtered by parent_service_key).
 *
 * Returns raw vc.vport_service_addons rows (explicit projection).
 *
 * @param {object} params
 * @param {string} params.actorId
 * @param {string|null|undefined} [params.parentServiceKey]
 *   - undefined => no filter
 *   - null      => parent_service_key IS NULL
 *   - string    => parent_service_key = string
 * @param {boolean} [params.includeDisabled=true]
 * @returns {Promise<Array>}
 */
export async function readVportServiceAddonsByActor({
  actorId,
  parentServiceKey,
  includeDisabled = true,
} = {}) {
  if (!actorId) {
    throw new Error("readVportServiceAddonsByActor: actorId is required");
  }

  let q = supabase
    .schema("vc")
    .from("vport_service_addons")
    .select(
      "id,actor_id,parent_service_key,key,label,category,enabled,meta,sort_order,created_at,updated_at"
    )
    .eq("actor_id", actorId)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  // only apply filter if caller provided the param (including null)
  if (Object.prototype.hasOwnProperty.call(arguments[0] ?? {}, "parentServiceKey")) {
    if (parentServiceKey === null) q = q.is("parent_service_key", null);
    else q = q.eq("parent_service_key", parentServiceKey);
  }

  if (!includeDisabled) q = q.eq("enabled", true);

  const { data, error } = await q;
  if (error) throw error;

  return data ?? [];
}

export default readVportServiceAddonsByActor;