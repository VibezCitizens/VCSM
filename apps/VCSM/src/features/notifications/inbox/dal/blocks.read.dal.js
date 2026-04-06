import { supabase } from "@/services/supabase/supabaseClient";

export async function listBlockedActorRowsDAL({ actorId }) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema("moderation")
    .from("blocks")
    .select("blocked_actor_id")
    .eq("blocker_actor_id", actorId)
    .eq("status", "active");

  if (error) throw error;
  return data ?? [];
}

export async function listBlockingActorRowsDAL({ actorId }) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema("moderation")
    .from("blocks")
    .select("blocker_actor_id")
    .eq("blocked_actor_id", actorId)
    .eq("status", "active");

  if (error) throw error;
  return data ?? [];
}
