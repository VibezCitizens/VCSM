function str(value) {
  return String(value ?? "");
}

export function mapVportServiceCatalogRow(row) {
  if (!row) return null;

  return {
    vportType: str(row.vport_type).trim(),
    key: str(row.key).trim(),
    label: str(row.label).trim() || str(row.key).trim(),
    category: str(row.category).trim() || "Other",
    sortOrder: Number.isFinite(row?.sort_order) ? row.sort_order : 0,
    isActive: row?.is_active !== false,
    meta: row?.meta && typeof row.meta === "object" ? row.meta : {},
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

export function mapVportServiceCatalogRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map(mapVportServiceCatalogRow).filter(Boolean);
}
