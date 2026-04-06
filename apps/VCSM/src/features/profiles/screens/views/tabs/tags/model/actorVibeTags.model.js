export function mapActorVibeTagRow(row) {
  return {
    key: row?.key ?? '',
    label: row?.label ?? row?.key ?? '',
    description: row?.description ?? '',
    icon: row?.icon ?? null,
    category: row?.category ?? null,
    sortOrder: Number(row?.sort_order ?? 0),
    isActive: row?.is_active !== false,
  }
}

export function buildActorVibeTagsModel({ selectedRows = [], tagRows = [] }) {
  const selectedKeys = Array.from(
    new Set(
      (Array.isArray(selectedRows) ? selectedRows : [])
        .map((row) => row?.vibe_tag_key)
        .filter(Boolean)
    )
  )

  const tagsByKey = new Map(
    (Array.isArray(tagRows) ? tagRows : []).map((row) => [row?.key, mapActorVibeTagRow(row)])
  )

  return selectedKeys
    .map((key) => tagsByKey.get(key) || { key, label: key, description: '', icon: null, category: null, sortOrder: 9999, isActive: true })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
}
