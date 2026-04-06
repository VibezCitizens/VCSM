// src/features/profiles/dal/readVportType.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: thin DB adapter only.
 * Returns raw row shape exactly as selected.
 *
 * Raw return shape:
 * {
 *   kind: "user" | "vport",
 *   vport: { vport_type: string | null } | null
 * }
 */
export async function readVportTypeDAL(actorId) {
  if (!actorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("kind,vport:vports(vport_type)")
    .eq("id", actorId)
    .maybeSingle();

  if (error) {
    console.error("[readVportTypeDAL] failed", error);
    throw error;
  }

  return data ?? null;
}