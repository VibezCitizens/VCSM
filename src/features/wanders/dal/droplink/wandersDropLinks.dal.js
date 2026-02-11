import { supabase } from "@/lib/supabaseClient"; // use your actual supabase client path

export async function getActiveDropLinkByOwnerAnonId(ownerAnonId) {
  const { data, error } = await supabase
    .schema("wanders")
    .from("inbox_drop_links")
    .select("id, public_id, inbox_id, owner_anon_id, is_active, title, expires_at, created_at, updated_at")
    .eq("owner_anon_id", ownerAnonId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function createDropLink(input) {
  const { inboxId, ownerAnonId, publicId, title = null, expiresAt = null } = input;

  const { data, error } = await supabase
    .schema("wanders")
    .from("inbox_drop_links")
    .insert({
      inbox_id: inboxId,
      owner_anon_id: ownerAnonId,
      public_id: publicId,
      title,
      expires_at: expiresAt,
      is_active: true,
    })
    .select("id, public_id, inbox_id, owner_anon_id, is_active, title, expires_at, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deactivateDropLink(id) {
  const { data, error } = await supabase
    .schema("wanders")
    .from("inbox_drop_links")
    .update({ is_active: false })
    .eq("id", id)
    .select("id, public_id, is_active, updated_at")
    .single();

  if (error) throw error;
  return data;
}
