// ============================================================
// Portfolio Engine — Locksmith Portfolio Details Model
// ============================================================

/**
 * @param {Object} raw - vport_locksmith_portfolio_details row
 */
export function LocksmithDetailsModel(raw) {
  if (!raw) return null
  return {
    portfolioItemId:        raw.portfolio_item_id,
    jobType:                raw.job_type,
    propertyType:           raw.property_type ?? null,
    lockType:               raw.lock_type ?? null,
    hardwareBrand:          raw.hardware_brand ?? null,
    serviceMode:            raw.service_mode ?? null,
    hasBeforeAfter:         raw.has_before_after ?? false,
    isEmergencyJob:         raw.is_emergency_job ?? false,
    isSecurityUpgrade:      raw.is_security_upgrade ?? false,
    estimatedDurationMinutes: raw.estimated_duration_minutes ?? null,
    displayInPortfolio:     raw.display_in_portfolio ?? true,
    notes:                  raw.notes ?? '',
  }
}
