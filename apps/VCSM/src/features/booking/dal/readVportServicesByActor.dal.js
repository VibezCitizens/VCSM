import { supabase } from "@/services/supabase/supabaseClient";

export default async function readVportServicesByActorDAL({
  actorId,
  includeDisabled = true,
} = {}) {
  if (!actorId) {
    throw new Error("readVportServicesByActorDAL: actorId is required");
  }

  let query = supabase
    .schema("vc")
    .from("vport_services")
    .select("id,actor_id,key,label,category,enabled,meta,created_at,updated_at")
    .eq("actor_id", actorId)
    .order("key", { ascending: true });

  if (!includeDisabled) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
