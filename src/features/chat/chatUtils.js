import { supabase } from '@/lib/supabaseClient';

export async function getOrCreatePrivateConversation(userId1, userId2) {
  if (!userId1 || !userId2 || userId1 === userId2) return null;

  try {
    // Step 1: Fetch all private conversations that user1 is in
    const { data: user1Convos, error: convoErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('type', 'private')
      .in('id',
        supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', userId1)
      );

    if (convoErr || !user1Convos?.length) {
      return await createNewConversation(userId1, userId2);
    }

    const convoIds = user1Convos.map(c => c.id);

    // Step 2: Look for mutual conversation with user2
    const { data: shared, error: mutualErr } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .in('conversation_id', convoIds)
      .eq('user_id', userId2);

    if (mutualErr) {
      console.error('Error checking mutual conversation:', mutualErr);
      return null;
    }

    // ✅ Found existing private conversation
    if (shared.length > 0) return shared[0].conversation_id;

    // ❌ No match, create new
    return await createNewConversation(userId1, userId2);
  } catch (err) {
    console.error('getOrCreatePrivateConversation error:', err);
    return null;
  }
}

async function createNewConversation(user1, user2) {
  try {
    const { data: convo, error } = await supabase
      .from('conversations')
      .insert({
        type: 'private'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }

    const convoId = convo.id;

    const { error: membersErr } = await supabase.from('conversation_members').insert([
      { conversation_id: convoId, user_id: user1 },
      { conversation_id: convoId, user_id: user2 }
    ]);

    if (membersErr) {
      console.error('Failed to insert members:', membersErr);
      return null;
    }

    return convoId;
  } catch (err) {
    console.error('createNewConversation error:', err);
    return null;
  }
}
