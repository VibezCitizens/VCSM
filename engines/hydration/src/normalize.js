// engines/hydration/src/normalize.js
// ============================================================
// Single canonical normalization function for actor summary rows
// ============================================================

/**
 * Normalize a raw actor summary row from any source
 * (RPC, view, chat engine, feed pipeline) into the canonical shape.
 *
 * For vports: prefers vport_name/vport_avatar_url as display fields.
 * For users: uses display_name/photo_url directly.
 *
 * @param {Object} row — raw row from any source
 * @returns {Object|null} — normalized actor object or null
 */
export function normalizeActorSummary(row) {
  if (!row) return null

  const actorId = row.actor_id ?? row.actorId ?? row.id ?? null
  if (!actorId) return null

  const kind = row.kind ?? null
  const isVport = kind === 'vport'

  return {
    id: actorId,
    actor_id: actorId,
    kind,

    // Canonical display fields
    display_name: isVport
      ? (row.vport_name ?? row.vportName ?? row.display_name ?? row.displayName ?? null)
      : (row.display_name ?? row.displayName ?? null),
    username: isVport
      ? (row.vport_slug ?? row.vportSlug ?? row.username ?? null)
      : (row.username ?? null),
    photo_url: isVport
      ? (row.vport_avatar_url ?? row.vportAvatarUrl ?? row.photo_url ?? row.photoUrl ?? null)
      : (row.photo_url ?? row.photoUrl ?? null),
    banner_url: row.banner_url ?? row.bannerUrl ?? null,
    bio: row.bio ?? null,

    // Vport-specific (always preserved)
    vport_name: row.vport_name ?? row.vportName ?? null,
    vport_slug: row.vport_slug ?? row.vportSlug ?? null,
    vport_avatar_url: row.vport_avatar_url ?? row.vportAvatarUrl ?? null,
    vport_banner_url: row.vport_banner_url ?? row.vportBannerUrl ?? null,
  }
}

/**
 * Normalize an array of actor summary rows.
 */
export function normalizeActorSummaries(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map(normalizeActorSummary).filter(Boolean)
}
