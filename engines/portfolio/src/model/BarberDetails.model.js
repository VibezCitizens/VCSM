// ============================================================
// Portfolio Engine — Barber Details Model
// ============================================================

/**
 * @param {Object} raw - vport_barber_portfolio_details row
 * @returns {import('../types/index.js').DomainBarberDetails}
 */
export function BarberDetailsModel(raw) {
  if (!raw) return null
  return {
    portfolioItemId: raw.portfolio_item_id,
    haircutStyle:    raw.haircut_style ?? null,
    fadeType:        raw.fade_type ?? null,
    beardService:    raw.beard_service ?? null,
    hairLength:      raw.hair_length ?? null,
    clientAgeGroup:  raw.client_age_group ?? null,
    hasDesign:       raw.has_design ?? false,
    hasColor:        raw.has_color ?? false,
    hasBeard:        raw.has_beard ?? false,
    notes:           raw.notes ?? '',
  }
}
