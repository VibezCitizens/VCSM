export async function insertAuditLogDal({
  supabase,
  actorId,
  action,
  entityType = null,
  entityId = null,
  context = null,
  realmId = null,
}) {
  if (!supabase) {
    throw new Error("insertAuditLogDal requires supabase");
  }

  if (!actorId) {
    throw new Error("insertAuditLogDal requires actorId");
  }

  if (!action) {
    throw new Error("insertAuditLogDal requires action");
  }

  const { error } = await supabase
    .schema("learning")
    .from("audit_log")
    .insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      context: context ?? null,
      realm_id: realmId,
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}

export default insertAuditLogDal;
