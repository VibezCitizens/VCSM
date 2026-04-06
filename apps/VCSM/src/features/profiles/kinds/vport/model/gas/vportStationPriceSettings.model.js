// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\model\gas\vportStationPriceSettings.model.js

/**
 * Model — Pure translator
 *
 * Translates raw DAL row (snake_case)
 * into domain-safe camelCase object.
 *
 * No I/O.
 * No business rules.
 * No permissions.
 */

/**
 * Map single station price settings row
 */
export function mapVportStationPriceSettingsRow(row) {
  if (!row) {
    return Object.freeze({
      targetActorId: null,
      showCommunitySuggestion: true,
      requireSanityForSuggestion: true,
      minPrice: 0.5,
      maxPrice: 20.0,
      maxDeltaAbs: 2.0,
      maxDeltaPct: 0.3,
      updatedAt: null,
    });
  }

  return Object.freeze({
    targetActorId: row.target_actor_id ?? null,
    showCommunitySuggestion: Boolean(row.show_community_suggestion),
    requireSanityForSuggestion: Boolean(row.require_sanity_for_suggestion),
    minPrice:
      row.min_price !== null && row.min_price !== undefined
        ? Number(row.min_price)
        : 0.5,
    maxPrice:
      row.max_price !== null && row.max_price !== undefined
        ? Number(row.max_price)
        : 20.0,
    maxDeltaAbs:
      row.max_delta_abs !== null && row.max_delta_abs !== undefined
        ? Number(row.max_delta_abs)
        : 2.0,
    maxDeltaPct:
      row.max_delta_pct !== null && row.max_delta_pct !== undefined
        ? Number(row.max_delta_pct)
        : 0.3,
    updatedAt: row.updated_at ?? null,
  });
}