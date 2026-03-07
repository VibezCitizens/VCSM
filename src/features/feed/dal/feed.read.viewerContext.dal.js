import { supabase } from "@/services/supabase/supabaseClient";

export async function readViewerActorIdentityDAL({ actorId }) {
  if (!actorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("profile_id, vport_id")
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function readProfileAdultFlagDAL({ profileId }) {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_adult")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
