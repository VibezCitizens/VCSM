import { getVportProfileIdByActorDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { listVportResourcesByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportResource.read.dal";
import { insertVportResourceDAL } from "@/features/dashboard/vport/dal/write/vportResource.write.dal";

export async function ensureVportOwnerResourceController({ actorId, ownerActorId }) {
  if (!ownerActorId) throw new Error("ownerActorId is required");

  const profileId = await getVportProfileIdByActorDAL({ actorId: ownerActorId });
  if (!profileId) throw new Error("No vport profile found for this actor.");

  const existing = await listVportResourcesByProfileIdDAL({ profileId, includeInactive: false });
  if (existing.length > 0) return { ok: true, resource: existing[0] };

  const resource = await insertVportResourceDAL({
    row: {
      profile_id:     profileId,
      owner_actor_id: ownerActorId,
      resource_type:  "staff",
      name:           "Primary",
      is_active:      true,
      sort_order:     0,
    },
  });
  return { ok: true, resource };
}
