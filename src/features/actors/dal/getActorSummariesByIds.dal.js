import { supabase } from "@/services/supabase/supabaseClient";

export async function getActorSummariesByIdsDAL({ actorIds }) {
  if (!Array.isArray(actorIds) || actorIds.length === 0) {
    return { rows: [], error: null };
  }

  const uniqueActorIds = [...new Set(actorIds.filter(Boolean))];
  if (uniqueActorIds.length === 0) {
    return { rows: [], error: null };
  }

  const { data, error } = await supabase
    .schema("vc")
    .rpc("get_actor_summaries", {
      p_actor_ids: uniqueActorIds,
    });

  return {
    rows: Array.isArray(data) ? data : [],
    error: error ?? null,
  };
}
