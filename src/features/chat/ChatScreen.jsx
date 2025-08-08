// src/features/chat/ChatScreen.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/components/ChatHeader';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

export default function ChatScreen() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Load history
    supabase
      .from('messages')
      .select('id, content, sender_id, created_at, media_url, media_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error loading messages:', error);
        else setMessages(data || []);
        setLoading(false);
      });

    // Live updates
    const sub = supabase
      .channel(`msg-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        ({ new: msg }) => {
          setMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [conversationId, user]);

  if (!user) return <p>Loading user…</p>;
  if (loading) return <p>Loading messages…</p>;

  const handleNewMessage = msg => {
    setMessages(prev => [...prev, msg]);
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* 1) Header */}
      <ChatHeader />

      {/* 2) Scrollable messages */}
      <div className="flex-1 overflow-auto p-4 pb-16 space-y-3">
        {messages.map(m => (
          <MessageItem key={m.id} message={m} currentUserId={user.id} />
        ))}
      </div>

      {/* 3) Input bar, 1rem above bottom nav */}
      <div className="absolute inset-x-0 bottom-4 border-t bg-black p-3">
        <MessageInput
          conversationId={conversationId}
          onSend={handleNewMessage}
        />
      </div>
    </div>
  );
}
