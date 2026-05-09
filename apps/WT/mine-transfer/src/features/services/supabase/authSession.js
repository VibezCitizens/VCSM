import { supabase } from "@/services/supabase/supabaseClient";

export async function readSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;
  return data?.session ?? null;
}

/**
 * Access check:
 *   auth.uid() -> learning.actors (user_id)
 *     -> learning.actor_access.can_access_learning_center
 *     -> learning.organization_memberships (active admin/staff)
 *
 * Returns true when the signed-in user has either:
 *   1. active learning-space membership, or
 *   2. active organization admin/staff access.
 */
export async function readLearningCenterAccess() {
  console.group("[readLearningCenterAccess]");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  console.log("1. auth user:", {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    userError,
  });

  if (userError) {
    console.groupEnd();
    throw userError;
  }

  if (!user) {
    console.warn("1. no user -> false");
    console.groupEnd();
    return false;
  }

  const { data: actor, error: actorError } = await supabase
    .schema("learning")
    .from("actors")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  console.log("2. learning.actors:", { actor, actorError });

  if (actorError) {
    console.groupEnd();
    throw actorError;
  }

  if (!actor) {
    console.warn("2. no actor row -> false");
    console.groupEnd();
    return false;
  }

  const { data: access, error: accessError } = await supabase
    .schema("learning")
    .from("actor_access")
    .select("can_access_learning_center")
    .eq("actor_id", actor.id)
    .maybeSingle();

  console.log("3. learning.actor_access:", { access, accessError });

  if (accessError) {
    console.groupEnd();
    throw accessError;
  }

  const hasLearningMembership = access?.can_access_learning_center === true;

  if (hasLearningMembership) {
    console.log("4. result:", true, "(source: actor_access)");
    console.groupEnd();
    return true;
  }

  const { data: organizationMemberships, error: organizationMembershipsError } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select("id, role, status")
    .eq("actor_id", actor.id)
    .eq("status", "active")
    .in("role", ["admin", "staff"])
    .limit(1);

  console.log("4. learning.organization_memberships:", {
    organizationMemberships,
    organizationMembershipsError,
  });

  if (organizationMembershipsError) {
    console.groupEnd();
    throw organizationMembershipsError;
  }

  const hasOrgAdminOrStaffAccess = (organizationMemberships ?? []).length > 0;

  console.log("5. result:", hasOrgAdminOrStaffAccess, {
    source: hasOrgAdminOrStaffAccess ? "organization_memberships" : "none",
  });
  console.groupEnd();

  return hasOrgAdminOrStaffAccess;
}

export async function readSupabaseAccessToken() {
  const session = await readSupabaseSession();
  return session?.access_token ?? null;
}
