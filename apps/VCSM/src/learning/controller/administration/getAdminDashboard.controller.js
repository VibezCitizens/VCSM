import { getLearningRealmByIdDal } from "@/learning/dal/realms/getLearningRealmById.dal";
import { listOrganizationsByRealmIdDal } from "@/learning/dal/organizations/listOrganizationsByRealmId.dal";
import { listCoursesByOrganizationIdDal } from "@/learning/dal/courses/listCoursesByOrganizationId.dal";
import { listCourseMembershipsByCourseIdDal } from "@/learning/dal/memberships/listCourseMembershipsByCourseId.dal";

import { mapRealm } from "@/learning/model/realm.model";
import { mapOrganizations } from "@/learning/model/organization.model";
import { mapCourse } from "@/learning/model/course.model";
import { mapMemberships } from "@/learning/model/membership.model";
import {
  ADMIN_ROLES,
  hasActiveAdminRole,
  isPlatformAdmin,
  listOrganizationMembershipRows,
  OBSERVER_ROLES,
  TEACHING_ROLES,
} from "@/learning/controller/administration/adminAccess.controller";

function buildOrganizationCourseSummary(courseEntries = []) {
  const summary = {
    totalCourses: courseEntries.length,
    activeCourses: 0,
    draftCourses: 0,
    archivedCourses: 0,
    totalMembers: 0,
    studentCount: 0,
    teacherCount: 0,
    observerCount: 0,
    adminCount: 0,
  };

  for (const entry of courseEntries) {
    const courseStatus = entry?.course?.status;

    if (courseStatus === "active" || courseStatus === "published") {
      summary.activeCourses += 1;
    } else if (courseStatus === "archived") {
      summary.archivedCourses += 1;
    } else {
      summary.draftCourses += 1;
    }

    summary.totalMembers += entry.summary.totalMembers;
    summary.studentCount += entry.summary.studentCount;
    summary.teacherCount += entry.summary.teacherCount;
    summary.observerCount += entry.summary.observerCount;
    summary.adminCount += entry.summary.adminCount;
  }

  return summary;
}

function buildCourseMembershipSummary(membershipRows = []) {
  const summary = {
    totalMembers: 0,
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
    summary.totalMembers += 1;

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

function buildDashboardSummary(organizationEntries = []) {
  const summary = {
    organizationCount: organizationEntries.length,
    activeOrganizationCount: 0,
    inactiveOrganizationCount: 0,
    totalCourses: 0,
    activeCourses: 0,
    draftCourses: 0,
    archivedCourses: 0,
    totalMembers: 0,
    studentCount: 0,
    teacherCount: 0,
    observerCount: 0,
    adminCount: 0,
  };

  for (const organizationEntry of organizationEntries) {
    if (organizationEntry.organization?.isActive) {
      summary.activeOrganizationCount += 1;
    } else {
      summary.inactiveOrganizationCount += 1;
    }

    summary.totalCourses += organizationEntry.summary.totalCourses;
    summary.activeCourses += organizationEntry.summary.activeCourses;
    summary.draftCourses += organizationEntry.summary.draftCourses;
    summary.archivedCourses += organizationEntry.summary.archivedCourses;
    summary.totalMembers += organizationEntry.summary.totalMembers;
    summary.studentCount += organizationEntry.summary.studentCount;
    summary.teacherCount += organizationEntry.summary.teacherCount;
    summary.observerCount += organizationEntry.summary.observerCount;
    summary.adminCount += organizationEntry.summary.adminCount;
  }

  return summary;
}

async function isRealmAdministrator({ supabase, actorId, organizations = [] }) {
  if (!actorId) return false;

  if (await isPlatformAdmin({ supabase, actorId })) {
    return true;
  }

  if (organizations.some((organizationRow) => organizationRow.owner_actor_id === actorId)) {
    return true;
  }

  for (const organizationRow of organizations) {
    const membershipRows = await listOrganizationMembershipRows({
      supabase,
      organizationId: organizationRow.id,
    });

    const adminMembership = membershipRows.find(
      (membershipRow) =>
        membershipRow.actor_id === actorId &&
        hasActiveAdminRole(membershipRow),
    );

    if (adminMembership) {
      return true;
    }
  }

  return false;
}

export async function getAdminDashboardController({
  supabase,
  actorId,
  realmId,
}) {
  const [realmRow, organizationRows] = await Promise.all([
    getLearningRealmByIdDal({ supabase, realmId }),
    listOrganizationsByRealmIdDal({
      supabase,
      realmId,
      includeInactive: true,
    }),
  ]);

  if (!realmRow || !realmRow.is_active) {
    return { ok: false, error: { code: "REALM_NOT_FOUND" } };
  }

  const isAdmin = await isRealmAdministrator({
    supabase,
    actorId,
    organizations: organizationRows,
  });

  if (!isAdmin) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const organizationEntries = await Promise.all(
    organizationRows.map(async (organizationRow) => {
      const courseRows = await listCoursesByOrganizationIdDal({
        supabase,
        organizationId: organizationRow.id,
        includeArchived: true,
        includeDrafts: true,
      });

      const courseEntries = await Promise.all(
        courseRows.map(async (courseRow) => {
          const membershipRows = await listCourseMembershipsByCourseIdDal({
            supabase,
            courseId: courseRow.id,
          });

          return {
            course: mapCourse(courseRow),
            memberships: mapMemberships(membershipRows),
            summary: buildCourseMembershipSummary(membershipRows),
          };
        }),
      );

      courseEntries.sort((left, right) => {
        const leftDate =
          left?.course?.publishedAt ??
          left?.course?.updatedAt ??
          left?.course?.createdAt ??
          "";
        const rightDate =
          right?.course?.publishedAt ??
          right?.course?.updatedAt ??
          right?.course?.createdAt ??
          "";

        return String(rightDate).localeCompare(String(leftDate));
      });

      return {
        organization: {
          ...mapOrganizations([organizationRow])[0],
          isOwner: organizationRow.owner_actor_id === actorId,
        },
        courses: courseEntries,
        summary: buildOrganizationCourseSummary(courseEntries),
      };
    }),
  );

  organizationEntries.sort((left, right) =>
    String(left?.organization?.name ?? "").localeCompare(
      String(right?.organization?.name ?? ""),
    ),
  );

  return {
    ok: true,
    data: {
      realm: mapRealm(realmRow),
      organizations: organizationEntries,
      summary: buildDashboardSummary(organizationEntries),
    },
  };
}

export default getAdminDashboardController;
