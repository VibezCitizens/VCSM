import { supabase } from "@/services/supabase/supabaseClient";

// Canonical DAL for all vc.actor_owners reads within the authorization feature.
//
// Ownership rule: actor_owners.user_id stores the Supabase auth UUID. Every RLS
// policy compares actor_owners.user_id = auth.uid(), and public.profiles.id is itself
// the auth UUID (consolidated schema — there is no profiles.user_id column). A
// session-derived check therefore matches actor_owners.user_id against auth.getUser().id
// directly; the actor-to-actor path matches it against vc.actors.profile_id, which for
// a user actor equals that same auth UUID.
//
// This file consolidates:
//   features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js  → readOwnerLinkByProfileDAL
//   features/booking/dal/readOwnerLinkByActorAndSession.dal.js            → readOwnerLinkBySessionDAL

const OWNER_SELECT = ["actor_id", "user_id", "is_primary", "is_void", "created_at"].join(",");

/**
 * Read the actor_owners row for a given actor + profile pair.
 *
 * Used by actor-to-actor ownership gates where the requester's profile_id
 * is already known (resolved from the requester actor row).
 *
 * Returns null if no ownership link exists.
 */
export async function readOwnerLinkByProfileDAL({ targetActorId, userProfileId } = {}) {
  if (!targetActorId) throw new Error("readOwnerLinkByProfileDAL: targetActorId is required");
  if (!userProfileId) throw new Error("readOwnerLinkByProfileDAL: userProfileId is required");

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select(OWNER_SELECT)
    .eq("actor_id", targetActorId)
    .eq("user_id", userProfileId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Read the actor_owners row derived entirely from the authenticated session.
 *
 * Caller identity is never passed in — derived from Supabase auth:
 *   getUser() → auth UUID → actor_owners.user_id
 *
 * actor_owners.user_id stores the Supabase auth UUID (matches auth.uid() in RLS;
 * public.profiles.id is itself the auth UUID, so no profiles lookup is needed).
 *
 * Used by session-derived ownership gates where the UI must not supply
 * a caller actor ID (Identity Contract §1.3).
 *
 * Returns null if no authenticated session or no ownership link.
 */
export async function readOwnerLinkBySessionDAL({ targetActorId } = {}) {
  if (!targetActorId) throw new Error("readOwnerLinkBySessionDAL: targetActorId is required");

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("No authenticated session.");

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select(OWNER_SELECT)
    .eq("actor_id", targetActorId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Read a raw actor_owners row by actor ID and user (profile) ID.
 *
 * Used as an engine DI callback (portfolio, reviews isActorOwner).
 * Returns null if no link exists; relies on RLS to scope to session user.
 */
export async function readActorOwnerRowDAL({ actorId, userId } = {}) {
  if (!actorId || !userId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, user_id, is_void")
    .eq("actor_id", actorId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
