// src/features/moderation/dal/moderationActions.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

/* ============================================================
   DAL: moderationActions
   - Thin DB adapter only
   - Explicit column projections only
   - Returns raw rows exactly as stored
   ============================================================ */

const MOD_ACTION_SELECT = `
  id,
  actor_id,
  report_id,
  object_type,
  object_id,
  action_type,
  reason,
  created_at
`;

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
    .select(MOD_ACTION_SELECT)
    .single();

  if (error) throw error;
  return data;
}

/**
 * List moderation actions for one actor over a set of objects.
 * Returns raw rows (projected columns only).
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
    .select(MOD_ACTION_SELECT)
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

/**
 * Get the latest cover-related moderation action for a conversation for this actor.
 * Returns the raw latest row (projected columns only) or null if none.
 *
 * IMPORTANT:
 * - Your DB allows action_type: 'hide' / 'unhide' (NOT 'hide_conversation')
 */
export async function dalGetConversationHideAction({
  actorId,
  conversationId,
  actionTypes = ["hide", "unhide"], // ✅ matches DB
}) {
  if (!actorId) throw new Error("dalGetConversationHideAction: actorId required");
  if (!conversationId) throw new Error("dalGetConversationHideAction: conversationId required");

  const types = Array.isArray(actionTypes) ? actionTypes.filter(Boolean) : [];

  let q = supabase
    .schema("vc")
    .from("moderation_actions")
    .select(MOD_ACTION_SELECT)
    .eq("actor_id", actorId)
    .eq("object_type", "conversation")
    .eq("object_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (types.length > 0) {
    q = q.in("action_type", types);
  }

  const { data, error } = await q;
  if (error) throw error;

  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

/**
 * Delete the latest cover-related moderation action for a conversation for this actor.
 * Returns { ok: true } when done.
 */
export async function dalDeleteConversationHideAction({
  actorId,
  conversationId,
  actionTypes = ["hide"], // ✅ usually you only want to remove the hide record
}) {
  if (!actorId) throw new Error("dalDeleteConversationHideAction: actorId required");
  if (!conversationId) throw new Error("dalDeleteConversationHideAction: conversationId required");

  const latest = await dalGetConversationHideAction({ actorId, conversationId, actionTypes });
  if (!latest?.id) return { ok: true };

  const { error } = await supabase
    .schema("vc")
    .from("moderation_actions")
    .delete()
    .eq("id", latest.id);

  if (error) throw error;
  return { ok: true };
}
