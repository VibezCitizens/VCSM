// src/data/vdrops.js
/**
 * @file VDROP DAL. These are just *video posts*:
 * - user VDROP rows live in `posts`
 * - VPORT VDROP rows live in `vport_posts`
 * This module keeps all VDROP creation/list/delete in one place.
 */
import { supabase } from '@/lib/supabaseClient';

/* ========= create ========= */

export async function createUserVDrop({
  userId,
  title,
  text = '',
  media_url,                    // required (video)
  tags = [],
  visibility = 'public',
  category = null,
}) {
  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        user_id: userId,
        title: title || null,
        text,
        tags,
        visibility,
        media_url,
        media_type: 'video',
        category,
      },
    ])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function createVportVDrop({
  vportId,
  createdBy,                   // auth user id
  title,
  body = '',
  media_url,                   // required (video)
}) {
  const { data, error } = await supabase
    .from('vport_posts')
    .insert([
      {
        vport_id: vportId,
        created_by: createdBy,
        title: title || null,
        body,
        media_url,
        media_type: 'video',
      },
    ])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/* ========= list ========= */

export async function listUserVDrops(userId, { limit = 20 } = {}) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .eq('media_type', 'video')
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function listVportVDrops(vportId, { limit = 20 } = {}) {
  const { data, error } = await supabase
    .from('vport_posts')
    .select('*')
    .eq('vport_id', vportId)
    .eq('media_type', 'video')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/* ========= delete (posts-style) ========= */

export async function softDeleteUserVDrop(postId) {
  const { error } = await supabase.from('posts').update({ deleted: true }).eq('id', postId);
  if (error) throw error;
  return true;
}

export async function hardDeleteVportVDrop(postId) {
  const { error } = await supabase.from('vport_posts').delete().eq('id', postId);
  if (error) throw error;
  return true;
}

/* ========= back-compat aliases expected by data.js ========= */
// data.js imports createUserVdrop/createVportVdrop (lowercase "d")
export { createUserVDrop as createUserVdrop, createVportVDrop as createVportVdrop };

/* ========= default aggregate (optional consumers) ========= */

export const vdrops = {
  createUserVDrop,
  createVportVDrop,
  listUserVDrops,
  listVportVDrops,
  softDeleteUserVDrop,
  hardDeleteVportVDrop,
};

export default vdrops;
