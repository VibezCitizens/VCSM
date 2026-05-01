import { supabase } from "@/services/supabase/supabaseClient";

export async function checkActorOwnershipDAL({ userId, actorId }) {
  if (!userId || !actorId) return false;

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .eq("actor_id", actorId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
