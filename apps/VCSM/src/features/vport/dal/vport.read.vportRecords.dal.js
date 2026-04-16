import supabase from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const user = data?.user || null;
  if (!user) throw new Error("Not authenticated");

  return user;
}

export async function listMyVports() {
  const user = await requireUser();

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,name,slug,avatar_url,banner_url,bio,is_active,created_at,actor_id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}
