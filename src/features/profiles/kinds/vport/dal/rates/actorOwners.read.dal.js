import supabase from "@/services/supabase/supabaseClient";

// DAL: “What does the database say?”
export async function dalReadActorOwnerRow({ actorId, userId } = {}) {
  console.log("[dalReadActorOwnerRow] actorId=", actorId, "userId=", userId);

  if (!actorId || !userId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, user_id, is_void, is_primary, created_at")
    .eq("actor_id", actorId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null; // raw row
}