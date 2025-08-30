// src/features/chat/utils/startVportConversation.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Ensure a vport conversation exists between the acting vport and a user.
 * Returns the vport_conversations.id
 */
export async function startVportConversation(vportId, receiverUserId) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[startVportConversation] not authenticated', authError);
    return null;
  }
  const { data, error } = await supabase.rpc('get_or_create_vport_conversation', {
    vport: vportId,
    user_b: receiverUserId,
    manager: user.id, // optional; default is auth.uid() in RPC
  });
  if (error) {
    console.error('[startVportConversation] rpc error', error);
    return null;
  }
  return data;
}
