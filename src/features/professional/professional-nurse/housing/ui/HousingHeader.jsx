/**
 * ============================================================
 * HousingHeader
 * ------------------------------------------------------------
 * Context header for the Housing section
 *
 * PURPOSE:
 * - Shows current location scope
 * - Sets context for housing experiences
 *
 * RULES:
 * - UI-only
 * - No data access
 * - No routing
 * - No business logic
 * ============================================================
 */

export default function HousingHeader({ location }) {
  if (!location) return null

  const { city, state } = location

  return (
    <section className="space-y-1">
      <h2 className="text-sm font-semibold text-white">
        Housing · {city}, {state}
      </h2>

      <p className="text-sm text-white/60">
        Housing experiences shared by verified travel nurses.
      </p>
    </section>
  )
}
