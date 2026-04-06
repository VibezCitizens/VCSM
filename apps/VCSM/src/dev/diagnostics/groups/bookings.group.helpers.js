import { supabase } from "@/services/supabase/supabaseClient";

export function getBookingsState(shared) {
  if (!shared.cache.bookingsState) {
    shared.cache.bookingsState = {};
  }
  return shared.cache.bookingsState;
}

function toIsoOrNull(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function buildBookingWindow({
  resourceId,
  durationMinutes = 30,
  minLeadMinutes = 60,
  gapMinutes = 5,
} = {}) {
  const startMs = Date.now() + minLeadMinutes * 60 * 1000;
  let resolvedStartMs = startMs;
  let strategy = "lead_time";
  let latestBooking = null;

  if (resourceId) {
    const { data, error } = await supabase
      .schema("vc")
      .from("bookings")
      .select("id,starts_at,ends_at")
      .eq("resource_id", resourceId)
      .order("ends_at", { ascending: false })
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      latestBooking = data[0];
      const latestEndMs = Date.parse(latestBooking.ends_at);
      if (!Number.isNaN(latestEndMs)) {
        resolvedStartMs = Math.max(startMs, latestEndMs + gapMinutes * 60 * 1000);
        strategy = "after_latest_booking";
      }
    }
  }

  const startsAt = new Date(resolvedStartMs);
  const endsAt = new Date(resolvedStartMs + durationMinutes * 60 * 1000);
  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    strategy,
    latestBooking: latestBooking
      ? {
          id: latestBooking.id ?? null,
          starts_at: toIsoOrNull(latestBooking.starts_at),
          ends_at: toIsoOrNull(latestBooking.ends_at),
        }
      : null,
  };
}

export async function findServiceIdForOwner(ownerActorId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("vport_services")
    .select("id")
    .eq("actor_id", ownerActorId)
    .eq("enabled", true)
    .limit(1);

  if (error) throw error;
  return data?.[0]?.id ?? null;
}
