export function mapCourseTerm(row) {
  if (!row) return null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCourseTerms(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapCourseTerm);
}

export default mapCourseTerm;
