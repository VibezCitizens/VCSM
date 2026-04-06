export function mapGrade(row) {
  if (!row) return null;

  return {
    id: row.id,
    submissionId: row.submission_id,
    score: row.score,
    feedbackText: row.feedback_text,
    gradedAt: row.graded_at,
    actorId: row.actor_id,
    gradedByActorId: row.graded_by_actor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGrades(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapGrade);
}

export default mapGrade;