// src/features/profiles/kinds/vport/dal/services/readVportServicesByActor.js

import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";

const SERVICES_SELECT =
  "id,profile_id,key,label,description,service_group,sort_order,enabled,meta,created_at,updated_at";

export async function readVportServicesByActor({
  actorId,
  includeDisabled = true,
} = {}) {
  if (!actorId) throw new Error("readVportServicesByActor: actorId is required");

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) return [];

  let q = vportSchema
    .from("services")
    .select(SERVICES_SELECT)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true });

  if (!includeDisabled) q = q.eq("enabled", true);

  const { data, error } = await q;
  if (error) throw error;

  return data ?? [];
}

export default readVportServicesByActor;
