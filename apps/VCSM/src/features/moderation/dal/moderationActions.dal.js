// src/features/moderation/dal/moderationActions.dal.js
// ============================================================
// Moderation Actions DAL
// - dumb DB adapter only
// - schema('moderation') for actions table
// - explicit column projections only
// - returns raw rows
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

// Allowlist mirrors the DB RLS WITH CHECK on moderation.actions:
// action_type = ANY (ARRAY['hide', 'unhide'])
// Reject at the DAL layer before the round-trip to avoid silent failures
// if the DB policy is ever tightened or a typo slips through a caller.
const ALLOWED_ACTION_TYPES = new Set(['hide', 'unhide']);

const MOD_ACTION_SELECT = `
  id,
  report_id,
  actor_domain,
  actor_id,
  target_domain,
  target_type,
  target_id,
  action_type,
  reason,
  expires_at,
  meta,
  created_at
`;

/**
 * Insert a moderation action row into moderation.actions.
 */
export async function insertModerationActionDAL({
  actorId,
  actorDomain = 'vc',
  reportId = null,
  targetDomain = 'vc',
  targetType,
  targetId,
  actionType,
  reason,
  meta = {},
}) {
  if (!actorId) throw new Error("insertModerationActionDAL: actorId required");
  if (!targetType) throw new Error("insertModerationActionDAL: targetType required");
  if (!targetId) throw new Error("insertModerationActionDAL: targetId required");
  if (!actionType) throw new Error("insertModerationActionDAL: actionType required");
  if (!ALLOWED_ACTION_TYPES.has(actionType)) {
    throw new Error(
      `insertModerationActionDAL: invalid actionType "${actionType}" — must be one of: ${[...ALLOWED_ACTION_TYPES].join(', ')}`
    );
  }

  const { data, error } = await supabase
    .schema("moderation")
    .from("actions")
    .insert({
      actor_domain: actorDomain,
      actor_id: actorId,
      report_id: reportId,
      target_domain: targetDomain,
      target_type: targetType,
      target_id: targetId,
      action_type: actionType,
      reason,
      meta: meta ?? {},
    })
    .select(MOD_ACTION_SELECT)
    .single();

  if (error) throw error;
  return data;
}

/**
 * List moderation actions for one actor over a set of objects.
 * Returns raw rows ordered newest-first.
 */
export async function listModerationActionsForActorOnObjectsDAL({
  actorId,
  targetType,
  targetIds,
  actionTypes,
  // Legacy aliases
  objectType,
  objectIds,
}) {
  if (!actorId) throw new Error("listModerationActionsForActorOnObjectsDAL: actorId required");

  const resolvedType = targetType || objectType;
  const resolvedIds = Array.isArray(targetIds) ? targetIds.filter(Boolean)
    : Array.isArray(objectIds) ? objectIds.filter(Boolean) : [];
  if (!resolvedType || resolvedIds.length === 0) return [];

  const types = Array.isArray(actionTypes) ? actionTypes.filter(Boolean) : [];

  let q = supabase
    .schema("moderation")
    .from("actions")
    .select(MOD_ACTION_SELECT)
    .eq("actor_id", actorId)
    .eq("target_type", resolvedType)
    .in("target_id", resolvedIds)
    .order("created_at", { ascending: false });

  if (types.length > 0) {
    q = q.in("action_type", types);
  }

  const { data, error } = await q;
  if (error) throw error;

  // Map to legacy shape for backward compat with visibility controllers
  return (Array.isArray(data) ? data : []).map(row => ({
    ...row,
    object_id: row.target_id,
    object_type: row.target_type,
  }));
}

/**
 * Get the latest cover-related moderation action for a conversation.
 */
export async function dalGetConversationHideAction({
  actorId,
  conversationId,
  actionTypes = ["hide", "unhide"],
}) {
  if (!actorId) throw new Error("dalGetConversationHideAction: actorId required");
  if (!conversationId) throw new Error("dalGetConversationHideAction: conversationId required");

  const types = Array.isArray(actionTypes) ? actionTypes.filter(Boolean) : [];

  let q = supabase
    .schema("moderation")
    .from("actions")
    .select(MOD_ACTION_SELECT)
    .eq("actor_id", actorId)
    .eq("target_type", "conversation")
    .eq("target_id", conversationId)
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
 * Delete the latest cover-related moderation action for a conversation.
 */
export async function dalDeleteConversationHideAction({
  actorId,
  conversationId,
  actionTypes = ["hide"],
}) {
  if (!actorId) throw new Error("dalDeleteConversationHideAction: actorId required");
  if (!conversationId) throw new Error("dalDeleteConversationHideAction: conversationId required");

  const latest = await dalGetConversationHideAction({ actorId, conversationId, actionTypes });
  if (!latest?.id) return { ok: true };

  const { error } = await supabase
    .schema("moderation")
    .from("actions")
    .delete()
    .eq("id", latest.id);

  if (error) throw error;
  return { ok: true };
}
