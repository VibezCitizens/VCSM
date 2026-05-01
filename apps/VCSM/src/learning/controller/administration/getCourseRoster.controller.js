import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getOrganizationByIdDal } from "@/learning/dal/organizations/getOrganizationById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listCourseMembershipsByCourseIdDal } from "@/learning/dal/memberships/listCourseMembershipsByCourseId.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapOrganization } from "@/learning/model/organization.model";
import { mapMembership, mapMemberships } from "@/learning/model/membership.model";
import {
  ADMIN_ROLES,
  canManageCourse,
  getOrganizationMembershipRow,
  isPlatformAdmin,
  OBSERVER_ROLES,
  TEACHING_ROLES,
} from "@/learning/controller/administration/adminAccess.controller";

async function listObserverLinksByCourseId({ supabase, courseId }) {
  const { data, error } = await supabase
    .schema("learning")
    .from("observer_student_links")
    .select(`
      id,
      course_id,
      observer_actor_id,
      student_actor_id,
      created_at
    `)
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
      return [];
    }

    throw error;
  }

  return data ?? [];
}

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

function buildRosterItems(membershipRows = [], linkRows = []) {
  const observerLinksByActorId = new Map();
  const studentLinksByActorId = new Map();

  for (const linkRow of linkRows) {
    if (!observerLinksByActorId.has(linkRow.observer_actor_id)) {
      observerLinksByActorId.set(linkRow.observer_actor_id, []);
    }

    if (!studentLinksByActorId.has(linkRow.student_actor_id)) {
      studentLinksByActorId.set(linkRow.student_actor_id, []);
    }

    observerLinksByActorId.get(linkRow.observer_actor_id).push({
      id: linkRow.id,
      courseId: linkRow.course_id,
      observerActorId: linkRow.observer_actor_id,
      studentActorId: linkRow.student_actor_id,
      createdAt: linkRow.created_at ?? null,
    });

    studentLinksByActorId.get(linkRow.student_actor_id).push({
      id: linkRow.id,
      courseId: linkRow.course_id,
      observerActorId: linkRow.observer_actor_id,
      studentActorId: linkRow.student_actor_id,
      createdAt: linkRow.created_at ?? null,
    });
  }

  const items = membershipRows.map((membershipRow) => ({
    ...mapMembership(membershipRow),
    linkedStudents: observerLinksByActorId.get(membershipRow.actor_id) ?? [],
    linkedObservers: studentLinksByActorId.get(membershipRow.actor_id) ?? [],
  }));

  return {
    students: items.filter((item) => item.role === "student"),
    teachers: items.filter((item) => TEACHING_ROLES.has(item.role)),
    observers: items.filter((item) => OBSERVER_ROLES.has(item.role)),
    admins: items.filter((item) => ADMIN_ROLES.has(item.role)),
    other: items.filter(
      (item) =>
        item.role !== "student" &&
        !TEACHING_ROLES.has(item.role) &&
        !OBSERVER_ROLES.has(item.role) &&
        !ADMIN_ROLES.has(item.role),
    ),
    all: items,
  };
}

export async function getCourseRosterController({
  supabase,
  actorId,
  realmId,
  courseId,
}) {
  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  const organizationRow = await getOrganizationByIdDal({
    supabase,
    organizationId: courseRow.organization_id,
  });

  const [courseMembershipRow, organizationMembershipRow, membershipRows, linkRows, isPlatformAdminActor] =
    await Promise.all([
      getCourseMembershipByActorDal({
        supabase,
        courseId,
        actorId,
      }),
      getOrganizationMembershipRow({
        supabase,
        organizationId: courseRow.organization_id,
        actorId,
      }),
      listCourseMembershipsByCourseIdDal({
        supabase,
        courseId,
      }),
      listObserverLinksByCourseId({
        supabase,
        courseId,
      }),
      isPlatformAdmin({
        supabase,
        actorId,
      }),
    ]);

  if (
    !canManageCourse({
      actorId,
      courseRow,
      courseMembershipRow,
      organizationRow,
      organizationMembershipRow,
      isPlatformAdminActor,
    })
  ) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const roster = buildRosterItems(membershipRows, linkRows);

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      organization: mapOrganization(organizationRow),
      actorMembership: mapMembership(courseMembershipRow),
      memberships: mapMemberships(membershipRows),
      summary: {
        ...buildMembershipSummary(membershipRows),
        observerLinkCount: linkRows.length,
      },
      roster,
      observerLinks: linkRows.map((linkRow) => ({
        id: linkRow.id,
        courseId: linkRow.course_id,
        observerActorId: linkRow.observer_actor_id,
        studentActorId: linkRow.student_actor_id,
        createdAt: linkRow.created_at ?? null,
      })),
    },
  };
}

export default getCourseRosterController;
