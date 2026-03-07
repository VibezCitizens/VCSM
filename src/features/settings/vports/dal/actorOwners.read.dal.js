import { supabase } from "@/services/supabase/supabaseClient";

export async function readActorOwnersByUserDAL({ userId }) {
  if (!userId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select(`
      actor:actors (
        id,
        kind
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
