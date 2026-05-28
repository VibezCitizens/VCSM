// src/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal.js

import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";

export async function deleteVportServiceAddonDal({ actorId, addonId } = {}) {
  if (!actorId) throw new Error("deleteVportServiceAddonDal: actorId required");
  if (!addonId) throw new Error("deleteVportServiceAddonDal: addonId required");

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) throw new Error("deleteVportServiceAddonDal: profile not found for actor");

  const { error } = await vportSchema
    .from("service_addons")
    .delete()
    .eq("id", addonId)
    .eq("profile_id", profileId);

  if (error) throw error;

  return { addonId };
}

export default deleteVportServiceAddonDal;
