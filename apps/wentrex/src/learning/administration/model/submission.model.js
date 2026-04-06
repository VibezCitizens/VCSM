export function mapSubmission(row) {
  if (!row) return null;

  return {
    id: row.id,
    assignmentId: row.assignment_id,
    courseId: row.course_id,
    attemptNo: row.attempt_no,
    status: row.status,
    submittedText: row.submitted_text,
    submittedUrl: row.submitted_url,
    submittedAt: row.submitted_at,
    isLate: row.is_late,
    actorId: row.actor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSubmissions(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapSubmission);
}

export default mapSubmission;