// src/features/chat/ChatScreen.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

export default function ChatScreen() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !user) return;

    // load historic messages (including media_url and media_type)
    supabase
      .from('messages')
      .select('id, content, sender_id, created_at, media_url, media_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading messages:', err);
        setLoading(false);
      });

    // subscribe to new ones
    const sub = supabase
      .channel(`msg-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        ({ new: msg }) => {
          setMessages((prev) => [...prev, msg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [conversationId, user]);

  if (!user) return <p>Loading user…</p>;
  if (loading) return <p>Loading messages…</p>;

  // Optimistic handler for messages you send
  const handleNewMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} currentUserId={user.id} />
        ))}
      </div>
      <div className="border-t p-3">
        <MessageInput conversationId={conversationId} onSend={handleNewMessage} />
      </div>
    </div>
  );
}
