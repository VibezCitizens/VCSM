// src/data/profiles.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Minimal profiles DAL.
 * Uses only public.profiles (everything else lives in vc schema).
 */

// ---- helpers ----
function pickAuthor(row) {
  if (!row) return null;
  return {
    id: row.id,
    display_name: row.display_name ?? null,
    username: row.username ?? null,
    photo_url: row.photo_url ?? null,
  };
}

// ---- core ----
export const users = {
  /** Get a single profile by id */
  async get(id) {
    if (!id) return null;
    const { data, error } = await supabase
      .from('profiles') // public.profiles
      .select('id, display_name, username, photo_url, last_seen, private, discoverable')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /** Update profile (by id) with a partial patch */
  async update(id, patch = {}) {
    if (!id) throw new Error('profiles.users.update: id required');
    const { data, error } = await supabase
      .from('profiles') // public.profiles
      .update(patch)
      .eq('id', id)
      .select('id, display_name, username, photo_url, last_seen, private, discoverable')
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /** Light search by username/display_name (used by some pickers) */
  async search(q, { limit = 10 } = {}) {
    const query = String(q || '').trim();
    if (!query) return [];
    const { data, error } = await supabase
      .from('profiles') // public.profiles
      .select('id, display_name, username, photo_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .order('display_name', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  /** Presence heartbeat — update last_seen for current user */
  async touchLastSeen() {
    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user?.id;
    if (!me) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', me);

    if (error) throw error;
    return true;
  },
};

/** quick existence probe */
export async function exists(userId) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/** small helper many UIs use to render an "author chip" */
export async function getAuthor(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, photo_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return pickAuthor(data);
}

export default {
  users,
  exists,
  getAuthor,
};
