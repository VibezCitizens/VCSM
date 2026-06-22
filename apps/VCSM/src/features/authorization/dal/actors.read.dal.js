import { supabase } from "@/services/supabase/supabaseClient";

// Columns required by authorization gate controllers only.
// Matches the projection in features/booking/dal/getActorById.dal.js — kept
// identical so the gate behavior is preserved exactly during Phase 2 migration.
const ACTOR_SELECT = ["id", "kind", "profile_id", "vport_id", "is_void"].join(",");

/**
 * Read a single actor row by ID.
 *
 * Used exclusively by authorization gate controllers to validate
 * requester kind and target actor availability before an ownership check.
 *
 * Returns null if the actor does not exist.
 */
export async function readActorByIdDAL({ actorId } = {}) {
  if (!actorId) throw new Error("readActorByIdDAL: actorId is required");

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select(ACTOR_SELECT)
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
