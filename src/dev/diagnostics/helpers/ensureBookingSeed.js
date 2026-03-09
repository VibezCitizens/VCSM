import { supabase } from "@/services/supabase/supabaseClient";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureVportSeed";
import { markerForUser } from "@/dev/diagnostics/helpers/seedMarker";

async function listOwnedVportActorIds(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select(
      `
      actor_id,
      actor:actors (
        id,
        kind
      )
    `
    )
    .eq("user_id", userId)
    .eq("actor.kind", "vport");

  if (error) throw error;

  return [...new Set(
    (Array.isArray(data) ? data : [])
      .map((row) => row?.actor_id)
      .filter(Boolean)
      .map(String)
  )];
}

async function resolvePreferredOwnedBookingContext(userId) {
  const ownerActorIds = await listOwnedVportActorIds(userId);
  if (!ownerActorIds.length) {
    return null;
  }

  const { data: serviceRows, error: serviceError } = await supabase
    .schema("vc")
    .from("vport_services")
    .select("id,actor_id,enabled")
    .in("actor_id", ownerActorIds)
    .eq("enabled", true);

  if (serviceError) throw serviceError;

  const ownersWithEnabledServices = new Set(
    (Array.isArray(serviceRows) ? serviceRows : [])
      .map((row) => row?.actor_id)
      .filter(Boolean)
      .map(String)
  );

  const { data: resources, error: resourceError } = await supabase
    .schema("vc")
    .from("booking_resources")
    .select("id,owner_actor_id,resource_type,name,timezone,is_active,created_at")
    .in("owner_actor_id", ownerActorIds)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (resourceError) throw resourceError;

  const resourceRows = Array.isArray(resources) ? resources : [];
  const preferredResource = resourceRows.find((row) => ownersWithEnabledServices.has(String(row?.owner_actor_id)));
  if (preferredResource?.id) {
    return {
      ownerActorId: String(preferredResource.owner_actor_id),
      resource: preferredResource,
      source: "owned_vport_resource_with_enabled_service",
    };
  }

  if (resourceRows[0]?.id) {
    return {
      ownerActorId: String(resourceRows[0].owner_actor_id),
      resource: resourceRows[0],
      source: "owned_vport_resource_existing",
    };
  }

  const fallbackOwnerActorId = ownerActorIds.find((id) => ownersWithEnabledServices.has(id)) ?? ownerActorIds[0];
  return {
    ownerActorId: String(fallbackOwnerActorId),
    resource: null,
    source: ownersWithEnabledServices.size > 0
      ? "owned_vport_enabled_service_no_resource"
      : "owned_vport_no_resource",
  };
}

export async function ensureBasicBookingObjects(shared) {
  if (shared?.cache?.seedBooking) return shared.cache.seedBooking;

  const { actorId, userId } = await ensureActorContext(shared);

  let preferred = null;
  try {
    preferred = await resolvePreferredOwnedBookingContext(userId);
  } catch {
    preferred = null;
  }

  if (preferred?.resource?.id && preferred?.ownerActorId) {
    const bookingSeed = {
      ownerActorId: preferred.ownerActorId,
      resourceId: preferred.resource.id,
      source: preferred.source,
    };
    if (shared?.cache) shared.cache.seedBooking = bookingSeed;
    return bookingSeed;
  }

  const owner =
    preferred?.ownerActorId
      ? { actorId: preferred.ownerActorId }
      : await ensureBasicVport(shared).catch(() => ({ actorId }));
  const ownerActorId = owner?.actorId ?? actorId;
  const marker = markerForUser(userId, "booking_resource");

  const { data: existing, error: readError } = await supabase
    .schema("vc")
    .from("booking_resources")
    .select("id,owner_actor_id,resource_type,name,timezone,is_active,created_at")
    .eq("owner_actor_id", ownerActorId)
    .eq("name", marker)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) throw readError;

  let resource = existing;

  if (!resource?.id) {
    const { data, error } = await supabase
      .schema("vc")
      .from("booking_resources")
      .insert({
        owner_actor_id: ownerActorId,
        resource_type: "primary",
        name: marker,
        timezone: "UTC",
        is_active: true,
      })
      .select("id,owner_actor_id,resource_type,name,timezone,is_active,created_at")
      .maybeSingle();

    if (error) throw error;
    resource = data;
  }

  if (!resource?.id) {
    throw new Error("Failed to ensure booking resource seed.");
  }

  const bookingSeed = {
    ownerActorId,
    resourceId: resource.id,
    source: preferred?.source ?? "seeded_marker_resource",
  };

  if (shared?.cache) shared.cache.seedBooking = bookingSeed;
  return bookingSeed;
}
