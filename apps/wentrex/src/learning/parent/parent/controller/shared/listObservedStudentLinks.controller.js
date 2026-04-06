export async function listObservedStudentLinks({ supabase, observerActorId, courseIds }) {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("observer_student_links")
    .select(`
      id,
      course_id,
      observer_actor_id,
      student_actor_id,
      created_at
    `)
    .eq("observer_actor_id", observerActorId)
    .in("course_id", courseIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
