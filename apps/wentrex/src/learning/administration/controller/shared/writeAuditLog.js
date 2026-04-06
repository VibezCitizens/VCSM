import { insertAuditLogDal } from "@/learning/administration/dal/auditLog/insertAuditLog.dal";

/**
 * Fire-and-forget audit write. A failure here must never crash the calling
 * controller — audit logs are best-effort and non-blocking.
 */
export async function writeAuditLog({
  supabase,
  actorId,
  action,
  entityType = null,
  entityId = null,
  context = null,
  realmId = null,
}) {
  try {
    await insertAuditLogDal({
      supabase,
      actorId,
      action,
      entityType,
      entityId,
      context,
      realmId,
    });
  } catch {
    // Intentionally swallowed: audit log writes are best-effort.
  }
}

export default writeAuditLog;
