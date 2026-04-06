import { getLearningRealmByIdDal } from "@/learning/administration/dal/realms/getLearningRealmById.dal";
import { listOrganizationsByRealmIdDal } from "@/learning/administration/dal/organizations/listOrganizationsByRealmId.dal";
import { listCoursesByOrganizationIdDal } from "@/learning/administration/dal/courses/listCoursesByOrganizationId.dal";
import { listCourseMembershipsByCourseIdDal } from "@/learning/administration/dal/memberships/listCourseMembershipsByCourseId.dal";

import { mapRealm } from "@/learning/administration/model/realm.model";
import { mapOrganizations } from "@/learning/administration/model/organization.model";
import { mapCourse } from "@/learning/administration/model/course.model";
import { mapMemberships } from "@/learning/administration/model/membership.model";

import { getRealmAdministrationAccess } from "@/learning/administration/controller/admin/shared/getRealmAdministrationAccess.controller";
import {
  buildCourseMembershipSummary,
  buildOrganizationCourseSummary,
  buildDashboardSummary,
} from "@/learning/administration/controller/admin/shared/adminDashboardSummary.controller";

export async function getAdminDashboardController({
  supabase,
  userId,
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

  const access = await getRealmAdministrationAccess({
    supabase,
    userId,
    actorId,
    organizations: organizationRows,
  });

  if (!access.allowed) {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message:
          "This actor is not a platform admin, organization owner, or active organization admin in the current learning realm.",
        details: {
          actorId,
          realmId,
          isPlatformAdminActor: access.isPlatformAdminActor,
          organizationCount: organizationRows.length,
          ownedOrganizationIds: access.ownedOrganizationIds,
          adminMemberships: access.adminMemberships,
          organizationsInRealm: organizationRows.map((organizationRow) => ({
            id: organizationRow.id,
            name: organizationRow.name ?? null,
            slug: organizationRow.slug ?? null,
            ownerActorId: organizationRow.owner_actor_id ?? null,
          })),
          requiredAccess:
            "platform admin, organization owner, or organization membership role in admin/owner/staff with visible status",
        },
      },
    };
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
