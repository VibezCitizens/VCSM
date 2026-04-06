import readVportServiceCatalogByTypeDAL from "@/features/vport/dal/readVportServiceCatalogByType.dal";
import { mapVportServiceCatalogRows } from "@/features/vport/model/vportServiceCatalog.model";

export default async function getVportServiceCatalogController({ vportType } = {}) {
  const safeVportType = (vportType ?? "").toString().trim().toLowerCase();
  if (!safeVportType) {
    return { vportType: null, services: [] };
  }

  const rows = await readVportServiceCatalogByTypeDAL({
    vportType: safeVportType,
    includeInactive: false,
  });

  const services = mapVportServiceCatalogRows(rows).map((row) => ({
    key: row.key,
    label: row.label,
    category: row.category,
    meta: row.meta ?? {},
  }));

  return { vportType: safeVportType, services };
}
