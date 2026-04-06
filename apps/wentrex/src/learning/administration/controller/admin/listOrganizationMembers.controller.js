import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import { listCoursesByOrganizationIdDal } from "@/learning/administration/dal/courses/listCoursesByOrganizationId.dal";
import { listCourseMembershipsByCourseIdDal } from "@/learning/administration/dal/memberships/listCourseMembershipsByCourseId.dal";

import { mapOrganization } from "@/learning/administration/model/organization.model";
import { mapCourse } from "@/learning/administration/model/course.model";
import { mapMembership } from "@/learning/administration/model/membership.model";
import {
  ADMIN_ROLES,
  canManageOrganization,
  getOrganizationMembershipRow,
  isAdminAuthorized,
  listOrganizationMembershipRows,
  OBSERVER_ROLES,
  TEACHING_ROLES,
} from "@/learning/administration/controller/admin/adminAccess";
import { hydrateOrganizationMemberProfiles } from "@/learning/administration/controller/admin/organizationMemberDirectory.controller";

function createEmptyCounts() {
  return {
    total: 0,
    active: 0,
    invited: 0,
    completed: 0,
    dropped: 0,
    removed: 0,
    student: 0,
    teacher: 0,
    observer: 0,
    admin: 0,
    other: 0,
  };
}

function applyMembershipToCounts(counts, membershipRow) {
  counts.total += 1;

  if (membershipRow.status === "active") counts.active += 1;
  if (membershipRow.status === "invited") counts.invited += 1;
  if (membershipRow.status === "completed") counts.completed += 1;
  if (membershipRow.status === "dropped") counts.dropped += 1;
  if (membershipRow.status === "removed") counts.removed += 1;

  if (membershipRow.role === "student") {
    counts.student += 1;
    return;
  }

  if (TEACHING_ROLES.has(membershipRow.role)) {
    counts.teacher += 1;
    return;
  }

  if (OBSERVER_ROLES.has(membershipRow.role)) {
    counts.observer += 1;
    return;
  }

  if (ADMIN_ROLES.has(membershipRow.role)) {
    counts.admin += 1;
    return;
  }

  counts.other += 1;
}

function buildOrganizationMemberSummary(memberItems = []) {
  const summary = {
    totalMembers: memberItems.length,
    orgAdminCount: 0,
    studentCount: 0,
    teacherCount: 0,
    observerCount: 0,
    adminCount: 0,
    activeMembers: 0,
    invitedMembers: 0,
    completedMembers: 0,
    droppedMembers: 0,
    removedMembers: 0,
  };

  for (const item of memberItems) {
    const organizationMembership = item.organizationMembership;
    const courseCounts = item.courseMembershipCounts;

    if (organizationMembership) {
      if (organizationMembership.status === "active") summary.activeMembers += 1;
      if (organizationMembership.status === "invited") summary.invitedMembers += 1;
      if (organizationMembership.status === "completed") summary.completedMembers += 1;
      if (organizationMembership.status === "dropped") summary.droppedMembers += 1;
      if (organizationMembership.status === "removed") summary.removedMembers += 1;

      if (ADMIN_ROLES.has(organizationMembership.role)) {
        summary.orgAdminCount += 1;
      }
    }

    if (courseCounts.student > 0) summary.studentCount += 1;
    if (courseCounts.teacher > 0) summary.teacherCount += 1;
    if (courseCounts.observer > 0) summary.observerCount += 1;
    if (courseCounts.admin > 0) summary.adminCount += 1;
  }

  return summary;
}

