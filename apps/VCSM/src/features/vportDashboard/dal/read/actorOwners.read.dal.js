import { supabase } from "@/services/supabase/supabaseClient";

export async function readActorOwnersByActorIdDAL({ actorId } = {}) {
  if (!actorId) return []

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, user_id")
    .eq("actor_id", actorId)

  if (error) throw error
  return data ?? []
}
