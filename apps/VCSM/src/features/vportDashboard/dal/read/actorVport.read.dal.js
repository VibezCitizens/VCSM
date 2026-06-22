import { supabase } from "@/services/supabase/supabaseClient";

export async function readActorVportLinkDAL({ actorId }) {
  if (!actorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,kind,vport_id")
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
