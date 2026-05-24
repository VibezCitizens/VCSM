// ============================================================
//  BLOCK SYSTEM — READ DAL (ACTOR-BASED)
// ------------------------------------------------------------
//  Reads from moderation.blocks WHERE status = 'active'
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

/* ============================================================
   READ: BULK BLOCK CHECK (PERF)
   ============================================================ */

export async function filterBlockedActors(
  actorId,
  candidateActorIds = []
) {
  if (!actorId || !isUuid(actorId) || candidateActorIds.length === 0) {
    return new Set();
  }

  const unique = [...new Set(candidateActorIds.filter((id) => isUuid(id)))];
  if (unique.length === 0) return new Set();

  const orClause =
    `and(blocker_actor_id.eq.${actorId},blocked_actor_id.in.(${unique.join(",")}))` +
    `,and(blocked_actor_id.eq.${actorId},blocker_actor_id.in.(${unique.join(",")}))`;

  const { data, error } = await supabase
    .schema("moderation")
    .from("blocks")
    .select("blocker_actor_id, blocked_actor_id")
    .eq("status", "active")
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
