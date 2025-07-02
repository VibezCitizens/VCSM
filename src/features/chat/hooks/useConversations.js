// src/features/chat/hooks/useConversations.js

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetch = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          conversations (
            id,
            type,
            updated_at,
            messages (
              content,
              created_at
            ),
            conversation_members (
              user_id,
              profile:profiles (
                id,
                display_name,
                photo_url
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { foreignTable: 'conversations', ascending: false });

      if (error) {
        console.error('[useConversations] Error:', error);
        setConversations([]);
      } else {
        const result = data.map(row => row.conversations);
        setConversations(result);
      }

      setLoading(false);
    };

    fetch();
  }, [user?.id]);

  return { conversations, loading };
}
