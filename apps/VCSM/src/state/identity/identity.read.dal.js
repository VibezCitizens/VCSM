import { supabase } from "@/services/supabase/supabaseClient";
import vc from "@/services/supabase/vcClient";

const ACTOR_COLUMNS = "id,kind,profile_id,vport_id,is_void";
const PROFILE_COLUMNS = [
  "id",
  "display_name",
  "username",
  "email",
  "photo_url",
  "banner_url",
  "bio",
  "birthdate",
  "age",
  "sex",
  "is_adult",
  "discoverable",
  "publish",
  "last_seen",
  "created_at",
  "updated_at",
].join(",");
const VPORT_COLUMNS = [
  "id",
  "owner_user_id",
  "name",
  "slug",
  "avatar_url",
  "bio",
  "is_active",
  "banner_url",
  "created_at",
  "updated_at",
  "vport_type",
].join(",");

export async function readPreferredRealmByVoidStateDAL(isVoid) {
  const { data, error } = await vc
    .from("realms")
    .select("id,created_at")
    .eq("is_void", Boolean(isVoid))
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function readFallbackRealmDAL() {
  const { data, error } = await vc
    .from("realms")
    .select("id,created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function readIdentityActorByIdDAL(actorId) {
  if (!actorId) return null;

  const { data, error } = await vc
    .from("actors")
    .select(ACTOR_COLUMNS)
    .eq("id", actorId)
    .single();

  if (error) throw error;
  return data ?? null;
}

// listOwnedActorRowsByUserDAL — REMOVED
// Was: legacy identity resolution via vc.actor_owners
// Now: identity resolution uses engine (resolveAuthenticatedContext)

export async function readProfileIdentityDAL(profileId) {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", profileId)
    .single();

  if (error) throw error;
  return data ?? null;
}

export async function readActorPrivacyDAL(actorId) {
  if (!actorId) return null;

  const { data, error } = await vc
    .from("actor_privacy_settings")
    .select("is_private")
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function readVportIdentityDAL(vportId) {
  if (!vportId) return null;

  const { data, error } = await vc
    .from("vports")
    .select(VPORT_COLUMNS)
    .eq("id", vportId)
    .single();

  if (error) throw error;
  return data ?? null;
}

export async function readActorOwnerUserDAL(actorId) {
  if (!actorId) return null;

  const { data, error } = await vc
    .from("actor_owners")
    .select("user_id")
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function readUserActorByProfileIdDAL(profileId) {
  if (!profileId) return null;

  const { data, error } = await vc
    .from("actors")
    .select("id")
    .eq("profile_id", profileId)
    .eq("kind", "user")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
