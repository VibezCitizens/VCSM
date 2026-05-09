import { listAllRealmsDal } from "@/superadmin/dal/listAllRealms.dal";
import { listAllOrganizationSummariesDal } from "@/superadmin/dal/listAllOrganizationSummaries.dal";
import { listAllCourseSummariesDal } from "@/superadmin/dal/listAllCourseSummaries.dal";

function groupBy(rows, key) {
  const map = {};
  for (const row of rows) {
    const k = row[key];
    if (!map[k]) map[k] = [];
    map[k].push(row);
  }
  return map;
}

export async function listTenantsController({ supabase, userId }) {
  const realmRows = await listAllRealmsDal({ supabase, userId });

  const [orgRows, courseRows] = await Promise.all([
    listAllOrganizationSummariesDal({ supabase }),
    listAllCourseSummariesDal({ supabase }),
  ]);

  const orgsByRealm = groupBy(orgRows, "realm_id");
  const coursesByRealm = groupBy(courseRows, "realm_id");

  const tenants = realmRows.map((realm) => {
    const orgs = orgsByRealm[realm.id] ?? [];
    const courses = coursesByRealm[realm.id] ?? [];

    return {
      id: realm.id,
      name: realm.name ?? realm.realm_name,
      slug: realm.slug ?? realm.realm_slug,
      isActive: realm.is_active !== false,
      createdAt: realm.created_at,
      organizationCount: orgs.length,
      totalCourses: courses.length,
      activeCourses: courses.filter(
        (c) => c.status === "published" || c.status === "active",
      ).length,
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
