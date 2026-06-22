import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Given a list of actor ids, return the subset that still exist and are
 * neither voided nor soft-deleted.
 *
 * Used to drop booking resources whose linked team member (member_actor_id)
 * account has been deleted/voided. A hard-deleted actor row simply won't be
 * returned by the `.in()` query, so it is treated as invalid as well.
 *
 * Returns: Set<string> of valid actor ids.
 */
export async function listValidMemberActorIdsDAL({ actorIds } = {}) {
  const ids = Array.isArray(actorIds)
    ? [...new Set(actorIds.filter(Boolean))]
    : [];
  if (ids.length === 0) return new Set();

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,is_void,is_deleted")
    .in("id", ids);

  if (error) throw error;

  return new Set(
    (data ?? [])
      .filter((a) => a && a.is_void !== true && a.is_deleted !== true)
      .map((a) => a.id)
  );
}
