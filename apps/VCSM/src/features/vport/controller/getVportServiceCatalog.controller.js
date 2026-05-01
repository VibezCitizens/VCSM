import readVportServiceCatalogByTypeDAL from "@/features/vport/dal/readVportServiceCatalogByType.dal";
import { mapVportServiceCatalogRows } from "@/features/vport/model/vportServiceCatalog.model";

// Types that share another type's service catalog.
// No DB duplication — catalog is looked up under the canonical key.
const SERVICE_CATALOG_TYPE_ALIASES = Object.freeze({
  barbershop: "barber",
});

export default async function getVportServiceCatalogController({ vportType, getFallbackServiceCatalogRows } = {}) {
  const safeVportType = (vportType ?? "").toString().trim().toLowerCase();
  if (!safeVportType) {
    return { vportType: null, services: [] };
  }

  const resolvedType = SERVICE_CATALOG_TYPE_ALIASES[safeVportType] ?? safeVportType;

  const rows = await readVportServiceCatalogByTypeDAL({
    vportType: resolvedType,
    includeInactive: false,
  });

  // If the DB has no catalog rows for this type, apply the fallback.
  // Fallback rows use { category, vport_type } — map directly to output shape
  // rather than routing through the DB mapper which expects { service_group, category_key }.
  if (!rows.length) {
    const fallbackRows = getFallbackServiceCatalogRows?.(resolvedType) ?? [];
    const services = fallbackRows.map((row) => ({
      key: row.key,
      label: row.label,
      category: row.category ?? "Other",
      meta: row.meta ?? {},
    }));
    return { vportType: safeVportType, services };
  }

  const services = mapVportServiceCatalogRows(rows).map((row) => ({
    key: row.key,
    label: row.label,
    category: row.category,
    meta: row.meta ?? {},
  }));

  return { vportType: safeVportType, services };
}
