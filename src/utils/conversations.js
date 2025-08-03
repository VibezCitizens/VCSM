// src/utils/conversations.js
import { supabase } from '@/lib/supabaseClient';

export async function getOrCreatePrivateConversation(userId1, userId2) {
  // Step 1: Get all conversation IDs for user1
  const { data: user1Convos, error: err1 } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId1);

  if (err1) throw err1;

  const user1Ids = user1Convos.map(c => c.conversation_id);

  // Step 2: Get all conversation IDs for user2
  const { data: user2Convos, error: err2 } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId2);

  if (err2) throw err2;

  const user2Ids = user2Convos.map(c => c.conversation_id);

  // Step 3: Find intersection
  const mutualConvoId = user1Ids.find(id => user2Ids.includes(id));

  if (mutualConvoId) {
    // Return full convo record
    const { data: convo, error: convoFetchErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', mutualConvoId)
      .single();

    if (convoFetchErr) throw convoFetchErr;
    return convo;
  }

  // Step 4: Create new conversation
  const { data: newConvo, error: insertError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();

  if (insertError) throw insertError;

  // Step 5: Add both users
  const { error: memberError } = await supabase
    .from('conversation_members')
    .insert([
      { conversation_id: newConvo.id, user_id: userId1 },
      { conversation_id: newConvo.id, user_id: userId2 },
    ]);

  if (memberError) throw memberError;

  return newConvo;
}
