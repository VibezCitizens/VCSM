/* eslint-disable react-refresh/only-export-components */

import React from "react";
import LearningLayout from "@/learning/layout/LearningLayout";
import {
  getCourseId,
  getOrganizationId,
  ScreenRoute,
  LearningHomeRoute,
} from "@/learning/routes/learningRouteComponents";

export function learningProtectedRoutes({
  LearningHomeScreen,
  LearningCourseScreen,
  LearningLessonScreen,
  LearningAssignmentScreen,
  LearningStudentDashboardScreen,
  LearningStudentCourseScreen,
  LearningTeacherDashboardScreen,
  LearningTeacherCourseScreen,
  LearningSubmissionReviewScreen,
  LearningParentDashboardScreen,
  LearningObservedStudentScreen,
  LearningAdminDashboardScreen,
  LearningOrganizationScreen,
  LearningCourseRosterScreen,
}) {
  return [
    {
      path: "/learning",
      element: <LearningLayout />,
      children: [
        {
          index: true,
          element: <LearningHomeRoute Screen={LearningHomeScreen} />,
        },
        {
          path: "courses/:courseId",
          element: <ScreenRoute Screen={LearningCourseScreen} />,
        },
        {
          path: "courses/:courseId/assignments",
          element: <ScreenRoute Screen={LearningCourseScreen} />,
        },
        {
          path: "courses/:courseId/lessons/:lessonId",
          element: <ScreenRoute Screen={LearningLessonScreen} />,
        },
        {
          path: "courses/:courseId/assignments/:assignmentId",
          element: <ScreenRoute Screen={LearningAssignmentScreen} />,
        },
        {
          path: "lessons/:lessonId",
          element: <ScreenRoute Screen={LearningLessonScreen} />,
        },
        {
          path: "assignments/:assignmentId",
          element: <ScreenRoute Screen={LearningAssignmentScreen} />,
        },
        {
          path: "student",
          element: (
            <ScreenRoute
              Screen={LearningStudentDashboardScreen}
              buildProps={({ navigate }) => ({
                onOpenCourse: (item) => {
                  const courseId = getCourseId(item);
                  if (courseId) navigate(`/learning/student/courses/${courseId}`);
                },
              })}
            />
          ),
        },
        {
          path: "student/courses/:courseId",
          element: (
            <ScreenRoute
              Screen={LearningStudentCourseScreen}
              buildProps={({ navigate }) => ({
                onBack: () => navigate(-1),
              })}
            />
          ),
        },
        {
          path: "teacher",
          element: (
            <ScreenRoute
              Screen={LearningTeacherDashboardScreen}
              buildProps={({ navigate }) => ({
                onOpenCourse: (item) => {
                  const courseId = getCourseId(item);
                  if (courseId) navigate(`/learning/teacher/courses/${courseId}`);
                },
                onOpenSubmissions: (item) => {
                  const courseId = getCourseId(item);
                  if (courseId) {
                    navigate(`/learning/teacher/courses/${courseId}/submissions`);
                  }
                },
              })}
            />
          ),
        },
        {
          path: "teacher/courses/:courseId",
          element: (
            <ScreenRoute
              Screen={LearningTeacherCourseScreen}
              buildProps={({ navigate, params }) => ({
                onBack: () => navigate(-1),
                onOpenSubmissions: () => {
                  if (params.courseId) {
                    navigate(`/learning/teacher/courses/${params.courseId}/submissions`);
                  }
                },
              })}
            />
          ),
        },
        {
          path: "teacher/courses/:courseId/submissions",
          element: (
            <ScreenRoute
              Screen={LearningSubmissionReviewScreen}
              buildProps={({ navigate }) => ({
                onBack: () => navigate(-1),
              })}
            />
          ),
        },
        {
          path: "teacher/courses/:courseId/assignments/:assignmentId/submissions",
          element: (
            <ScreenRoute
              Screen={LearningSubmissionReviewScreen}
              buildProps={({ navigate }) => ({
                onBack: () => navigate(-1),
              })}
            />
          ),
        },
        {
          path: "parent",
          element: (
            <ScreenRoute
              Screen={LearningParentDashboardScreen}
              buildProps={({ navigate }) => ({
                onOpenStudent: (item) => {
                  const courseId = item?.courseId ?? item?.course?.id ?? null;
                  const studentActorId = item?.studentActorId ?? null;

                  if (courseId && studentActorId) {
                    navigate(
                      `/learning/parent/courses/${courseId}/students/${studentActorId}`,
                    );
                  }
                },
              })}
            />
          ),
        },
        {
          path: "parent/courses/:courseId/students/:studentActorId",
          element: (
            <ScreenRoute
              Screen={LearningObservedStudentScreen}
              buildProps={({ navigate }) => ({
                onBack: () => navigate(-1),
              })}
            />
          ),
        },
        {
          path: "admin",
          element: (
            <ScreenRoute
              Screen={LearningAdminDashboardScreen}
              buildProps={({ navigate }) => ({
                onOpenStudentDashboard: () => {
                  navigate("/learning/student");
                },
                onOpenParentDashboard: () => {
                  navigate("/learning/parent");
                },
                onOpenTeacherDashboard: () => {
                  navigate("/learning/teacher");
                },
                onOpenOrganization: (item) => {
                  const organizationId = getOrganizationId(item);
                  if (organizationId) {
                    navigate(`/learning/admin/organizations/${organizationId}`);
                  }
                },
                onOpenCourseRoster: (item) => {
                  const courseId = getCourseId(item);
                  if (courseId) {
                    navigate(`/learning/admin/courses/${courseId}/roster`);
                  }
                },
              })}
            />
          ),
        },
        {
          path: "admin/organizations/:organizationId",
          element: (
            <ScreenRoute
              Screen={LearningOrganizationScreen}
              buildProps={({ navigate }) => ({
                onBack: () => navigate(-1),
                onOpenCourseRoster: (item) => {
                  const courseId = getCourseId(item);
                  if (courseId) {
                    navigate(`/learning/admin/courses/${courseId}/roster`);
                  }
                },
              })}
            />
          ),
        },
        {
          path: "admin/courses/:courseId/roster",
          element: (
            <ScreenRoute
              Screen={LearningCourseRosterScreen}
              buildProps={({ navigate }) => ({
                onBack: () => navigate(-1),
              })}
            />
          ),
        },
      ],
    },
  ];
}

export default learningProtectedRoutes;
