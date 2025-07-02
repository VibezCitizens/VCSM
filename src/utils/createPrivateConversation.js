import { supabase } from '@/lib/supabaseClient';

/**
 * Finds or creates a private conversation between two users.
 * @param {string} user1 - Current user ID
 * @param {string} user2 - Target user ID
 * @returns {Promise<string|null>} conversation ID or null on failure
 */
export default async function getOrCreatePrivateConversation(user1, user2) {
  if (!user1 || !user2) {
    console.error('Both user IDs are required');
    return null;
  }

  if (user1 === user2) {
    console.warn('Cannot chat with yourself');
    return null;
  }

  try {
    // Find all conversation IDs that include user1
    const { data: existing, error: fetchError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user1);

    if (fetchError) throw fetchError;

    const convoIds = existing.map((m) => m.conversation_id);

    if (convoIds.length > 0) {
      // Look for a conversation that also includes user2
      const { data: shared, error: matchError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .in('conversation_id', convoIds)
        .eq('user_id', user2);

      if (matchError) throw matchError;
      if (shared.length > 0) return shared[0].conversation_id;
    }

    // No shared conversation found – create a new one
    return await createNewPrivateConversation(user1, user2);
  } catch (err) {
    console.error('getOrCreatePrivateConversation failed:', err.message);
    return null;
  }
}

async function createNewPrivateConversation(user1, user2) {
  try {
    // Create a new conversation
    const { data: convo, error: convoError } = await supabase
      .from('conversations')
      .insert([{ type: 'private' }])
      .select('id')
      .single();

    if (convoError) throw convoError;

    const conversationId = convo.id;

    // Add both users as members
    const { error: membersError } = await supabase
      .from('conversation_members')
      .insert([
        { conversation_id: conversationId, user_id: user1 },
        { conversation_id: conversationId, user_id: user2 },
      ]);

    if (membersError) throw membersError;

    return conversationId;
  } catch (err) {
    console.error('createNewPrivateConversation failed:', err.message);
    return null;
  }
}
