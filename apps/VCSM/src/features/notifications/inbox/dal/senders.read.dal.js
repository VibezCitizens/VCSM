import { supabase } from "@/services/supabase/supabaseClient";

function uniqueIds(ids = []) {
  return [...new Set((Array.isArray(ids) ? ids : []).filter(Boolean))];
}

export async function listActorSummaryRowsByIdsDAL({ actorIds }) {
  const ids = uniqueIds(actorIds);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .rpc("get_actor_summaries", {
      p_actor_ids: ids,
    });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listActorPresentationRowsByIdsDAL({ actorIds }) {
  const ids = uniqueIds(actorIds);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select(
      "actor_id,kind,username,display_name,photo_url,vport_name,vport_slug,vport_avatar_url"
    )
    .in("actor_id", ids);

  if (error) throw error;
  return data ?? [];
}

export async function listActorIdentityRowsByIdsDAL({ actorIds }) {
  const ids = uniqueIds(actorIds);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,profile_id,vport_id")
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}

export async function listProfileRowsByIdsDAL({ profileIds }) {
  const ids = uniqueIds(profileIds);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,photo_url")
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}

export async function listVportRowsByIdsDAL({ vportIds }) {
  const ids = uniqueIds(vportIds);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("vports")
    .select("id,name,slug,avatar_url")
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}
