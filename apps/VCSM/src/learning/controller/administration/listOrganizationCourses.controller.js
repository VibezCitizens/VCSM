import { getOrganizationByIdDal } from "@/learning/dal/organizations/getOrganizationById.dal";
import { listCoursesByOrganizationIdDal } from "@/learning/dal/courses/listCoursesByOrganizationId.dal";
import { listCourseMembershipsByCourseIdDal } from "@/learning/dal/memberships/listCourseMembershipsByCourseId.dal";

import { mapOrganization } from "@/learning/model/organization.model";
import { mapCourse } from "@/learning/model/course.model";
import {
  ADMIN_ROLES,
  canManageOrganization,
  getOrganizationMembershipRow,
  isPlatformAdmin,
  OBSERVER_ROLES,
  TEACHING_ROLES,
} from "@/learning/controller/administration/adminAccess.controller";

function buildMembershipSummary(membershipRows = []) {
  const summary = {
    totalMembers: membershipRows.length,
    activeMembers: 0,
    invitedMembers: 0,
    completedMembers: 0,
    droppedMembers: 0,
    removedMembers: 0,
    studentCount: 0,
    teacherCount: 0,
    observerCount: 0,
    adminCount: 0,
    otherCount: 0,
  };

  for (const membershipRow of membershipRows) {
    if (membershipRow.status === "active") summary.activeMembers += 1;
    if (membershipRow.status === "invited") summary.invitedMembers += 1;
    if (membershipRow.status === "completed") summary.completedMembers += 1;
    if (membershipRow.status === "dropped") summary.droppedMembers += 1;
    if (membershipRow.status === "removed") summary.removedMembers += 1;

    if (membershipRow.role === "student") {
      summary.studentCount += 1;
      continue;
    }

    if (TEACHING_ROLES.has(membershipRow.role)) {
      summary.teacherCount += 1;
      continue;
    }

    if (OBSERVER_ROLES.has(membershipRow.role)) {
      summary.observerCount += 1;
      continue;
    }

    if (ADMIN_ROLES.has(membershipRow.role)) {
      summary.adminCount += 1;
      continue;
    }

    summary.otherCount += 1;
  }

  return summary;
}

function buildCourseStatusSummary(items = []) {
  const summary = {
    totalCourses: items.length,
    activeCourses: 0,
    draftCourses: 0,
    archivedCourses: 0,
    totalMembers: 0,
    studentCount: 0,
    teacherCount: 0,
    observerCount: 0,
    adminCount: 0,
  };

  for (const item of items) {
    if (item.course.status === "active" || item.course.status === "published") {
      summary.activeCourses += 1;
    } else if (item.course.status === "archived") {
      summary.archivedCourses += 1;
    } else {
      summary.draftCourses += 1;
    }

    summary.totalMembers += item.summary.totalMembers;
    summary.studentCount += item.summary.studentCount;
    summary.teacherCount += item.summary.teacherCount;
    summary.observerCount += item.summary.observerCount;
    summary.adminCount += item.summary.adminCount;
  }

  return summary;
}

export async function listOrganizationCoursesController({
  supabase,
  actorId,
  realmId,
  organizationId,
  includeArchived = true,
  includeDrafts = true,
}) {
  const organizationRow = await getOrganizationByIdDal({
    supabase,
    organizationId,
  });

  if (!organizationRow || organizationRow.realm_id !== realmId) {
    return { ok: false, error: { code: "ORGANIZATION_NOT_FOUND" } };
  }

  const [organizationMembershipRow, isPlatformAdminActor] = await Promise.all([
    getOrganizationMembershipRow({
      supabase,
      organizationId,
      actorId,
    }),
    isPlatformAdmin({
      supabase,
      actorId,
    }),
  ]);

  if (
    !canManageOrganization({
      actorId,
      organizationRow,
      organizationMembershipRow,
      isPlatformAdminActor,
    })
  ) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const courseRows = await listCoursesByOrganizationIdDal({
    supabase,
    organizationId,
    includeArchived,
    includeDrafts,
  });

  const items = await Promise.all(
    courseRows.map(async (courseRow) => {
      const membershipRows = await listCourseMembershipsByCourseIdDal({
        supabase,
        courseId: courseRow.id,
      });

      return {
        course: mapCourse(courseRow),
        summary: buildMembershipSummary(membershipRows),
      };
    }),
  );

  items.sort((left, right) => {
    const leftDate =
      left?.course?.publishedAt ?? left?.course?.updatedAt ?? left?.course?.createdAt ?? "";
    const rightDate =
      right?.course?.publishedAt ?? right?.course?.updatedAt ?? right?.course?.createdAt ?? "";

    return String(rightDate).localeCompare(String(leftDate));
  });

  return {
    ok: true,
    data: {
      organization: mapOrganization(organizationRow),
      summary: buildCourseStatusSummary(items),
      courses: items,
    },
  };
}

export default listOrganizationCoursesController;
