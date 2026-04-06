import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { listSubmissionsByAssignmentIdDal } from "@/learning/dal/submissions/listSubmissionsByAssignmentId.dal";
import { listSubmissionFilesBySubmissionIdDal } from "@/learning/dal/submissionFiles/listSubmissionFilesBySubmissionId.dal";
import { listGradesByAssignmentIdDal } from "@/learning/dal/grades/listGradesByAssignmentId.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";
import { mapAssignment } from "@/learning/model/assignment.model";
import { mapSubmissions } from "@/learning/model/submission.model";
import { mapSubmissionFiles } from "@/learning/model/submissionFile.model";
import { mapGrade } from "@/learning/model/grade.model";

const TEACHER_ROLES = new Set(["instructor", "ta", "grader", "admin"]);

function isTeacherMembership(membership) {
  return Boolean(
    membership &&
      membership.status &&
      membership.status !== "removed" &&
      TEACHER_ROLES.has(membership.role)
  );
}

export async function listCourseSubmissionsController({
  supabase,
  actorId,
  realmId,
  courseId,
  assignmentId = null,
  includeDrafts = false,
}) {
  if (!supabase) {
    throw new Error("listCourseSubmissionsController requires supabase");
  }

  if (!actorId) {
    throw new Error("listCourseSubmissionsController requires actorId");
  }

  if (!realmId) {
    throw new Error("listCourseSubmissionsController requires realmId");
  }

  if (!courseId) {
    throw new Error("listCourseSubmissionsController requires courseId");
  }

  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  const membershipRow = await getCourseMembershipByActorDal({
    supabase,
    courseId,
    actorId,
  });

  if (!isTeacherMembership(membershipRow)) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const allAssignmentRows = await listAssignmentsByCourseIdDal({
    supabase,
    courseId,
    includeUnpublished: true,
  });

  const filteredAssignmentRows = assignmentId
    ? allAssignmentRows.filter((assignment) => assignment.id === assignmentId)
    : allAssignmentRows;

  if (assignmentId && filteredAssignmentRows.length === 0) {
    return { ok: false, error: { code: "ASSIGNMENT_NOT_FOUND" } };
  }

  const submissionsByAssignment = await Promise.all(
    filteredAssignmentRows.map((assignment) =>
      listSubmissionsByAssignmentIdDal({
        supabase,
        assignmentId: assignment.id,
      })
    )
  );

  const gradesByAssignment = await Promise.all(
    filteredAssignmentRows.map((assignment) =>
      listGradesByAssignmentIdDal({
        supabase,
        assignmentId: assignment.id,
      })
    )
  );

  const assignmentResults = await Promise.all(
    filteredAssignmentRows.map(async (assignmentRow, index) => {
      let submissionRows = submissionsByAssignment[index] ?? [];

      if (!includeDrafts) {
        submissionRows = submissionRows.filter(
          (submission) => submission.status !== "draft"
        );
      }

      const mappedSubmissions = mapSubmissions(submissionRows);
      const gradeRows = gradesByAssignment[index] ?? [];
      const gradeBySubmissionId = new Map(
        gradeRows.map((grade) => [grade.submission_id, grade])
      );

      const filesBySubmission = await Promise.all(
        submissionRows.map((submission) =>
          listSubmissionFilesBySubmissionIdDal({
            supabase,
            submissionId: submission.id,
          })
        )
      );

      const submissions = mappedSubmissions.map((submission, submissionIndex) => ({
        ...submission,
        files: mapSubmissionFiles(filesBySubmission[submissionIndex] ?? []),
        grade: mapGrade(gradeBySubmissionId.get(submission.id) ?? null),
      }));

      const gradedCount = submissions.filter((item) => item.grade).length;
      const pendingCount = submissions.filter(
        (item) => item.status === "submitted" && !item.grade
      ).length;

      return {
        assignment: mapAssignment(assignmentRow),
        submissions,
        counts: {
          total: submissions.length,
          graded: gradedCount,
          pending: pendingCount,
        },
      };
    })
  );

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      membership: mapMembership(membershipRow),
      assignments: assignmentResults,
    },
  };
}

export default listCourseSubmissionsController;