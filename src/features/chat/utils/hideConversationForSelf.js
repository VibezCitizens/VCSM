// src/features/chat/utils/hideConversationForSelf.js
import { supabase } from '@/lib/supabaseClient';

export async function hideConversationForSelf(conversationId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !conversationId) return { error: 'not-auth' };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('conversation_members')
    .update({ archived_at: now, cleared_before: now }) // ← cutoff saved
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  return { error };
}
