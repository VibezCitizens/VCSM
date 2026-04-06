/* eslint-disable react-refresh/only-export-components */

import React from "react";
import LearningLayout from "@/learning/administration/layout/LearningLayout";
import { ScreenRoute, LearningHomeRoute } from "./routeWrappers";
import { adminRoutes } from "./admin.routes";
import { teacherRoutes } from "./teacher.routes";
import { parentRoutes } from "./parent.routes";
import { studentRoutes } from "./student.routes";

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
  LearningAccessManagementScreen,
  LearningPlatformAdminsScreen,
  LearningStaffScreen,
  LearningCoursesListScreen,
}) {
  return [
    {
      path: "/learning/:realmSlug",
      element: <LearningLayout />,
      children: [
        // -- Portal home --
        {
          index: true,
          element: <LearningHomeRoute Screen={LearningHomeScreen} />,
        },

        // -- Shared course / lesson / assignment routes --
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

        // -- Administration --
        adminRoutes({
          LearningAdminDashboardScreen,
          LearningOrganizationScreen,
          LearningCourseRosterScreen,
          LearningAccessManagementScreen,
          LearningPlatformAdminsScreen,
          LearningStaffScreen,
          LearningCoursesListScreen,
        }),

        // -- Staff / Teachers --
        teacherRoutes({
          LearningTeacherDashboardScreen,
          LearningTeacherCourseScreen,
          LearningSubmissionReviewScreen,
        }),

        // -- Parents --
        parentRoutes({
          LearningParentDashboardScreen,
          LearningObservedStudentScreen,
        }),

        // -- Students --
        studentRoutes({
          LearningStudentDashboardScreen,
          LearningStudentCourseScreen,
        }),
      ],
    },
  ];
}

export default learningProtectedRoutes;
