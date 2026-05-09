import { listAllRealmsDal } from "@/learning/dal/realms/listAllRealms.dal";
import { listAllOrganizationSummariesDal } from "@/learning/dal/organizations/listAllOrganizationSummaries.dal";
import { listAllCourseSummariesDal } from "@/learning/dal/courses/listAllCourseSummaries.dal";
import { mapRealms } from "@/learning/model/realm.model";
import { isAdminAuthorized } from "@/learning/admin/controller/adminAccess";

export async function listTenantsController({ supabase, userId, actorId }) {
  const isAdmin = await isAdminAuthorized({ supabase, userId, actorId });

  if (!isAdmin) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const realmRows = await listAllRealmsDal({ supabase, userId });

  const [orgRows, courseRows] = await Promise.all([
    listAllOrganizationSummariesDal({ supabase }),
    listAllCourseSummariesDal({ supabase }),
  ]);

  const orgsByRealm = {};
  for (const org of orgRows) {
    if (!orgsByRealm[org.realm_id]) orgsByRealm[org.realm_id] = [];
    orgsByRealm[org.realm_id].push(org);
  }

  const coursesByRealm = {};
  for (const course of courseRows) {
    if (!coursesByRealm[course.realm_id]) coursesByRealm[course.realm_id] = [];
    coursesByRealm[course.realm_id].push(course);
  }

  const tenants = mapRealms(realmRows).map((realm) => {
    const realmOrgs = orgsByRealm[realm.id] ?? [];
    const realmCourses = coursesByRealm[realm.id] ?? [];

    return {
      ...realm,
      organizationCount: realmOrgs.length,
      totalCourses: realmCourses.length,
      activeCourses: realmCourses.filter((c) => c.status === "published" || c.status === "active").length,
    };
  });

  return {
    ok: true,
    data: {
      tenants,
      totalCount: tenants.length,
      activeCount: tenants.filter((t) => t.isActive).length,
    },
  };
}

export default listTenantsController;
