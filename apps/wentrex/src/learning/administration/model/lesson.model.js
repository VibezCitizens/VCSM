export function mapLesson(row) {
  if (!row) return null;

  return {
    id: row.id,
    moduleId: row.module_id,
    courseId: row.course_id,
    title: row.title,
    lessonType: row.lesson_type,
    body: row.body,
    externalUrl: row.external_url,
    fileUrl: row.file_url,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    createdByActorId: row.created_by_actor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLessons(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapLesson);
}

export default mapLesson;