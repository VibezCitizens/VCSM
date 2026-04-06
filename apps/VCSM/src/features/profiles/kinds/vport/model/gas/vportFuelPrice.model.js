// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\model\gas\vportFuelPrice.model.js

/**
 * Model — Pure translator
 *
 * Translates raw DAL rows (snake_case)
 * into domain-safe camelCase objects.
 *
 * No I/O.
 * No business logic.
 * No permissions.
 */

/**
 * Map single fuel price row
 */
export function mapVportFuelPriceRow(row) {
  if (!row) return null;

  return Object.freeze({
    targetActorId: row.target_actor_id ?? null,
    fuelKey: row.fuel_key ?? null,
    price:
      row.price !== null && row.price !== undefined
        ? Number(row.price)
        : null,
    currencyCode: row.currency_code ?? "USD",
    unit: row.unit ?? "liter",
    isAvailable: Boolean(row.is_available),
    updatedAt: row.updated_at ?? null,
    updatedByActorId: row.updated_by_actor_id ?? null,
    source: row.source ?? "manual",
  });
}

/**
 * Map list of fuel price rows
 */
export function mapVportFuelPriceRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapVportFuelPriceRow);
}