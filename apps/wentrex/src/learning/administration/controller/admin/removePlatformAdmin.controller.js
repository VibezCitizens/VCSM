import { getPlatformAdminDal } from "@/learning/administration/dal/platformAdmins/getPlatformAdmin.dal";
import { deletePlatformAdminDal } from "@/learning/administration/dal/platformAdmins/deletePlatformAdmin.dal";
import { isAdminAuthorized } from "@/learning/administration/controller/admin/adminAccess";
import { writeAuditLog } from "@/learning/administration/controller/shared/writeAuditLog";

export async function removePlatformAdminController({
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

  if (actorId === targetActorId) {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "You cannot remove yourself as a platform admin",
      },
    };
  }

  const isPlatformAdminActor = await isAdminAuthorized({ supabase, userId, actorId });

  if (!isPlatformAdminActor) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const existing = await getPlatformAdminDal({ supabase, actorId: targetActorId });

  if (!existing) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Actor is not a platform admin" },
    };
  }

  await deletePlatformAdminDal({ supabase, actorId: targetActorId });

  await writeAuditLog({
    supabase,
    actorId,
    action: "remove_platform_admin",
    entityType: "platform_admin",
    entityId: targetActorId,
    context: { targetActorId },
  });

  return { ok: true, data: {} };
}

export default removePlatformAdminController;
