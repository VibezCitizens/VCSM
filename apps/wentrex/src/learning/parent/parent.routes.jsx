import React from "react";
import ParentLayout from "@/learning/parent/ParentLayout";
import { ScreenRoute } from "./routeWrappers";

export function parentRoutes({
  LearningParentDashboardScreen,
  LearningObservedStudentScreen,
}) {
  return {
    path: "parent",
    element: <ParentLayout />,
    children: [
      {
        index: true,
        element: (
          <ScreenRoute
            Screen={LearningParentDashboardScreen}
            buildProps={({ navigate, params }) => ({
              onOpenStudent: (item) => {
                const courseId = item?.courseId ?? item?.course?.id ?? null;
                const studentActorId = item?.studentActorId ?? null;
                if (courseId && studentActorId) {
                  navigate(
                    `/learning/${params.realmSlug}/parent/courses/${courseId}/students/${studentActorId}`,
                  );
                }
              },
            })}
          />
        ),
      },
      {
        path: "courses/:courseId/students/:studentActorId",
        element: (
          <ScreenRoute
            Screen={LearningObservedStudentScreen}
            buildProps={({ navigate, params }) => ({
              onBack: () => navigate(`/learning/${params.realmSlug}/parent`),
            })}
          />
        ),
      },
    ],
  };
}
