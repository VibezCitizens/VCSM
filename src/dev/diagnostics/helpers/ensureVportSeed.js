import { supabase } from "@/services/supabase/supabaseClient";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { markerForUser } from "@/dev/diagnostics/helpers/seedMarker";
import {
  isMissingRpc,
  isPermissionDenied,
} from "@/dev/diagnostics/helpers/supabaseAssert";

async function findOwnedVport(shared) {
  const { userId } = await ensureActorContext(shared);

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select(
      `
      actor_id,
      user_id,
      actor:actors (
        id,
        kind,
        vport_id
      )
    `
    )
    .eq("user_id", userId)
    .eq("actor.kind", "vport")
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data?.actor?.id) {
    return null;
  }

  return {
    actorId: data.actor.id,
    vportId: data.actor.vport_id ?? null,
  };
}

async function createVportViaRpc(shared) {
  const { userId } = await ensureActorContext(shared);
  const marker = markerForUser(userId, "vport");

  const { data, error } = await supabase
    .schema("vc")
    .rpc("create_vport", {
      p_name: `Diagnostics ${marker}`,
      p_slug: marker.slice(0, 20),
      p_avatar_url: null,
      p_bio: "Diagnostics seeded vport",
      p_banner_url: null,
      p_vport_type: "other",
    });

  if (error) throw error;

  return {
    actorId: data?.actor_id ?? null,
    vportId: data?.vport_id ?? null,
    raw: data ?? null,
  };
}

export async function ensureBasicVport(shared) {
  if (shared?.cache?.seedVport) return shared.cache.seedVport;

  const owned = await findOwnedVport(shared);
  if (owned?.actorId && owned?.vportId) {
    if (shared?.cache) shared.cache.seedVport = owned;
    return owned;
  }

  try {
    const created = await createVportViaRpc(shared);
    if (created?.actorId && created?.vportId) {
      if (shared?.cache) shared.cache.seedVport = created;
      return created;
    }
  } catch (error) {
    if (!isMissingRpc(error) && !isPermissionDenied(error)) {
      throw error;
    }
  }

  const fallback = await findOwnedVport(shared);
  if (!fallback?.actorId || !fallback?.vportId) {
    throw new Error("No vport actor available and create_vport RPC unavailable or blocked.");
  }

  if (shared?.cache) shared.cache.seedVport = fallback;
  return fallback;
}
