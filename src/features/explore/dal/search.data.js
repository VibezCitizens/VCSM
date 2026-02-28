// src/features/explore/dal/search.data.js

import { supabase } from '@/services/supabase/supabaseClient'
import { vc } from '@/services/supabase/vcClient'
import {
  isUuid,
  normalizeHandleTerm,
  toContainsPattern,
} from '@/services/supabase/postgrestSafe'

// ============================================================
// Search Data (ACTOR-FIRST)
// ------------------------------------------------------------
// RULES:
// - Actor identity is PRIMARY
// - user_id is LEGACY / AUXILIARY
// - NEVER emit user_id as `id` for actors
// - result_type MUST reflect navigability
// ============================================================

function mergeActorRows(primaryRows = [], supplementalRows = []) {
  const merged = new Map()

  for (const row of primaryRows) {
    if (!row) continue
    const key = row.actor_id
      ? `actor:${row.actor_id}`
      : `legacy:${row.user_id ?? Math.random()}`
    if (!merged.has(key)) merged.set(key, row)
  }

  for (const row of supplementalRows) {
    if (!row?.actor_id) continue
    const key = `actor:${row.actor_id}`
    if (!merged.has(key)) merged.set(key, row)
  }

  return Array.from(merged.values())
}

export const search = {
  // ==========================================================
  // ACTORS (USERS)
  // ==========================================================
  async users(rawQuery, opts = {}) {
    const { minLength = 1, limit = 25, offset = 0 } = opts
    let { currentUserId } = opts

    const q = (rawQuery || '').trim()
    if (q.length < minLength) return []

    // --------------------------------------------------------
    // Resolve viewer user_id (LEGACY, for blocks only)
    // --------------------------------------------------------
    if (!currentUserId) {
      try {
        const { data } = await supabase.auth.getUser()
        currentUserId = data?.user?.id || null
      } catch {
        currentUserId = null
      }
    }

    const byHandle = q.startsWith('@')
    const byId = q.startsWith('#')
    const needle = byHandle || byId ? q.slice(1) : q

    let rows = []

    // --------------------------------------------------------
    // PRIMARY PATH - Actor-aware RPC
    // --------------------------------------------------------
    try {
      const { data, error } = await supabase
        .schema('vc')
        .rpc('search_directory', {
          _q: needle,
          _limit: limit,
          _offset: offset,
        })

      if (error) throw error
      rows = Array.isArray(data) ? data : []
    } catch {
      // ------------------------------------------------------
      // FALLBACK - profiles table (LEGACY, non-actor)
      // ------------------------------------------------------
      let fb = supabase
        .from('profiles')
        .select('id, display_name, username, photo_url, private, discoverable')
        .limit(limit)

      if (currentUserId && isUuid(currentUserId)) {
        fb = fb.or(`discoverable.eq.true,id.eq.${currentUserId}`)
      } else {
        fb = fb.eq('discoverable', true)
      }

      if (byId && needle) {
        const idPrefix = String(needle).toLowerCase().replace(/[^0-9a-f-]/g, '')
        if (!idPrefix) return []
        fb = fb.ilike('id', `${idPrefix}%`)
      } else if (byHandle && needle) {
        const handlePrefix = normalizeHandleTerm(needle)
        if (!handlePrefix) return []
        fb = fb.ilike('username', `${handlePrefix}%`)
      } else {
        const like = toContainsPattern(needle)
        if (!like) return []
        fb = fb.or(`username.ilike.${like},display_name.ilike.${like}`)
      }

      const { data } = await fb
      rows = (data || []).map((u) => ({
        actor_id: null, // non-navigable legacy fallback
        user_id: u.id,
        display_name: u.display_name,
        username: u.username,
        photo_url: u.photo_url,
        is_private: !!u.private,
      }))
    }

    // --------------------------------------------------------
    // SUPPLEMENTAL PATH - profiles + actors bridge
    // --------------------------------------------------------
    // Ensure private accounts are still searchable.
    // Access control remains enforced by profile-open gate.
    let supplemental = []
    try {
      let pq = supabase
        .from('profiles')
        .select('id,display_name,username,photo_url,private')
        .limit(limit)

      if (byId && needle) {
        const idPrefix = String(needle).toLowerCase().replace(/[^0-9a-f-]/g, '')
        if (!idPrefix) {
          pq = null
        } else {
          pq = pq.ilike('id', `${idPrefix}%`)
        }
      } else if (byHandle && needle) {
        const handlePrefix = normalizeHandleTerm(needle)
        if (!handlePrefix) {
          pq = null
        } else {
          pq = pq.ilike('username', `${handlePrefix}%`)
        }
      } else {
        const like = toContainsPattern(needle)
        if (!like) {
          pq = null
        } else {
          pq = pq.or(`username.ilike.${like},display_name.ilike.${like}`)
        }
      }

      if (pq) {
        const { data: profileRows, error: profileErr } = await pq
        if (!profileErr && Array.isArray(profileRows) && profileRows.length) {
          const profileIds = profileRows.map((p) => p.id).filter(Boolean)

          const { data: actorRows, error: actorErr } = await vc
            .from('actors')
            .select('id,profile_id,kind,is_void')
            .eq('kind', 'user')
            .eq('is_void', false)
            .in('profile_id', profileIds)

          if (!actorErr) {
            const actorByProfileId = new Map(
              (actorRows || [])
                .filter((a) => a?.profile_id && a?.id)
                .map((a) => [a.profile_id, a])
            )

            supplemental = profileRows
              .map((p) => {
                const actor = actorByProfileId.get(p.id)
                if (!actor?.id) return null

                return {
                  actor_id: actor.id,
                  user_id: p.id,
                  display_name: p.display_name ?? '',
                  username: p.username ?? '',
                  photo_url: p.photo_url ?? '/avatar.jpg',
                  is_private: !!p.private,
                }
              })
              .filter(Boolean)
          }
        }
      }
    } catch {
      supplemental = []
    }

    rows = mergeActorRows(rows, supplemental)

    // Backfill user_id from actors for user-block legacy filtering.
    try {
      const actorIds = Array.from(
        new Set(
          rows
            .filter((r) => r?.actor_id && !r?.user_id)
            .map((r) => r.actor_id)
            .filter(Boolean)
        )
      )

      if (actorIds.length) {
        const { data: actorRows, error: actorErr } = await vc
          .from('actors')
          .select('id,profile_id,kind')
          .in('id', actorIds)
          .eq('kind', 'user')

        if (!actorErr) {
          const actorToProfile = new Map(
            (actorRows || [])
              .filter((x) => x?.id && x?.profile_id)
              .map((x) => [x.id, x.profile_id])
          )

          rows = rows.map((r) => {
            if (!r?.actor_id || r?.user_id) return r
            return {
              ...r,
              user_id: actorToProfile.get(r.actor_id) ?? null,
            }
          })
        }
      }
    } catch {
      // best effort only
      void 0
    }

    // --------------------------------------------------------
    // LEGACY BLOCK FILTER (user_id scoped)
    // --------------------------------------------------------
    if (currentUserId && rows.length) {
      let iBlocked = new Set()
      let blockedMe = new Set()

      try {
        const { data } = await vc
          .from('user_blocks')
          .select('blocked_id')
          .eq('blocker_id', currentUserId)
        iBlocked = new Set((data || []).map((r) => r.blocked_id))
      } catch {
        void 0
      }

      try {
        const ids = rows.map((r) => r.user_id).filter(Boolean)
        if (ids.length) {
          const { data } = await vc
            .from('user_blocks')
            .select('blocker_id')
            .in('blocker_id', ids)
            .eq('blocked_id', currentUserId)
          blockedMe = new Set((data || []).map((r) => r.blocker_id))
        }
      } catch {
        void 0
      }

      rows = rows.filter((r) => {
        if (!r.user_id) return true
        return !iBlocked.has(r.user_id) && !blockedMe.has(r.user_id)
      })
    }

    // --------------------------------------------------------
    // FINAL SHAPE - ACTOR-FIRST
    // --------------------------------------------------------
    return rows.map((r) => ({
      result_type: 'actor',
      actor_id: r.actor_id,
      user_id: r.user_id ?? null,
      display_name: r.display_name || '',
      username: r.username || '',
      photo_url: r.photo_url || '/avatar.jpg',
      private: !!r.is_private,
    }))
  },

  // ==========================================================
  // VPORTS (UNCHANGED)
  // ==========================================================
  async vports(rawQuery, opts = {}) {
    const { minLength = 1, limit = 25 } = opts

    const q = (rawQuery || '').trim()
    if (q.length < minLength) return []

    const needle =
      q.startsWith('@') || q.startsWith('#')
        ? q.slice(1)
        : q

    const { data, error } = await supabase
      .schema('vc')
      .rpc('search_vports', {
        _q: needle,
        _limit: limit,
      })

    if (error) throw error

    return (data || []).map((r) => ({
      result_type: 'actor',
      actor_id: r.actor_id,
      display_name: r.display_name,
      username: r.username,
      photo_url: r.photo_url || '/avatar.jpg',
      private: false,
    }))
  },

  // ==========================================================
  // STUBS
  // ==========================================================
  async posts() {
    return []
  },
  async videos() {
    return []
  },
  async groups() {
    return []
  },
}

export default search
