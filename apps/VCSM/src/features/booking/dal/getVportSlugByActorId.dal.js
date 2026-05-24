import vportClient from "@/services/supabase/vportClient";

/**
 * Fetches the public slug for a VPORT actor.
 *
 * Used exclusively to construct notification linkPath values that must not
 * expose raw UUIDs to notification recipients (VPD-V-020).
 *
 * Returns null on any error — callers must handle null gracefully
 * (e.g. omit linkPath rather than falling back to UUID).
 */
export async function getVportSlugByActorIdDAL({ actorId } = {}) {
  if (!actorId) return null;

  try {
    const { data, error } = await vportClient
      .from("profiles")
      .select("slug")
      .eq("actor_id", actorId)
      .maybeSingle();

    if (error) return null;
    return data?.slug ?? null;
  } catch {
    return null;
  }
}
