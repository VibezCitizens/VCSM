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
 * Returns:
 * [{ id, name, slug, avatar_url, banner_url, bio, is_active, created_at, actor_id }]
 */
export async function listMyVportsDAL() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,name,slug,avatar_url,banner_url,bio,is_active,is_deleted,business_card_published,created_at,actor_id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * List VPORTs owned by the current authenticated user (compact).
 *
 * Returns:
 * [{ id, name, avatar_url, actor_id, created_at }]
 */
export async function readMyVports() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,name,avatar_url,actor_id,created_at")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
