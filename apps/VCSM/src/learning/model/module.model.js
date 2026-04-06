export function mapModule(row) {
  if (!row) return null;

  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    unlockAt: row.unlock_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapModules(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapModule);
}

export default mapModule;