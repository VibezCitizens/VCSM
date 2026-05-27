import vportClient from "@/services/supabase/vportClient";

/**
 * Resolves a VPORT actor's internal vport.profiles.id from an actorId.
 *
 * Used exclusively as a translation layer inside useQrLinks — allows the hook
 * to accept actorId (canonical identity surface) and resolve to the booking
 * engine's required profileId internally, invisible to callers.
 *
 * Pattern mirrors getVportSlugByActorId.dal.js (VPD-V-020 fix).
 *
 * Returns null on any error — callers must handle null gracefully.
 * (VENOM V-003 — identity surface remediation)
 */
export async function getVportProfileIdByActorIdDAL({ actorId } = {}) {
  if (!actorId) return null;

  try {
    const { data, error } = await vportClient
      .from("profiles")
      .select("id")
      .eq("actor_id", actorId)
      .maybeSingle();

    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
}
