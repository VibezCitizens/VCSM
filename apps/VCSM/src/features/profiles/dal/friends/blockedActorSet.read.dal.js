import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

export async function listBlockedActorRowsForCandidatesDAL({
  actorId,
  candidateActorIds = [],
}) {
  if (!actorId || !isUuid(actorId) || !candidateActorIds.length) {
    return [];
  }

  const unique = [...new Set(candidateActorIds.filter((id) => isUuid(id)))];
  if (!unique.length) return [];

  const orClause =
    `and(blocker_actor_id.eq.${actorId},blocked_actor_id.in.(${unique.join(",")}))` +
    `,and(blocked_actor_id.eq.${actorId},blocker_actor_id.in.(${unique.join(",")}))`;

  const { data, error } = await supabase
    .schema("moderation")
    .from("blocks")
    .select("blocker_actor_id,blocked_actor_id")
    .eq("status", "active")
    .or(orClause);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
