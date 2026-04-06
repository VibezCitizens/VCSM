import React from "react";
import StudentLayout from "@/learning/student/StudentLayout";
import { ScreenRoute, getCourseId } from "./routeWrappers";

export function studentRoutes({
  LearningStudentDashboardScreen,
  LearningStudentCourseScreen,
}) {
  return {
    path: "student",
    element: <StudentLayout />,
    children: [
      {
        index: true,
        element: (
          <ScreenRoute
            Screen={LearningStudentDashboardScreen}
            buildProps={({ navigate, params }) => ({
              onOpenCourse: (item) => {
                const courseId = getCourseId(item);
                if (courseId) navigate(`/learning/${params.realmSlug}/student/courses/${courseId}`);
              },
            })}
          />
        ),
      },
      {
        path: "courses/:courseId",
        element: (
          <ScreenRoute
            Screen={LearningStudentCourseScreen}
            buildProps={({ navigate, params }) => ({
              onBack: () => navigate(`/learning/${params.realmSlug}/student`),
            })}
          />
        ),
      },
    ],
  };
}
