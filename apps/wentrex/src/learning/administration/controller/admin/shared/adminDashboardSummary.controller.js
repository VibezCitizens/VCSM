import {
  ADMIN_ROLES,
  TEACHING_ROLES,
  OBSERVER_ROLES,
} from "@/learning/administration/controller/admin/shared/adminRoles.controller";

export function buildCourseMembershipSummary(membershipRows = []) {
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

export function buildOrganizationCourseSummary(courseEntries = []) {
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

export function buildDashboardSummary(organizationEntries = []) {
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
