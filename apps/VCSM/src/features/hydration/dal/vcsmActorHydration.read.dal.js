// VCSM hydration read DALs — hydration-owned.
// Relocated verbatim from state/identity/identity.read.dal.js by IDENTITY-BOUNDARY-005.
// These reads enrich an actor with profile / vport / privacy / owner display data.
// Identity-runtime reads (actor-by-id, user-actor-by-profile, realm lookups) remain
// in state/identity/identity.read.dal.js.

import { supabase } from "@/services/supabase/supabaseClient";
import vc from "@/services/supabase/vcClient";
import vportSchema from "@/services/supabase/vportClient";

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

  const [profileResult, catResult] = await Promise.all([
    vportSchema
      .from("profiles")
      .select("id,owner_user_id,name,slug,avatar_url,bio,is_active,is_deleted,banner_url,created_at,updated_at")
      .eq("id", vportId)
      .maybeSingle(),
    vportSchema
      .from("profile_categories")
      .select("category_key")
      .eq("profile_id", vportId)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (!profileResult.data) return null;

  return {
    ...profileResult.data,
    vport_type: catResult.data?.category_key ?? null,
  };
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
