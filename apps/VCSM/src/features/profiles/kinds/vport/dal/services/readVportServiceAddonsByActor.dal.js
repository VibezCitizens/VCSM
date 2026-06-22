// src/features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.js

import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";

const ADDONS_SELECT =
  "id,profile_id,service_id,key,label,enabled,meta,sort_order,created_at,updated_at";

/**
 * DAL: Read add-ons for an actor_id (optionally filtered by parent service_id).
 *
 * @param {object} params
 * @param {string} params.actorId
 * @param {string|null|undefined} [params.parentServiceId]
 *   - undefined => no filter
 *   - null      => service_id IS NULL
 *   - string    => service_id = string (uuid)
 * @param {boolean} [params.includeDisabled=true]
 * @returns {Promise<Array>}
 */
export async function readVportServiceAddonsByActor({
  actorId,
  parentServiceId,
  includeDisabled = true,
} = {}) {
  if (!actorId) throw new Error("readVportServiceAddonsByActor: actorId is required");

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) return [];

  let q = vportSchema
    .from("service_addons")
    .select(ADDONS_SELECT)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (Object.prototype.hasOwnProperty.call(arguments[0] ?? {}, "parentServiceId")) {
    if (parentServiceId === null) q = q.is("service_id", null);
    else q = q.eq("service_id", parentServiceId);
  }

  if (!includeDisabled) q = q.eq("enabled", true);

  const { data, error } = await q;
  if (error) throw error;

  return data ?? [];
}

export default readVportServiceAddonsByActor;
