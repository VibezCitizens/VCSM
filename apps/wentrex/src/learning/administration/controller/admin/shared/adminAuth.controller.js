import { isPlatformOwner } from "@/learning/administration/controller/shared/platformOwner";

export async function isPlatformAdmin({ supabase, actorId }) {
  if (!supabase || !actorId) {
    console.warn("[isPlatformAdmin] called with missing supabase or actorId", { supabase: !!supabase, actorId });
    return false;
  }

  console.group("[isPlatformAdmin]");
  console.log("querying learning.platform_admins for actorId:", actorId);

  const { data, error } = await supabase
    .schema("learning")
    .from("platform_admins")
    .select("id, actor_id")
    .eq("actor_id", actorId)
    .limit(1);

  console.log("raw result:", { data, error });

  if (error) {
    console.error("query error:", error);
    console.groupEnd();
    if (error.code === "42P01") {
      return false;
    }

    throw error;
  }

  const result = (data ?? []).length > 0;
  console.log("isPlatformAdmin result:", result, "| rows returned:", (data ?? []).length);
  console.groupEnd();

  return result;
}

/**
 * Combined authority check: platform owner (via user_id) OR platform admin (via actor_id).
 * Use this instead of isPlatformAdmin wherever owner bypass is needed.
 * Short-circuits on owner so the platform_admins query is skipped entirely.
 */
export async function isAdminAuthorized({ supabase, userId, actorId }) {
  if (userId) {
    const ownerResult = await isPlatformOwner(supabase, userId);
    if (ownerResult) {
      return true;
    }
  }

  return isPlatformAdmin({ supabase, actorId });
}
