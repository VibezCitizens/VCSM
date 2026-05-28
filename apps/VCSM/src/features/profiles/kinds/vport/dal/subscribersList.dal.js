import { supabase } from "@/services/supabase/supabaseClient";

export async function dalListVportSubscribers({ actorId, limit = 50, offset = 0 }) {
  if (!actorId) throw new Error("dalListVportSubscribers: actorId required");

  const { data, error } = await supabase
    .schema("vc")
    .rpc("list_vport_subscribers", {
      p_actor_id: actorId,
      p_limit: limit,
      p_offset: offset,
    });

  if (error) throw error;
  return data ?? [];
}
