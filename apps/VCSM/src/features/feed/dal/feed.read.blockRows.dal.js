import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

export async function readFeedBlockRowsDAL({ viewerActorId, actorIds = [] }) {
  if (!viewerActorId || !isUuid(viewerActorId)) return [];

  const uniqueActorIds = Array.from(
    new Set((Array.isArray(actorIds) ? actorIds : []).filter((id) => isUuid(id)))
  );

  if (!uniqueActorIds.length) return [];

  const orClause =
    `and(blocker_actor_id.eq.${viewerActorId},blocked_actor_id.in.(${uniqueActorIds.join(",")}))` +
    `,and(blocked_actor_id.eq.${viewerActorId},blocker_actor_id.in.(${uniqueActorIds.join(",")}))`;

  const { data, error } = await supabase
    .schema("moderation")
    .from("blocks")
    .select("blocker_actor_id,blocked_actor_id")
    .eq("status", "active")
    .or(orClause);

  if (error) throw error;
  return data ?? [];
}
