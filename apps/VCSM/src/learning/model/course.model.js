export function mapCourse(row) {
  if (!row) return null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    syllabus: row.syllabus,
    visibility: row.visibility,
    status: row.status,
    publishedAt: row.published_at,
    createdByActorId: row.created_by_actor_id,
    realmId: row.realm_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCourses(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapCourse);
}

export default mapCourse;