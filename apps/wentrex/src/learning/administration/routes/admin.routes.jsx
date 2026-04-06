import React from "react";
import AdminLayout from "@/learning/administration/layout/AdminLayout";
import { ScreenRoute, getCourseId, getOrganizationId } from "./routeWrappers";

export function adminRoutes({
  LearningAdminDashboardScreen,
  LearningOrganizationScreen,
  LearningCourseRosterScreen,
  LearningCoursesListScreen,
  LearningAccessManagementScreen,
  LearningPlatformAdminsScreen,
  LearningStaffScreen,
}) {
  return {
    path: "admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: (
          <ScreenRoute
            Screen={LearningAdminDashboardScreen}
            buildProps={({ navigate, params }) => ({
              onOpenStudentDashboard: () => navigate(`/learning/${params.realmSlug}/student`),
              onOpenParentDashboard: () => navigate(`/learning/${params.realmSlug}/parent`),
              onOpenTeacherDashboard: () => navigate(`/learning/${params.realmSlug}/teacher`),
              onOpenOrganization: (item) => {
                const organizationId = getOrganizationId(item);
                if (organizationId) {
                  navigate(`/learning/${params.realmSlug}/admin/organizations/${organizationId}`);
                }
              },
              onOpenCourseRoster: (item) => {
                const courseId = getCourseId(item);
                if (courseId) {
                  navigate(`/learning/${params.realmSlug}/admin/courses/${courseId}/roster`);
                }
              },
              onOpenAccessManagement: () => navigate(`/learning/${params.realmSlug}/admin/access`),
              onOpenPlatformAdmins: () => navigate(`/learning/${params.realmSlug}/admin/platform-admins`),
            })}
          />
        ),
      },
      {
        path: "organizations/:organizationId",
        element: (
          <ScreenRoute
            Screen={LearningOrganizationScreen}
            buildProps={({ navigate, params }) => ({
              onBack: () => navigate(`/learning/${params.realmSlug}/admin`),
              onOpenCourseRoster: (item) => {
                const courseId = getCourseId(item);
                if (courseId) {
                  navigate(`/learning/${params.realmSlug}/admin/courses/${courseId}/roster`);
                }
              },
            })}
          />
        ),
      },
      {
        path: "courses",
        element: (
          <ScreenRoute
            Screen={LearningCoursesListScreen}
            buildProps={({ navigate, params }) => ({
              onBack: () => navigate(`/learning/${params.realmSlug}/admin`),
              onOpenCourseRoster: (item) => {
                const courseId = getCourseId(item);
                if (courseId) {
                  navigate(`/learning/${params.realmSlug}/admin/courses/${courseId}/roster`);
                }
              },
            })}
          />
        ),
      },
      {
        path: "courses/:courseId/roster",
        element: (
          <ScreenRoute
            Screen={LearningCourseRosterScreen}
            buildProps={({ navigate }) => ({
              onBack: () => navigate(-1),
            })}
          />
        ),
      },
      {
        path: "access",
        element: (
          <ScreenRoute
            Screen={LearningAccessManagementScreen}
            buildProps={({ navigate, params }) => ({
              onBack: () => navigate(`/learning/${params.realmSlug}/admin`),
            })}
          />
        ),
      },
      {
        path: "platform-admins",
        element: (
          <ScreenRoute
            Screen={LearningPlatformAdminsScreen}
            buildProps={({ navigate, params }) => ({
              onBack: () => navigate(`/learning/${params.realmSlug}/admin`),
            })}
          />
        ),
      },
      {
        path: "staff",
        element: (
          <ScreenRoute
            Screen={LearningStaffScreen}
            buildProps={({ navigate, params }) => ({
              onBack: () => navigate(`/learning/${params.realmSlug}/admin`),
            })}
          />
        ),
      },
    ],
  };
}
