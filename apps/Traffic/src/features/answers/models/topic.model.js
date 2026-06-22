export function mapTopicRowToTopic(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug ?? "",
    name: row.name ?? "General",
    description: row.description ?? "",
    parentId: row.parent_id ?? null,
    isActive: row.is_active !== false,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? row.created_at ?? null
  };
}
