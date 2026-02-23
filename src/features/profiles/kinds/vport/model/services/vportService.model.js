// src/features/profiles/kinds/vport/model/services/vportService.model.js

function str(v) {
  return (v ?? "").toString();
}

// ---------- Existing (unchanged) ----------
export function mapVportServiceRow(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    actorId: row.actor_id ?? null,

    key: str(row.key).trim(),
    label: str(row.label).trim() || str(row.key).trim(),
    category: str(row.category).trim() || "Other",

    enabled: row.enabled !== false,
    meta: row.meta && typeof row.meta === "object" ? row.meta : {},

    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapVportServiceRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map(mapVportServiceRow).filter(Boolean);
}

// ---------- New: Catalog mappers ----------
export function mapVportServiceCatalogRow(row) {
  if (!row) return null;

  return {
    vportType: str(row.vport_type).trim(),
    key: str(row.key).trim(),
    label: str(row.label).trim() || str(row.key).trim(),
    category: str(row.category).trim() || "Other",

    sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : 0,
    isActive: row.is_active !== false,
    meta: row.meta && typeof row.meta === "object" ? row.meta : {},

    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapVportServiceCatalogRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map(mapVportServiceCatalogRow).filter(Boolean);
}

// ---------- New: Add-on mappers ----------
export function mapVportServiceAddonRow(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    actorId: row.actor_id ?? null,

    parentServiceKey:
      row.parent_service_key === null || row.parent_service_key === undefined
        ? null
        : str(row.parent_service_key).trim(),

    key: str(row.key).trim() || null,
    label: str(row.label).trim() || str(row.key).trim(),
    category: str(row.category).trim() || "Other",

    enabled: row.enabled !== false,
    sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : 0,
    meta: row.meta && typeof row.meta === "object" ? row.meta : {},

    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapVportServiceAddonRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map(mapVportServiceAddonRow).filter(Boolean);
}

// ---------- New: Merge catalog + actor overrides ----------
// Purpose:
// - Catalog defines allowed services for a vport_type
// - Actor services overrides enable/meta/label/category per actor_id
//
// Options:
// - includeInactiveCatalog: keep inactive catalog entries (default false)
// - defaultEnabled: if actor has no row, should catalog item default enabled? (default false)
// - viewerMode: if true, returns only enabled services (public view)
export function resolveVportServicesFromCatalog({
  catalogRows,
  actorServiceRows,
  includeInactiveCatalog = false,
  defaultEnabled = false,
  viewerMode = false,
}) {
  const catalog = mapVportServiceCatalogRows(catalogRows);
  const actorRows = mapVportServiceRows(actorServiceRows);

  const actorByKey = new Map();
  for (const a of actorRows) {
    if (!a?.key) continue;
    actorByKey.set(a.key, a);
  }

  const merged = [];

  for (const c of catalog) {
    if (!c?.key) continue;
    if (!includeInactiveCatalog && c.isActive === false) continue;

    const a = actorByKey.get(c.key);

    // Base from catalog
    const base = {
      id: a?.id ?? null,
      actorId: a?.actorId ?? null,

      key: c.key,
      label: (a?.label ?? c.label ?? c.key).toString().trim() || c.key,
      category: (a?.category ?? c.category ?? "Other").toString().trim() || "Other",

      enabled: a ? a.enabled !== false : !!defaultEnabled,

      // Merge meta (catalog meta as defaults, actor meta overrides)
      meta: {
        ...(c.meta && typeof c.meta === "object" ? c.meta : {}),
        ...(a?.meta && typeof a.meta === "object" ? a.meta : {}),
      },

      // Keep useful catalog fields for UI sorting if you want
      sortOrder: c.sortOrder ?? 0,
      vportType: c.vportType ?? "",

      createdAt: a?.createdAt ?? c.createdAt ?? null,
      updatedAt: a?.updatedAt ?? c.updatedAt ?? null,
    };

    if (!viewerMode || base.enabled) merged.push(base);
  }

  // Sort stable: sortOrder then label
  merged.sort((x, y) => {
    const so = (x.sortOrder ?? 0) - (y.sortOrder ?? 0);
    if (so !== 0) return so;
    return str(x.label).localeCompare(str(y.label));
  });

  return merged;
}

// ---------- New: Group add-ons by parent key (optional helper) ----------
export function groupVportServiceAddonsByParent(addonRows) {
  const addons = mapVportServiceAddonRows(addonRows);

  /** @type {Record<string, Array<any>>} */
  const byParent = {};
  /** @type {Array<any>} */
  const general = [];

  for (const a of addons) {
    if (!a.enabled) continue;

    if (!a.parentServiceKey) general.push(a);
    else {
      if (!byParent[a.parentServiceKey]) byParent[a.parentServiceKey] = [];
      byParent[a.parentServiceKey].push(a);
    }
  }

  // Sort each bucket
  general.sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0) || str(x.label).localeCompare(str(y.label)));
  for (const k of Object.keys(byParent)) {
    byParent[k].sort(
      (x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0) || str(x.label).localeCompare(str(y.label))
    );
  }

  return { general, byParent };
}