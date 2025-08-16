import { supabase } from '@/lib/supabaseClient';

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not authenticated');
  return data.user;
}

export async function listVPortPosts(vportId, { limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('vport_posts')
    .select('id,vport_id,created_by,body,media_url,media_type,created_at,updated_at') // 👈 no join here
    .eq('vport_id', vportId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createVPortPost(vportId, payload) {
  const user = await requireUser();
  const insert = {
    vport_id: vportId,
    created_by: user.id,
    body: payload.body ?? null,
    media_url: payload.media_url ?? null,
    media_type: payload.media_type ?? (payload.media_url ? 'image' : 'text'),
  };
  const { data, error } = await supabase.from('vport_posts').insert([insert]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVPortPost(id) {
  const { error } = await supabase.from('vport_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}
