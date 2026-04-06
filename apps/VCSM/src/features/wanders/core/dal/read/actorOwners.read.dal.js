import { supabase } from "@/services/supabase/supabaseClient";

export async function readPrimaryUserActorOwnerByUserIdDAL({
  userId,
}) {
  if (!userId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select(
      `
      actor_id,
      is_primary,
      created_at,
      actors!inner (
        id,
        kind,
        is_void
      )
    `
    )
    .eq("user_id", userId)
    .eq("is_void", false)
    .eq("actors.kind", "user")
    .eq("actors.is_void", false)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
