// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\model\gas\vportFuelPriceSubmission.model.js

/**
 * Model — Pure translator
 *
 * Translates raw DAL rows (snake_case)
 * into domain-safe camelCase objects.
 *
 * No I/O.
 * No business rules.
 * No permissions.
 */

/**
 * Map single submission row
 */
export function mapFuelPriceSubmissionRow(row) {
  if (!row) return null;

  return Object.freeze({
    id: row.id ?? null,
    targetActorId: row.target_actor_id ?? null,
    fuelKey: row.fuel_key ?? null,
    proposedPrice:
      row.proposed_price !== null && row.proposed_price !== undefined
        ? Number(row.proposed_price)
        : null,
    currencyCode: row.currency_code ?? "USD",
    unit: row.unit ?? "liter",
    submittedByActorId: row.submitted_by_actor_id ?? null,
    submittedAt: row.submitted_at ?? null,
    status: row.status ?? "pending",
    reviewedAt: row.reviewed_at ?? null,
    reviewedByActorId: row.reviewed_by_actor_id ?? null,
    decisionReason: row.decision_reason ?? null,
    evidence: row.evidence ?? {},
  });
}

/**
 * Map list of submission rows
 */
export function mapFuelPriceSubmissionRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapFuelPriceSubmissionRow);
}