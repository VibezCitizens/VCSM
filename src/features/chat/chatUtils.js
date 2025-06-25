import { supabase } from '@/lib/supabaseClient';

export async function getOrCreatePrivateConversation(userId1, userId2) {
  if (!userId1 || !userId2) return null;
  if (userId1 === userId2) return null;

  const { data: user1Convos } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId1);

  const convoIds = user1Convos.map((row) => row.conversation_id);

  if (convoIds.length === 0) {
    return await createNew(userId1, userId2);
  }

  const { data: matches } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .in('conversation_id', convoIds)
    .eq('user_id', userId2);

  if (matches.length > 0) return matches[0].conversation_id;

  return await createNew(userId1, userId2);
}

async function createNew(user1, user2) {
  const { data: convo } = await supabase
    .from('conversations')
    .insert({ type: 'private' })
    .select()
    .single();

  const conversationId = convo.id;

  await supabase.from('conversation_members').insert([
    { conversation_id: conversationId, user_id: user1 },
    { conversation_id: conversationId, user_id: user2 },
  ]);

  return conversationId;
}
