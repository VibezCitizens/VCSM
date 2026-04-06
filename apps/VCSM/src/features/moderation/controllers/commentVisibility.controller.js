// src/features/moderation/controllers/commentVisibility.controller.js

import {
  insertModerationActionDAL,
  listModerationActionsForActorOnObjectsDAL,
} from "@/features/moderation/dal/moderationActions.dal";

/* ============================================================
   CONTROLLER: commentVisibility
   - Owns meaning + policy for comment hiding
   - Latest action wins (hide/unhide)
   - Optional propagation: if a ROOT is hidden, descendants are hidden too
   ============================================================ */

/**
 * Build a set of hidden comment ids based on moderation actions.
 * "Latest action wins" per target_id.
 */
export function computeHiddenCommentIdsFromActions(actions) {
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
 * Expand hidden roots to hide all descendants.
 */
export function expandHiddenRootsToDescendants(tree, hiddenSet) {
  const out = new Set(hiddenSet || []);

  const walk = (node, ancestorCovered) => {
    if (!node?.id) return;

    const nodeIsExplicitlyHidden = out.has(node.id);
    const shouldCoverChildren = ancestorCovered || nodeIsExplicitlyHidden;

    if (ancestorCovered) out.add(node.id);

    const replies = Array.isArray(node.replies) ? node.replies : [];
    for (const r of replies) walk(r, shouldCoverChildren);
  };

  const roots = Array.isArray(tree) ? tree : [];
  for (const root of roots) walk(root, false);

  return out;
}

/**
 * Read current hidden comment ids for an actor.
 */
export async function getHiddenCommentIdsForActor({
  actorId,
  commentIds,
}) {
  if (!actorId) return new Set();

  const ids = Array.isArray(commentIds) ? commentIds.filter(Boolean) : [];
  if (ids.length === 0) return new Set();

  const actions = await listModerationActionsForActorOnObjectsDAL({
    actorId,
    targetType: "comment",
    targetIds: ids,
    actionTypes: ["hide", "unhide"],
  });

  return computeHiddenCommentIdsFromActions(actions);
}

/**
 * Persist a "hide comment" action for this actor.
 */
export async function hideCommentForActor({
  actorId,
  commentId,
  reportId = null,
  reason = "user_reported_comment",
}) {
  if (!actorId) throw new Error("hideCommentForActor: actorId required");
  if (!commentId) throw new Error("hideCommentForActor: commentId required");

  await insertModerationActionDAL({
    actorId,
    actorDomain: 'vc',
    reportId,
    targetDomain: 'vc',
    targetType: "comment",
    targetId: commentId,
    actionType: "hide",
    reason,
  });

  return { ok: true };
}

/**
 * Persist an "unhide comment" action for this actor.
 */
export async function unhideCommentForActor({
  actorId,
  commentId,
  reportId = null,
  reason = "user_unhid_comment",
}) {
  if (!actorId) throw new Error("unhideCommentForActor: actorId required");
  if (!commentId) throw new Error("unhideCommentForActor: commentId required");

  await insertModerationActionDAL({
    actorId,
    actorDomain: 'vc',
    reportId,
    targetDomain: 'vc',
    targetType: "comment",
    targetId: commentId,
    actionType: "unhide",
    reason,
  });

  return { ok: true };
}
