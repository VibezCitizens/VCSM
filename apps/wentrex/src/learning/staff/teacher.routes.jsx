import React from "react";
import StaffLayout from "@/learning/teacher/StaffLayout";
import { ScreenRoute, getCourseId } from "./routeWrappers";

export function teacherRoutes({
  LearningTeacherDashboardScreen,
  LearningTeacherCourseScreen,
  LearningSubmissionReviewScreen,
}) {
  return {
    path: "teacher",
    element: <StaffLayout />,
    children: [
      {
        index: true,
        element: (
          <ScreenRoute
            Screen={LearningTeacherDashboardScreen}
            buildProps={({ navigate, params }) => ({
              onOpenCourse: (item) => {
                const courseId = getCourseId(item);
                if (courseId) navigate(`/learning/${params.realmSlug}/teacher/courses/${courseId}`);
              },
              onOpenSubmissions: (item) => {
                const courseId = getCourseId(item);
                if (courseId) {
                  navigate(`/learning/${params.realmSlug}/teacher/courses/${courseId}/submissions`);
                }
              },
            })}
          />
        ),
      },
      {
        path: "courses/:courseId",
        element: (
          <ScreenRoute
            Screen={LearningTeacherCourseScreen}
            buildProps={({ navigate, params }) => ({
              onBack: () => navigate(`/learning/${params.realmSlug}/teacher`),
              onOpenSubmissions: () => {
                if (params.courseId) {
                  navigate(`/learning/${params.realmSlug}/teacher/courses/${params.courseId}/submissions`);
                }
              },
            })}
          />
        ),
      },
      {
        path: "courses/:courseId/submissions",
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
        path: "courses/:courseId/assignments/:assignmentId/submissions",
        element: (
          <ScreenRoute
            Screen={LearningSubmissionReviewScreen}
            buildProps={({ navigate }) => ({
              onBack: () => navigate(-1),
            })}
          />
        ),
      },
    ],
  };
}
