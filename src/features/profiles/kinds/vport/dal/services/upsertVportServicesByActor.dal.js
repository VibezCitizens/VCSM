// src/features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: Upsert vport services overrides for an actor_id.
 *
 * Requires a unique constraint/index on (actor_id, key) for onConflict to work.
 *
 * @param {object} params
 * @param {Array<object>} params.rows - rows shaped for vc.vport_services
 * @returns {Promise<Array>}
 */
export async function upsertVportServicesByActorDal({ rows } = {}) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];

  if (!list.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_services")
    .upsert(list, { onConflict: "actor_id,key" })
    .select("id,actor_id,key,label,category,enabled,meta,created_at,updated_at");

  if (error) throw error;
  return data ?? [];
}

export default upsertVportServicesByActorDal;