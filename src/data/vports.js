// src/data/vports.js
import { supabase } from '@/lib/supabaseClient';
import { getPostsByVportId } from './posts';

export async function getVport({ id, slug }) {
  if (!id && !slug) return { vport: null, error: new Error('VPORT id or slug required') };

  if (id) {
    const { data, error } = await supabase.from('vports').select('*').eq('id', id).maybeSingle();
    if (error && error.code !== 'PGRST116') return { vport: null, error };
    return { vport: data ?? null, error: null };
  }

  const { data, error } = await supabase.from('vports').select('*').eq('slug', slug).maybeSingle();
  if (error && error.code !== 'PGRST116') return { vport: null, error };
  return { vport: data ?? null, error: null };
}

export async function getVportPosts(vportId) {
  // Prefer vport_posts, fallback to posts(vport_id)
  const primary = await supabase
    .from('vport_posts')
    .select('*')
    .eq('vport_id', vportId)
    .order('created_at', { ascending: false });

  if (!primary.error) {
    return { posts: primary.data ?? [], error: null };
  }

  return getPostsByVportId(vportId);
}

export async function getVportSubscriberCount(vportId) {
  if (!vportId) return { count: 0, error: null };
  const { count, error } = await supabase
    .from('vport_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('vport_id', vportId);
  return { count: typeof count === 'number' ? count : 0, error };
}

export function mapVportProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.slug ?? null,
    display_name: row.name ?? 'Untitled VPORT',
    bio: row.bio ?? row.description ?? '',
    photo_url: row.avatar_url ?? null,
    kind: 'vport',
  };
}
