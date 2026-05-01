// src/features/settings/vports/model/vport.mapper.js
// ============================================================
// VPORT — MODEL MAPPER
// - Normalizes DAL / RPC output into UI-safe shape
// - Actor-based (vport + actor_id)
// - No side effects
// ============================================================

/**
 * Normalize a raw VPORT row into UI-safe shape
 *
 * Accepts:
 * - actor_owners → actors → vports join
 * - RPC output
 * - Direct vports table row
 */
export function mapVport(raw) {
  if (!raw) return null;

  // Case 1: already normalized
  if (raw.id && raw.actor_id) {
    return {
      id: raw.id,
      name: raw.name ?? "",
      avatar_url: raw.avatar_url ?? null,
      actor_id: raw.actor_id,
      created_at: raw.created_at ?? null,
    };
  }

  // Case 2: actor wrapper (actor_owners → actors → vports)
  if (raw.actor && raw.actor.kind === "vport") {
    const v = raw.actor.vport;
    if (!v) return null;

    return {
      id: v.id,
      name: v.name ?? "",
      avatar_url: v.avatar_url ?? null,
      actor_id: raw.actor.id,
      created_at: v.created_at ?? null,
    };
  }

  // Case 3: direct vports table row
  if (raw.vports || raw.name) {
    const v = raw.vports ?? raw;

    return {
      id: v.id,
      name: v.name ?? "",
      avatar_url: v.avatar_url ?? null,
      actor_id: v.actor_id ?? null,
      created_at: v.created_at ?? null,
    };
  }

  return null;
}

/**
 * Normalize an array of VPORT rows
 */
export function mapVports(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapVport).filter(Boolean);
}
