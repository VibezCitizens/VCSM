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

export function normalizeResult(item) {
  if (!item) return null

  const type = item.result_type || item.type || item.kind

  switch (type) {
    case 'actor':
      if (!item.actor_id) return null
      return {
        result_type: 'actor',
        actor_id: item.actor_id,
        display_name: item.display_name ?? '',
        username: item.username ?? '',
        photo_url: item.photo_url ?? '/avatar.jpg',
        private: !!item.private,
      }
    case 'feature':
      if (!item.id) return null
      return {
        result_type: 'feature',
        id: item.id,
        title: item.title ?? '',
        subtitle: item.subtitle ?? '',
        icon: item.icon ?? null,
        route: item.route ?? null,
      }
    case 'vport':
      return {
        result_type: 'vport',
        id: item.id ?? null,
        name: item.name ?? '',
        description: item.description ?? '',
        avatar_url: item.avatar_url ?? '/avatar.jpg',
        is_active: !!item.is_active,
      }
    case 'post':
      return {
        result_type: 'post',
        id: item.id ?? item.post_id ?? null,
        title: item.title ?? '',
        text: item.text ?? '',
      }
    case 'comment':
      return {
        result_type: 'comment',
        id: item.id ?? item.comment_id ?? null,
        text: item.text ?? item.body ?? '',
        post_id: item.post_id ?? null,
      }
    case 'message':
    case 'conversation':
      return {
        result_type: type,
        id: item.id ?? item.conversation_id ?? item.message_id ?? null,
        title: item.title ?? '',
        text: item.text ?? item.body ?? '',
      }
    case 'video':
      return {
        result_type: 'video',
        id: item.id ?? item.video_id ?? null,
        title: item.title ?? '',
      }
    case 'group':
      return {
        result_type: 'group',
        id: item.id ?? item.group_id ?? null,
        name: item.name ?? item.group_name ?? '',
        description: item.description ?? '',
      }
    default:
      return null
  }
}

export function dedupeByKindAndId(items) {
  const out = new Map()

  for (const item of items) {
    if (!item) continue
    const keyId = item.result_type === 'actor' ? item.actor_id : item.id
    const key = `${item.result_type}:${keyId ?? 'null'}`
    if (!out.has(key)) out.set(key, item)
  }

  return Array.from(out.values())
}
