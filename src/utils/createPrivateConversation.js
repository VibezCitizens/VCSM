import { supabase } from '@/lib/supabaseClient';

export async function createPrivateConversation(user1, user2) {
  const isSelfChat = user1 === user2;

  // Step 1: Get all private convos involving user1
  const { data: user1Convos, error } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user1);

  if (error) throw error;

  const convoIds = user1Convos.map((c) => c.conversation_id);

  if (convoIds.length === 0) {
    return await createNewPrivateConversation(user1, user2);
  }

  // Step 2: Check if user2 is in any of the same convos
  const { data: matchingConvos, error: matchError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .in('conversation_id', convoIds)
    .eq('user_id', user2);

  if (matchError) throw matchError;

  if (matchingConvos.length > 0) {
    // ✅ Existing private convo between both users found
    return matchingConvos[0].conversation_id;
  }

  // 🚨 No existing convo — create new one
  return await createNewPrivateConversation(user1, user2);
}

async function createNewPrivateConversation(user1, user2) {
  const { data: convo, error } = await supabase
    .from('conversations')
    .insert([{ type: 'private' }])
    .select('id')
    .single();

  if (error) throw error;

  const conversationId = convo.id;

  const members = [
    { conversation_id: conversationId, user_id: user1 },
    { conversation_id: conversationId, user_id: user2 },
  ];

  const { error: memberError } = await supabase
    .from('conversation_members')
    .insert(members);

  if (memberError) throw memberError;

  return conversationId;
}
