import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";

import { mapCourses } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";
import { mapAssignments } from "@/learning/model/assignment.model";
import { mapSubmission } from "@/learning/model/submission.model";
import { mapGrade } from "@/learning/model/grade.model";
import {
  isStudentMembership,
  toNumber,
  getAssignmentStatus,
  buildPerCourseData,
} from "@/learning/controller/students/getStudentDashboard.helpers";

export async function getStudentDashboardController({
  supabase,
  actorId,
  realmId = null,
}) {
  if (!supabase) {
    throw new Error("getStudentDashboardController requires supabase");
  }

  if (!actorId) {
    throw new Error("getStudentDashboardController requires actorId");
  }

  const courseRows = await listCoursesByActorIdDal({
    supabase,
    actorId,
    realmId,
  });

  if (!Array.isArray(courseRows) || courseRows.length === 0) {
    return {
      ok: true,
      data: {
        membership: null,
        courses: [],
        upcomingAssignments: [],
        recentGrades: [],
        continueLearning: [],
        stats: {
          totalCourses: 0,
          totalLessons: 0,
          completedLessons: 0,
          completionPercent: 0,
          totalAssignments: 0,
          submittedAssignments: 0,
          gradedAssignments: 0,
          averageScore: null,
        },
      },
    };
  }

  const membershipRows = await Promise.all(
    courseRows.map((course) =>
      getCourseMembershipByActorDal({
        supabase,
        courseId: course.id,
        actorId,
      })
    )
  );

  const studentCoursePairs = courseRows
    .map((course, index) => ({
      course,
      membership: membershipRows[index],
    }))
    .filter(({ membership }) => isStudentMembership(membership));

  if (studentCoursePairs.length === 0) {
    return {
      ok: false,
      error: { code: "FORBIDDEN" },
    };
  }

  const perCourseRows = await buildPerCourseData({ supabase, studentCoursePairs, actorId });

  let totalLessons = 0;
  let completedLessons = 0;
  let totalAssignments = 0;
  let submittedAssignments = 0;
  let gradedAssignments = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  const courses = [];
  const upcomingAssignments = [];
  const recentGrades = [];
  const continueLearning = [];

  for (const courseBundle of perCourseRows) {
    const {
      course,
      membership,
      lessons,
      progress,
      assignments,
      submissions,
      grades,
    } = courseBundle;

    const completedForCourse = progress.filter(
      (row) => row.state === "completed" || Boolean(row.completed_at)
    ).length;
    const inProgressForCourse = progress.filter(
      (row) => row.state === "in_progress",
    ).length;
    const notStartedForCourse = Math.max(
      lessons.length - completedForCourse - inProgressForCourse,
      0,
    );

    totalLessons += lessons.length;
    completedLessons += completedForCourse;
    totalAssignments += assignments.length;

    const mappedAssignments = mapAssignments(assignments);

    submissions.forEach((submission) => {
      if (submission && submission.status !== "draft") {
        submittedAssignments += 1;
      }
    });

    grades.forEach((grade) => {
      if (!grade) return;
      gradedAssignments += 1;

      if (grade.score !== null && grade.score !== undefined) {
        scoreSum += toNumber(grade.score);
        scoreCount += 1;
      }
    });

    courses.push({
      ...mapCourses([course])[0],
      membership: mapMembership(membership),
      lessonCount: lessons.length,
      completedLessons: completedForCourse,
      inProgressLessons: inProgressForCourse,
      notStartedLessons: notStartedForCourse,
      assignmentCount: assignments.length,
      progressPercent:
        lessons.length > 0
          ? Math.round((completedForCourse / lessons.length) * 100)
          : 0,
    });

    mappedAssignments.forEach((assignment, index) => {
      const submission = submissions[index] ?? null;
      const grade = grades[index] ?? null;
      const status = getAssignmentStatus({ assignment, submission, grade });

      upcomingAssignments.push({
        ...assignment,
        course: mapCourses([course])[0],
        submission: mapSubmission(submission),
        grade: mapGrade(grade),
        status,
      });

      if (grade) {
        recentGrades.push({
          ...assignment,
          course: mapCourses([course])[0],
          submission: mapSubmission(submission),
          grade: mapGrade(grade),
        });
      }
    });

    const lessonProgressByLessonId = new Map(
      progress.map((item) => [item.lesson_id, item])
    );

    const nextLessonRow =
      lessons.find((lesson) => {
        const progressRow = lessonProgressByLessonId.get(lesson.id);
        return !progressRow || progressRow.state !== "completed";
      }) ?? lessons[0] ?? null;

    if (nextLessonRow) {
      continueLearning.push({
        course: mapCourses([course])[0],
        lesson: {
          id: nextLessonRow.id,
          moduleId: nextLessonRow.module_id,
          courseId: nextLessonRow.course_id,
          title: nextLessonRow.title,
          lessonType: nextLessonRow.lesson_type,
          body: nextLessonRow.body,
          externalUrl: nextLessonRow.external_url,
          fileUrl: nextLessonRow.file_url,
          sortOrder: nextLessonRow.sort_order,
          isPublished: nextLessonRow.is_published,
          createdByActorId: nextLessonRow.created_by_actor_id,
          createdAt: nextLessonRow.created_at,
          updatedAt: nextLessonRow.updated_at,
        },
        progress: nextLessonRow
          ? {
              completed: Boolean(
                lessonProgressByLessonId.get(nextLessonRow.id)?.completed_at ||
                  lessonProgressByLessonId.get(nextLessonRow.id)?.state ===
                    "completed"
              ),
            }
          : null,
      });
    }
  }

  upcomingAssignments.sort((a, b) => {
    const left = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const right = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    return left - right;
  });

  recentGrades.sort((a, b) => {
    const left = a.grade?.gradedAt ? new Date(a.grade.gradedAt).getTime() : 0;
    const right = b.grade?.gradedAt ? new Date(b.grade.gradedAt).getTime() : 0;
    return right - left;
  });

  continueLearning.sort((a, b) => a.course.title.localeCompare(b.course.title));

  return {
    ok: true,
    data: {
      membership: mapMembership(studentCoursePairs[0].membership),
      courses,
      upcomingAssignments: upcomingAssignments.slice(0, 12),
      recentGrades: recentGrades.slice(0, 12),
      continueLearning: continueLearning.slice(0, 8),
      stats: {
        totalCourses: studentCoursePairs.length,
        totalLessons,
        completedLessons,
        completionPercent:
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        totalAssignments,
        submittedAssignments,
        gradedAssignments,
        averageScore: scoreCount > 0 ? scoreSum / scoreCount : null,
      },
    },
  };
}

export default getStudentDashboardController;
