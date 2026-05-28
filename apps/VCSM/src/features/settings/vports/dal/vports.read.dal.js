// src/features/settings/vports/dal/vports.read.dal.js
// ============================================================
// VPORTS — READ DAL
// - Lists VPORTs owned by the authenticated user
// - Actor-safe (via actor_owners)
// - UI-agnostic
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

/**
 * List VPORTs owned by the current user (full detail).
 * Used by the Vports settings tab list.
 *
 * Ownership resolved via actor_owners → actors(kind='vport') → vport.profiles(actor_id).
 * owner_user_id is not used — §1.4 Owner Meaning Rule.
 *
 * Returns:
 * [{ id, name, slug, avatar_url, banner_url, bio, is_active, is_deleted, business_card_published, directory_visible, created_at, actor_id }]
 */
export async function listMyVportsDAL() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data: ownerships, error: ownerError } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, actor:actors!inner(id, kind, is_void, is_deleted)")
    .eq("user_id", userId)
    .eq("is_void", false);

  if (ownerError) throw ownerError;

  const vportActorIds = (ownerships ?? [])
    .filter(o => o.actor?.kind === "vport" && !o.actor?.is_void && !o.actor?.is_deleted)
    .map(o => o.actor_id);

  if (vportActorIds.length === 0) return [];

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,name,slug,avatar_url,banner_url,bio,is_active,is_deleted,business_card_published,directory_visible,created_at,actor_id")
    .in("actor_id", vportActorIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * List VPORTs owned by the current authenticated user (compact).
 *
 * Ownership resolved via actor_owners → actors(kind='vport') → vport.profiles(actor_id).
 * owner_user_id is not used — §1.4 Owner Meaning Rule.
 *
 * Returns:
 * [{ id, name, avatar_url, actor_id, created_at }]
 */
export async function readMyVports() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data: ownerships, error: ownerError } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, actor:actors!inner(id, kind, is_void, is_deleted)")
    .eq("user_id", userId)
    .eq("is_void", false);

  if (ownerError) throw ownerError;

  const vportActorIds = (ownerships ?? [])
    .filter(o => o.actor?.kind === "vport" && !o.actor?.is_void && !o.actor?.is_deleted)
    .map(o => o.actor_id);

  if (vportActorIds.length === 0) return [];

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,name,avatar_url,actor_id,created_at")
    .in("actor_id", vportActorIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Read business_card_settings for a single vport.
 * Ownership enforced via owner_user_id = auth.uid().
 */
export async function readVportBusinessCardSettingsDAL(vportId) {
  if (!vportId) return null;

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,business_card_settings")
    .eq("id", vportId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Read directory_visible and directory_status for a single vport.
 * Ownership enforced via owner_user_id = auth.uid().
 */
export async function readVportDirectoryStateDAL(vportId) {
  if (!vportId) return null;

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,directory_visible,directory_status")
    .eq("id", vportId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
