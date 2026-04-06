import { listActiveCourseMembershipsByActorRolesDal } from "@/learning/administration/dal/memberships/listActiveCourseMembershipsByActorRoles.dal";
import { getCourseByIdDal } from "@/learning/administration/dal/courses/getCourseById.dal";
import { resolveRealmSlug } from "@/learning/administration/controller/shared/resolveRealmSlug.controller";

const DEBUG_PREFIX = "[resolveMembershipDestination]";

export async function buildOrganizationMembershipDestination({
  supabase,
  memberships,
  segment,
}) {
  console.group(`${DEBUG_PREFIX} buildOrganizationMembershipDestination`);
  console.log("memberships", memberships);
  console.log("segment", segment);

  for (const membership of memberships ?? []) {
    // Try the joined organization data first (avoids a separate org lookup that may fail due to RLS)
    const joinedRealmId = membership.organization?.realm_id;
    const realmSlug = joinedRealmId
      ? await resolveRealmSlug({ supabase, realmId: joinedRealmId })
      : await resolveRealmSlug({ supabase, organizationId: membership.organization_id });

    if (!realmSlug) {
      console.warn(`${DEBUG_PREFIX} membership is active but not routable`, {
        membership,
      });
      continue;
    }

    const destinationPath = segment
      ? `/learning/${realmSlug}/${segment}`
      : `/learning/${realmSlug}`;

    console.log(`${DEBUG_PREFIX} organization membership destination resolved`, {
      membership,
      path: destinationPath,
    });
    console.groupEnd();
    return {
      path: destinationPath,
      role: membership.role,
      organizationId: membership.organization_id,
    };
  }

  console.warn(`${DEBUG_PREFIX} no routable organization membership destination found`);
  console.groupEnd();
  return null;
}

export async function resolveCourseMembershipDestination({
  supabase,
  actorId,
  roles,
  segment,
}) {
  if (!actorId || !roles?.length) return null;

  console.group(`${DEBUG_PREFIX} resolveCourseMembershipDestination`);
  console.log("actorId", actorId);
  console.log("roles", roles);
  console.log("segment", segment);

  const data = await listActiveCourseMembershipsByActorRolesDal({
    supabase,
    actorId,
    roles,
  });

  console.log("course memberships", {
    data,
  });

  for (const membership of data ?? []) {
    const course = await getCourseByIdDal({
      supabase,
      courseId: membership.course_id,
    });

    console.log("course lookup", {
      membership,
      course,
    });

    if (!course) continue;

    const realmSlug = await resolveRealmSlug({
      supabase,
      organizationId: course.organization_id,
      realmId: course.realm_id,
    });

    if (!realmSlug) {
      console.warn(`${DEBUG_PREFIX} course membership is active but not routable`, {
        membership,
        course,
      });
      continue;
    }

    const courseDestPath = segment
      ? `/learning/${realmSlug}/${segment}`
      : `/learning/${realmSlug}`;

    console.log(`${DEBUG_PREFIX} course membership destination resolved`, {
      membership,
      course,
      path: courseDestPath,
    });
    console.groupEnd();
    return {
      path: courseDestPath,
      role: membership.role,
      organizationId: course.organization_id,
      courseId: membership.course_id,
    };
  }

  console.warn(`${DEBUG_PREFIX} no routable course membership destination found`);
  console.groupEnd();
  return null;
}
