import { supabase } from '@/services/supabase/supabaseClient';

export async function countPostComments(postId) {
  if (!postId) return 0;

  const { count, error } = await supabase
    .schema('vc')
    .from('post_comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)
    .is('deleted_at', null);

  if (error) throw error;
  return count ?? 0;
}
