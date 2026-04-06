import { getActorAccessDal } from "@/learning/administration/dal/actorAccess/getActorAccess.dal";
import { upsertActorAccessDal } from "@/learning/administration/dal/actorAccess/upsertActorAccess.dal";
import { mapActorAccess } from "@/learning/administration/model/actorAccess.model";
import { isAdminAuthorized } from "@/learning/administration/controller/admin/adminAccess";
import { writeAuditLog } from "@/learning/administration/controller/shared/writeAuditLog";

export async function revokeLearningAccessController({
  supabase,
  userId,
  actorId,
  targetActorId,
  notes = "",
}) {
  if (!targetActorId) {
    return { ok: false, error: { code: "TARGET_ACTOR_ID_REQUIRED" } };
  }

  const isPlatformAdminActor = await isAdminAuthorized({ supabase, userId, actorId });

  if (!isPlatformAdminActor) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const existing = await getActorAccessDal({ supabase, actorId: targetActorId });

  const row = await upsertActorAccessDal({
    supabase,
    actorId: targetActorId,
    canAccessLearningCenter: false,
    grantedByActorId: existing?.granted_by_actor_id ?? actorId,
    grantedAt: existing?.granted_at ?? null,
    notes: notes || existing?.notes || "",
  });

  await writeAuditLog({
    supabase,
    actorId,
    action: "revoke_learning_access",
    entityType: "actor_access",
    entityId: targetActorId,
    context: { targetActorId, notes },
  });

  return {
    ok: true,
    data: {
      access: mapActorAccess(row),
    },
  };
}

export default revokeLearningAccessController;
