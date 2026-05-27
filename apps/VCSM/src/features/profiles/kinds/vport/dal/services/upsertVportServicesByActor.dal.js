// src/features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js

import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";

const SERVICES_SELECT =
  "id,profile_id,key,label,description,service_group,sort_order,enabled,meta,created_at,updated_at";

/**
 * DAL: Upsert vport services for an actor.
 *
 * Requires a unique constraint on (profile_id, key).
 *
 * @param {object} params
 * @param {string} params.actorId
 * @param {Array<object>} params.rows - service row shapes (without profile_id — injected here)
 * @returns {Promise<Array>}
 */
export async function upsertVportServicesByActorDal({ actorId, rows } = {}) {
  if (!actorId) throw new Error("upsertVportServicesByActorDal: actorId is required");

  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (!list.length) return [];

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) return [];

  const mapped = list.map((r) => ({
    profile_id: profileId,
    key: r.key,
    label: r.label,
    description: r.description ?? null,
    service_group: r.service_group ?? null,
    enabled: r.enabled !== false,
    sort_order: r.sort_order ?? 0,
    meta: r.meta ?? {},
    updated_at: r.updated_at ?? new Date().toISOString(),
  }));

  const { data, error } = await vportSchema
    .from("services")
    .upsert(mapped, { onConflict: "profile_id,key" })
    .select(SERVICES_SELECT);

  if (error) throw error;
  return data ?? [];
}

export default upsertVportServicesByActorDal;
