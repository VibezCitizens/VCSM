import vc from "@/services/supabase/vcClient";

// Hydration-only reads (readProfileIdentityDAL, readActorPrivacyDAL, readVportIdentityDAL,
// readActorOwnerUserDAL) + PROFILE_COLUMNS MOVED to
// features/hydration/dal/vcsmActorHydration.read.dal.js (IDENTITY-BOUNDARY-005).
const ACTOR_COLUMNS = "id,kind,profile_id,vport_id,is_void,is_deleted";

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

export async function readIdentityActorsByIdsDAL(actorIds) {
  if (!Array.isArray(actorIds) || actorIds.length === 0) return [];

  const { data, error } = await vc
    .from("actors")
    .select(ACTOR_COLUMNS)
    .in("id", actorIds);

  if (error) throw error;
  return data ?? [];
}

// listOwnedActorRowsByUserDAL — REMOVED
// Was: legacy identity resolution via vc.actor_owners
// Now: identity resolution uses engine (resolveAuthenticatedContext)

export async function readActorPrivacyDiagnosticDAL(actorId) {
  if (!actorId) return null;

  const { data, error } = await vc
    .from("actor_privacy_settings")
    .select("actor_id,is_private")
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
