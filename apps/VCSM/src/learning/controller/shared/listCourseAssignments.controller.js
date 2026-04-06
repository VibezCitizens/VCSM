import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";

import { mapAssignments } from "@/learning/model/assignment.model";

export async function listCourseAssignmentsController({
  supabase,
  actorId,
  courseId,
}) {
  const membership = await getCourseMembershipByActorDal({
    supabase,
    courseId,
    actorId,
  });

  if (!membership) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const assignments = await listAssignmentsByCourseIdDal({
    supabase,
    courseId,
    includeUnpublished: false,
  });

  return {
    ok: true,
    data: {
      assignments: mapAssignments(assignments),
    },
  };
}

export default listCourseAssignmentsController;