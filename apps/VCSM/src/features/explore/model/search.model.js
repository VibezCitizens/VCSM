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
 * Normalize a raw row from identity.search_actor_directory RPC.
 * Distinct from mapActorSearchResult — maps RPC-specific column names.
 */
export function normalizeActorRow(row) {
  if (!row || !row.actor_id) return null

  return {
    resultType: 'actor',
    result_type: 'actor',
    actorDomain: row.actor_domain ?? 'vc',
    actorId: row.actor_id,
    actor_id: row.actor_id,
    actorKind: row.actor_kind ?? null,
    displayName: row.display_name ?? '',
    display_name: row.display_name ?? '',
    username: row.username ?? '',
    avatarUrl: row.avatar_url ?? '/avatar.jpg',
    photo_url: row.avatar_url ?? '/avatar.jpg',
    bannerUrl: row.banner_url ?? null,
    bio: row.bio ?? null,
    isPrivate: row.is_private === true,
    private: row.is_private === true,
    rank: row.rank ?? null,
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
