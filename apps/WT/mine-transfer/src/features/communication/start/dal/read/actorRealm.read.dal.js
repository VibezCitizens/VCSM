import { supabase } from "@/services/supabase/supabaseClient";

export async function readActorRealmContextDAL({ actorId }) {
  if (!actorId) {
    throw new Error("readActorRealmContextDAL: actorId required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,is_void")
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
