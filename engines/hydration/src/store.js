// engines/hydration/src/store.js
// ============================================================
// Actor Store — Global Zustand cache with freshness metadata
// ============================================================

import { create } from 'zustand'

const STALE_AFTER_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Safe merge: never overwrite a non-null value with null.
 * Newer non-null values always win.
 */
function safeMerge(existing, incoming) {
  if (!existing) return incoming

  const merged = { ...existing }
  for (const [key, value] of Object.entries(incoming)) {
    if (key.startsWith('_')) {
      // Always overwrite metadata fields
      merged[key] = value
    } else if (value != null) {
      // Only overwrite if incoming is non-null
      merged[key] = value
    }
    // If incoming is null and existing is non-null, keep existing
  }
  return merged
}

export const useActorStore = create((set, get) => ({
  actors: {},

  /**
   * Upsert actors with safe merge and freshness tracking.
   * @param {Array} rows — actor rows (snake_case or camelCase)
   * @param {Object} options
   * @param {boolean} options.force — overwrite all fields including nulls
   */
  upsertActors(rows = [], { force = false } = {}) {
    if (!rows.length) return

    set((s) => {
      const next = { ...s.actors }
      const now = Date.now()

      for (const r of rows) {
        const actorId = r.actor_id ?? r.actorId ?? r.id ?? null
        if (!actorId) continue

        const incoming = {
          id: actorId,
          actor_id: actorId,
          kind: r.kind ?? null,

          // Canonical camelCase
          displayName: r.display_name ?? r.displayName ?? null,
          username: r.username ?? null,
          photoUrl: r.photo_url ?? r.photoUrl ?? null,
          bannerUrl: r.banner_url ?? r.bannerUrl ?? null,
          bio: r.bio ?? null,

          // Vport fields
          vportName: r.vport_name ?? r.vportName ?? null,
          vportSlug: r.vport_slug ?? r.vportSlug ?? null,
          vportAvatarUrl: r.vport_avatar_url ?? r.vportAvatarUrl ?? null,
          vportBannerUrl: r.vport_banner_url ?? r.vportBannerUrl ?? null,

          // Legacy snake_case compat
          display_name: r.display_name ?? r.displayName ?? null,
          photo_url: r.photo_url ?? r.photoUrl ?? null,
          banner_url: r.banner_url ?? r.bannerUrl ?? null,
          vport_name: r.vport_name ?? r.vportName ?? null,
          vport_slug: r.vport_slug ?? r.vportSlug ?? null,
          vport_avatar_url: r.vport_avatar_url ?? r.vportAvatarUrl ?? null,

          // Freshness metadata
          _hydratedAt: now,
        }

        next[actorId] = force ? incoming : safeMerge(next[actorId], incoming)
      }

      return { actors: next }
    })
  },

  /**
   * Check if an actor is stale (older than STALE_AFTER_MS).
   */
  isStale(actorId) {
    const actor = get().actors[actorId]
    if (!actor || !actor._hydratedAt) return true
    return Date.now() - actor._hydratedAt > STALE_AFTER_MS
  },

  /**
   * Get actor IDs that are missing or stale from a list.
   */
  getMissingOrStale(actorIds) {
    const actors = get().actors
    const now = Date.now()
    return actorIds.filter((id) => {
      const actor = actors[id]
      if (!actor || !actor._hydratedAt) return true
      return now - actor._hydratedAt > STALE_AFTER_MS
    })
  },

  /**
   * Get an actor from store (raw, no presentation logic).
   */
  getActor(actorId) {
    return get().actors[actorId] ?? null
  },
}))
