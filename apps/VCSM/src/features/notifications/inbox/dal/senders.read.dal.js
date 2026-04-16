import { supabase } from "@/services/supabase/supabaseClient";
import { hydrateAndReturnSummaries } from "@hydration";
import vportSchema from "@/services/supabase/vportClient";

function uniqueIds(ids = []) {
  return [...new Set((Array.isArray(ids) ? ids : []).filter(Boolean))];
}

/**
 * Primary sender lookup — uses shared hydration store.
 * Checks cache first, only fetches stale/missing actors.
 * Results are upserted into the global actor store.
 */
export async function listActorSummaryRowsByIdsDAL({ actorIds }) {
  const ids = uniqueIds(actorIds);
  if (!ids.length) return [];

  const { rows, error } = await hydrateAndReturnSummaries({ actorIds: ids });
  if (error) throw error;
  return rows;
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

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,name,slug,avatar_url")
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}
