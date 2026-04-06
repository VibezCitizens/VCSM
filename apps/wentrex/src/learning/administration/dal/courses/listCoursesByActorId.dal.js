import { COURSE_COLUMNS } from "@/learning/administration/dal/courses/getCourseById.dal";

export async function listCoursesByActorIdDal({
  supabase,
  actorId,
  realmId,
}) {
  if (!supabase) {
    throw new Error("listCoursesByActorIdDal requires supabase");
  }

  if (!actorId) {
    throw new Error("listCoursesByActorIdDal requires actorId");
  }

  let query = supabase
    .schema("learning")
    .from("course_memberships")
    .select(`
      course_id,
      courses:course_id (${COURSE_COLUMNS})
    `)
    .eq("actor_id", actorId);

  if (realmId) {
    query = query.eq("courses.realm_id", realmId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // flatten nested join
  return (data ?? [])
    .map((row) => row.courses)
    .filter(Boolean);
}

export default listCoursesByActorIdDal;
