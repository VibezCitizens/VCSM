import { ACTOR_ACCESS_COLUMNS } from "@/learning/administration/dal/actorAccess/getActorAccess.dal";

export async function upsertActorAccessDal({
  supabase,
  actorId,
  canAccessLearningCenter,
  grantedByActorId,
  grantedAt = null,
  revokedAt = null,
  notes = "",
}) {
  if (!supabase) {
    throw new Error("upsertActorAccessDal requires supabase");
  }

  if (!actorId) {
    throw new Error("upsertActorAccessDal requires actorId");
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .schema("learning")
    .from("actor_access")
    .upsert(
      {
        actor_id: actorId,
        can_access_learning_center: canAccessLearningCenter,
        granted_by_actor_id: grantedByActorId ?? null,
        granted_at: grantedAt ?? (canAccessLearningCenter ? now : null),
        revoked_at: revokedAt ?? (!canAccessLearningCenter ? now : null),
        notes: notes ?? "",
        updated_at: now,
      },
      { onConflict: "actor_id" },
    )
    .select(ACTOR_ACCESS_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default upsertActorAccessDal;
