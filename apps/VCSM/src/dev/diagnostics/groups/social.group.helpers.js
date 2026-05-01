import { supabase } from "@/services/supabase/supabaseClient";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";

export async function resolveTargetActorId(shared) {
  const { actorId } = await ensureActorContext(shared);
  try {
    const vport = await ensureBasicVport(shared);
    if (vport?.actorId && vport.actorId !== actorId) {
      return vport.actorId;
    }
  } catch {
    // best effort only
  }
  const { data, error } = await supabase
    .schema("identity")
    .from("actor_directory")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(1);
  if (error) throw error;
  return data?.[0]?.actor_id ?? null;
}

export async function resolveForeignActorId(shared) {
  const { actorId, userId } = await ensureActorContext(shared);
  const { data: ownedRows } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId);
  const ownedIds = new Set((ownedRows || []).map((row) => row.actor_id).filter(Boolean));
  ownedIds.add(actorId);
  const { data, error } = await supabase
    .schema("identity")
    .from("actor_directory")
    .select("actor_id")
    .limit(50);
  if (error) throw error;
  const foreign = (data || []).find((row) => row?.actor_id && !ownedIds.has(row.actor_id));
  return foreign?.actor_id ?? null;
}
