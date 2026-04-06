const COURSE_MEMBERSHIP_COLUMNS = `
  id,
  course_id,
  actor_id,
  role,
  status,
  created_by_actor_id,
  created_at
`;

export async function getCourseMembershipByActorDal({
  supabase,
  courseId,
  actorId,
}) {
  if (!supabase) {
    throw new Error("getCourseMembershipByActorDal requires supabase");
  }

  if (!courseId) {
    throw new Error("getCourseMembershipByActorDal requires courseId");
  }

  if (!actorId) {
    throw new Error("getCourseMembershipByActorDal requires actorId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("course_memberships")
    .select(COURSE_MEMBERSHIP_COLUMNS)
    .eq("course_id", courseId)
    .eq("actor_id", actorId)
    .in("status", ["invited", "active", "completed", "dropped", "removed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { COURSE_MEMBERSHIP_COLUMNS };
export default getCourseMembershipByActorDal;
