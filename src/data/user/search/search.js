// src/data/user/search/search.js
import { supabase } from '@/lib/supabaseClient'; // main client (rpc lives here)
import { vc } from '@/lib/vcClient';            // schema-scoped client for tables

export const search = {
  /**
   * USERS — now backed by vc.search_directory RPC
   * Rules enforced server-side:
   * - Always return self.
   * - Public & discoverable users are searchable by substring.
   * - Private users only when:
   *   - exact @username match, or
   *   - viewer already follows them (friend discovery).
   * Returns: id (user_id), actor_id, username, display_name, photo_url, is_private
   */
  async users(rawQuery, opts = {}) {
    const { minLength = 1, limit = 25, offset = 0 } = opts;
    let { currentUserId } = opts;

    const q = (rawQuery || '').trim();
    if (q.length < minLength) return [];

    // Ensure we know viewer id (for client-side block filter fallback)
    if (!currentUserId) {
      try {
        const { data } = await supabase.auth.getUser();
        currentUserId = data?.user?.id || null;
      } catch {
        currentUserId = null;
      }
    }

    const byHandle = q.startsWith('@');
    const byId     = q.startsWith('#');
    const needle   = (byHandle || byId) ? q.slice(1) : q;

    // Call RPC (lives in vc schema, but supabase.rpc handles it globally)
    // _q is the raw query string the function expects (case-insensitive inside)
    let rows = [];
    try {
      const { data, error } = await supabase.rpc('search_directory', {
        _q: needle,
        _limit: limit,
        _offset: offset,
      });
      if (error) throw error;
      rows = Array.isArray(data) ? data : [];
    } catch (e) {
      // Optional fallback if RPC is missing — keep behavior identical to old code
      // (Public & discoverable only; won’t return private exact-match or follow-visibility)
      let fb = supabase
        .from('profiles')
        .select('id, display_name, username, photo_url, private, discoverable')
        .limit(limit);

      // Only discoverable, plus self if logged in
      if (currentUserId) fb = fb.or(`discoverable.eq.true,id.eq.${currentUserId}`);
      else fb = fb.eq('discoverable', true);

      if (byId && needle)       fb = fb.ilike('id', `${needle}%`);
      else if (byHandle && needle) fb = fb.ilike('username', `${needle}%`);
      else {
        const like = `%${needle}%`;
        fb = fb.or(`username.ilike.${like},display_name.ilike.${like}`);
      }

      const { data: fallbackData, error: fallbackErr } = await fb;
      if (fallbackErr) throw fallbackErr;

      rows = (fallbackData || []).map(u => ({
        id: u.id,
        actor_id: null, // not available from fallback
        username: u.username || '',
        display_name: u.display_name || '',
        photo_url: u.photo_url || '/avatar.jpg',
        is_private: !!u.private,
      }));
    }

    // Client-side 2-way block safety net (server may already enforce this elsewhere)
    if (currentUserId && rows.length) {
      // who I blocked
      let iBlockedSet = new Set();
      try {
        const { data: myBlocks } = await vc
          .from('user_blocks')
          .select('blocked_id')
          .eq('blocker_id', currentUserId);
        iBlockedSet = new Set((myBlocks || []).map(r => r.blocked_id));
      } catch {}

      // who blocked me
      let blockedMeSet = new Set();
      try {
        const candidateIds = rows.map(r => r.id).filter(Boolean);
        if (candidateIds.length) {
          const { data: bbRows } = await vc
            .from('user_blocks')
            .select('blocker_id')
            .in('blocker_id', candidateIds)
            .eq('blocked_id', currentUserId);
          blockedMeSet = new Set((bbRows || []).map(r => r.blocker_id));
        }
      } catch {}

      rows = rows.filter(r => !iBlockedSet.has(r.id) && !blockedMeSet.has(r.id));
    }

    return rows.map(r => ({
      result_type: 'user',
      id: r.id,
      display_name: r.display_name || '',
      photo_url: r.photo_url || '/avatar.jpg',
      username: r.username || '',
      // keep these fields around if you want to show badges or navigate by actor
      actor_id: r.actor_id ?? null,
      private: !!r.is_private,
    }));
  },

  /** VPORTS — unchanged from prior message (active, or mine) */
  async vports(rawQuery, opts = {}) {
    const { minLength = 1, limit = 25 } = opts;
    let { currentUserId } = opts;

    const q = (rawQuery || '').trim();
    if (q.length < minLength) return [];

    if (!currentUserId) {
      try {
        const { data } = await supabase.auth.getUser();
        currentUserId = data?.user?.id || null;
      } catch { currentUserId = null; }
    }

    const byId = q.startsWith('#');     // #<uuid-prefix>
    const bySlug = q.startsWith('@');   // @<slug-prefix>
    const needle = (byId || bySlug) ? q.slice(1) : q;
    const like = `%${needle}%`;

    let query = vc
      .from('vports')
      .select('id, name, slug, avatar_url, bio, is_active, owner_user_id')
      .limit(limit);

    if (byId && needle) {
      query = query.ilike('id', `${needle}%`);
    } else if (bySlug && needle) {
      query = query.ilike('slug', `${needle}%`);
    } else {
      query = query.or(`name.ilike.${like},slug.ilike.${like},bio.ilike.${like}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).filter(v =>
      v.is_active || (!!currentUserId && v.owner_user_id === currentUserId)
    );

    return rows.map(v => ({
      result_type: 'vport',
      id: v.id,
      name: v.name || '',
      slug: v.slug || null,
      avatar_url: v.avatar_url || '/avatar.jpg',
      description: v.bio || '',
      is_active: !!v.is_active,
      owner_user_id: v.owner_user_id,
    }));
  },

  // Stubs (implement later if needed)
  async posts()  { return []; },
  async videos() { return []; },
  async groups() { return []; },
};

export default search;