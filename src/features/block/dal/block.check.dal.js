// ============================================================
//  BLOCK SYSTEM — CHECK DAL (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: block.check.dal.js
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

/**
 * Check block status between two actors
 *
 * @param {string} actorA  - current actor
 * @param {string} actorB  - target actor
 *
 * @returns {{
 *   isBlocked: boolean,
 *   blockedByMe: boolean,
 *   blockedMe: boolean
 * }}
 */
export async function checkBlockStatus(actorA, actorB) {
  if (!actorA || !actorB || actorA === actorB || !isUuid(actorA) || !isUuid(actorB)) {
    return {
      isBlocked: false,
      blockedByMe: false,
      blockedMe: false,
    };
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("user_blocks")
    .select("blocker_actor_id, blocked_actor_id")
    .or(
      `and(blocker_actor_id.eq.${actorA},blocked_actor_id.eq.${actorB}),and(blocker_actor_id.eq.${actorB},blocked_actor_id.eq.${actorA})`
    )
    .limit(2);

  if (error) {
    console.error("[checkBlockStatus] failed:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return {
      isBlocked: false,
      blockedByMe: false,
      blockedMe: false,
    };
  }

  let blockedByMe = false;
  let blockedMe = false;

  for (const row of data) {
    if (
      row.blocker_actor_id === actorA &&
      row.blocked_actor_id === actorB
    ) {
      blockedByMe = true;
    }

    if (
      row.blocker_actor_id === actorB &&
      row.blocked_actor_id === actorA
    ) {
      blockedMe = true;
    }
  }

  return {
    isBlocked: blockedByMe || blockedMe,
    blockedByMe,
    blockedMe,
  };
}

/**
 * Lightweight boolean check
 * (useful for guards / feed filters)
 *
 * @param {string} actorA
 * @param {string} actorB
 * @returns {boolean}
 */
export async function isBlocked(actorA, actorB) {
  if (!actorA || !actorB || actorA === actorB || !isUuid(actorA) || !isUuid(actorB)) return false;

  const { data, error } = await supabase
    .schema("vc")
    .from("user_blocks")
    .select("id")
    .or(
      `and(blocker_actor_id.eq.${actorA},blocked_actor_id.eq.${actorB}),and(blocker_actor_id.eq.${actorB},blocked_actor_id.eq.${actorA})`
    )
    .limit(1);

  if (error) {
    console.error("[isBlocked] failed:", error);
    throw error;
  }

  return !!(data && data.length > 0);
}
