// src/features/explore/model/search.model.js

// ============================================================
// Search Models (PURE, ACTOR-FIRST)
// ------------------------------------------------------------
// Purpose:
// - Translate raw search rows → domain-safe objects
// - Enforce actor-first identity semantics
//
// Rules:
// - PURE functions only (no I/O)
// - actor_id is the ONLY navigable identity for people
// - user_id is legacy / auxiliary metadata only
// ============================================================

/**
 * Normalize an ACTOR (user profile) search row
 */
export function mapActorSearchResult(row) {
  if (!row) return null
  if (!row.actor_id) return null // 🔒 non-navigable

  return {
    result_type: 'actor',
    actorId: row.actor_id,          // PRIMARY
    userId: row.user_id ?? null,    // legacy only
    displayName: row.display_name ?? '',
    username: row.username ?? '',
    photoUrl: row.photo_url ?? '/avatar.jpg',
    isPrivate: !!row.private,
  }
}

/**
 * Normalize a VPORT search row
 */
export function mapVportSearchResult(row) {
  if (!row) return null

  return {
    result_type: 'vport',
    id: row.id,
    name: row.name ?? '',
    slug: row.slug ?? null,
    avatarUrl: row.avatar_url ?? '/avatar.jpg',
    description: row.description ?? '',
    isActive: !!row.is_active,
    ownerUserId: row.owner_user_id ?? null,
  }
}

/**
 * Normalize a POST search row (stub-ready)
 */
export function mapPostSearchResult(row) {
  if (!row) return null

  return {
    result_type: 'post',
    id: row.id ?? null,
    title: row.title ?? '',
    text: row.text ?? '',
  }
}

/**
 * Normalize a VIDEO search row (stub-ready)
 */
export function mapVideoSearchResult(row) {
  if (!row) return null

  return {
    result_type: 'video',
    id: row.id ?? null,
    title: row.title ?? '',
  }
}

/**
 * Normalize a GROUP search row (stub-ready)
 */
export function mapGroupSearchResult(row) {
  if (!row) return null

  return {
    result_type: 'group',
    id: row.id ?? null,
    name: row.name ?? '',
    description: row.description ?? '',
  }
}

/**
 * Generic dispatcher (optional helper)
 * Keeps controller code clean if you want to use it later
 */
export function mapSearchResult(row) {
  if (!row) return null

  switch (row.result_type) {
    case 'actor':
      return mapActorSearchResult(row)

    case 'vport':
      return mapVportSearchResult(row)

    case 'post':
      return mapPostSearchResult(row)

    case 'video':
      return mapVideoSearchResult(row)

    case 'group':
      return mapGroupSearchResult(row)

    default:
      return null
  }
}
