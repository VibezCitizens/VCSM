import { supabase } from "@/services/supabase/supabaseClient";

export async function readPostActorsByIdsDAL(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select("id,actor_id")
    .in("id", postIds);

  if (error) throw error;
  return data ?? [];
}

export async function readActorsByIdsDAL(actorIds) {
  if (!Array.isArray(actorIds) || actorIds.length === 0) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,kind,profile_id,vport_id")
    .in("id", actorIds);

  if (error) throw error;
  return data ?? [];
}

export async function readActorPrivacyByActorIdsDAL(actorIds) {
  if (!Array.isArray(actorIds) || actorIds.length === 0) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_privacy_settings")
    .select("actor_id,is_private")
    .in("actor_id", actorIds);

  if (error) throw error;
  return data ?? [];
}

export async function readOwnedActorIdsByUserIdDAL(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}

export async function readFollowRowsByActorsDAL({
  followerActorIds,
  followedActorIds,
}) {
  if (!Array.isArray(followerActorIds) || followerActorIds.length === 0) return [];
  if (!Array.isArray(followedActorIds) || followedActorIds.length === 0) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_follows")
    .select("follower_actor_id,followed_actor_id,is_active")
    .in("follower_actor_id", followerActorIds)
    .in("followed_actor_id", followedActorIds);

  if (error) throw error;
  return data ?? [];
}

