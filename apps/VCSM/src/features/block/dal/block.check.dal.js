// ============================================================
//  BLOCK SYSTEM — CHECK DAL (ACTOR-BASED)
// ------------------------------------------------------------
//  Reads from moderation.blocks WHERE status = 'active'
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

/**
 * Check block status between two actors
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
    .schema("moderation")
    .from("blocks")
    .select("blocker_actor_id, blocked_actor_id")
    .eq("status", "active")
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
    if (row.blocker_actor_id === actorA && row.blocked_actor_id === actorB) {
      blockedByMe = true;
    }
    if (row.blocker_actor_id === actorB && row.blocked_actor_id === actorA) {
      blockedMe = true;
    }
  }

  return {
    isBlocked: blockedByMe || blockedMe,
    blockedByMe,
    blockedMe,
  };
}

