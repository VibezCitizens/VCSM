import { supabase } from "@/services/supabase/supabaseClient";

export async function getActorSummariesByIdsDAL(actorIds) {
  if (!actorIds?.length) return [];
  const { data, error } = await supabase.schema("learning").from("actor_profiles")
    .select("actor_id, full_name, display_name, avatar_url")
    .in("actor_id", actorIds);
  if (error) throw error;
  return (data ?? []).map(d => ({
    actor_id: d.actor_id,
    display_name: d.display_name || d.full_name,
    photo_url: d.avatar_url,
    kind: "user",
  }));
}
