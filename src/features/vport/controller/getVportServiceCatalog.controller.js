import readVportServiceCatalogByType from "@/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js";
import { mapVportServiceCatalogRows } from "@/features/profiles/kinds/vport/model/services/vportService.model.js";

export default async function getVportServiceCatalogController({ vportType } = {}) {
  const safeVportType = (vportType ?? "").toString().trim().toLowerCase();
  if (!safeVportType) {
    return { vportType: null, services: [] };
  }

  const rows = await readVportServiceCatalogByType({
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
