import { supabase } from "@/services/supabase/supabaseClient";

const ACTOR_SELECT = [
  "id",
  "kind",
  "profile_id",
  "vport_id",
  "is_void",
].join(",");

export async function getActorByIdDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("getActorByIdDAL: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select(ACTOR_SELECT)
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default getActorByIdDAL;
