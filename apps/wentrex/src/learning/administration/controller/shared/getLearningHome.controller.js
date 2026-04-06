import { getLearningRealmByIdDal } from "@/learning/administration/dal/realms/getLearningRealmById.dal";
import { listOrganizationsByRealmIdDal } from "@/learning/administration/dal/organizations/listOrganizationsByRealmId.dal";
import { listCoursesByActorIdDal } from "@/learning/administration/dal/courses/listCoursesByActorId.dal";
import { listCoursesByRealmIdDal } from "@/learning/administration/dal/courses/listCoursesByRealmId.dal";
import { getCourseMembershipByActorDal } from "@/learning/administration/dal/memberships/getCourseMembershipByActor.dal";

import { mapRealm } from "@/learning/administration/model/realm.model";
import { mapOrganizations } from "@/learning/administration/model/organization.model";
import { mapCourse } from "@/learning/administration/model/course.model";
import { mapMembership } from "@/learning/administration/model/membership.model";
import {
  createLearningError,
  withLearningErrorContext,
} from "@/learning/administration/utils/realmDebug";

function buildRoleBuckets(entries = []) {
  const buckets = {
    student: [],
    teacher: [],
    parent: [],
    administration: [],
    other: [],
  };

  for (const entry of entries) {
    const role = entry?.membership?.role;

    if (role === "student") {
      buckets.student.push(entry);
      continue;
    }

    if (["teacher", "instructor", "ta", "grader"].includes(role)) {
      buckets.teacher.push(entry);
      continue;
    }

    if (["parent", "observer"].includes(role)) {
      buckets.parent.push(entry);
      continue;
    }

    if (["admin", "owner", "staff"].includes(role)) {
      buckets.administration.push(entry);
      continue;
    }

    buckets.other.push(entry);
  }

  return buckets;
}

function buildSummary(entries = []) {
  const summary = {
    totalCourses: entries.length,
    activeCourses: 0,
    completedCourses: 0,
    invitedCourses: 0,
    droppedCourses: 0,
    removedCourses: 0,
    roleCounts: {
      student: 0,
      teacher: 0,
      parent: 0,
      administration: 0,
      other: 0,
    },
  };

  for (const entry of entries) {
    const status = entry?.membership?.status;
    const role = entry?.membership?.role;

    if (status === "active") summary.activeCourses += 1;
    if (status === "completed") summary.completedCourses += 1;
    if (status === "invited") summary.invitedCourses += 1;
    if (status === "dropped") summary.droppedCourses += 1;
    if (status === "removed") summary.removedCourses += 1;

    if (role === "student") {
      summary.roleCounts.student += 1;
      continue;
    }

    if (["teacher", "instructor", "ta", "grader"].includes(role)) {
      summary.roleCounts.teacher += 1;
      continue;
    }

    if (["parent", "observer"].includes(role)) {
      summary.roleCounts.parent += 1;
      continue;
    }

    if (["admin", "owner", "staff"].includes(role)) {
      summary.roleCounts.administration += 1;
      continue;
    }

    summary.roleCounts.other += 1;
  }

  return summary;
}

function sortEntries(entries = []) {
  return [...entries].sort((left, right) => {
    const leftStatus = left?.membership?.status === "active" ? 1 : 0;
    const rightStatus = right?.membership?.status === "active" ? 1 : 0;

    if (leftStatus !== rightStatus) {
      return rightStatus - leftStatus;
    }

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
}

export async function getLearningHomeController({
  supabase,
  actorId,
  realmId,
}) {
  try {
    const [realmRow, organizationRows, courseRows, realmCourseRows] = await Promise.all([
      getLearningRealmByIdDal({ supabase, realmId }),
      listOrganizationsByRealmIdDal({
        supabase,
        realmId,
        includeInactive: false,
      }),
      listCoursesByActorIdDal({
        supabase,
        actorId,
        realmId,
      }),
      listCoursesByRealmIdDal({
        supabase,
        realmId,
        includeArchived: false,
        includeDrafts: false,
      }),
    ]);

    if (!realmRow || !realmRow.is_active) {
      return {
        ok: false,
        error: createLearningError({
          code: "REALM_NOT_FOUND",
          message: "Learning realm was not found",
          context: {
            layer: "controller",
            scope: "getLearningHomeController",
            actorId,
            realmId,
            resolvedRealmId: realmRow?.id ?? null,
            isActive: realmRow?.is_active ?? null,
          },
          trace: [
            {
              scope: "getLearningHomeController",
              layer: "controller",
              actorId,
              realmId,
            },
          ],
        }),
      };
    }

    const membershipRows = await Promise.all(
      courseRows.map((courseRow) =>
        getCourseMembershipByActorDal({
          supabase,
          courseId: courseRow.id,
          actorId,
        }),
      ),
    );

    const entries = courseRows
      .map((courseRow, index) => {
        const membershipRow = membershipRows[index];

        if (!membershipRow) {
          return null;
        }

        return {
          id: courseRow.id,
          role: membershipRow.role,
          status: membershipRow.status,
          course: mapCourse(courseRow),
          membership: mapMembership(membershipRow),
        };
      })
      .filter(Boolean);

    const sortedEntries = sortEntries(entries);
    const buckets = buildRoleBuckets(sortedEntries);

    return {
      ok: true,
      data: {
        realm: mapRealm(realmRow),
        organizations: mapOrganizations(organizationRows),
        summary: {
          ...buildSummary(sortedEntries),
          totalAvailableCourses: realmCourseRows.length,
        },

        courses: sortedEntries.map((entry) => ({
          ...entry.course,
          membership: entry.membership,
          role: entry.role,
          status: entry.status,
        })),

        memberships: sortedEntries.map((entry) => entry.membership),

        groupedCourses: {
          student: buckets.student.map((entry) => ({
            ...entry.course,
            membership: entry.membership,
            role: entry.role,
            status: entry.status,
          })),
          teacher: buckets.teacher.map((entry) => ({
            ...entry.course,
            membership: entry.membership,
            role: entry.role,
            status: entry.status,
          })),
          parent: buckets.parent.map((entry) => ({
            ...entry.course,
            membership: entry.membership,
            role: entry.role,
            status: entry.status,
          })),
          administration: buckets.administration.map((entry) => ({
            ...entry.course,
            membership: entry.membership,
            role: entry.role,
            status: entry.status,
          })),
          other: buckets.other.map((entry) => ({
            ...entry.course,
            membership: entry.membership,
            role: entry.role,
            status: entry.status,
          })),
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: withLearningErrorContext(error, {
        scope: "getLearningHomeController",
        code: "LEARNING_HOME_LOAD_FAILED",
        context: {
          layer: "controller",
          actorId,
          realmId,
        },
      }),
    };
  }
}

export default getLearningHomeController;
