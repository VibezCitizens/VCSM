// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\moderation\dal\moderationActions.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

/* ============================================================
   DAL: moderationActions
   - Thin DB adapter only
   - Explicit column projections only
   - Returns raw rows exactly as stored
   ============================================================ */

/**
 * Insert a moderation action row.
 * Returns the raw inserted row (projected columns only).
 */
export async function insertModerationActionDAL({
  actorId,
  reportId = null,
  objectType,
  objectId,
  actionType,
  reason,
}) {
  if (!actorId) throw new Error("insertModerationActionDAL: actorId required");
  if (!objectType) throw new Error("insertModerationActionDAL: objectType required");
  if (!objectId) throw new Error("insertModerationActionDAL: objectId required");
  if (!actionType) throw new Error("insertModerationActionDAL: actionType required");

  const { data, error } = await supabase
    .schema("vc")
    .from("moderation_actions")
    .insert({
      actor_id: actorId,
      report_id: reportId,
      object_type: objectType,
      object_id: objectId,
      action_type: actionType,
      reason,
    })
    .select(
      `
      id,
      actor_id,
      report_id,
      object_type,
      object_id,
      action_type,
      reason,
      created_at
    `
    )
    .single();

  if (error) throw error;
  return data;
}

/**
 * List moderation actions for one actor over a set of objects.
 * Returns raw rows (projected columns only).
 *
 * Notes:
 * - Orders newest-first so controllers can "latest wins" deterministically.
 * - Uses explicit projections (no select('*')).
 */
export async function listModerationActionsForActorOnObjectsDAL({
  actorId,
  objectType,
  objectIds,
  actionTypes,
}) {
  if (!actorId) throw new Error("listModerationActionsForActorOnObjectsDAL: actorId required");
  if (!objectType) throw new Error("listModerationActionsForActorOnObjectsDAL: objectType required");

  const ids = Array.isArray(objectIds) ? objectIds.filter(Boolean) : [];
  if (ids.length === 0) return [];

  const types = Array.isArray(actionTypes) ? actionTypes.filter(Boolean) : [];

  let q = supabase
    .schema("vc")
    .from("moderation_actions")
    .select(
      `
      id,
      actor_id,
      report_id,
      object_type,
      object_id,
      action_type,
      reason,
      created_at
    `
    )
    .eq("actor_id", actorId)
    .eq("object_type", objectType)
    .in("object_id", ids)
    .order("created_at", { ascending: false });

  if (types.length > 0) {
    q = q.in("action_type", types);
  }

  const { data, error } = await q;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
