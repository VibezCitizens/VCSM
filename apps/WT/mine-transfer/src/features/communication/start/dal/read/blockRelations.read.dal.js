import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

export async function listUserBlockRowsBetweenActorsDAL({
  actorA,
  actorB,
}) {
  if (!actorA || !actorB || actorA === actorB || !isUuid(actorA) || !isUuid(actorB)) {
    return [];
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("user_blocks")
    .select("blocker_actor_id,blocked_actor_id")
    .or(
      `and(blocker_actor_id.eq.${actorA},blocked_actor_id.eq.${actorB}),and(blocker_actor_id.eq.${actorB},blocked_actor_id.eq.${actorA})`
    )
    .limit(2);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
