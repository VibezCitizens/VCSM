// src/data/posts/userPosts.js
import { supabase } from '@/lib/supabaseClient';

export async function create({
  userId,
  title = null,
  text = '',
  media_type = 'text',
  media_url = '',
  tags = [],
}) {
  if (!userId) throw new Error('userPosts.create: userId is required');
  const row = { user_id: userId, vport_id: null, title, text, media_type, media_url, tags };
  const { data, error } = await supabase.from('posts').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function softDelete(postId) {
  if (!postId) throw new Error('userPosts.softDelete: postId is required');
  const { error } = await supabase.from('posts').update({ deleted: true }).eq('id', postId);
  if (error) throw error;
  return true;
}

export default { create, softDelete };
