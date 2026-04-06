import { listPlatformAdminsDal } from "@/learning/administration/dal/platformAdmins/listPlatformAdmins.dal";
import { mapPlatformAdmins } from "@/learning/administration/model/platformAdmin.model";
import { isAdminAuthorized } from "@/learning/administration/controller/admin/adminAccess";

export async function listPlatformAdminsController({ supabase, userId, actorId }) {
  const isPlatformAdminActor = await isAdminAuthorized({ supabase, userId, actorId });

  if (!isPlatformAdminActor) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const rows = await listPlatformAdminsDal({ supabase });

  return {
    ok: true,
    data: {
      admins: mapPlatformAdmins(rows),
      adminCount: rows.length,
    },
  };
}

export default listPlatformAdminsController;
