// src/features/moderation/controllers/postVisibility.controller.js

import {
  insertModerationActionDAL,
  listModerationActionsForActorOnObjectsDAL,
} from "@/features/moderation/dal/moderationActions.dal";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';
import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { readModerationActorOwnerLinkDAL } from "@/features/moderation/dal/moderationActorOwnership.read.dal";

// V11-M2 (TICKET-MODERATION-ACTORBIND-001): canonical KIND-AGNOSTIC
// session→vc.actor_owners owner-bind on the acting (suppressing) actor. Personal
// suppression writes an actor_id-keyed moderation.actions row; the acting actor is
// the active identity actor and may be a user OR a vport, so neither kind-specific
// helper fits (assertSessionOwns = vport-only, assertActorOwns = user-only). This
// verifies the authenticated session owns actorId via vc.actor_owners before any
// write — closing the prior gap where actorId was trusted from the caller (replay
// could pollute any victim's hidden set). Defense-in-depth over the durable
// boundary 11-DB-3 (moderation.actions INSERT RLS).
async function assertSessionOwnsActingActor(actorId) {
  const sessionUser = await readCurrentAuthUser();
  if (
    !sessionUser ||
    !(await readModerationActorOwnerLinkDAL({ actorId, userId: sessionUser.id }))
  ) {
    throw new Error("moderation: session does not own the acting actor");
  }
}

/**
 * "Latest action wins" per object_id.
 * Returns Set<string> of hidden post ids.
 */
export function computeHiddenPostIdsFromActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return new Set();

  const latest = new Map();
  for (const a of actions) {
    const id = a?.object_id ?? a?.target_id;
    const type = a?.action_type;
    if (!id || !type) continue;
    if (latest.has(id)) continue;
    latest.set(id, type);
  }

  return new Set(
    Array.from(latest.entries())
      .filter(([, t]) => t === "hide")
      .map(([id]) => id)
  );
}

/**
 * Read hidden post ids for an actor over a known list of postIds.
 */
export async function getHiddenPostIdsForActor({ actorId, postIds }) {
  if (!actorId) return new Set();

  const ids = Array.isArray(postIds) ? postIds.filter(Boolean) : [];
  if (ids.length === 0) return new Set();

  const actions = await listModerationActionsForActorOnObjectsDAL({
    actorId,
    targetType: "post",
    targetIds: ids,
    actionTypes: ["hide", "unhide"],
  });

  return computeHiddenPostIdsFromActions(actions);
}

/**
 * Persist a "hide post" action for this actor.
 */
export async function hidePostForActor({
  actorId,
  postId,
  reportId = null,
  reason = "user_reported_post",
}) {
  if (!actorId) throw new Error("hidePostForActor: actorId required");
  if (!postId) throw new Error("hidePostForActor: postId required");

  await assertSessionOwnsActingActor(actorId);

  try {
    await insertModerationActionDAL({
      actorId,
      actorDomain: 'vc',
      reportId,
      targetDomain: 'vc',
      targetType: "post",
      targetId: postId,
      actionType: "hide",
      reason,
      meta: { source: 'reporter_local_hide' },
    });
  } catch (error) {
    captureVcsmError({ feature: 'moderation', module: 'postVisibility.controller', severity: 'error', message: `hidePostForActor: insertModerationActionDAL failed — ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'insertModerationActionDAL', is_handled: false, context: { postId, actorId: actorId ?? null } })
    throw error
  }

  return { ok: true };
}

/**
 * Persist an "unhide post" action for this actor.
 */
export async function unhidePostForActor({
  actorId,
  postId,
  reportId = null,
  reason = "user_unhid_post",
}) {
  if (!actorId) throw new Error("unhidePostForActor: actorId required");
  if (!postId) throw new Error("unhidePostForActor: postId required");

  await assertSessionOwnsActingActor(actorId);

  try {
    await insertModerationActionDAL({
      actorId,
      actorDomain: 'vc',
      reportId,
      targetDomain: 'vc',
      targetType: "post",
      targetId: postId,
      actionType: "unhide",
      reason,
    });
  } catch (error) {
    captureVcsmError({ feature: 'moderation', module: 'postVisibility.controller', severity: 'error', message: `unhidePostForActor: insertModerationActionDAL failed — ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'insertModerationActionDAL', is_handled: false, context: { postId, actorId: actorId ?? null } })
    throw error
  }

  return { ok: true };
}
