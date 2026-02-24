// ============================================================
//  BLOCK SYSTEM — READ DAL (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: block.read.dal.js
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Read block relationships
//    • Actor-only identity
//    • Used by UI lists, guards, moderation tools
// ------------------------------------------------------------
//  RULES:
//   • actorId is the ONLY identity
//   • No UI logic
//   • No side effects
//   • No hooks
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

/* ============================================================
   READ: ACTORS I BLOCKED
   ============================================================ */

/**
 * Get actors that THIS actor has blocked
 *
 * @param {string} actorId
 * @returns {string[]} blockedActorIds
 */
export async function fetchActorsIBlocked(actorId) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("user_blocks")
    .select("blocked_actor_id")
    .eq("blocker_actor_id", actorId);

  if (error) {
    console.error("[fetchActorsIBlocked] failed:", error);
    throw error;
  }

  return data?.map((r) => r.blocked_actor_id) ?? [];
}

/* ============================================================
   READ: ACTORS WHO BLOCKED ME
   ============================================================ */

/**
 * Get actors that blocked THIS actor
 *
 * @param {string} actorId
 * @returns {string[]} blockerActorIds
 */
export async function fetchActorsWhoBlockedMe(actorId) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("user_blocks")
    .select("blocker_actor_id")
    .eq("blocked_actor_id", actorId);

  if (error) {
    console.error("[fetchActorsWhoBlockedMe] failed:", error);
    throw error;
  }

  return data?.map((r) => r.blocker_actor_id) ?? [];
}

/* ============================================================
   READ: FULL BLOCK GRAPH FOR ACTOR
   ============================================================ */

/**
 * Fetch full block graph for an actor
 *
 * @param {string} actorId
 * @returns {{
 *   iBlocked: Set<string>,
 *   blockedMe: Set<string>
 * }}
 */
export async function fetchBlockGraph(actorId) {
  if (!actorId) {
    return {
      iBlocked: new Set(),
      blockedMe: new Set(),
    };
  }

  const [{ data: iBlocked }, { data: blockedMe }] =
    await Promise.all([
      supabase
        .schema("vc")
        .from("user_blocks")
        .select("blocked_actor_id")
        .eq("blocker_actor_id", actorId),

      supabase
        .schema("vc")
        .from("user_blocks")
        .select("blocker_actor_id")
        .eq("blocked_actor_id", actorId),
    ]);

  return {
    iBlocked: new Set(iBlocked?.map((r) => r.blocked_actor_id)),
    blockedMe: new Set(blockedMe?.map((r) => r.blocker_actor_id)),
  };
}

/* ============================================================
   READ: BULK BLOCK CHECK (PERF)
   ============================================================ */

/**
 * Given a list of candidate actorIds, return only those
 * that are blocked in either direction
 *
 * Useful for feed filtering
 *
 * @param {string} actorId
 * @param {string[]} candidateActorIds
 * @returns {Set<string>} blockedActorIds
 */
export async function filterBlockedActors(
  actorId,
  candidateActorIds = []
) {
  if (!actorId || !isUuid(actorId) || candidateActorIds.length === 0) {
    return new Set();
  }

  const unique = [...new Set(candidateActorIds.filter((id) => isUuid(id)))];
  if (unique.length === 0) return new Set();

  // ⚠️ PostgREST REQUIRES single-line logic trees
  const orClause =
    `and(blocker_actor_id.eq.${actorId},blocked_actor_id.in.(${unique.join(",")}))` +
    `,and(blocked_actor_id.eq.${actorId},blocker_actor_id.in.(${unique.join(",")}))`;

  const { data, error } = await supabase
    .schema("vc")
    .from("user_blocks")
    .select("blocker_actor_id, blocked_actor_id")
    .or(orClause);

  if (error) {
    console.error("[filterBlockedActors] failed:", error);
    throw error;
  }

  const blocked = new Set();

  for (const row of data ?? []) {
    if (row.blocker_actor_id === actorId) {
      blocked.add(row.blocked_actor_id);
    } else {
      blocked.add(row.blocker_actor_id);
    }
  }

  return blocked;
}
