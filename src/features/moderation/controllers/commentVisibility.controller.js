// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\moderation\controllers\commentVisibility.controller.js

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
 * "Latest action wins" per object_id.
 * Returns Set<string>
 */
export function computeHiddenCommentIdsFromActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return new Set();

  const latest = new Map(); // object_id -> action_type
  for (const a of actions) {
    const id = a?.object_id;
    const type = a?.action_type;
    if (!id || !type) continue;
    if (latest.has(id)) continue; // actions should be ordered newest-first
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
 * Policy:
 * - If a top-level spark is hidden, its replies are hidden too (for that actor)
 * - If a reply is hidden, only that reply is hidden (no propagation upward)
 *
 * Input `tree` is the domain tree: [{id, parent_id?, replies:[...]}]
 */
export function expandHiddenRootsToDescendants(tree, hiddenSet) {
  const out = new Set(hiddenSet || []);

  const walk = (node, ancestorCovered) => {
    if (!node?.id) return;

    const nodeIsExplicitlyHidden = out.has(node.id);

    // Propagate only from a covered ancestor OR if this node itself is hidden
    const shouldCoverChildren = ancestorCovered || nodeIsExplicitlyHidden;

    // If ancestor is covered, this node becomes covered too (even if not explicitly hidden)
    if (ancestorCovered) out.add(node.id);

    const replies = Array.isArray(node.replies) ? node.replies : [];
    for (const r of replies) walk(r, shouldCoverChildren);
  };

  const roots = Array.isArray(tree) ? tree : [];
  for (const root of roots) walk(root, false);

  return out;
}

/**
 * Read current hidden comment ids for an actor, for a known list of commentIds.
 * - Pull latest hide/unhide actions
 * - Compute hidden set
 *
 * Returns: Set<string>
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
    objectType: "comment",
    objectIds: ids,
    actionTypes: ["hide", "unhide"],
  });

  return computeHiddenCommentIdsFromActions(actions);
}

/**
 * Persist a "hide comment" action for this actor.
 * Controller owns semantic defaults (reason/action_type)
 *
 * Returns: { ok: true } or throws
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
    reportId,
    objectType: "comment",
    objectId: commentId,
    actionType: "hide",
    reason,
  });

  return { ok: true };
}

/**
 * Persist an "unhide comment" action for this actor.
 * Returns: { ok: true } or throws
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
    reportId,
    objectType: "comment",
    objectId: commentId,
    actionType: "unhide",
    reason,
  });

  return { ok: true };
}
