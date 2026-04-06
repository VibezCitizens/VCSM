import { COURSE_COLUMNS } from "@/learning/administration/dal/courses/getCourseById.dal";

export async function createCourseDal({
  supabase,
  organizationId,
  realmId,
  title,
  slug,
  code = null,
  description = null,
  visibility = "organization",
  status = "draft",
  termId = null,
  coverImageUrl = null,
  createdByActorId = null,
}) {
  if (!supabase) throw new Error("createCourseDal requires supabase");
  if (!organizationId) throw new Error("createCourseDal requires organizationId");
  if (!realmId) throw new Error("createCourseDal requires realmId");
  if (!title) throw new Error("createCourseDal requires title");
  if (!slug) throw new Error("createCourseDal requires slug");

  const payload = {
    organization_id: organizationId,
    realm_id: realmId,
    title,
    slug,
    code,
    description,
    visibility,
    status,
    term_id: termId,
    cover_image_url: coverImageUrl,
    created_by_actor_id: createdByActorId,
  };

  const { data, error } = await supabase
    .schema("learning")
    .from("courses")
    .insert(payload)
    .select(COURSE_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default createCourseDal;
