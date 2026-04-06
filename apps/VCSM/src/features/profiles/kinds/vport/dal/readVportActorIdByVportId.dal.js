import { supabase } from "@/services/supabase/supabaseClient";

export async function readVportActorIdByVportIdDAL(vportId) {
  if (!vportId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id")
    .eq("kind", "vport")
    .eq("vport_id", vportId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

