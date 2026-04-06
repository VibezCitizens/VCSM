export function mapLessonProgress(row) {
  if (!row) return null;

  return {
    id: row.id,
    lessonId: row.lesson_id,
    actorId: row.actor_id,
    state: row.state,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

export function mapLessonProgressList(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapLessonProgress);
}

export default mapLessonProgress;