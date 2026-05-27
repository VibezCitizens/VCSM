/**
 * Shared text utility — single source of truth for toText normalization.
 * Replaces the three inline copies that existed in:
 *   - features/dashboard/vport/dal/write/vportLeads.write.dal.js
 *   - features/dashboard/vport/controller/vportLeads.controller.js
 *   - features/dashboard/vport/model/vportLead.display.model.js
 */

/**
 * Returns the trimmed string value, or empty string for any non-string input.
 * @param {unknown} value
 * @returns {string}
 */
export function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}
