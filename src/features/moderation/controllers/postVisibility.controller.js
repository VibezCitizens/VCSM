// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\moderation\controllers\postVisibility.controller.js

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

  const latest = new Map(); // object_id -> action_type
  for (const a of actions) {
    const id = a?.object_id;
    const type = a?.action_type;
    if (!id || !type) continue;
    if (latest.has(id)) continue; // newest-first expected
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
 * Returns Set<string>
 */
export async function getHiddenPostIdsForActor({ actorId, postIds }) {
  if (!actorId) return new Set();

  const ids = Array.isArray(postIds) ? postIds.filter(Boolean) : [];
  if (ids.length === 0) return new Set();

  const actions = await listModerationActionsForActorOnObjectsDAL({
    actorId,
    objectType: "post",
    objectIds: ids,
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
    reportId,
    objectType: "post",
    objectId: postId,
    actionType: "hide",
    reason,
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
    reportId,
    objectType: "post",
    objectId: postId,
    actionType: "unhide",
    reason,
  });

  return { ok: true };
}
