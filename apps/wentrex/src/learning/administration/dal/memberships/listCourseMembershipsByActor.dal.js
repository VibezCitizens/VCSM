import { COURSE_MEMBERSHIP_COLUMNS } from "@/learning/administration/dal/memberships/getCourseMembershipByActor.dal";

export async function listCourseMembershipsByActorDal({
  supabase,
  courseId,
  actorId,
}) {
  if (!supabase) {
    throw new Error("listCourseMembershipsByActorDal requires supabase");
  }

  if (!courseId) {
    throw new Error("listCourseMembershipsByActorDal requires courseId");
  }

  if (!actorId) {
    throw new Error("listCourseMembershipsByActorDal requires actorId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("course_memberships")
    .select(COURSE_MEMBERSHIP_COLUMNS)
    .eq("course_id", courseId)
    .eq("actor_id", actorId)
    .in("status", ["invited", "active", "completed", "dropped", "removed"])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listCourseMembershipsByActorDal;
