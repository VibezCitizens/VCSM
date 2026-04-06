export function mapAssignment(row) {
  if (!row) return null;

  return {
    id: row.id,
    courseId: row.course_id,
    moduleId: row.module_id,
    title: row.title,
    instructions: row.instructions,
    submissionType: row.submission_type,
    pointsPossible: row.points_possible,
    attemptLimit: row.attempt_limit,
    availableFrom: row.available_from,
    dueAt: row.due_at,
    lockAt: row.lock_at,
    allowLateSubmissions: row.allow_late_submissions,
    isPublished: row.is_published,
    createdByActorId: row.created_by_actor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAssignments(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapAssignment);
}

export default mapAssignment;