// src/features/chat/ConversationList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ConversationListItem from './ConversationListItem';

export default function ConversationList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loaded, setLoaded] = useState(false); // NEW: track if first fetch finished

  useEffect(() => {
    if (!user) return;

    const fetchConvos = async () => {
      const { data, error } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations(created_at)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to load conversations:', error);
      } else {
        const convos = (data || []).map(cm => ({
          id: cm.conversation_id,
          created_at: cm.conversations?.created_at,
        }));
        setConversations(convos);
      }
      setLoaded(true); // mark loaded after fetch
    };

    fetchConvos();

    // Realtime updates
    const channel = supabase
      .channel(`conv-list-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        ({ new: payload }) => {
          setConversations(prev => {
            if (prev.some(c => c.id === payload.conversation_id)) return prev;
            return [
              ...prev,
              { id: payload.conversation_id, created_at: new Date().toISOString() },
            ];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        ({ old: payload }) => {
          setConversations(prev =>
            prev.filter(c => c.id !== payload.conversation_id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  // Only show the empty message *after* we know there are no conversations
  if (loaded && conversations.length === 0) {
    return <p className="p-4 text-gray-500">No conversations yet.</p>;
  }

  return (
    <div className="p-4 space-y-2">
      {conversations.map(c => (
        <ConversationListItem
          key={c.id}
          conversationId={c.id}
          createdAt={c.created_at}
          onClick={() => navigate(`/chat/${c.id}`)}
        />
      ))}
    </div>
  );
}
