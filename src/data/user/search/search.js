// src/data/user/search/search.js
import { supabase } from '@/lib/supabaseClient';     // ensure this matches your actual export
import { vc } from '@/lib/vcClient';

export const search = {
  /** USERS — unchanged from yours */
  async users(rawQuery, opts = {}) {
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

    const byId = q.startsWith('#');
    const byHandle = q.startsWith('@');
    const needle = byId || byHandle ? q.slice(1) : q;

    let query = supabase
      .from('profiles')
      .select('id, display_name, username, photo_url, private, discoverable')
      .limit(limit);

    if (currentUserId) query = query.or(`discoverable.eq.true,id.eq.${currentUserId}`);
    else query = query.eq('discoverable', true);

    if (byId && needle)       query = query.ilike('id', `${needle}%`);
    else if (byHandle && needle) query = query.ilike('username', `${needle}%`);
    else {
      const like = `%${needle}%`;
      query = query.or(`username.ilike.${like},display_name.ilike.${like}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!currentUserId) {
      return (data || []).map(u => ({
        result_type: 'user',
        id: u.id,
        display_name: u.display_name || '',
        photo_url: u.photo_url || '/avatar.jpg',
        username: u.username || '',
        private: !!u.private,
        discoverable: !!u.discoverable,
      }));
    }

    // two-way block filter
    const candidates = Array.isArray(data) ? data : [];
    const candidateIds = candidates.map(u => u.id).filter(Boolean);

    let iBlockedSet = new Set();
    try {
      const { data: myBlocks } = await vc
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', currentUserId);
      iBlockedSet = new Set((myBlocks || []).map(r => r.blocked_id));
    } catch {}

    let blockedMeSet = new Set();
    try {
      if (candidateIds.length) {
        const { data: bbRows } = await vc
          .from('user_blocks')
          .select('blocker_id')
          .in('blocker_id', candidateIds)
          .eq('blocked_id', currentUserId);
        blockedMeSet = new Set((bbRows || []).map(r => r.blocker_id));
      }
    } catch {}

    const filtered = candidates.filter(u => !iBlockedSet.has(u.id) && !blockedMeSet.has(u.id));

    return filtered.map(u => ({
      result_type: 'user',
      id: u.id,
      display_name: u.display_name || '',
      photo_url: u.photo_url || '/avatar.jpg',
      username: u.username || '',
      private: !!u.private,
      discoverable: !!u.discoverable,
    }));
  },

  /** VPORTS — NEW */
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
    const needle = byId || bySlug ? q.slice(1) : q;
    const like = `%${needle}%`;

    // Base: show active vports to everyone; always include my own even if inactive
    let query = vc
      .from('vports')
      .select('id, name, slug, avatar_url, bio, is_active, owner_user_id')
      .limit(limit);

    if (byId && needle) {
      query = query.ilike('id', `${needle}%`);
    } else if (bySlug && needle) {
      query = query.ilike('slug', `${needle}%`);
    } else {
      // name/slug/bio match
      // (Supabase's .or() expects comma-separated clauses)
      query = query.or(`name.ilike.${like},slug.ilike.${like},bio.ilike.${like}`);
    }

    // Fetch first, then filter client-side for visibility rule:
    // visible if is_active OR owner_user_id == viewer
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
