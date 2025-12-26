// Minimal data-layer for VPORTs under schema `vc`.

import supabase from '@/services/supabase/supabaseClient'; //transfer';  // default export
import vc from '@/services/supabase/vcClient'//transfer;              // supabase.schema('vc') wrapper

/* ------------------------------ utils ------------------------------ */

function ensureString(x) {
  return typeof x === 'string' ? x : '';
}

function normalizeSlug(s) {
  const base = ensureString(s).trim().toLowerCase();
  if (!base) return null;
  return base
    .replace(/[^a-z0-9\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data?.user || null;
  if (!user) throw new Error('Not authenticated');
  return user;
}

function raise(message, meta) {
  const e = new Error(message);
  if (meta) e.meta = meta;
  throw e;
}

/* ------------------------------ create ----------------------------- */

export async function createVport({ name, slug, avatarUrl, bio, bannerUrl }) {
  await requireUser();

  const cleanName = ensureString(name).trim();
  if (!cleanName) raise('Vport name is required');

  const cleanSlug = normalizeSlug(slug);

  const { data, error } = await vc.rpc('create_vport', {
    p_name: cleanName,
    p_slug: cleanSlug,                  // may be null
    p_avatar_url: avatarUrl ?? null,
    p_bio: bio ?? null,
    p_banner_url: bannerUrl ?? null,    // optional in RPC
  });

  if (error) {
    console.error('create_vport RPC failed:', error);
    const msg = error.message || String(error);
    if (msg.includes('not authenticated')) raise('Not authenticated');
    if (msg.includes('owner profile') || msg.includes('23503')) {
      raise('Owner profile not found. Ensure profiles row exists for this user.');
    }
    if (msg.includes('duplicate') || msg.includes('unique')) {
      raise('Slug already in use. Pick a different one.');
    }
    raise('Failed to create Vport', { error });
  }

  return data; // { vport_id, actor_id }
}

/* ------------------------------ reads ------------------------------ */

export async function listMyVports() {
  const user = await requireUser();
  const { data, error } = await vc
    .from('vports')
    .select('id, name, slug, avatar_url, banner_url, bio, is_active, created_at')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) raise('Failed to load your Vports', { error });
  return data || [];
}

export async function getVportById(vportId) {
  const { data, error } = await vc
    .from('vports')
    .select('id, owner_user_id, name, slug, avatar_url, banner_url, bio, is_active, created_at, updated_at')
    .eq('id', vportId)
    .single(); // fail if not found/RLS

  if (error) raise('Failed to load Vport', { error });
  return data || null;
}

export async function getVportBySlug(slug) {
  const clean = normalizeSlug(slug);
  if (!clean) return null;

  const { data, error } = await vc
    .from('vports')
    .select('id, owner_user_id, name, slug, avatar_url, banner_url, bio, is_active, created_at, updated_at')
    .eq('slug', clean)
    .maybeSingle();

  if (error) raise('Failed to load Vport', { error });
  return data || null;
}

/** Handy for feed/comment enrichment. */
export async function getVportsByIds(ids = []) {
  const uniq = [...new Set((ids || []).filter(Boolean))];
  if (!uniq.length) return [];
  const { data, error } = await vc
    .from('vports')
    .select('id, name, slug, avatar_url, banner_url, is_active')
    .in('id', uniq);
  if (error) raise('Failed to load Vports', { error });
  return data || [];
}

/* ------------------------------ updates ------------------------------ */

export async function updateVport(
  vportId,
  {
    name,
    slug,
    avatarUrl,   // camelCase accepted
    avatar_url,  // snake_case also accepted
    bannerUrl,   // camelCase
    banner_url,  // snake_case
    bio,
    is_active,
  } = {}
) {
  await requireUser();

  const patch = {};
  if (name !== undefined)        patch.name = ensureString(name).trim();
  if (slug !== undefined)        patch.slug = normalizeSlug(slug);

  if (avatarUrl !== undefined)   patch.avatar_url = avatarUrl ?? null;
  if (avatar_url !== undefined)  patch.avatar_url = avatar_url ?? patch.avatar_url ?? null;

  if (bannerUrl !== undefined)   patch.banner_url = bannerUrl ?? null;
  if (banner_url !== undefined)  patch.banner_url = banner_url ?? patch.banner_url ?? null;

  if (bio !== undefined)         patch.bio = bio ?? null;
  if (is_active !== undefined)   patch.is_active = !!is_active;

  if (Object.keys(patch).length === 0) return await getVportById(vportId);

  const { data, error } = await vc
    .from('vports')
    .update(patch)
    .eq('id', vportId)
    .select('id, name, slug, avatar_url, banner_url, bio, is_active, created_at, updated_at')
    .single(); // error if 0 rows (RLS or wrong id)

  if (error) raise('Failed to update Vport', { error });
  return data;
}

/* ------------------------------ default export ------------------------------ */

export default {
  createVport,
  listMyVports,
  getVportById,
  getVportBySlug,
  getVportsByIds,
  updateVport,
};
