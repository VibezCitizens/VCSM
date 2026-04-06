const ORG_MEMBERSHIP_COLUMNS = `
  organization_id,
  role,
  created_at,
  organization:organizations ( realm_id, slug )
`;

export async function listActiveOrgMembershipsByActorRolesDal({
  supabase,
  actorId,
  roles,
}) {
  if (!supabase) {
    throw new Error("listActiveOrgMembershipsByActorRolesDal requires supabase");
  }

  if (!actorId) {
    throw new Error("listActiveOrgMembershipsByActorRolesDal requires actorId");
  }

  if (!roles?.length) {
    throw new Error("listActiveOrgMembershipsByActorRolesDal requires roles");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select(ORG_MEMBERSHIP_COLUMNS)
    .eq("actor_id", actorId)
    .eq("status", "active")
    .in("role", roles)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export { ORG_MEMBERSHIP_COLUMNS };
export default listActiveOrgMembershipsByActorRolesDal;
