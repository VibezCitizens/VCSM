/**
 * DAL functions for admin diagnostics panel.
 * These run targeted queries to help debug membership/access issues.
 */

export async function listRawMembershipsByActorDal({ supabase, actorId }) {
  if (!supabase) {
    throw new Error("listRawMembershipsByActorDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select("organization_id, actor_id, role, status, created_at")
    .eq("actor_id", actorId);

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listActiveMembershipsByActorDal({ supabase, actorId }) {
  if (!supabase) {
    throw new Error("listActiveMembershipsByActorDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select("organization_id, role, status")
    .eq("actor_id", actorId)
    .eq("status", "active");

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listAdminRoleMembershipsByActorDal({ supabase, actorId }) {
  if (!supabase) {
    throw new Error("listAdminRoleMembershipsByActorDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select("organization_id, role, status")
    .eq("actor_id", actorId)
    .in("role", ["admin", "staff", "owner"]);

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listVisibleOrganizationsDal({ supabase }) {
  if (!supabase) {
    throw new Error("listVisibleOrganizationsDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("organizations")
    .select("id, name, slug, is_active, realm_id, owner_actor_id");

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listVisibleRealmsDal({ supabase }) {
  if (!supabase) {
    throw new Error("listVisibleRealmsDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select("id, name, slug, is_active, owner_actor_id, vc_realm_id");

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listLearningActorsForUserDal({ supabase }) {
  if (!supabase) {
    throw new Error("listLearningActorsForUserDal requires supabase");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .schema("learning")
    .from("actors")
    .select("id, user_id, is_active")
    .eq("user_id", user?.id ?? "");

  return {
    userId: user?.id ?? null,
    data: data ?? [],
    error: error?.message ?? null,
  };
}

export async function getActorAccessDiagnosticDal({ supabase, actorId }) {
  if (!supabase) {
    throw new Error("getActorAccessDiagnosticDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("actor_access")
    .select("actor_id, can_access_learning_center, role")
    .eq("actor_id", actorId)
    .maybeSingle();

  return { data: data ?? null, error: error?.message ?? null };
}
