function normalizeVportType(vportType) {
  return String(vportType ?? "").trim().toLowerCase();
}

/**
 * Returns catalog-like rows when DB catalog is missing for a supported type.
 * Shape matches vc.vport_service_catalog read projection.
 */
export function getFallbackServiceCatalogRows(vportType) {
  const normalized = normalizeVportType(vportType);

  if (normalized !== "exchange" && normalized !== "money exchange") {
    return [];
  }

  const canonicalType = "exchange";
  const createdAt = new Date().toISOString();

  return [
    {
      vport_type: canonicalType,
      key: "currency_exchange",
      label: "Currency Exchange",
      category: "Core Services",
      sort_order: 10,
      is_active: true,
      meta: { defaultEnabled: true },
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      vport_type: canonicalType,
      key: "wire_transfer",
      label: "Wire Transfer",
      category: "Transfers",
      sort_order: 20,
      is_active: true,
      meta: { defaultEnabled: false },
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      vport_type: canonicalType,
      key: "remittance_support",
      label: "Remittance Support",
      category: "Transfers",
      sort_order: 30,
      is_active: true,
      meta: { defaultEnabled: false },
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      vport_type: canonicalType,
      key: "rate_alerts",
      label: "Rate Alerts",
      category: "Customer Tools",
      sort_order: 40,
      is_active: true,
      meta: { defaultEnabled: false },
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      vport_type: canonicalType,
      key: "bulk_exchange",
      label: "Bulk Exchange",
      category: "Business Services",
      sort_order: 50,
      is_active: true,
      meta: { defaultEnabled: false },
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];
}

export default getFallbackServiceCatalogRows;
