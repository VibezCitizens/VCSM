import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import { createCourseDal } from "@/learning/administration/dal/courses/createCourse.dal";
import { createModuleDal } from "@/learning/administration/dal/modules/createModule.dal";
import { mapCourse } from "@/learning/administration/model/course.model";
import {
  canManageOrganization,
  getOrganizationMembershipRow,
  isAdminAuthorized,
} from "@/learning/administration/controller/admin/adminAccess";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createCourseController({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
  title,
  code = null,
  description = null,
  visibility = "organization",
  termId = null,
  coverImageUrl = null,
}) {
  if (!title?.trim()) {
    return { ok: false, error: { code: "TITLE_REQUIRED" } };
  }

  if (!organizationId) {
    return { ok: false, error: { code: "ORGANIZATION_ID_REQUIRED" } };
  }

  const organizationRow = await getOrganizationByIdDal({ supabase, organizationId });

  if (!organizationRow || organizationRow.realm_id !== realmId) {
    return { ok: false, error: { code: "ORGANIZATION_NOT_FOUND" } };
  }

  const [actorOrganizationMembershipRow, isPlatformAdminActor] = await Promise.all([
    getOrganizationMembershipRow({ supabase, organizationId, actorId }),
    isAdminAuthorized({ supabase, userId, actorId }),
  ]);

  if (
    !canManageOrganization({
      actorId,
      organizationRow,
      organizationMembershipRow: actorOrganizationMembershipRow,
      isPlatformAdminActor,
    })
  ) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const baseSlug = slugify(title.trim());
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const courseRow = await createCourseDal({
    supabase,
    organizationId,
    realmId,
    title: title.trim(),
    slug,
    code: code?.trim() || null,
    description: description?.trim() || null,
    visibility,
    status: "draft",
    termId: termId || null,
    coverImageUrl: coverImageUrl?.trim() || null,
    createdByActorId: actorId,
  });

  if (!courseRow) {
    return { ok: false, error: { code: "INSERT_FAILED" } };
  }

  try {
    await createModuleDal({
      supabase,
      courseId: courseRow.id,
      title: "Getting Started",
      description: "",
      sortOrder: 1,
    });
  } catch (err) {
    console.warn("[createCourse] default module creation failed (non-fatal)", err);
  }

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
    },
  };
}

export default createCourseController;
