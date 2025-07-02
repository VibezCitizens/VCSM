import { supabase } from '@/lib/supabaseClient';

/**
 * Gets or creates a private conversation between two users using an RPC.
 */
export async function getOrCreatePrivateConversation(userId1, userId2) {
    const currentUserId = (await supabase.auth.getUser()).data.user.id;
    if (!currentUserId || (![userId1, userId2].includes(currentUserId))) {
        console.error("[getOrCreatePrivateConversation] User not authenticated or not a participant.");
        return null;
    }

    if (!userId1 || !userId2 || userId1 === userId2) return null;

    try {
        const { data: conversationId, error } = await supabase.rpc('get_or_create_private_conversation', {
            user_id_1: userId1, // Match parameter names in RPC
            user_id_2: userId2, // Match parameter names in RPC
        });

        if (error) {
            console.error('[getOrCreatePrivateConversation] Error from RPC:', error);
            return null;
        }

        return conversationId;
    } catch (err) {
        console.error('[getOrCreatePrivateConversation] Unexpected error:', err);
        return null;
    }
}