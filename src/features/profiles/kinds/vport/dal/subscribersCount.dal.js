import { supabase } from "@/services/supabase/supabaseClient";

export async function dalCountSubscribers(actorId) {
  if (!actorId) throw new Error("dalCountSubscribers: actorId required");

  // If you used the RPC:
  const { data, error } = await supabase
    .schema("vc")
    .rpc("count_subscribers", { p_actor_id: actorId });

  if (error) throw error;
  return data ?? 0;
}
