// src/features/profiles/dal/readVportType.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Reads actor kind + vport_type (if actor is vport)
 * Controller decides meaning.
 *
 * Returns:
 * {
 *   kind: "user" | "vport",
 *   vport_type: string | null
 * }
 */
export async function readVportTypeDAL(actorId) {
  if (!actorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select(`
      kind,
      vport:vports (
        vport_type
      )
    `)
    .eq("id", actorId)
    .maybeSingle();

  if (error) {
    console.error("[readVportTypeDAL] failed", error);
    throw error;
  }

  if (!data) return null;

  return {
    kind: data.kind,
    vport_type: data.vport?.vport_type ?? null,
  };
}
