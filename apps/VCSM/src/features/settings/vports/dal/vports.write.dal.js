import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

/**
 * Publish or unpublish a VPORT's public business card.
 * Calls vport.set_business_card_publish_state RPC — SECURITY DEFINER, ownership enforced at DB.
 */
export async function setVportBusinessCardPublishStateDAL(vportId, published) {
  if (!vportId) throw new Error("setVportBusinessCardPublishStateDAL: vportId required");

  const { data, error } = await vportSchema.rpc("set_business_card_publish_state", {
    p_vport_id: vportId,
    p_published: published,
  });

  if (error) {
    const msg = error.message || String(error);
    if (msg.includes("AUTH_REQUIRED")) throw new Error("Not authenticated");
    if (msg.includes("INVALID_INPUT")) throw new Error("Invalid input");
    if (msg.includes("VPORT_NOT_FOUND")) throw new Error("VPORT not found or not owned by you");
    throw error;
  }

  return data;
}

/**
 * Save business_card_settings jsonb for a vport.
 * Ownership enforced via owner_user_id = auth.uid() in the WHERE clause.
 */
export async function setVportBusinessCardSettingsDAL(vportId, settings) {
  if (!vportId) throw new Error("setVportBusinessCardSettingsDAL: vportId required");
  if (!settings || typeof settings !== "object") throw new Error("settings must be an object");

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await vportSchema
    .from("profiles")
    .update({ business_card_settings: settings })
    .eq("id", vportId)
    .eq("owner_user_id", userId)
    .select("id,business_card_settings")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("VPORT not found or not owned by you");

  return data;
}

/**
 * Set directory_visible on a vport.profiles row.
 * Ownership enforced via owner_user_id = auth.uid() in the WHERE clause.
 * Never touches directory_status — that is admin-only.
 *
 * VPD-V-FIX-002: Secondary table sync removed from this DAL.
 * The controller (ctrlSetVportDirectoryVisible) now orchestrates the sync
 * to profile_public_details via syncDirectoryVisibleToPublicDetailsDAL.
 */
export async function setVportDirectoryVisibleDAL(vportId, visible) {
  if (!vportId) throw new Error("setVportDirectoryVisibleDAL: vportId required");

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await vportSchema
    .from("profiles")
    .update({ directory_visible: Boolean(visible) })
    .eq("id", vportId)
    .eq("owner_user_id", userId)
    .select("id,directory_visible")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("VPORT not found or not owned by you");

  return data;
}

/**
 * Sync directory_visible to profile_public_details.
 * Non-critical secondary write — vport.profiles is the authoritative source.
 * Uses UPDATE-only (not upsert) to avoid violating NOT NULL constraints on insert.
 * Called by the controller layer after the primary write succeeds.
 *
 * VPD-V-FIX-002: Extracted from setVportDirectoryVisibleDAL so the controller
 * can orchestrate this as a non-blocking step with proper observability.
 */
export async function syncDirectoryVisibleToPublicDetailsDAL(vportId, visible) {
  if (!vportId) throw new Error("syncDirectoryVisibleToPublicDetailsDAL: vportId required");

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data: owned, error: ownerError } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("id", vportId)
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (ownerError) throw ownerError;
  if (!owned) throw new Error("VPORT not found or not owned by you");

  const { error } = await vportSchema
    .from("profile_public_details")
    .update({ directory_visible: Boolean(visible) })
    .eq("profile_id", vportId);

  if (error) throw error;
}
