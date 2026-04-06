// src/features/moderation/controllers/postVisibility.controller.js

import {
  insertModerationActionDAL,
  listModerationActionsForActorOnObjectsDAL,
} from "@/features/moderation/dal/moderationActions.dal";

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

  return { ok: true };
}
