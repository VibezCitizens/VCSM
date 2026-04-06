import { getPlatformAdminDal } from "@/learning/administration/dal/platformAdmins/getPlatformAdmin.dal";
import { insertPlatformAdminDal } from "@/learning/administration/dal/platformAdmins/insertPlatformAdmin.dal";
import { mapPlatformAdmin } from "@/learning/administration/model/platformAdmin.model";
import { isAdminAuthorized } from "@/learning/administration/controller/admin/adminAccess";
import { writeAuditLog } from "@/learning/administration/controller/shared/writeAuditLog";

export async function addPlatformAdminController({
  supabase,
  userId,
  actorId,
  targetActorId,
}) {
  if (!targetActorId) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "targetActorId is required" },
    };
  }

  const isPlatformAdminActor = await isAdminAuthorized({ supabase, userId, actorId });

  if (!isPlatformAdminActor) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const existing = await getPlatformAdminDal({ supabase, actorId: targetActorId });

  if (existing) {
    return {
      ok: false,
      error: {
        code: "ALREADY_EXISTS",
        message: "Actor is already a platform admin",
      },
    };
  }

  const row = await insertPlatformAdminDal({ supabase, actorId: targetActorId });

  await writeAuditLog({
    supabase,
    actorId,
    action: "add_platform_admin",
    entityType: "platform_admin",
    entityId: targetActorId,
    context: { targetActorId },
  });

  return {
    ok: true,
    data: { admin: mapPlatformAdmin(row) },
  };
}

export default addPlatformAdminController;
