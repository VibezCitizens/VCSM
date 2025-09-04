import { supabase } from '@/lib/supabaseClient';

export async function give({ postId, fromUserId, qty = 1 }) {
  const { data, error } = await supabase
    .from('roses_ledger')
    .insert([{ post_id: postId, from_user_id: fromUserId, qty }])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function count(postId) {
  const { data, error } = await supabase
    .from('roses_ledger')
    .select('qty')
    .eq('post_id', postId);
  if (error) throw error;
  return (data ?? []).reduce((s, r) => s + (r.qty ?? 0), 0);
}
