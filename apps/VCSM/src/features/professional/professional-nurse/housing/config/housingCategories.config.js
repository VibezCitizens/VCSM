/**
 * ============================================================
 * Housing Categories Configuration
 * ------------------------------------------------------------
 * Defines the allowed housing experience categories
 *
 * PURPOSE:
 * - Used by UI to label and group housing notes
 * - Provides a shared, stable vocabulary for nurses
 *
 * RULES:
 * - No logic
 * - No imports
 * - No side effects
 * - UI-facing only
 * ============================================================
 */

export const HOUSING_CATEGORIES = [
  {
    key: 'safety',
    label: 'Safety',
    description: 'Neighborhood safety, lighting, and overall comfort',
  },
  {
    key: 'commute',
    label: 'Commute',
    description: 'Distance and ease of travel to the hospital',
  },
  {
    key: 'noise',
    label: 'Noise',
    description: 'Traffic, neighbors, and general quietness',
  },
  {
    key: 'landlord',
    label: 'Landlord',
    description: 'Responsiveness, respect, and flexibility',
  },
  {
    key: 'lease',
    label: 'Lease Flexibility',
    description: 'Short-term lease terms and extensions',
  },
  {
    key: 'utilities',
    label: 'Utilities',
    description: 'Inclusions such as electricity, water, and internet',
  },
  {
    key: 'parking',
    label: 'Parking',
    description: 'Availability, safety, and cost of parking',
  },
  {
    key: 'furnishing',
    label: 'Furnishing',
    description: 'Furniture quality and move-in readiness',
  },
]
