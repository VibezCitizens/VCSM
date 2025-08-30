/**
 * @fileoverview Profiles DAL: user profiles (public.profiles) + VPORT profiles (public.vports)
 * @module data/profiles
 *
 * All UI should use this module instead of importing `supabase` directly.
 */

import { supabase } from '@/lib/supabaseClient';

/* =============================================================================
   internal helpers
============================================================================= */

async function requireAuthUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

/* small parser used by username helpers */
function _parseUsernameInput(s) {
  const raw = (s || '').trim();
  if (!raw) return '';

  let str = raw;
  // Allow full URL and extract pathname
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      str = u.pathname || raw;
    }
  } catch {
    /* ignore */
  }

  // /u/username
  const m = str.match(/(?:^|\/)u\/([A-Za-z0-9_.]+)/i);
  if (m?.[1]) return m[1];

  // @username
  if (str.startsWith('@')) return str.slice(1);

  return str;
}

/* =============================================================================
   USERS (public.profiles)
============================================================================= */

export const users = {
  /**
   * Get a user profile by id.
   * @param {string} id
   * @returns {Promise<null|{id:string,display_name?:string,username?:string,photo_url?:string,email?:string}>}
   */
  async getById(id) {
    if (!id) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url, email')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /**
   * Batch get by ids (best-effort; preserves no specific order).
   * @param {string[]} ids
   * @returns {Promise<Array<{id:string,display_name?:string,username?:string,photo_url?:string,email?:string}>>}
   */
  async getByIds(ids = []) {
    const list = (ids || []).filter(Boolean);
    if (!list.length) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url, email')
      .in('id', list);
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Check if a user profile exists.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    if (!id) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  /**
   * Get a user profile by username (case-sensitive exact).
   * @param {string} username
   * @returns {Promise<null|{id:string,display_name?:string,username?:string,photo_url?:string,email?:string}>}
   */
  async getByUsername(username) {
    const u = (username || '').trim();
    if (!u) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url, email')
      .eq('username', u)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /**
   * Get a user profile by username (case-insensitive).
   * @param {string} username
   * @returns {Promise<null|{id:string,display_name?:string,username?:string,photo_url?:string,email?:string}>}
   */
  async getByUsernameCI(username) {
    const u = (username || '').trim();
    if (!u) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url, email')
      .ilike('username', u)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /**
   * Parse common inputs (@username, /u/username, URL) and fetch user by username (CI).
   * @param {string} input
   * @returns {Promise<null|{id:string,display_name?:string,username?:string,photo_url?:string,email?:string}>}
   */
  async getByUsernameInput(input) {
    const uname = _parseUsernameInput(input);
    if (!uname) return null;
    return users.getByUsernameCI(uname);
  },

  /**
   * Search users by display_name or username (CI).
   * @param {{ q:string, limit?:number }} params
   * @returns {Promise<Array<{id:string,display_name?:string,username?:string,photo_url?:string}>>}
   */
  async search({ q, limit = 10 }) {
    const term = (q || '').trim();
    if (!term) return [];
    const pattern = `%${term}%`;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url')
      .or(`display_name.ilike.${pattern},username.ilike.${pattern}`)
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Update a user profile (RLS must allow; user must be owner).
   * Only pass the fields you intend to update.
   * @param {string} id
   * @param {Partial<{display_name:string, username:string, photo_url:string, bio:string, private:boolean}>} patch
   * @returns {Promise<boolean>}
   */
  async update(id, patch) {
    if (!id) throw new Error('Missing profile id.');
    const clean = Object.fromEntries(
      Object.entries(patch || {}).filter(([, v]) => v !== undefined)
    );
    if (!Object.keys(clean).length) return true;
    const { error } = await supabase.from('profiles').update(clean).eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * Touch presence: sets profiles.last_seen to server time (RPC) or client ISO fallback.
   * Use this from non-realtime heartbeats (e.g., your usePresence hook).
   * @returns {Promise<boolean>}
   */
  async touchLastSeen() {
    const me = await requireAuthUserId();

    // Preferred: RPC for server-time write (create it with SECURITY DEFINER).
    // SQL suggestion:
    //   create or replace function touch_last_seen()
    //   returns void language sql security definer as $$
    //     update profiles set last_seen = now() where id = auth.uid();
    //   $$;
    try {
      const { error } = await supabase.rpc('touch_last_seen');
      if (!error) return true;
    } catch {
      // fall through to client-time
    }

    // Fallback: client timestamp
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', me);
    if (updErr) throw updErr;
    return true;
  },
};

/* =============================================================================
   VPORTS (public.vports)
============================================================================= */

export const vports = {
  /**
   * Get a VPORT by id.
   * @param {string} id
   * @returns {Promise<null|{id:string,name:string,avatar_url?:string,type?:string,city?:string,state?:string}>}
   */
  async getById(id) {
    if (!id) return null;
    const { data, error } = await supabase
      .from('vports')
      .select('id, name, avatar_url, type, city, state')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /**
   * Batch get by ids.
   * @param {string[]} ids
   * @returns {Promise<Array<{id:string,name:string,avatar_url?:string,type?:string,city?:string,state?:string}>>}
   */
  async getByIds(ids = []) {
    const list = (ids || []).filter(Boolean);
    if (!list.length) return [];
    const { data, error } = await supabase
      .from('vports')
      .select('id, name, avatar_url, type, city, state')
      .in('id', list);
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Check if a VPORT exists.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    if (!id) return false;
    const { data, error } = await supabase
      .from('vports')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  /**
   * Search VPORTs by name or city (CI).
   * @param {{ q:string, limit?:number }} params
   * @returns {Promise<Array<{id:string,name:string,avatar_url?:string,type?:string,city?:string,state?:string}>>}
   */
  async search({ q, limit = 10 }) {
    const term = (q || '').trim();
    if (!term) return [];
    const pattern = `%${term}%`;
    const { data, error } = await supabase
      .from('vports')
      .select('id, name, avatar_url, type, city, state')
      .or(`name.ilike.${pattern},city.ilike.${pattern}`)
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Update a VPORT (only if your RLS/permissions allow managers/owners).
   * @param {string} id
   * @param {Partial<{name:string, avatar_url:string, description:string, is_published:boolean}>} patch
   * @returns {Promise<boolean>}
   */
  async update(id, patch) {
    if (!id) throw new Error('Missing vport id.');
    const clean = Object.fromEntries(
      Object.entries(patch || {}).filter(([, v]) => v !== undefined)
    );
    if (!Object.keys(clean).length) return true;
    const { error } = await supabase.from('vports').update(clean).eq('id', id);
    if (error) throw error;
    return true;
  },
};

/* =============================================================================
   Followers / Subscribers (centralized here to keep “profiles” concerns together)
============================================================================= */

export const followers = {
  /** followers of a user (count) */
  async countForUser(followedId) {
    if (!followedId) return 0;
    const { count, error } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', followedId);
    if (error) throw error;
    return typeof count === 'number' ? count : 0;
  },

  /** is viewer following target user? */
  async isSubscribed({ followerId, followedId }) {
    if (!followerId || !followedId || followerId === followedId) return false;
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('followed_id', followedId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },
};

export const vportSubscribers = {
  /** subscribers of a vport (count) */
  async count(vportId) {
    if (!vportId) return 0;
    const { count, error } = await supabase
      .from('vport_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('vport_id', vportId);
    if (error) throw error;
    return typeof count === 'number' ? count : 0;
  },
};

/* =============================================================================
   Convenience helpers
============================================================================= */

/**
 * Exists helper that dispatches based on kind.
 * @param {string} id
 * @param {'user'|'vport'} [kind='user']
 * @returns {Promise<boolean>}
 */
export async function exists(id, kind = 'user') {
  return kind === 'vport' ? vports.exists(id) : users.exists(id);
}

/**
 * Unified fetch for author meta used by UI components like PostCard / UserLink.
 * @param {{ kind:'user'|'vport', id:string }} param0
 * @returns {Promise<null|object>} A normalized object with type-discriminant
 */
export async function getAuthor({ kind, id }) {
  if (kind === 'vport') {
    const v = await vports.getById(id);
    return v
      ? { type: 'vport', id: v.id, name: v.name, avatar_url: v.avatar_url }
      : null;
  }
  const u = await users.getById(id);
  return u
    ? {
        type: 'user',
        id: u.id,
        display_name: u.display_name,
        username: u.username,
        photo_url: u.photo_url,
        email: u.email,
      }
    : null;
}

/**
 * Public helper: parse common username inputs.
 * @param {string} input
 * @returns {string} normalized username (may be empty string)
 */
export function parseUsernameInput(input) {
  return _parseUsernameInput(input);
}

export default {
  users,
  vports,
  followers,
  vportSubscribers,
  exists,
  getAuthor,
  parseUsernameInput,
};
