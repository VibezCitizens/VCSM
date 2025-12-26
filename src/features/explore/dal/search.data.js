// src/features/explore/dal/search.data.js

import { supabase } from '@/services/supabase/supabaseClient'
import { vc } from '@/services/supabase/vcClient'

// ============================================================
// Search Data (ACTOR-FIRST)
// ------------------------------------------------------------
// RULES:
// - Actor identity is PRIMARY
// - user_id is LEGACY / AUXILIARY
// - NEVER emit user_id as `id` for actors
// - result_type MUST reflect navigability
// ============================================================

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
    // PRIMARY PATH — Actor-aware RPC
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
      // FALLBACK — profiles table (LEGACY, non-actor)
      // ------------------------------------------------------
      let fb = supabase
        .from('profiles')
        .select(
          'id, display_name, username, photo_url, private, discoverable'
        )
        .limit(limit)

      if (currentUserId) {
        fb = fb.or(`discoverable.eq.true,id.eq.${currentUserId}`)
      } else {
        fb = fb.eq('discoverable', true)
      }

      if (byId && needle) {
        fb = fb.ilike('id', `${needle}%`)
      } else if (byHandle && needle) {
        fb = fb.ilike('username', `${needle}%`)
      } else {
        const like = `%${needle}%`
        fb = fb.or(
          `username.ilike.${like},display_name.ilike.${like}`
        )
      }

      const { data } = await fb
      rows = (data || []).map(u => ({
        actor_id: null,          // ❌ NOT navigable
        user_id: u.id,
        display_name: u.display_name,
        username: u.username,
        photo_url: u.photo_url,
        is_private: !!u.private,
      }))
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
        iBlocked = new Set((data || []).map(r => r.blocked_id))
      } catch {}

      try {
        const ids = rows.map(r => r.user_id).filter(Boolean)
        if (ids.length) {
          const { data } = await vc
            .from('user_blocks')
            .select('blocker_id')
            .in('blocker_id', ids)
            .eq('blocked_id', currentUserId)
          blockedMe = new Set((data || []).map(r => r.blocker_id))
        }
      } catch {}

      rows = rows.filter(r => {
        if (!r.user_id) return true
        return !iBlocked.has(r.user_id) && !blockedMe.has(r.user_id)
      })
    }

    // --------------------------------------------------------
    // FINAL SHAPE — ACTOR-FIRST
    // --------------------------------------------------------
    return rows.map(r => ({
      result_type: 'actor',     // 🔒 KEY FIX
      actor_id: r.actor_id,     // PRIMARY
      user_id: r.user_id ?? null, // LEGACY ONLY
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

  return (data || []).map(r => ({
    result_type: 'actor',
    actor_id: r.actor_id,
    display_name: r.display_name,
    username: r.username,
    photo_url: r.photo_url || '/avatar.jpg',
    private: false,
  }))
}
,

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
