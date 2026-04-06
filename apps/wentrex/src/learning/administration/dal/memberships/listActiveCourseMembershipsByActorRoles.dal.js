const COURSE_MEMBERSHIP_COLUMNS = `
  course_id,
  role,
  created_at
`;

export async function listActiveCourseMembershipsByActorRolesDal({
  supabase,
  actorId,
  roles,
}) {
  if (!supabase) {
    throw new Error("listActiveCourseMembershipsByActorRolesDal requires supabase");
  }

  if (!actorId) {
    throw new Error("listActiveCourseMembershipsByActorRolesDal requires actorId");
  }

  if (!roles?.length) {
    throw new Error("listActiveCourseMembershipsByActorRolesDal requires roles");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("course_memberships")
    .select(COURSE_MEMBERSHIP_COLUMNS)
    .eq("actor_id", actorId)
    .eq("status", "active")
    .in("role", roles)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export { COURSE_MEMBERSHIP_COLUMNS };
export default listActiveCourseMembershipsByActorRolesDal;
