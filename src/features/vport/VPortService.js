// src/components/vports/VPortService.js
import { supabase } from '@/lib/supabaseClient';

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not authenticated');
  return data.user;
}

export async function listVPorts({ q = '', limit = 50, offset = 0 }) {
  let query = supabase
    .from('vports')
    .select(`
      id,
      name,
      type,
      city,
      region,
      country,
      verified,
      created_at,
      updated_at,
      created_by,
      avatar_url
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike('name', `%${q}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: data || [], count: count || 0 };
}

export async function getVPort(id) {
  const { data, error } = await supabase
    .from('vports')
    .select(`
      id,
      name,
      type,
      latitude,
      longitude,
      phone,
      website,
      address,
      city,
      region,
      country,
      verified,
      created_by,
      created_at,
      updated_at,
      avatar_url
    `)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createVPort(payload) {
  const user = await requireUser();
  const insert = {
    ...payload,
    latitude: payload.latitude ?? 0,
    longitude: payload.longitude ?? 0,
    created_by: user.id,
  };
  const { data, error } = await supabase
    .from('vports')
    .insert([insert])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVPort(id, payload) {
  const patch = { ...payload, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('vports')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVPort(id) {
  const { error } = await supabase.from('vports').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function listVPortPhotos(vportId, { limit = 12, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('vport_photos')
    .select('id,url,caption,uploaded_by,created_at')
    .eq('vport_id', vportId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listVPortHours(vportId) {
  const { data, error } = await supabase
    .from('vport_hours')
    .select('*')
    .eq('vport_id', vportId)
    .order('weekday', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listVPortReviews(vportId, { limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('vport_reviews')
    .select('id,user_id,rating,body,created_at')
    .eq('vport_id', vportId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data || [];
}
