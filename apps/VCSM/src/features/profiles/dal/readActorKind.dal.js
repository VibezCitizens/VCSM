// src/features/profiles/dal/readActorKind.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

export async function readActorKindDAL(actorId) {
  if (!actorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("kind")          // ✅ explicit
    .eq("id", actorId)
    .maybeSingle();          // ✅ single row

  if (error) throw error;
  return data;               // ✅ raw row: { kind }
}
