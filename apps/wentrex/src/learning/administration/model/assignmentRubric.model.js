export function mapAssignmentRubric(row) {
  if (!row) return null;

  return {
    id: row.id,
    assignmentId: row.assignment_id,
    criterionKey: row.criterion_key,
    criterionLabel: row.criterion_label,
    pointsPossible: row.points_possible,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function mapAssignmentRubrics(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapAssignmentRubric);
}

export default mapAssignmentRubric;