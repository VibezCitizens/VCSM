import { supabase } from '@/lib/supabaseClient';

/**
 * Finds (or creates via RPC) a private 1:1 conversation between the
 * authenticated user and `otherUserId`, and returns an object
 * containing the conversation row plus its members’ profiles.
 */
export async function getOrCreateConversation(otherUserId) {
  // 1️⃣ Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('getOrCreateConversation: not authenticated', authError);
    return null;
  }

  const me = user.id;
  if (me === otherUserId) {
    console.warn('getOrCreateConversation: cannot create conversation with yourself');
    return null;
  }

  // 2️⃣ RPC: get or create the conversation ID
  const { data: convId, error: rpcError } = await supabase.rpc(
    'get_or_create_private_conversation',
    { user_id_1: me, user_id_2: otherUserId }
  );

  if (rpcError || !convId) {
    console.error('getOrCreateConversation: RPC error', rpcError);
    return null;
  }

  // 3️⃣ Fetch the conversations row
  const { data: convo, error: convoError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', convId)
    .single();

  if (convoError) {
    console.error('getOrCreateConversation: failed to fetch conversation', convoError);
    return null;
  }

  // 4️⃣ Load member IDs
  const { data: members, error: membersError } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', convId);

  if (membersError) {
    console.error('getOrCreateConversation: failed to fetch members', membersError);
    return null;
  }

  const userIds = members.map(m => m.user_id);

  // 5️⃣ Fetch profiles for each member
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, username, photo_url')
    .in('id', userIds);

  if (profilesError) {
    console.error('getOrCreateConversation: failed to fetch profiles', profilesError);
    return null;
  }

  // 6️⃣ Assemble results
  const membersWithProfile = members.map(m => ({
    user_id: m.user_id,
    profile: profiles.find(p => p.id === m.user_id) || null,
  }));

  return {
    ...convo,
    conversation_members: membersWithProfile,
  };
}
