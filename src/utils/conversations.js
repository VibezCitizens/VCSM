// src/utils/conversations.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Get or create a private conversation between two users.
 * Returns conversation id.
 */
export async function getOrCreatePrivateConversation(userId, targetUserId) {
  if (!userId || !targetUserId) return null;

  // Check if conversation exists
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('id')
    .eq('is_group', false)
    .contains('member_ids', [userId, targetUserId])
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching conversation:', fetchError);
    return null;
  }

  if (existing) return existing.id;

  // Create new conversation
  const { data: inserted, error: insertError } = await supabase
    .from('conversations')
    .insert([
      {
        is_group: false,
        member_ids: [userId, targetUserId],
        created_at: new Date().toISOString(),
      },
    ])
    .select('id')
    .single();

  if (insertError) {
    console.error('Error creating conversation:', insertError);
    return null;
  }

  return inserted.id;
}
