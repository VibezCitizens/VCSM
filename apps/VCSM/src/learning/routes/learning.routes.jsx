/* eslint-disable react-refresh/only-export-components */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import LearningErrorState from "@/learning/components/shared/LearningErrorState";
import LearningLoadingState from "@/learning/components/shared/LearningLoadingState";
import { useLearningHome } from "@/learning/hooks/shared/useLearningHome";
import { useLearningRouteContext } from "@/learning/hooks/shared/useLearningRouteContext";
import LearningLayout from "@/learning/layout/LearningLayout";

function getCourseId(item) {
  return item?.course?.id ?? item?.id ?? null;
}

function getOrganizationId(item) {
  return item?.organization?.id ?? item?.id ?? null;
}

function RuntimeError({ error, onRetry }) {
  return <LearningErrorState error={error} onRetry={onRetry} />;
}

function ScreenRoute({ Screen, buildProps }) {
  const navigate = useNavigate();
  const params = useParams();
  const learning = useLearningRouteContext();

  if (learning.isLoading) {
    return <LearningLoadingState label="Loading learning..." />;
  }

  if (learning.error) {
    return <RuntimeError error={learning.error} onRetry={learning.reload} />;
  }

  if (!learning.isReady) {
    return (
      <RuntimeError
        error={{
          code: "LEARNING_CONTEXT_UNAVAILABLE",
          message: "Learning context is unavailable.",
        }}
        onRetry={learning.reload}
      />
    );
  }

  return (
    <Screen
      {...learning}
      {...params}
      {...buildProps?.({ navigate, params })}
    />
  );
}

function LearningHomeRoute({ Screen }) {
  const learning = useLearningRouteContext();

  const homeState = useLearningHome({
    supabase: learning.supabase,
    actorId: learning.actorId,
    realmId: learning.realmId,
    enabled: learning.isReady,
  });

  if (learning.isLoading || (learning.isReady && homeState.isLoading && !homeState.data)) {
    return <LearningLoadingState label="Loading learning..." />;
  }

  if (learning.error) {
    return <RuntimeError error={learning.error} onRetry={learning.reload} />;
  }

  if (!learning.isReady) {
    return (
      <RuntimeError
        error={{
          code: "LEARNING_CONTEXT_UNAVAILABLE",
          message: "Learning context is unavailable.",
        }}
        onRetry={learning.reload}
      />
    );
  }

  if (homeState.error && !homeState.data) {
    return <RuntimeError error={homeState.error} onRetry={homeState.reload} />;
  }

  return (
    <Screen
      {...learning}
      courses={homeState.data?.courses ?? []}
      groupedCourses={homeState.data?.groupedCourses ?? {}}
      summary={homeState.data?.summary ?? {}}
      realm={homeState.data?.realm ?? learning.realm}
      reload={homeState.reload}
    />
  );
}

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