export async function listOrganizationMembersController({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
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
    isAdminAuthorized({
      supabase,
      userId,
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

  const [organizationMembershipRows, courseRows] = await Promise.all([
    listOrganizationMembershipRows({
      supabase,
      organizationId,
    }),
    listCoursesByOrganizationIdDal({
      supabase,
      organizationId,
      includeArchived: true,
      includeDrafts: true,
    }),
  ]);

  const membershipGroups = new Map();

  for (const orgMembershipRow of organizationMembershipRows) {
    membershipGroups.set(orgMembershipRow.actor_id, {
      actorId: orgMembershipRow.actor_id,
      organizationMembership: {
        id: orgMembershipRow.id,
        organizationId: orgMembershipRow.organization_id,
        actorId: orgMembershipRow.actor_id,
        role: orgMembershipRow.role,
        status: orgMembershipRow.status,
        createdByActorId: orgMembershipRow.created_by_actor_id,
        createdAt: orgMembershipRow.created_at,
      },
      courseMemberships: [],
      courses: [],
      courseMembershipCounts: createEmptyCounts(),
    });
  }

  if (
    organizationRow.owner_actor_id &&
    !membershipGroups.has(organizationRow.owner_actor_id)
  ) {
    membershipGroups.set(organizationRow.owner_actor_id, {
      actorId: organizationRow.owner_actor_id,
      organizationMembership: {
        id: `owner:${organizationRow.id}:${organizationRow.owner_actor_id}`,
        organizationId: organizationRow.id,
        actorId: organizationRow.owner_actor_id,
        role: "owner",
        status: "active",
        createdByActorId: organizationRow.owner_actor_id,
        createdAt: organizationRow.created_at,
      },
      courseMemberships: [],
      courses: [],
      courseMembershipCounts: createEmptyCounts(),
    });
  }

  const courseMembershipGroups = await Promise.all(
    courseRows.map(async (courseRow) => ({
      course: mapCourse(courseRow),
      memberships: await listCourseMembershipsByCourseIdDal({
        supabase,
        courseId: courseRow.id,
      }),
    })),
  );

  for (const courseEntry of courseMembershipGroups) {
    for (const membershipRow of courseEntry.memberships) {
      if (!membershipGroups.has(membershipRow.actor_id)) {
        membershipGroups.set(membershipRow.actor_id, {
          actorId: membershipRow.actor_id,
          organizationMembership: null,
          courseMemberships: [],
          courses: [],
          courseMembershipCounts: createEmptyCounts(),
        });
      }

      const item = membershipGroups.get(membershipRow.actor_id);

      item.courseMemberships.push({
        ...mapMembership(membershipRow),
        course: courseEntry.course,
      });

      item.courses.push(courseEntry.course);
      applyMembershipToCounts(item.courseMembershipCounts, membershipRow);
    }
  }

  const members = Array.from(membershipGroups.values())
    .map((item) => item);

  const profilesByActorId = await hydrateOrganizationMemberProfiles({
    supabase,
    actorIds: members.map((item) => item.actorId),
  });

  const mappedMembers = members
    .map((item) => ({
      actorId: item.actorId,
      profile: profilesByActorId.get(item.actorId) ?? null,
      organizationMembership: item.organizationMembership,
      courseMembershipCounts: item.courseMembershipCounts,
      courseMemberships: item.courseMemberships.sort((left, right) => {
        const leftDate =
          left?.course?.publishedAt ?? left?.course?.updatedAt ?? left?.course?.createdAt ?? "";
        const rightDate =
          right?.course?.publishedAt ?? right?.course?.updatedAt ?? right?.course?.createdAt ?? "";

        return String(rightDate).localeCompare(String(leftDate));
      }),
      courses: item.courses,
    }))
    .sort((left, right) => {
      const leftDisplayName = left?.profile?.displayName?.toLowerCase() ?? "\uffff";
      const rightDisplayName = right?.profile?.displayName?.toLowerCase() ?? "\uffff";

      if (leftDisplayName !== rightDisplayName) {
        return leftDisplayName.localeCompare(rightDisplayName);
      }

      const leftUsername = left?.profile?.username?.toLowerCase() ?? "\uffff";
      const rightUsername = right?.profile?.username?.toLowerCase() ?? "\uffff";

      if (leftUsername !== rightUsername) {
        return leftUsername.localeCompare(rightUsername);
      }

      const leftCreatedAt = left?.organizationMembership?.createdAt ?? "";
      const rightCreatedAt = right?.organizationMembership?.createdAt ?? "";

      return String(rightCreatedAt).localeCompare(String(leftCreatedAt));
    });

  return {
    ok: true,
    data: {
      organization: mapOrganization(organizationRow),
      summary: buildOrganizationMemberSummary(mappedMembers),
      members: mappedMembers,
    },
  };
}

export default listOrganizationMembersController;
