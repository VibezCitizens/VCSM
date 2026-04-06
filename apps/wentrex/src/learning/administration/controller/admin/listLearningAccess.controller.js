import { listActorAccessDal } from "@/learning/administration/dal/actorAccess/listActorAccess.dal";
import { mapActorAccessList } from "@/learning/administration/model/actorAccess.model";
import { isAdminAuthorized } from "@/learning/administration/controller/admin/adminAccess";

export async function listLearningAccessController({ supabase, userId, actorId }) {
  const isPlatformAdminActor = await isAdminAuthorized({ supabase, userId, actorId });

  if (!isPlatformAdminActor) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const rows = await listActorAccessDal({ supabase });

  return {
    ok: true,
    data: {
      accessRecords: mapActorAccessList(rows),
      grantedCount: rows.filter((r) => r.can_access_learning_center).length,
      revokedCount: rows.filter((r) => !r.can_access_learning_center).length,
    },
  };
}

export default listLearningAccessController;
